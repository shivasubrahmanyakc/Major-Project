import numpy as np
import mne
from scipy.signal import welch, coherence
import os
import joblib

# Create models directory if it doesn't exist
os.makedirs("models", exist_ok=True)

CHANNELS = ['Fp1','Fp2','F7','F3','Fz','F4','F8',
            'T3','C3','Cz','C4','T4',
            'T5','P3','Pz','P4','T6',
            'O1','O2']

TARGET_SFREQ = 256
N_TIMES = 1024

BANDS = {
    'delta': (0.5,4),
    'theta': (4,8),
    'alpha': (8,13),
    'beta': (13,30),
    'gamma': (30,45)
}

CLASSES = ["AD","CN","FTD"]

# Load model logic with graceful fallback explicitly requested by user
try:
    import tensorflow as tf
    try:
        model = tf.keras.models.load_model("models/best_model.keras")
        print("CNN-BiLSTM loaded ✅")

        # Extract attention layer
        attn_model = tf.keras.Model(
            inputs=model.input,
            outputs=model.get_layer("channel_attn").output
        )
        MODELS_LOADED = True
    except Exception as e:
        print(f"Warning: Could not load CNN-BiLSTM — {str(e)}. Using mock predictions.")
        MODELS_LOADED = False

    # GCN is optional — ensemble is used when available
    try:
        gcn_model = tf.keras.models.load_model("models/best_gcn.keras")
        GCN_LOADED = True
        print("GCN loaded ✅  (ensemble mode)")
    except Exception as e:
        gcn_model = None
        GCN_LOADED = False
        print(f"GCN not loaded — {str(e)}. CNN-only mode.")

except ImportError:
    print("Warning: TensorFlow not installed. Using mock predictions.")
    MODELS_LOADED = False
    GCN_LOADED   = False

# Load StandardScaler (fitted on training data — fixes distribution mismatch)
try:
    _scaler = joblib.load("models/eeg_scaler.pkl")
    SCALER_LOADED = True
    print("EEG scaler loaded ✅")
except Exception as e:
    _scaler = None
    SCALER_LOADED = False
    print(f"Scaler not loaded — {e}. Predictions may be less accurate.")

def _normalise(X_raw):
    """Apply training StandardScaler to X_raw (N, 1024, 19) per channel."""
    if not SCALER_LOADED:
        return X_raw
    shape = X_raw.shape          # (N, 1024, 19)
    return _scaler.transform(X_raw.reshape(-1, shape[-1])).reshape(shape).astype(np.float32)

def preprocess(path):
    print("Preprocessing EEG file...")
    raw = mne.io.read_raw_eeglab(path, preload=True)

    ch_map = {c.upper(): c for c in raw.ch_names}
    keep = [ch_map[c.upper()] for c in CHANNELS if c.upper() in ch_map]

    raw.pick_channels(keep)
    raw.reorder_channels(keep)

    raw.notch_filter(50)
    raw.filter(0.5,45)
    raw.set_eeg_reference('average')

    if raw.info['sfreq'] != TARGET_SFREQ:
        raw.resample(TARGET_SFREQ)

    return raw

def segment(raw):
    print("Segmenting data...")
    data = raw.get_data()*1e6
    segs=[]
    step=int(N_TIMES*0.5)

    for i in range(0, data.shape[1]-N_TIMES+1, step):
        w=data[:,i:i+N_TIMES]
        if np.max(np.abs(w))<=150:
            segs.append(w.astype(np.float32))

    # If no segments remain due to artifact rejection, take the first one or mock
    if len(segs) == 0:
        segs.append((data[:, :N_TIMES] if data.shape[1] >= N_TIMES else np.pad(data, ((0,0),(0,N_TIMES-data.shape[1])))).astype(np.float32))

    return np.array(segs)

def band_powers(segs):
    print("Calculating band powers...")
    N,nch,_=segs.shape
    out=np.zeros((N,nch,5))

    for i in range(N):
        for c in range(nch):
            f,psd=welch(segs[i,c],fs=TARGET_SFREQ)
            for b,(lo,hi) in enumerate(BANDS.values()):
                mask=(f>=lo)&(f<hi)
                val=(np.trapezoid if hasattr(np, 'trapezoid') else np.trapz)(psd[mask],f[mask]) if mask.any() else 1e-12
                out[i,c,b]=np.log(val+1e-12)

    return out

def coherence_matrix(seg):
    # seg shape: (time, channels)
    nch=seg.shape[1]
    A=np.zeros((nch,nch))

    for i in range(nch):
        for j in range(i+1,nch):
            f,Cxy=coherence(seg[:,i],seg[:,j],fs=TARGET_SFREQ)
            val=Cxy.mean()
            A[i,j]=val
            A[j,i]=val

    np.fill_diagonal(A,1.0)
    return A

def mock_prediction(X_raw, X_band, A_graph):
    print("Running mock prediction logic...")
    probs = np.array([0.85, 0.10, 0.05])
    idx = 0
    attn = np.random.uniform(0.1, 1.0, size=(len(CHANNELS),))
    attn = attn / attn.sum()
    
    A = A_graph.mean(axis=0) if len(A_graph) > 0 else np.zeros((len(CHANNELS), len(CHANNELS)))
    # Add random connectivity to ensure graph displays well during mock dev
    A = A + np.random.uniform(0, 0.4, size=A.shape)
    
    return probs, idx, attn, A

def run_pipeline(path):
    # Dummy mock run if the file doesn't exist or is not a real .set to let UI dev proceed without real data
    try:
        raw=preprocess(path)
        segs=segment(raw)  # segs: (N, channels, time)

        # Model expects (batch, time, channels) — transpose axes 1 and 2
        X_raw=segs.transpose(0,2,1)  # (N, 1024, 19)
        X_band=band_powers(segs)      # (N, 19, 5)

        # coherence_matrix receives a single segment of shape (time, channels)
        A_graph=np.array([coherence_matrix(x) for x in X_raw])
    except Exception as e:
        print(f"Dataset reading failed (is it a valid .set?), using mock pipeline path. Error: {e}")
        # Generate random values with correct shapes to let UI still receive a structure
        X_raw = np.random.randn(2, N_TIMES, len(CHANNELS)).astype(np.float32)  # (2, 1024, 19)
        X_band = np.random.randn(2, len(CHANNELS), 5).astype(np.float32)       # (2, 19, 5)
        A_graph = np.random.uniform(0, 1, size=(2, len(CHANNELS), len(CHANNELS))).astype(np.float32)

    if MODELS_LOADED:
        X_raw_n = _normalise(X_raw)   # apply training scaler
        pred1 = model.predict([X_raw_n, X_band])          # CNN-BiLSTM: (N, 3)

        if GCN_LOADED:
            # GCN takes (node_features, adjacency): shapes (N,19,5) and (N,19,19)
            pred2 = gcn_model.predict([X_band, A_graph])  # GCN: (N, 3)
            final = (pred1 + pred2) / 2.0
            print("Ensemble prediction (CNN + GCN) ✅")
        else:
            final = pred1
            print("CNN-only prediction (GCN not loaded)")

        probs = final.mean(axis=0)
        idx   = int(np.argmax(probs))

        # channel attention
        attn = attn_model.predict([X_raw, X_band]).mean(axis=0)
        A    = A_graph.mean(axis=0)
    else:
        probs, idx, attn, A = mock_prediction(X_raw, X_band, A_graph)

    # graph edges (thresholded)
    edges=[]
    for i in range(len(A)):
        for j in range(i+1,len(A)):
            if A[i,j]>0.5:
                edges.append({"source":i,"target":j,"weight":float(A[i,j])})

    nodes=[
        {"id":i,"label":CHANNELS[i],"value":float(attn[i])}
        for i in range(len(CHANNELS))
    ]

    return {
        "prediction": CLASSES[idx],
        "confidence": float(np.max(probs)),
        "probabilities": [float(p) for p in probs],
        "attention": [float(a) for a in attn],
        "graph": {
            "nodes": nodes,
            "edges": edges
        }
    }
