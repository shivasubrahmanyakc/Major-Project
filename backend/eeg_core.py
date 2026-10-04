"""eeg_core.py - preprocessing, custom layers, model builders and predictor for the AD/FTD/CN EEG model.
Everything here is copied from the training notebook (v7). The three Lambda layers of the notebook are replaced by
the custom layers Square, LogClip and TimeStd (same maths, no weights) so that .keras files load without safe_mode."""
import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers

try:
    _register = keras.saving.register_keras_serializable
except AttributeError:
    _register = keras.utils.register_keras_serializable

# ---------------- constants ----------------
CHANNELS = ['Fp1','Fp2','F7','F3','Fz','F4','F8','T3','C3','Cz','C4','T4',
            'T5','P3','Pz','P4','T6','O1','O2']
REGIONS = {'frontal':  ['Fp1','Fp2','F7','F3','Fz','F4','F8'],
           'central':  ['C3','Cz','C4'],
           'temporal': ['T3','T4','T5','T6'],
           'parietal': ['P3','Pz','P4'],
           'occipital':['O1','O2']}
CLASS_NAMES = ['AD', 'CN', 'FTD']          # label index 0,1,2
COND_NAMES  = ['rest', 'photic']           # condition index 0,1
HEAD_NAMES  = ['fusion', 'temporal', 'graph']
TARGET_SFREQ, SEG_SEC, OVERLAP, AMP_THRESH = 128, 4, 0.5, 150.0
N_TIMES = SEG_SEC * TARGET_SFREQ           # 512
N_CH, N_CLASSES = 19, 3
BANDS = {'delta':(0.5,4), 'theta':(4,8), 'alpha':(8,13), 'beta':(13,30), 'gamma':(30,45)}
N_BANDS = 5
BASE_NODE_FEAT = 8
N_NODE_FEAT = 16
EMB_T, EMB_G = 64, 64
MIN_SEGS = 20
TMP_KERNELS, TMP_F_PER_K = (16, 32, 64), 8
BASE_VAR = dict(trainval=True, mod_drop=0.15, head_w=(1.0, 0.7, 0.7), tmp_kernels=TMP_KERNELS, tmp_f_per_k=TMP_F_PER_K)
NODE_FEATURE_NAMES = ['log_rel_delta','log_rel_theta','log_rel_alpha','log_rel_beta','log_rel_gamma',
                      'log_theta_over_alpha','log_deltatheta_over_alphabeta','log_alpha_over_beta',
                      'log_share_8_10','log_share_10_13','log_share_13_20','log_share_20_30',
                      'spectral_entropy','alpha_centroid_freq','log_hjorth_mobility','log_hjorth_complexity']
ENT_NAMES = ['vne','edge_entropy','strength_entropy','mean_coh','var_coh','global_eff','clustering']

WIN, HOP = 128, 32
FREQS = np.fft.rfftfreq(WIN, 1.0 / TARGET_SFREQ)
BAND_MASKS = [(FREQS >= lo) & (FREQS < hi) for lo, hi in BANDS.values()]
HANN = np.hanning(WIN).astype(np.float32)
SUB_MASKS = [(FREQS >= lo) & (FREQS < hi) for lo, hi in [(8, 10), (10, 13), (13, 20), (20, 30)]]
ALPHA_M = (FREQS >= 6) & (FREQS <= 13); ALPHA_F = FREQS[ALPHA_M]
SE_M = (FREQS >= 0.5) & (FREQS <= 45)

def softmax_np(z):
    e = np.exp(z - z.max(-1, keepdims=True)); return e / e.sum(-1, keepdims=True)

# ---------------- loading + windowing ----------------
def load_recording(path, is_prep=False, use_preprocessed=True):
    """Read one EEG file (.set, .edf, .fif, .vhdr ...). Returns (19, samples) in microvolts at 128 Hz.
    is_prep=True means the file is already filtered/cleaned (the dataset's derivatives); then no filtering is done.
    For a raw new recording use is_prep=False: 50 Hz notch, 0.5-45 Hz band-pass, average reference."""
    import mne
    import re
    mne.set_log_level('WARNING')
    raw = mne.io.read_raw(path, preload=True, verbose=False)
    
    synonyms = {
        'T7': 'T3', 'T8': 'T4', 'P7': 'T5', 'P8': 'T6',
        'FP1': 'FP1', 'FP2': 'FP2',
    }
    def normalize_name(c):
        c_clean = re.sub(r'^(EEG[\s_-]*)', '', c.strip(), flags=re.I)
        c_clean = re.sub(r'([-_.]*(REF|LE|A1|A2|AV))$', '', c_clean, flags=re.I).strip()
        up = c_clean.upper()
        return synonyms.get(up, up)

    raw_ch_norm = {normalize_name(c): c for c in raw.ch_names}
    keep_actual = []
    matched_target = []
    for ch in CHANNELS:
        ch_norm = normalize_name(ch)
        if ch_norm in raw_ch_norm:
            actual = raw_ch_norm[ch_norm]
            if actual not in keep_actual:
                keep_actual.append(actual)
                matched_target.append(ch)

    if len(keep_actual) < 15:
        raise ValueError(f"Only {len(keep_actual)}/19 standard EEG channels found in {os.path.basename(path)} (matched: {keep_actual})")

    raw.pick_channels(keep_actual, ordered=True)
    if not (use_preprocessed and is_prep):
        raw.notch_filter(50.0, verbose=False)
        raw.filter(0.5, 45.0, verbose=False)
        raw.set_eeg_reference('average', projection=False, verbose=False)
    if raw.info['sfreq'] != TARGET_SFREQ:
        raw.resample(TARGET_SFREQ, verbose=False)

    raw_data = raw.get_data()
    max_val = float(np.max(np.abs(raw_data))) if raw_data.size > 0 else 0.0
    scale = 1e6 if max_val < 1.0 else 1.0
    data = raw_data * scale

    if len(keep_actual) < N_CH:
        final_data = np.zeros((N_CH, data.shape[1]), dtype=data.dtype)
        for i, ch in enumerate(CHANNELS):
            if ch in matched_target:
                idx = matched_target.index(ch)
                final_data[i] = data[idx]
        return final_data
    return data

def segment(data):
    """(19, samples) in uV -> z-scored windows (n, 19, 512), 4 s, 50% overlap."""
    if data is None or data.size == 0:
        return None

    # Pad if shorter than 1 window (512 samples)
    if data.shape[1] < N_TIMES:
        pad_width = N_TIMES - data.shape[1]
        data = np.pad(data, ((0, 0), (0, pad_width)), mode='edge')

    step = int(N_TIMES * (1 - OVERLAP))
    segs = []
    all_segs = []
    for s in range(0, data.shape[1] - N_TIMES + 1, step):
        w = data[:, s:s + N_TIMES]
        all_segs.append(w.astype(np.float32))
        if np.max(np.abs(w)) <= AMP_THRESH:
            segs.append(w.astype(np.float32))

    # Fallback if strict 150uV threshold filtered everything out
    if not segs:
        segs = all_segs

    if not segs:
        return None

    segs = np.stack(segs)
    mu = segs.mean(axis=(0, 2), keepdims=True)
    sd = segs.std(axis=(0, 2), keepdims=True) + 1e-6
    return ((segs - mu) / sd).astype(np.float32)

# ---------------- features ----------------
def spec_graph_features(segs, chunk=64):
    n = len(segs)
    nodes = np.zeros((n, N_CH, BASE_NODE_FEAT), np.float32)
    coh = np.zeros((n, N_BANDS, N_CH, N_CH), np.float16)
    for s in range(0, n, chunk):
        w = np.lib.stride_tricks.sliding_window_view(segs[s:s+chunk], WIN, axis=-1)[..., ::HOP, :]
        w = w - w.mean(-1, keepdims=True)
        X = np.fft.rfft(w * HANN, axis=-1)
        P = (np.abs(X) ** 2).mean(2)
        S = np.einsum('bcwf,bdwf->bcdf', X, X.conj(), optimize=True) / X.shape[2]
        C2 = np.abs(S) ** 2 / (P[:, :, None, :] * P[:, None, :, :] + 1e-12)
        bp = np.stack([P[..., m].sum(-1) for m in BAND_MASKS], -1) + 1e-12
        rel = bp / bp.sum(-1, keepdims=True)
        d, t, a, be = bp[..., 0], bp[..., 1], bp[..., 2], bp[..., 3]
        nodes[s:s+chunk] = np.concatenate(
            [np.log(rel), np.log(t / a)[..., None],
             np.log((d + t) / (a + be))[..., None], np.log(a / be)[..., None]], -1)
        coh[s:s+chunk] = np.stack([C2[..., m].mean(-1) for m in BAND_MASKS], 1)
    return nodes, coh

def extended_node_feats(xr):
    """xr: (b, T, C) z-scored windows -> (b, C, 8)."""
    x = xr.astype(np.float32).transpose(0, 2, 1)
    w = np.lib.stride_tricks.sliding_window_view(x, WIN, axis=-1)[..., ::HOP, :]
    w = w - w.mean(-1, keepdims=True)
    P = (np.abs(np.fft.rfft(w * HANN, axis=-1)) ** 2).mean(2)
    tot = P[..., SE_M].sum(-1) + 1e-12
    sub = np.stack([P[..., m].sum(-1) for m in SUB_MASKS], -1) + 1e-12
    rel_sub = np.log(sub / tot[..., None])
    pn = P[..., SE_M] / tot[..., None]
    sent = -(pn * np.log(pn + 1e-12)).sum(-1) / np.log(SE_M.sum())
    paf = (P[..., ALPHA_M] * ALPHA_F).sum(-1) / (P[..., ALPHA_M].sum(-1) + 1e-12)
    d1 = np.diff(x, axis=-1); d2 = np.diff(d1, axis=-1)
    v0, v1, v2 = x.var(-1) + 1e-12, d1.var(-1) + 1e-12, d2.var(-1) + 1e-12
    mob = np.sqrt(v1 / v0); comp = np.sqrt(v2 / v1) / mob
    return np.concatenate([rel_sub, sent[..., None], paf[..., None],
                           np.log(mob)[..., None], np.log(comp)[..., None]], -1).astype(np.float32)

def graph_metrics(A):
    """A: (n, 19, 19) coherence graphs -> (n, 7) [vne, edge_entropy, strength_entropy, mean_coh, var_coh, global_eff, clustering]."""
    A = A.astype(np.float64).copy(); idx = np.arange(N_CH); A[:, idx, idx] = 0
    deg = A.sum(-1); dinv = 1 / np.sqrt(deg + 1e-8)
    Ls = np.eye(N_CH)[None] - dinv[:, :, None] * A * dinv[:, None, :]
    ev = np.clip(np.linalg.eigvalsh(Ls), 0, None); p = ev / (ev.sum(1, keepdims=True) + 1e-12)
    vne = -(p * np.log(p + 1e-12)).sum(1)
    iu = np.triu_indices(N_CH, 1); tri = A[:, iu[0], iu[1]]
    pe = tri / (tri.sum(1, keepdims=True) + 1e-12); edge_ent = -(pe * np.log(pe + 1e-12)).sum(1)
    ps = deg / (deg.sum(1, keepdims=True) + 1e-12); str_ent = -(ps * np.log(ps + 1e-12)).sum(1)
    Dm = 1 / (A + 1e-6); Dm[:, idx, idx] = 0
    for k in range(N_CH): Dm = np.minimum(Dm, Dm[:, :, k:k+1] + Dm[:, k:k+1, :])
    inv = 1 / (Dm + np.eye(N_CH)[None]); inv[:, idx, idx] = 0
    geff = inv.sum((1, 2)) / (N_CH * (N_CH - 1))
    W3 = np.cbrt(A / (A.max((1, 2), keepdims=True) + 1e-12))
    tr = np.diagonal(W3 @ W3 @ W3, axis1=1, axis2=2)
    ki = (A > 0).sum(-1); clus = (tr / (ki * (ki - 1) + 1e-12)).mean(1)
    return np.stack([vne, edge_ent, str_ent, tri.mean(1), tri.var(1), geff, clus], 1).astype(np.float32)

def make_inputs(segs):
    """z-scored windows (n, 19, 512) -> (Xr, Xn, A): raw (n,512,19) float16, node features (n,19,16) float32
    (NOT yet normalised), coherence graph (n,19,19) float16. This is exactly what the training cache holds."""
    segs = np.asarray(segs, np.float32)
    nodes, coh = spec_graph_features(segs)
    Xr = segs.transpose(0, 2, 1).astype(np.float16)
    A = coh.astype(np.float32).mean(1).astype(np.float16)
    ext = np.concatenate([extended_node_feats(Xr[i:i + 64]) for i in range(0, len(Xr), 64)])
    ext = np.nan_to_num(ext, nan=0.0, posinf=0.0, neginf=0.0)
    Xn = np.concatenate([nodes, ext], -1).astype(np.float32)
    return Xr, Xn, A

# ---------------- classical (subject-level) features ----------------
REG_IDX = {r: [CHANNELS.index(c) for c in chs] for r, chs in REGIONS.items()}
REG_NAMES = list(REGIONS)

def regional_feats_from_means(nf, A_, ent):
    """nf: (19,16) mean node feats over windows, A_: (19,19) mean coherence, ent: (7,) mean graph metrics -> (102,)"""
    f = [nf[REG_IDX[r]].mean(0) for r in REG_NAMES]
    for i, r in enumerate(REG_NAMES):
        ii = REG_IDX[r]; iu = np.triu_indices(len(ii), 1)
        f.append(np.array([A_[np.ix_(ii, ii)][iu].mean()]))
        for r2 in REG_NAMES[i + 1:]: f.append(np.array([A_[np.ix_(ii, REG_IDX[r2])].mean()]))
    f.append(np.asarray(ent))
    return np.concatenate([np.ravel(x) for x in f]).astype(np.float32)

def full_feats_from_means(nf, ent):
    return np.concatenate([np.ravel(nf), np.asarray(ent)]).astype(np.float32)

def classical_row(rest_segs=None, photic_segs=None):
    """Two recordings of ONE person -> (reg_row (204,), full_row (622,)). Missing recording -> NaN (the pickled
    pipelines contain a median imputer)."""
    nreg, nfull = 102, N_CH * N_NODE_FEAT + len(ENT_NAMES)
    reg = np.full(2 * nreg, np.nan, np.float32); full = np.full(2 * nfull, np.nan, np.float32)
    for c, segs in enumerate([rest_segs, photic_segs]):
        if segs is None: continue
        _, Xn, A = make_inputs(segs); A32 = A.astype(np.float32)
        ent = graph_metrics(A32).mean(0); nf = Xn.mean(0)
        reg[c*nreg:(c+1)*nreg] = regional_feats_from_means(nf, A32.mean(0), ent)
        full[c*nfull:(c+1)*nfull] = full_feats_from_means(nf, ent)
    return reg, full

# ---------------- custom layers ----------------
@_register(package="eeg")
class Square(layers.Layer):
    def call(self, x): return tf.square(x)

@_register(package="eeg")
class LogClip(layers.Layer):
    def call(self, x): return tf.math.log(tf.clip_by_value(x, 1e-6, 1e4))

@_register(package="eeg")
class TimeStd(layers.Layer):
    def call(self, x): return tf.math.reduce_std(x, axis=1)

@_register(package="eeg")
class GraphPrep(layers.Layer):
    def __init__(self, topk=8, **kw): super().__init__(**kw); self.topk = topk
    def call(self, A):
        A = tf.cast(A, tf.float32); eye = tf.eye(N_CH)[None]
        A = A * (1.0 - eye)
        thr = tf.math.top_k(A, k=self.topk)[0][..., -1:]
        A = A * tf.cast(A >= thr, tf.float32)
        A = tf.maximum(A, tf.transpose(A, [0, 2, 1])) + eye
        dinv = tf.math.rsqrt(tf.reduce_sum(A, -1) + 1e-8)
        return -(dinv[:, :, None] * A * dinv[:, None, :])
    def compute_output_shape(self, s): return s
    def get_config(self): return {**super().get_config(), 'topk': self.topk}

@_register(package="eeg")
class ChebConv(layers.Layer):
    def __init__(self, units, K=3, **kw): super().__init__(**kw); self.units, self.K = units, K
    def build(self, input_shape):
        F = input_shape[0][-1]
        self.W = self.add_weight(name='W', shape=(self.K * F, self.units), initializer='glorot_uniform',
                                 regularizer=regularizers.l2(3e-4))
        self.b = self.add_weight(name='b', shape=(self.units,), initializer='zeros')
        super().build(input_shape)
    def call(self, inputs):
        H, L = inputs; cheb = [H, tf.matmul(L, H)]
        for _ in range(2, self.K): cheb.append(2 * tf.matmul(L, cheb[-1]) - cheb[-2])
        Z = tf.concat(cheb[:self.K], -1)
        return tf.nn.relu(tf.tensordot(Z, self.W, axes=1) + self.b)
    def get_config(self): return {**super().get_config(), 'units': self.units, 'K': self.K}

@_register(package="eeg")
class ModalityDrop(layers.Layer):
    """Training only: randomly zeroes the temporal OR the graph embedding (each with prob rate/2). Identity at inference."""
    def __init__(self, rate=0.15, **kw): super().__init__(**kw); self.rate = rate
    def call(self, inputs, training=None):
        h, g = inputs
        if training is not True or self.rate <= 0: return [h, g]
        u = tf.random.uniform([tf.shape(h)[0], 1])
        mh = tf.cast(u >= self.rate / 2, tf.float32)
        mg = tf.cast(tf.logical_or(u < self.rate / 2, u >= self.rate), tf.float32)
        return [h * mh, g * mg]
    def compute_output_shape(self, s): return s
    def get_config(self): return {**super().get_config(), 'rate': self.rate}

# ---------------- model builders ----------------
def build_temporal_encoder(var=BASE_VAR):
    ks, fpk = var['tmp_kernels'], var['tmp_f_per_k']; sp = 2 * fpk * len(ks)
    inp = layers.Input((N_TIMES, N_CH))
    x = layers.GaussianNoise(0.02)(inp)
    x = layers.Reshape((N_TIMES, N_CH, 1))(x)
    br = [layers.Conv2D(fpk, (k, 1), padding='same', use_bias=False)(x) for k in ks]
    x = layers.Concatenate()(br) if len(br) > 1 else br[0]
    x = layers.BatchNormalization()(x)
    x = layers.DepthwiseConv2D((1, N_CH), depth_multiplier=2, use_bias=False,
                               depthwise_constraint=keras.constraints.MaxNorm(1.0))(x)
    x = layers.BatchNormalization()(x)
    x = Square()(x)
    x = layers.AveragePooling2D((64, 1), strides=(16, 1))(x)
    x = LogClip()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Reshape((-1, sp))(x)
    m = layers.GlobalAveragePooling1D()(x)
    s = TimeStd()(x)
    z = layers.Concatenate()([m, s])
    h = layers.Dense(EMB_T)(layers.Dropout(0.3)(z))
    h = layers.LayerNormalization()(h)
    return keras.Model(inp, h, name='temporal_encoder')

def cheb_block(H, Ls, units, K, drop):
    z = ChebConv(units, K)([H, Ls]); z = layers.LayerNormalization()(z); z = layers.Dropout(drop)(z)
    r = H if H.shape[-1] == units else layers.Dense(units, use_bias=False)(H)
    return layers.Add()([z, r])

def build_graph_encoder(K=3, topk=8):
    n_in = layers.Input((N_CH, N_NODE_FEAT)); a_in = layers.Input((N_CH, N_CH))
    Ls = GraphPrep(topk)(a_in)
    x = layers.GaussianNoise(0.05)(n_in)
    h1 = cheb_block(x, Ls, 32, K, 0.2)
    h2 = cheb_block(h1, Ls, 64, K, 0.3)
    pooled = layers.Concatenate()([layers.GlobalAveragePooling1D()(h2), layers.GlobalMaxPooling1D()(h2),
                                   layers.GlobalAveragePooling1D()(h1)])
    per_node = layers.Flatten()(layers.Dense(8, activation='relu')(h2))
    g = layers.Concatenate()([pooled, per_node])
    g = layers.Dense(EMB_G, activation='relu')(layers.Dropout(0.3)(layers.LayerNormalization()(g)))
    return keras.Model([n_in, a_in], g, name='graph_encoder')

def build_classifier(enc_t, enc_g, var=BASE_VAR):
    """Inputs  : [raw (512,19), node feats NORMALISED (19,16), coherence (19,19), condition one-hot (2)]
    Outputs : [fusion logits, temporal logits, graph logits, temporal embedding, graph embedding]"""
    x_in = layers.Input((N_TIMES, N_CH)); n_in = layers.Input((N_CH, N_NODE_FEAT))
    a_in = layers.Input((N_CH, N_CH)); c_in = layers.Input((2,))
    h = enc_t(x_in); g = enc_g([n_in, a_in])
    def head(z, name):
        z = layers.Concatenate()([z, c_in]); z = layers.Dropout(0.5)(z)
        z = layers.Dense(64, activation='relu', kernel_regularizer=regularizers.l2(1e-3))(z)
        return layers.Dense(N_CLASSES, name=name)(layers.Dropout(0.3)(z))
    h_d, g_d = ModalityDrop(var['mod_drop'])([h, g])
    fus = layers.Concatenate()([h_d, g_d])
    return keras.Model([x_in, n_in, a_in, c_in],
                       [head(fus, 'fusion'), head(h, 'tmp'), head(g, 'gr'), h, g], name='classifier')

# ---------------- predictor used by the application ----------------
class EEGEnsemble:
    """Loads several saved .keras models + their normalisation file and scores one person.
        ens = EEGEnsemble(sorted(glob.glob('models_final/seed*.keras')), 'norm_final.npz')
        out = ens.predict_subject(rest=segs_rest, photic=segs_photic)   # segs: (n,19,512) z-scored, from segment()
    out['fusion'] / out['temporal'] / out['graph'] are class probabilities [AD, CN, FTD];
    out['prediction'] comes from the fusion head (the declared headline model)."""
    def __init__(self, model_paths, norm_path):
        self.models = [keras.models.load_model(p, compile=False) for p in model_paths]
        z = np.load(norm_path); self.mu, self.sd = z['mu'], z['sd']
    def window_probs(self, Xr, Xn, A, cond, bs=512):
        xn = ((Xn - self.mu) / self.sd).astype(np.float32)
        c = np.tile(np.eye(2, dtype=np.float32)[cond], (len(Xr), 1))
        all_m = []
        for m in self.models:
            ps = []
            for i in range(0, len(Xr), bs):
                o = m([Xr[i:i+bs].astype(np.float32), xn[i:i+bs], A[i:i+bs].astype(np.float32), c[i:i+bs]], training=False)
                ps.append(np.stack([softmax_np(o[k].numpy()) for k in range(3)], 1))
            all_m.append(np.concatenate(ps))
        return np.mean(all_m, 0)                         # (n_windows, 3 heads, 3 classes)
    def predict_subject(self, rest=None, photic=None):
        parts, n_win = [], {}
        for cond, segs in [(0, rest), (1, photic)]:
            if segs is None: continue
            if len(segs) < MIN_SEGS: print(f"warning: only {len(segs)} windows for {COND_NAMES[cond]} (< {MIN_SEGS})")
            Xr, Xn, A = make_inputs(segs)
            P = self.window_probs(Xr, Xn, A, cond)
            parts.append(np.log(P + 1e-6).mean(0)); n_win[COND_NAMES[cond]] = int(len(P))
        if not parts: raise ValueError("give at least one recording")
        sc = softmax_np(np.mean(parts, 0))               # (3 heads, 3 classes)
        out = {h: dict(zip(CLASS_NAMES, sc[i].round(4).tolist())) for i, h in enumerate(HEAD_NAMES)}
        out['prediction'] = CLASS_NAMES[int(sc[0].argmax())]
        out['windows_used'] = n_win
        out['inputs_used'] = 'both' if len(parts) == 2 else ('rest' if rest is not None else 'photic')
        return out
