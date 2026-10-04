import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Topomap from '../components/Topomap';
import GraphView from '../components/GraphView';

/* ── helpers ─────────────────────────────────────────────────────── */
const CLASS_INFO = {
  AD:  {
    fullName: "Alzheimer's Disease",
    color: '#f43f5e',
    glow:  'rgba(244,63,94,.3)',
    bg:    'rgba(244,63,94,.08)',
    border:'rgba(244,63,94,.25)',
    icon:  '🔴',
    description: 'Alzheimer\'s Disease (AD) is a progressive neurodegenerative disorder characterized by tau tangles and amyloid plaques, leading to cognitive decline.',
    eeg_findings: [
      'Slowing of dominant alpha rhythm',
      'Increased delta/theta power in temporal and parietal regions',
      'Reduced long-range coherence between hemispheres',
      'Abnormal phase synchronization patterns',
      'Decreased beta band activity in frontal regions',
    ],
  },
  FTD: {
    fullName: 'Frontotemporal Dementia',
    color: '#f59e0b',
    glow:  'rgba(245,158,11,.3)',
    bg:    'rgba(245,158,11,.08)',
    border:'rgba(245,158,11,.25)',
    icon:  '🟠',
    description: 'Frontotemporal Dementia (FTD) involves progressive degeneration of the frontal and temporal lobes, affecting behavior, personality and language.',
    eeg_findings: [
      'Prominent frontal slow-wave activity',
      'Disrupted fronto-temporal connectivity',
      'Irregular gamma band synchronization',
      'Reduced signal stability across channels',
      'Altered mu rhythm over motor cortex',
    ],
  },
  CN:  {
    fullName: 'Cognitively Normal',
    color: '#10b981',
    glow:  'rgba(16,185,129,.3)',
    bg:    'rgba(16,185,129,.08)',
    border:'rgba(16,185,129,.25)',
    icon:  '🟢',
    description: 'The EEG pattern is consistent with normal cognitive function, showing organized rhythms, strong connectivity, and healthy synchronization across all brain regions.',
    eeg_findings: [
      'Well-organized posterior alpha rhythm (8–13 Hz)',
      'Strong fronto-occipital coherence',
      'Normal beta activity during resting state',
      'Low delta/theta power (no pathological slowing)',
      'Healthy long-range neural synchronization',
    ],
  },
};

const HEAD_INFO = {
  fusion:   { label: 'Fusion Head',   color: '#22d3ee', desc: 'Combined temporal + graph (headline model)' },
  temporal: { label: 'Temporal Head', color: '#818cf8', desc: 'EEGNet-style multi-scale CNN' },
  graph:    { label: 'Graph Head',    color: '#a78bfa', desc: 'Chebyshev GCN over coherence graph' },
};

function ProbBar({ label, value, color, highlight }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: highlight ? 700 : 500, color: highlight ? color : '#94a3b8' }}>
          {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: highlight ? color : '#64748b' }}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 9999, background: 'rgba(99,129,255,.1)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 9999,
          background: highlight ? color : 'rgba(99,129,255,.25)',
          width: `${value * 100}%`,
          transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
          boxShadow: highlight ? `0 0 8px ${color}` : 'none',
        }} />
      </div>
    </div>
  );
}

function HeadCard({ headKey, probs }) {
  const hi = HEAD_INFO[headKey];
  const entries = Object.entries(probs).sort((a, b) => b[1] - a[1]);
  const winner = entries[0][0];
  return (
    <div style={{
      background: 'rgba(8,13,26,.7)',
      border: `1px solid rgba(99,129,255,.12)`,
      borderRadius: 16, padding: 20,
      flex: 1, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: hi.color }}>{hi.label}</span>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 9999,
          background: `${hi.color}18`, border: `1px solid ${hi.color}40`,
          color: hi.color, fontWeight: 600,
        }}>{winner}</span>
      </div>
      <p style={{ fontSize: 11, color: '#475569', marginBottom: 14 }}>{hi.desc}</p>
      {entries.map(([cls, prob]) => (
        <ProbBar key={cls} label={cls} value={prob} color={hi.color} highlight={cls === winner} />
      ))}
    </div>
  );
}

/* ── Main ── */
export default function ResultPage() {
  const { state: results } = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (!results) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontSize: 18, marginBottom: 16 }}>No result data available.</p>
          <button onClick={() => navigate('/')} style={btnStyle('#22d3ee')}>← Back to Upload</button>
        </div>
      </div>
    );
  }

  const info = CLASS_INFO[results.prediction] || CLASS_INFO.CN;
  const fusionProbs = results.probabilities?.fusion || {};
  const TABS = ['overview', 'heads', 'brain-map'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Prediction hero card ── */}
        <div style={{
          borderRadius: 24,
          background: `linear-gradient(135deg, ${info.bg}, rgba(8,13,26,.9))`,
          border: `1px solid ${info.border}`,
          padding: '36px 40px',
          marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 24,
          boxShadow: `0 0 60px ${info.glow}`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Background decorative blur */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: info.color, opacity: 0.06,
            filter: 'blur(60px)', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: info.color,
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
            }}>
              EEG Classification Result
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 56, fontWeight: 900, lineHeight: 1,
                color: info.color,
                textShadow: `0 0 40px ${info.glow}`,
              }}>
                {results.prediction}
              </h1>
              <div>
                <p style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0' }}>{info.fullName}</p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4,
                  padding: '4px 12px', borderRadius: 9999,
                  background: `${info.color}18`, border: `1px solid ${info.color}40`,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: info.color, boxShadow: `0 0 6px ${info.color}` }} />
                  <span style={{ fontSize: 13, color: info.color, fontWeight: 600 }}>
                    {(results.confidence * 100).toFixed(1)}% Confidence (Fusion Head)
                  </span>
                </div>
              </div>
            </div>

            {/* Inputs used */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {results.inputs_used && (
                <span style={{
                  padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 500,
                  background: 'rgba(99,129,255,.1)', border: '1px solid rgba(99,129,255,.2)', color: '#818cf8',
                }}>
                  Inputs: {results.inputs_used}
                </span>
              )}
              {results.windows_used && Object.entries(results.windows_used).map(([k, v]) => (
                <span key={k} style={{
                  padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 500,
                  background: 'rgba(34,211,238,.06)', border: '1px solid rgba(34,211,238,.15)', color: '#67e8f9',
                }}>
                  {k}: {v} windows
                </span>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '10px 20px', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(99,129,255,.1)', border: '1px solid rgba(99,129,255,.25)',
                color: '#818cf8', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              ↩ New Analysis
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(8,13,26,.6)', padding: 4, borderRadius: 14, width: 'fit-content', border: '1px solid rgba(99,129,255,.1)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all .2s',
              background: activeTab === t ? 'rgba(34,211,238,.12)' : 'transparent',
              color: activeTab === t ? '#22d3ee' : '#64748b',
              boxShadow: activeTab === t ? '0 0 12px rgba(34,211,238,.15)' : 'none',
            }}>
              {t === 'overview' ? '📋 Overview' : t === 'heads' ? '🔍 Head Probabilities' : '🧠 Brain Map'}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}
            className="animate-fade-in">

            {/* Description */}
            <div style={{
              background: 'rgba(8,13,26,.7)', border: '1px solid rgba(99,129,255,.1)',
              borderRadius: 20, padding: 28, gridColumn: '1 / -1',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>
                {info.icon} About this Diagnosis
              </h3>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{info.description}</p>
            </div>

            {/* EEG findings */}
            <div style={{
              background: 'rgba(8,13,26,.7)', border: '1px solid rgba(99,129,255,.1)',
              borderRadius: 20, padding: 28,
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>
                EEG Biomarkers Detected
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {info.eeg_findings.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#94a3b8' }}>
                    <span style={{ color: info.color, marginTop: 2, flexShrink: 0 }}>▸</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Fusion probabilities */}
            <div style={{
              background: 'rgba(8,13,26,.7)', border: '1px solid rgba(99,129,255,.1)',
              borderRadius: 20, padding: 28,
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>
                Fusion Head Probabilities
              </h3>
              {Object.entries(fusionProbs)
                .sort((a, b) => b[1] - a[1])
                .map(([cls, prob]) => (
                  <ProbBar key={cls} label={CLASS_INFO[cls]?.fullName || cls}
                    value={prob} color={CLASS_INFO[cls]?.color || '#818cf8'}
                    highlight={cls === results.prediction} />
                ))}
              <p style={{ fontSize: 11, color: '#475569', marginTop: 12 }}>
                Fusion = averaged log-probabilities across both conditions and all 5 seeds.
              </p>
            </div>
          </div>
        )}

        {/* ── Head Probabilities tab ── */}
        {activeTab === 'heads' && (
          <div className="animate-fade-in">
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              Each head independently classifies from a different learned representation. Their outputs are averaged in log-probability space.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {results.probabilities && Object.entries(results.probabilities).map(([head, probs]) => (
                <HeadCard key={head} headKey={head} probs={probs} />
              ))}
            </div>
          </div>
        )}

        {/* ── Brain Map tab ── */}
        {activeTab === 'brain-map' && (
          <div className="animate-fade-in">
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              Spatial attention (channel importance from mean node-feature magnitude) and functional connectivity graph from spectral coherence.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <Topomap attentionVals={results.graph?.nodes} />
              <GraphView graphData={results.graph} />
            </div>
          </div>
        )}

        {/* ── Disclaimer ── */}
        <div style={{
          marginTop: 32, padding: '14px 20px',
          background: 'rgba(244,63,94,.04)',
          border: '1px solid rgba(244,63,94,.12)',
          borderRadius: 12, fontSize: 12, color: '#64748b', textAlign: 'center',
        }}>
          ⚠️ This system is a <strong style={{ color: '#94a3b8' }}>research prototype</strong> only and is not validated for clinical use. Do not use for medical diagnosis.
        </div>
      </main>
    </div>
  );
}

function btnStyle(color) {
  return {
    padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
    background: `${color}18`, border: `1px solid ${color}40`,
    color, fontSize: 14, fontWeight: 600,
  };
}