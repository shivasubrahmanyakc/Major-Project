# NeuralScan AI: EEG-based Brain Disorder Classification

NeuralScan AI is an end-to-end Machine Learning system and full-stack interactive web application for analyzing Electroencephalography (EEG) recordings. It classifies brain disorder profiles into **Alzheimer's Disease (AD)**, **Frontotemporal Dementia (FTD)**, and **Cognitively Normal (CN)**.

---

## 📁 Repository Structure

```
NeuralScan-AI-EEG-based-Brain-Disorder-Classification/
├── backend/                        # FastAPI Python backend & model server
│   ├── eeg_core.py                 # Core DSP, preprocessing, and EEGEnsemble logic
│   ├── main.py                     # FastAPI REST API endpoints
│   ├── requirements.txt            # Python dependencies
│   └── models/                     # Production model assets & statistics
│       ├── models_final/           # 5-seed Deep Ensemble (.keras & .weights.h5)
│       ├── norm_final.npz          # Feature normalization parameters
│       ├── metadata.json           # Model metadata and architecture specs
│       ├── folds.json              # 5-fold cross-validation splits
│       ├── subject_labels.json     # Subject-to-diagnosis mappings
│       └── samples/                # Sample EEG recordings for testing
│
├── frontend/                       # Modern React + Vite interactive dashboard
│   ├── src/
│   │   ├── components/             # Topomap, GraphView, Navbar
│   │   └── pages/                  # UploadPage, ProcessingPage, ResultPage, AboutPage
│   ├── package.json
│   └── vite.config.js
│
├── notebooks/                      # Research & training notebooks
│   └── Final Model for Paper.ipynb # Final publication-ready model notebook
│
├── start.bat                       # 1-Click launcher (starts both backend & frontend)
└── README.md
```

---

## 🧠 Model Architecture & Methodology

The core classifier uses a **Multi-Modal Deep Ensemble** with 5 independently seeded models:

1. **Temporal Branch (1D-CNN)**:
   - Multi-scale 1D convolutions capturing micro-temporal waveform dynamics across 19 standard 10–20 EEG channels.
2. **Spatial / Functional Branch (Graph Chebyshev Network — GCN)**:
   - Inter-electrode spectral coherence adjacency matrix with Chebyshev graph convolutions capturing functional brain connectivity and network breakdown.
3. **Multi-Head Ensemble Fusion**:
   - **Fusion Head**: Primary diagnostic output integrating temporal and graph representations.
   - **Temporal Head**: Standalone time-series confidence.
   - **Graph Head**: Standalone topological coherence confidence.
4. **Ensemble Voting**:
   - Log-posterior averaging across the 5 seed models ensures high reliability, reduced variance, and clinical-grade generalization.

---

## ⚡ Quick Start

### Option 1: 1-Click Launcher (Windows)
Double-click [start.bat](file:///c:/Users/shiva/Desktop/New%20folder/NeuralScan-AI-EEG-based-Brain-Disorder-Classification/start.bat) to start both the backend and frontend simultaneously.

### Option 2: Manual Startup

#### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 EEG Preprocessing & Input Format

- **Sampling Rate**: Resampled to 128 Hz.
- **Window Length**: 4.0 seconds (512 timepoints per window).
- **Channels**: Standard 10–20 layout (19 channels: `Fp1, Fp2, F7, F3, Fz, F4, F8, T3/T7, C3, Cz, C4, T4/T8, T5/P7, P3, Pz, P4, T6/P8, O1, O2`).
- **File Format**: Standard EEGLAB `.set` (+ companion `.fdt`) or upload direct.
- **Dual Recording**: Supports simultaneous Resting-State and Photic Stimulation recordings, or single-session inference.

