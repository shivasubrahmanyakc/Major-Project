# NeuralScan AI: EEG-based Brain Disorder Classification
*(Major Project)*

NeuralScan AI is a comprehensive, end-to-end Machine Learning pipeline and Full-Stack interactive web application for analyzing Electroencephalography (EEG) data. It predicts and classifies Alzheimer's Disease (AD), Frontotemporal Dementia (FTD), and Cognitively Normal (CN) profiles.

## Table of Contents
- [Overview](#overview)
- [Web Platform (Full-Stack)](#web-platform-full-stack-)
  - [Tech Stack](#tech-stack)
  - [Setup Instructions](#setup-instructions)
- [Pipeline Architecture (Data Science)](#pipeline-architecture-data-science)
- [Dataset Requirements](#dataset-requirements)
- [Outputs & Analytics](#outputs--analytics)

---

## Overview
This platform bridges rigorous graph-theory and deep learning techniques with a beautifully immersive web interface. By extracting temporal and spatial features from EEG signals, the engine assesses functional connectivity, predictive biomarkers, and lead-time optimization to determine patient diagnosis.

The system is divided into two primary parts:
1. **The Core Analytical Engine / Training** (Generates `.keras` model weights) 
2. **The Full-Stack Web App** (Consumes uploaded `.set` files to dynamically generate diagnostic results).

---

## Web Platform (Full-Stack) 🚀

Our newly integrated interactive dashboard accepts EEGLAB (`.set`) files, queries the trained analytical engine, and returns beautifully mapped spatial outputs.

### Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS v4, `react-force-graph-2d`, `lucide-react`
- **Backend API**: FastAPI, Python 3.10+, Uvicorn
- **AI/DSP Stack**: TensorFlow 2, MNE-Python, SciPy, NumPy

### Setup Instructions

The web application contains a smart **Offline Mock Mode**. If you haven't transferred the large `.keras` model weights over yet, the backend will gracefully simulate inferences so you can develop and test the UI rendering without errors!

#### 1. Start the Backend API
The backend acts as the gateway to the CNN-BiLSTM and GCN networks.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
*Note: Make sure your trained `best_model.keras` and `best_gcn.keras` files are placed inside the `backend/models/` folder for genuine processing.*

#### 2. Start the Frontend UI
The frontend renders spatial Topomaps dynamically via Canvas and renders coherence matrices as force-directed 2D networks.

```bash
cd frontend
npm install
npm run dev
```

Visit the link displayed in your terminal (typically `http://localhost:5173`).

---

## Pipeline Architecture (Data Science)

The engine training process is divided into 6 distinct analytical stages:

1. **Stage 1: CNN-BiLSTM Temporal Classifier**: 1D Convolution + Bi-directional LSTM with Spatial Attention.
2. **Stage 2: Functional Connectivity Construction**: Generates coherence-based 19x19 adjacency matrices per segment.
3. **Stage 3: Graph Convolutional Network (GCN)**: 3-layer Graph system where nodes = power bands, edges = coherence.
4. **Stage 4: Connectivity Entropy Biomarker**: Mathematical network tracking.
5. **Stage 5: Temporal–Spatial Coupling Analysis**: Canonical Correlation Analysis (CCA) between structural arrays.
6. **Stage 6: Early-Warning / Lead-Time Analysis**: Dynamic ensemble voting.

## Dataset Requirements

For training or evaluating against the raw `.set` files, note that:
- It focuses geometrically on the 10-20 standard 19-Channel layout.
- Re-samples incoming arrays strictly to 256Hz.
- Applies standard high-low (0.5Hz - 45Hz) artifact filtration alongside notch filtering at 50Hz.

## Outputs & Analytics

**Web Outputs:**
- **Spatial Attention Topomap**: Color-dense radial distributions identifying highly engaged cranial zones.
- **Functional Network Graph**: Coherence lines map relationships between discrete channels with visual gravity.

**Local Training Artifacts:**
- `./results/` - Plot caches, attention models, and accuracy matrices.
- `./checkpoints/` - TensorFlow model state dumps.
- `./entropy_biomarkers.csv` - Tabular raw readouts for clinical comparison.
