# EEG Full Pipeline: AD/FTD/CN Classification

This repository contains a comprehensive 6-stage deep learning and graph-theoretic pipeline for analyzing Electroencephalography (EEG) data. It specifically classifies Alzheimer's Disease (AD), Frontotemporal Dementia (FTD), and Cognitively Normal (CN) subjects using the ds006036 dataset.

## Table of Contents
- [Overview](#overview)
- [Pipeline Architecture](#pipeline-architecture)
- [Requirements & Installation](#requirements--installation)
- [Dataset](#dataset)
- [Usage](#usage)
- [Outputs](#outputs)

## Overview
The pipeline combines deep learning and graph theory to extract temporal and spatial insights from EEG recordings. It evaluates not only the accuracy of classification but also functional connectivity, discriminative connectivity biomarkers (like entropy), and lead-time optimization to determine the minimum EEG recording length necessary for an accurate diagnosis.

## Pipeline Architecture
The analysis is divided into 6 distinct stages:

1. **Stage 1: CNN-BiLSTM Temporal Classifier**
   - Applies a 1D Convolutional Neural Network followed by a Bidirectional LSTM.
   - Includes an attention mechanism over electrodes and a parallel band-power feature branch.
2. **Stage 2: Functional Connectivity Construction**
   - Generates coherence-based 19x19 adjacency matrices per 4-second EEG segment.
3. **Stage 3: Graph Convolutional Network (GCN)** 
   - A 3-layer GCN trained on graph structures where nodes represent band-power and edges represent functional connectivity.
4. **Stage 4: Connectivity Entropy Biomarker**
   - Calculates various network disorder metrics, establishing that higher entropy aligns with dementia (AD/FTD) through rigorous statistical tests.
5. **Stage 5: Temporal–Spatial Coupling Analysis**
   - Evaluates the correlation between Stage 1's temporal embeddings and Stage 3's graph embeddings using Canonical Correlation Analysis (CCA).
6. **Stage 6: Early-Warning / Lead-Time Analysis** 
   - Uses an ensemble of Stage 1 & 3 models to predict diagnosis across increasing time windows (1 to 64 segments) to optimize early diagnosis.

## Requirements & Installation
Ensure you have Python 3.7+ installed. Run the following command to install the required dependencies:
```bash
pip install mne scipy scikit-learn matplotlib seaborn tensorflow networkx
```

*Note: The script is optimized to utilize GPU acceleration via TensorFlow and mixed precision training (e.g., for RTX series graphics cards).*

## Dataset
The project is built to process the **ds006036** dataset (or appropriately structured standard derivatives).
- Must include a `participants.tsv` file detailing subject diagnosis/grouping.
- Inside the dataset directory, EEG recordings should be stored as `.set` files under the `eeglab` derivatives or raw `eeg` folders.

Set your dataset path in the `DATA_DIR` variable within the notebook. Example:
```python
DATA_DIR = "/kaggle/input/datasets/shivasubrahmanyakc/new-dataset/New Dataset"
```

## Usage
The entire pipeline is consolidated into a single Jupyter Notebook (`Major.ipynb`). You can run it sequentially, from top to bottom, either locally or within a Kaggle Notebook environment.

1. Clone the repository and install requirements.
2. Ensure your dataset is downloaded and the `DATA_DIR` path is mapped correctly in Cell 3 of the notebook.
3. Execute all cells in the Jupyter notebook. It will sequentially process and train the entire 6-stage pipeline.

*Caching: Intermediate processed chunks, such as segmented signals and adjacency matrices, are saved to `./eeg_cache.npz` and `./conn_cache.npz` to make subsequent test runs significantly faster.*

## Outputs

All classification summaries, statistical testing logs, and performance metrics are logged chronologically during execution.

### Local output artifacts:
- **`./results/` directory**: Contains all high-resolution generated plots.
   - Training curves and confusion matrices.
   - Mean band power and channel attention maps.
   - GCN tracking.
   - Entropy biomarker comparisons and CCA scatter plots.
   - Final trajectory / lead-time accuracy plots.
- **`./checkpoints/` directory**: Stores best-performing model weights (saved in `.keras` format).
   - `best_model.keras` (CNN-BiLSTM core)
   - `best_gcn.keras` (Graph module)
   - `gcn_embed.keras` & `temporal_extractor.keras` 
- **Tabular Biomarkers**: `entropy_biomarkers.csv` is exported with block-level entropy statistical tests and measurements.

##  Note
#The thing what has to b done next is validation  setup and other criteria for support 
