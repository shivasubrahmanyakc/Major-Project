import React from 'react';
import Navbar from '../components/Navbar';

const PHASES = [
  {
    tag: 'PHASE 01', title: 'Continuous EEG Signal Ingestion & Filtering',
    items: [
      'Reads .set, .edf, .fif, and .vhdr neurophysiological recordings using MNE-Python.',
      'Aligns recording channels to the standardized 19-channel 10-20 international montage.',
      'Applies 50 Hz notch filter and 0.5–45 Hz band-pass filter to raw potentials.',
      'Performs common average re-referencing (CAR) across active scalp sensors.',
      'Resamples continuous data to 128 Hz uniform temporal resolution.',
    ],
  },
  {
    tag: 'PHASE 02', title: 'Epoch Segmentation & Artifact Rejection',
    items: [
      'Partitions raw continuous traces into 4-second epochs (512 samples) with 50% overlap.',
      'Applies strict amplitude thresholding: epochs exceeding ±150 μV are discarded.',
      'Performs channel-wise z-score standardization per recording session.',
      'Requires a minimum of 20 clean windows to guarantee statistical reliability.',
    ],
  },
  {
    tag: 'PHASE 03', title: 'Spectral & Coherence Graph Feature Extraction',
    items: [
      'Computes 16 node features per channel: log relative band powers (δ, θ, α, β, γ), band ratios, spectral entropy, peak alpha frequency, and Hjorth mobility/complexity.',
      'Constructs 19×19 cross-spectral coherence matrices across canonical EEG bands.',
      'Normalizes node features using precomputed empirical training set distributions.',
    ],
  },
  {
    tag: 'PHASE 04', title: 'Chebyshev Spectral Graph Convolution (GCN)',
    items: [
      'Sparsifies coherence graphs using top-k (k=8) nearest-neighbor edge thresholding.',
      'Applies Chebyshev polynomial graph filters (order K=3) over normalized Laplacian.',
      'Executes two residual ChebConv blocks (32 → 64 units) with skip connections.',
      'Dual global average and global max pooling produce 64-dimensional graph embeddings.',
    ],
  },
  {
    tag: 'PHASE 05', title: 'Multi-Scale Temporal Convolutional Encoder',
    items: [
      'Processes raw waveform epochs via multi-scale temporal kernel convolutions (16, 32, 64).',
      'Depthwise spatial filtering captures cross-electrode phase and amplitude patterns.',
      'Square activation, average pooling, and batch normalization extract rhythmic power envelopes.',
      'Global pooling yields 64-dimensional temporal latent representation vectors.',
    ],
  },
  {
    tag: 'PHASE 06', title: '5-Seed Ensemble Fusion & Decision Rules',
    items: [
      'Ensemble integrates 5 independently trained model seeds to reduce prediction variance.',
      'Evaluates fusion, temporal CNN, and graph convolutional classification heads.',
      'Aggregates segment posteriors in log-probability space across available conditions.',
      'Computes final class likelihoods via calibrated softmax output distribution.',
    ],
  },
];

const METRICS = [
  { label: 'Total Parameters', value: '57,873', sub: 'learnable weights' },
  { label: 'Temporal Encoder', value: '8,624', sub: 'CNN parameters' },
  { label: 'Graph GCN', value: '31,704', sub: 'Chebyshev weights' },
  { label: 'Ensemble Seeds', value: '5 Seeds', sub: 'independent runs' },
  { label: 'Window Length', value: '4 s (512)', sub: 'at 128 Hz sampling' },
  { label: 'Montage', value: '19 Channels', sub: '10-20 standard' },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(3rem, 5vw, 5rem) 24px 80px' }}>

        {/* Editorial Header */}
        <div style={{ marginBottom: 44 }} className="animate-fade-up">
          <p style={{
            margin: '0 0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            fontSize: '0.8125rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#6B7078',
          }}>
            Technical Architecture
            <span style={{ height: 1, flex: 1, background: '#D9D2C5' }} />
          </p>

          <h1 style={{
            margin: '0 0 20px',
            maxWidth: '48rem',
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            fontSize: 'clamp(2.4rem, 1.2rem + 3.8vw, 4.4rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: '#14161A',
          }}>
            The computational models behind NeuralScan.
          </h1>

          <p style={{
            margin: 0,
            maxWidth: '42rem',
            fontFamily: "var(--font-sans)",
            fontSize: 'clamp(1.05rem, 0.98rem + 0.3vw, 1.25rem)',
            lineHeight: 1.6,
            color: '#3A3E45',
          }}>
            A multimodal ensemble coupling temporal waveform encoders and spectral Chebyshev graph convolutional networks trained across Alzheimer's Disease (AD), Frontotemporal Dementia (FTD), and Cognitively Normal (CN) cohorts.
          </p>
        </div>

        {/* Model Metrics */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12, marginBottom: 40,
        }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{
              background: '#FAF6F0', border: '1px solid #D8D1C4',
              borderRadius: 8, padding: '16px 14px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 18, fontWeight: 700,
                color: '#84512E',
                marginBottom: 4,
              }}>
                {m.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#14161A', marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#6B7078' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Pipeline Phases */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {PHASES.map((phase, i) => (
            <div key={i} style={{
              background: '#FAF6F0',
              border: '1px solid #D8D1C4',
              borderRadius: 8, padding: '22px 26px',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: '#84512E',
                }}>
                  {phase.tag}
                </span>
                <h2 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 18, fontWeight: 600, color: '#14161A',
                  margin: 0,
                }}>
                  {phase.title}
                </h2>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
                {phase.items.map((item, j) => (
                  <li key={j} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    fontSize: 13, color: '#3A3E45', lineHeight: 1.5,
                  }}>
                    <span style={{ color: '#84512E', flexShrink: 0, marginTop: 1 }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: 40, padding: '16px 20px',
          background: '#F3EDE3',
          border: '1px solid #D8D1C4',
          borderRadius: 6, fontSize: 12, color: '#6B7078', lineHeight: 1.6, textAlign: 'center',
        }}>
          Research and academic verification software. All neurophysiological classifications represent model outputs from academic datasets and do not constitute clinical diagnostic conclusions.
        </div>
      </main>
    </div>
  );
}