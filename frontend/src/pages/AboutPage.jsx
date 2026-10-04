import React from 'react';
import Navbar from '../components/Navbar';

const PHASES = [
  {
    icon: '📂', title: 'Phase 1 — EEG Loading',
    items: [
      'Reads .set / .edf / .fif / .vhdr files via MNE',
      'Maps all channel names to 19 standard 10-20 electrodes',
      '50 Hz notch filter + 0.5–45 Hz band-pass (raw recordings)',
      'Common average re-referencing',
      'Resamples to 128 Hz',
    ],
  },
  {
    icon: '⚡', title: 'Phase 2 — Windowing & Artifact Rejection',
    items: [
      '4-second windows (512 samples) with 50% overlap',
      'Amplitude threshold: windows > ±150 μV are discarded',
      'Z-score normalization per channel per recording',
      'Requires ≥ 20 clean windows for reliable prediction',
    ],
  },
  {
    icon: '📊', title: 'Phase 3 — Feature Extraction',
    items: [
      '16 node features per channel: log relative band powers (δ, θ, α, β, γ), ratio features, spectral entropy, peak alpha frequency, Hjorth mobility & complexity',
      'Coherence graph (19×19): cross-spectral coherence across 5 frequency bands',
      'Node features normalised by training set statistics (norm_final.npz)',
    ],
  },
  {
    icon: '🔗', title: 'Phase 4 — Graph Neural Network (GCN)',
    items: [
      'Top-k (k=8) coherence-graph sparsification',
      'Symmetric normalisation → Chebyshev GCN (K=3)',
      'Two ChebConv blocks (32→64 units) with skip connections',
      'Global average + max pooling → 64-dim graph embedding',
    ],
  },
  {
    icon: '🧠', title: 'Phase 5 — Temporal Encoder (EEGNet-style)',
    items: [
      'Multi-scale spatial convolutions: kernels 16, 32, 64 × depthwise',
      'Square activation → average pooling → log-clip → BN',
      'Global average + std pooling → 64-dim temporal embedding',
      'Condition one-hot (rest=[1,0] / photic=[0,1]) concatenated to both heads',
    ],
  },
  {
    icon: '✨', title: 'Phase 6 — 5-Seed Ensemble & Fusion',
    items: [
      '5 independently-trained models (seeds 0–4) trained on all subjects',
      'Three classification heads: fusion, temporal, graph',
      'Window probabilities averaged in log-probability space per condition',
      'Conditions averaged → softmax → final class probabilities',
      'Headline model: fusion head (rest + photic combined)',
    ],
  },
];

const METRICS = [
  { label: 'Parameters', value: '57,873', sub: 'total model weights' },
  { label: 'Temporal', value: '8,624', sub: 'encoder parameters' },
  { label: 'Graph', value: '31,704', sub: 'GCN parameters' },
  { label: 'Ensemble', value: '5 seeds', sub: 'independent models' },
  { label: 'Window', value: '4 s / 128 Hz', sub: '512 samples' },
  { label: 'Channels', value: '19', sub: '10-20 standard' },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }} className="animate-fade-up">
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 40, fontWeight: 800, color: '#e2e8f0', marginBottom: 12,
          }}>
            How <span className="brand-text">NeuralScan AI</span> Works
          </h1>
          <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, maxWidth: 680 }}>
            A lightweight Temporal + Graph Neural Network ensemble for 3-class EEG-based dementia classification.
            Trained on the openly available AD/FTD/CN dataset (19-channel eyes-closed rest + photic stimulation).
          </p>
        </div>

        {/* Model metrics */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12, marginBottom: 48,
        }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{
              background: 'rgba(8,13,26,.8)', border: '1px solid rgba(99,129,255,.12)',
              borderRadius: 16, padding: '18px 16px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 20, fontWeight: 800,
                background: 'linear-gradient(135deg, #22d3ee, #818cf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                marginBottom: 4,
              }}>{m.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Pipeline phases */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PHASES.map((phase, i) => (
            <div key={i} style={{
              background: 'rgba(8,13,26,.7)',
              border: '1px solid rgba(99,129,255,.1)',
              borderRadius: 20, padding: '24px 28px',
              transition: 'border-color .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,129,255,.25)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,129,255,.1)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>{phase.icon}</span>
                <h2 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 16, fontWeight: 700, color: '#e2e8f0',
                }}>{phase.title}</h2>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {phase.items.map((item, j) => (
                  <li key={j} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    fontSize: 13, color: '#94a3b8', lineHeight: 1.6,
                  }}>
                    <span style={{ color: '#22d3ee', marginTop: 3, flexShrink: 0, fontSize: 10 }}>◆</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Classes */}
        <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { code: 'AD',  name: "Alzheimer's Disease",    color: '#f43f5e', note: 'Progressive neurodegeneration with amyloid plaques' },
            { code: 'FTD', name: 'Frontotemporal Dementia',color: '#f59e0b', note: 'Frontal/temporal lobe degeneration affecting behavior' },
            { code: 'CN',  name: 'Cognitively Normal',     color: '#10b981', note: 'Healthy baseline — organized rhythms, strong connectivity' },
          ].map(cls => (
            <div key={cls.code} style={{
              background: `${cls.color}08`, border: `1px solid ${cls.color}25`,
              borderRadius: 16, padding: '18px 20px',
            }}>
              <div style={{
                display: 'inline-block', padding: '2px 12px', borderRadius: 9999,
                background: `${cls.color}18`, border: `1px solid ${cls.color}40`,
                fontSize: 14, fontWeight: 800, color: cls.color, marginBottom: 8,
              }}>{cls.code}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>{cls.name}</p>
              <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{cls.note}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: 40, padding: '16px 20px',
          background: 'rgba(244,63,94,.04)',
          border: '1px solid rgba(244,63,94,.12)',
          borderRadius: 14, fontSize: 12, color: '#64748b', lineHeight: 1.7, textAlign: 'center',
        }}>
          ⚠️ <strong style={{ color: '#94a3b8' }}>Research Prototype:</strong> NeuralScan AI is for academic demonstration only.
          It has not been clinically validated and must not be used for medical diagnosis or treatment decisions.
          Final models are trained on all subjects with no held-out test set; refer to cross-validation results in the associated paper.
        </div>
      </main>
    </div>
  );
}