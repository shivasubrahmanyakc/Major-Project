"""NeuralScan AI — FastAPI backend
Uses the EEGEnsemble from eeg_core.py (5-seed ensemble, fusion + temporal + graph heads).
Supports dual-recording upload (rest + photic) or single recording.
"""
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import shutil, os, glob, tempfile, traceback, sys

# Fix Windows cp1252 console encoding
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# eeg_core.py is copied into this directory — import directly
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR  = os.path.join(BACKEND_DIR, "models")

app = FastAPI(title="NeuralScan AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── load ensemble once at startup ─────────────────────────────────────────────
try:
    from eeg_core import EEGEnsemble, load_recording, segment, CHANNELS, CLASS_NAMES  # noqa: E402

    _model_paths = sorted(glob.glob(os.path.join(MODELS_DIR, "models_final", "final_seed*.keras")))
    _norm_path   = os.path.join(MODELS_DIR, "norm_final.npz")

    if not _model_paths:
        raise FileNotFoundError(f"No .keras models found in {MODELS_DIR}/models_final/")
    ensemble = EEGEnsemble(_model_paths, _norm_path)
    ENSEMBLE_LOADED = True
    print(f"✅ EEGEnsemble loaded ({len(_model_paths)} models from {os.path.dirname(_model_paths[0])})")
except Exception as exc:
    ensemble = None
    ENSEMBLE_LOADED = False
    print(f"⚠️  Could not load ensemble: {exc}")
    traceback.print_exc()


EEG_SET_DIRS = [
    r"C:\Users\shiva\Desktop\New folder\New Data\EEG_SET_FILES",
    r"C:\Users\shiva\Desktop\New folder\New Data",
]


def _save_upload(upload: UploadFile) -> tuple[str, str]:
    """Save an UploadFile to a temp dir preserving its filename, and auto-link companion .fdt if present."""
    temp_dir = tempfile.mkdtemp(prefix="neuralscan_")
    filename = os.path.basename(upload.filename or "upload.set")
    file_path = os.path.join(temp_dir, filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(upload.file, f)

    # If EEGLAB .set file, look for companion .fdt file
    base_no_ext, ext = os.path.splitext(filename)
    if ext.lower() == ".set":
        fdt_name = base_no_ext + ".fdt"
        for d in EEG_SET_DIRS:
            if os.path.isdir(d):
                candidate = os.path.join(d, fdt_name)
                if os.path.exists(candidate):
                    try:
                        shutil.copyfile(candidate, os.path.join(temp_dir, fdt_name))
                        print(f"🔗 Auto-linked companion .fdt: {fdt_name}")
                        break
                    except Exception as err:
                        print(f"⚠️ Could not copy companion .fdt: {err}")

    return file_path, temp_dir


def _run_inference(rest_path: Optional[str], photic_path: Optional[str]):
    """Core pipeline: load → segment → ensemble predict → build response."""
    import numpy as np

    rest_segs   = None
    photic_segs = None

    if rest_path and os.path.exists(rest_path):
        print(f"📂 Loading REST recording: {rest_path}")
        raw = load_recording(rest_path, is_prep=True, use_preprocessed=True)
        rest_segs = segment(raw)
        if rest_segs is None:
            raise ValueError(f"No valid segments in REST recording (all exceeded amplitude threshold).")
        print(f"✅ REST segments created: {rest_segs.shape}")

    if photic_path and os.path.exists(photic_path):
        print(f"📂 Loading PHOTIC recording: {photic_path}")
        raw = load_recording(photic_path, is_prep=True, use_preprocessed=True)
        photic_segs = segment(raw)
        if photic_segs is None:
            raise ValueError(f"No valid segments in PHOTIC recording.")
        print(f"✅ PHOTIC segments created: {photic_segs.shape}")

    print("🧠 Running 5-model ensemble inference...")
    out = ensemble.predict_subject(rest=rest_segs, photic=photic_segs)

    # ── Build coherence-graph from the first available condition ──────────────
    from eeg_core import make_inputs  # noqa: E402

    segs_for_graph = rest_segs if rest_segs is not None else photic_segs
    _, Xn, A = make_inputs(segs_for_graph)

    A_mean = A.astype(np.float32).mean(0)           # (19, 19)
    Xn_mean = Xn.mean(0)                            # (19, 16)

    # channel importance = mean absolute node-feature magnitude
    ch_importance = np.abs(Xn_mean).mean(-1)
    ch_importance = (ch_importance / (ch_importance.max() + 1e-8)).tolist()

    # graph edges (threshold > 0.4)
    edges = []
    for i in range(len(CHANNELS)):
        for j in range(i + 1, len(CHANNELS)):
            w = float(A_mean[i, j])
            if w > 0.4:
                edges.append({"source": i, "target": j, "weight": round(w, 4)})

    nodes = [
        {"id": i, "label": CHANNELS[i], "value": round(ch_importance[i], 4)}
        for i in range(len(CHANNELS))
    ]

    fusion_probs   = out["fusion"]    # {"AD":x,"CN":y,"FTD":z}
    temporal_probs = out["temporal"]
    graph_probs    = out["graph"]
    confidence = max(fusion_probs.values())

    return {
        "prediction":   out["prediction"],
        "confidence":   round(confidence, 4),
        "inputs_used":  out["inputs_used"],
        "windows_used": out["windows_used"],
        "probabilities": {
            "fusion":   fusion_probs,
            "temporal": temporal_probs,
            "graph":    graph_probs,
        },
        "channel_importance": ch_importance,
        "graph": {
            "nodes": nodes,
            "edges": edges,
        },
    }


# Standard sync def so FastAPI executes in background threadpool (does NOT block event loop)
@app.post("/predict")
def predict(
    rest_file: Optional[UploadFile]   = File(None),
    photic_file: Optional[UploadFile] = File(None),
):
    """Upload one or two EEG .set files (rest and/or photic stimulation)."""
    from fastapi import HTTPException
    if not ENSEMBLE_LOADED:
        raise HTTPException(503, "Model ensemble not loaded on server.")

    if rest_file is None and photic_file is None:
        raise HTTPException(400, "Provide at least one EEG file (rest_file or photic_file).")

    rest_path   = None
    photic_path = None
    temp_dirs   = []
    try:
        if rest_file:
            rest_path, tdir = _save_upload(rest_file)
            temp_dirs.append(tdir)
        if photic_file:
            photic_path, tdir = _save_upload(photic_file)
            temp_dirs.append(tdir)

        result = _run_inference(rest_path, photic_path)
        return result

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(500, f"Analysis Error: {str(exc)}")
    finally:
        for td in temp_dirs:
            shutil.rmtree(td, ignore_errors=True)


@app.get("/local-files")
def list_local_files():
    """List available .set files from local EEG_SET_FILES directory."""
    files = []
    for d in EEG_SET_DIRS:
        if os.path.isdir(d):
            for f in sorted(os.listdir(d)):
                if f.lower().endswith(".set"):
                    files.append({
                        "filename": f,
                        "folder": d,
                        "path": os.path.join(d, f),
                    })
    return {"files": files}


@app.post("/predict-local")
def predict_local(data: dict):
    """Run inference directly on local files by filename or absolute path."""
    from fastapi import HTTPException
    if not ENSEMBLE_LOADED:
        raise HTTPException(503, "Model ensemble not loaded on server.")

    rest_name = data.get("rest_file")
    photic_name = data.get("photic_file")

    def resolve(name):
        if not name: return None
        if os.path.isabs(name) and os.path.exists(name): return name
        for d in EEG_SET_DIRS:
            candidate = os.path.join(d, name)
            if os.path.exists(candidate): return candidate
        return None

    rest_path = resolve(rest_name)
    photic_path = resolve(photic_name)

    if not rest_path and not photic_path:
        raise HTTPException(400, f"Neither REST nor PHOTIC file found on disk.")

    try:
        return _run_inference(rest_path, photic_path)
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(500, f"Analysis Error: {str(exc)}")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "ensemble_loaded": ENSEMBLE_LOADED,
        "n_models": len(_model_paths) if ENSEMBLE_LOADED else 0,
    }
