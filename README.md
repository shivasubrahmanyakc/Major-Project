# 🧠 NeuralScan AI: EEG-based Brain Disorder Classification

NeuralScan AI is an end-to-end Machine Learning system and full-stack interactive web application for analyzing Electroencephalography (EEG) recordings. It classifies brain disorder profiles into **Alzheimer's Disease (AD)**, **Frontotemporal Dementia (FTD)**, and **Cognitively Normal (CN)**.

This system provides a seamless clinical-grade pipeline, from raw EEG ingestion to deep-learning-based diagnosis, accompanied by an interactive, modern visual dashboard.

---

## 🚀 Tech Stack

- **Model & Signal Processing:** TensorFlow/Keras, MNE-Python, NumPy, SciPy
- **Backend API:** FastAPI, Uvicorn, Python 3
- **Frontend Dashboard:** React 19, Vite, Tailwind CSS v4, Chart.js, React-Force-Graph-2D, Lucide React

---

## 🏗️ System Architecture

### 1. 🧠 Deep Learning Model Architecture
The core classifier uses a **Multi-Modal Deep Ensemble** with 5 independently seeded models to ensure high reliability, reduced variance, and robust generalization.

- **Temporal Branch (1D-CNN):**
  - Uses multi-scale 1D convolutions (temporal kernels) combined with depthwise convolutions.
  - Extracts micro-temporal waveform dynamics and log-variance features across the 19 standard 10–20 EEG channels.
- **Spatial / Functional Branch (Graph Chebyshev Network — GCN):**
  - Computes an inter-electrode spectral coherence adjacency matrix based on sub-band frequencies.
  - Uses Chebyshev graph convolutions (`ChebConv`) to capture functional brain connectivity, network breakdown, and spatial relationships.
- **Multi-Head Ensemble Fusion:**
  - **Fusion Head:** Primary diagnostic output integrating temporal and graph representations.
  - **Temporal Head:** Standalone time-series confidence.
  - **Graph Head:** Standalone topological coherence confidence.
- **Custom Keras Layers:** Includes custom mathematical layers for `Square`, `LogClip`, `TimeStd`, `GraphPrep`, `ChebConv`, and `ModalityDrop` to allow seamless model loading and serving without `safe_mode` restrictions.

### 2. ⚙️ Backend (FastAPI)
The backend serves as the model inference server and data processing pipeline (`eeg_core.py` + `main.py`).

- **EEG Preprocessing Pipeline:**
  - Reads standard EEG formats (like `.set` and `.fdt`) using `MNE-Python`.
  - Applies a 50 Hz notch filter and 0.5-45 Hz band-pass filter (for raw recordings).
  - Resamples to **128 Hz**.
  - Applies a common average reference.
  - Segments data into **4.0-second windows** (512 timepoints) with **50% overlap**.
  - Performs Z-score normalization with amplitude thresholding (150 µV artifact rejection).
- **Inference Engine:** Supports both single-session inference and simultaneous **Dual Recording** inference (Resting-State and Photic Stimulation) and averages log-posteriors.
- **Core Endpoints:**
  - `/predict`: Accepts multipart file uploads for rest and/or photic EEG files.
  - `/predict-local`: Directly processes files stored on the local server.
  - `/local-files`: Lists available local EEG files.
  - `/health`: Server and ensemble load status.

### 3. 💻 Frontend (React + Vite)
A modern, highly interactive web dashboard built to visualize the results of the EEG analysis in real-time.

- **Pages:**
  - `UploadPage`: Drag-and-drop interface for uploading `.set` / `.fdt` files or selecting from local server datasets.
  - `ProcessingPage`: Real-time feedback and dynamic animations while the ensemble model runs inference.
  - `ResultPage`: Comprehensive dashboard showing the final diagnosis, confidence scores, multi-head probabilities (Fusion vs Temporal vs Graph), and visual analytics.
  - `AboutPage`: Detailed explanation of the model architecture and methodology.
- **Visual Components:**
  - **Topomap (`Topomap.jsx`):** A custom SVG-based interactive topographical brain map highlighting region-specific channel importance (Frontal, Central, Temporal, Parietal, Occipital) derived from the model's feature extraction.
  - **Graph Network (`GraphView.jsx`):** A 2D force-directed graph (`react-force-graph-2d`) visualizing functional brain connectivity and node coherence based on the GCN's spectral graph inputs.
  - **Charts:** Radar charts and bar charts (`react-chartjs-2`) mapping the probability distributions across classes and model heads.

---

## 📁 Repository Structure

```
NeuralScan-AI-EEG-based-Brain-Disorder-Classification/
├── backend/                        # FastAPI Python backend & model server
│   ├── eeg_core.py                 # Core DSP, preprocessing, custom layers & EEGEnsemble
│   ├── main.py                     # FastAPI REST API endpoints
│   ├── requirements.txt            # Python dependencies
│   └── models/                     # Production model assets & statistics
│       ├── models_final/           # 5-seed Deep Ensemble (.keras)
│       ├── norm_final.npz          # Feature normalization parameters
│       ├── metadata.json           # Model metadata and architecture specs
│       ├── folds.json              # 5-fold cross-validation splits
│       ├── subject_labels.json     # Subject-to-diagnosis mappings
│       └── samples/                # Sample EEG recordings for testing
│
├── frontend/                       # Modern React 19 + Vite dashboard
│   ├── src/
│   │   ├── components/             # Topomap, GraphView, Navbar
│   │   ├── pages/                  # UploadPage, ProcessingPage, ResultPage, AboutPage
│   │   ├── App.jsx                 # Routing and Layout
│   │   └── index.css               # Tailwind CSS v4 styles
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

## ⚡ Quick Start

### Option 1: 1-Click Launcher (Windows)
Double-click `start.bat` in the root folder to automatically start both the FastAPI backend and React frontend simultaneously.

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

## 🧪 EEG Input Requirements

- **Channels:** Standard 10–20 layout (19 channels required: `Fp1, Fp2, F7, F3, Fz, F4, F8, T3/T7, C3, Cz, C4, T4/T8, T5/P7, P3, Pz, P4, T6/P8, O1, O2`).
- **File Format:** Standard EEGLAB `.set` (accompanied by `.fdt`), or other formats supported by MNE (`.edf`, `.fif`, `.vhdr`).
- **Duration:** Recommended at least 1-2 minutes of recording (minimum of 20 valid 4-second windows).
