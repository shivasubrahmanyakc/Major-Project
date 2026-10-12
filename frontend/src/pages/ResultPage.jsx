import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BrainDashboard from '../components/BrainDashboard';

/* ── Class Metadata ── */
const CLASS_INFO = {
  AD:  {
    fullName: "Alzheimer's Disease",
    code: 'AD',
    description: 'Alzheimer\'s Disease (AD) is characterized by neurodegenerative cortical changes resulting in progressive cognitive decline, slowing of dominant background rhythms, and impaired functional interconnectivity.',
    eeg_findings: [
      'Generalized slowing of posterior dominant alpha rhythm (shift toward theta)',
      'Marked increase in spectral delta/theta power across temporo-parietal leads',
      'Loss of long-range inter-hemispheric coherence and phase locking',
      'Reduced fast beta-band synchronization over associative neocortex',
      'Decreased non-linear complexity and signal entropy in continuous EEG',
    ],
  },
  FTD: {
    fullName: 'Frontotemporal Dementia',
    code: 'FTD',
    description: 'Frontotemporal Dementia (FTD) involves focal progressive atrophy localized primarily in the frontal and anterior temporal regions, affecting executive control and behavioral circuits.',
    eeg_findings: [
      'Prominent anterior slow-wave (theta/delta) excess over fronto-central channels',
      'Selective disruption of fronto-temporal connectivity pathways',
      'Atypical gamma-band power distribution reflecting altered cortical excitation',
      'Relative preservation of occipital alpha reactivity in early stages',
      'Reduced temporal variability in oscillatory burst patterns',
    ],
  },
  CN:  {
    fullName: 'Cognitively Normal',
    code: 'CN',
    description: 'The recording exhibits preserved neurophysiological architecture consistent with healthy aging, characterized by strong rhythmic synchronization and robust functional connectivity.',
    eeg_findings: [
      'Well-organized, reactive posterior dominant alpha rhythm (8–13 Hz)',
      'Intact fronto-occipital and inter-hemispheric functional coherence',
      'Normal beta-band distribution during alert eyes-closed resting state',
      'Minimal delta/theta slow-wave intrusion outside expected physiological bounds',
      'Preserved complex temporal dynamics and high phase-lag index',
    ],
  },
};

const HEAD_INFO = {
  fusion:   { label: 'Fusion Model',   desc: 'Unified temporal + graph ensemble (headline prediction)' },
  temporal: { label: 'Temporal CNN',   desc: 'Multi-scale spatial-temporal convolutional network' },
  graph:    { label: 'Chebyshev GCN',  desc: 'Spectral graph convolutional network over coherence' },
};

function ProbBar({ label, value, highlight }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: highlight ? 600 : 400, color: highlight ? '#14161A' : '#6B7078' }}>
          {label}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          color: highlight ? '#84512E' : '#6B7078',
        }}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: '#D9D2C5', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: highlight ? '#84512E' : '#A89F90',
          width: `${value * 100}%`,
          transition: 'width 0.8s ease',
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
      background: '#FAF6F0',
      border: '1px solid #D8D1C4',
      borderRadius: 8, padding: 18,
      flex: 1, minWidth: 260,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h4 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 17,
          fontWeight: 600,
          color: '#14161A',
          margin: 0,
        }}>
          {hi.label}
        </h4>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11, padding: '2px 8px', borderRadius: 4,
          background: '#F3EDE3', border: '1px solid #D8D1C4',
          color: '#84512E', fontWeight: 600,
        }}>
          {winner}
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#6B7078', marginBottom: 14 }}>{hi.desc}</p>
      {entries.map(([cls, prob]) => (
        <ProbBar key={cls} label={cls} value={prob} highlight={cls === winner} />
      ))}
    </div>
  );
}

/* ── Main Result Page ── */
export default function ResultPage() {
  const { state: results } = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (!results) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6B7078' }}>
          <p style={{ fontSize: 16, marginBottom: 14 }}>No result data available.</p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 18px', borderRadius: 6, cursor: 'pointer',
              background: '#84512E', border: 'none', color: '#FFFFFF', fontSize: 13, fontWeight: 500,
            }}
          >
            ← Back to Upload
          </button>
        </div>
      </div>
    );
  }

  const info = CLASS_INFO[results.prediction] || CLASS_INFO.CN;
  const fusionProbs = results.probabilities?.fusion || {};
  const TABS = [
    { id: 'overview', label: 'Summary Overview' },
    { id: 'heads',    label: 'Head Probabilities' },
    { id: 'brain-map',label: 'Brain Mapping' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(2.5rem, 4vw, 4rem) 24px 80px' }}>

        {/* ── Editorial Header (SapientPriors Style) ── */}
        <div style={{ marginBottom: 36 }} className="animate-fade-up">
          <p style={{
            margin: '0 0 16px',
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
            Classification Output • 5-Seed Ensemble
            <span style={{ height: 1, flex: 1, background: '#D9D2C5' }} />
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 20,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 style={{
                  margin: 0,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 400,
                  fontSize: 'clamp(2.5rem, 1.2rem + 3vw, 4rem)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.025em',
                  color: '#14161A',
                }}>
                  {info.fullName}
                </h1>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#84512E',
                  letterSpacing: '0.04em',
                }}>
                  ({results.prediction})
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 6,
                  background: '#FAF6F0', border: '1px solid #D8D1C4',
                  fontFamily: 'var(--font-mono)', fontSize: 12, color: '#84512E', fontWeight: 600,
                }}>
                  {(results.confidence * 100).toFixed(1)}% CONFIDENCE (FUSION)
                </span>

                <span style={{
                  padding: '4px 10px', borderRadius: 6,
                  background: '#F3EDE3', border: '1px solid #D8D1C4',
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7078',
                }}>
                  RECORDING: EEG SIGNALS
                </span>
                {results.windows_used && Object.entries(results.windows_used).map(([k, v]) => (
                  <span key={k} style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: '#F3EDE3', border: '1px solid #D8D1C4',
                    fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7078',
                  }}>
                    {k === 'rest' ? 'EEG Signals' : k}: {v} windows
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              style={{
                padding: '8px 18px', borderRadius: 6, cursor: 'pointer',
                background: '#FAF6F0', border: '1px solid #D8D1C4',
                color: '#14161A', fontSize: 13, fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all .15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#B8AFA0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FAF6F0'; e.currentTarget.style.borderColor = '#D8D1C4'; }}
            >
              ← New Analysis
            </button>
          </div>
        </div>

        {/* ── View Navigation Tabs ── */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 24,
          borderBottom: '1px solid #D9D2C5',
          paddingBottom: 2,
        }}>
          {TABS.map(t => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid #84512E' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  fontFamily: 'var(--font-sans)',
                  color: active ? '#84512E' : '#6B7078',
                  transition: 'all .15s ease',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }} className="animate-fade-in">

            {/* Diagnostic Profile card */}
            <div style={{
              background: '#FAF6F0', border: '1px solid #D8D1C4',
              borderRadius: 8, padding: 24, gridColumn: '1 / -1',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#84512E',
                display: 'block',
                marginBottom: 6,
              }}>
                Diagnostic Profile
              </span>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 600,
                color: '#14161A',
                marginBottom: 8,
              }}>
                {info.fullName} Pathophysiological Signatures
              </h3>
              <p style={{ fontSize: 14, color: '#3A3E45', lineHeight: 1.6, margin: 0 }}>
                {info.description}
              </p>
            </div>

            {/* EEG Biomarkers */}
            <div style={{
              background: '#FAF6F0', border: '1px solid #D8D1C4',
              borderRadius: 8, padding: 24,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#84512E',
                display: 'block',
                marginBottom: 6,
              }}>
                Identified Correlates
              </span>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 600,
                color: '#14161A',
                marginBottom: 14,
              }}>
                Electroencephalographic Markers
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, padding: 0 }}>
                {info.eeg_findings.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#3A3E45', lineHeight: 1.5 }}>
                    <span style={{ color: '#84512E', fontWeight: 700, flexShrink: 0 }}>•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Fusion distribution */}
            <div style={{
              background: '#FAF6F0', border: '1px solid #D8D1C4',
              borderRadius: 8, padding: 24,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#84512E',
                display: 'block',
                marginBottom: 6,
              }}>
                Ensemble Likelihood
              </span>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 600,
                color: '#14161A',
                marginBottom: 14,
              }}>
                Class Posterior Distribution
              </h3>
              {Object.entries(fusionProbs)
                .sort((a, b) => b[1] - a[1])
                .map(([cls, prob]) => (
                  <ProbBar
                    key={cls}
                    label={`${cls} — ${CLASS_INFO[cls]?.fullName || cls}`}
                    value={prob}
                    highlight={cls === results.prediction}
                  />
                ))}
              <p style={{ fontSize: 11, color: '#6B7078', marginTop: 14, lineHeight: 1.4 }}>
                Averaged in log-probability space over 5 random initialization seeds.
              </p>
            </div>
          </div>
        )}

        {/* ── Head Probabilities Tab ── */}
        {activeTab === 'heads' && (
          <div className="animate-fade-in">
            <p style={{ fontSize: 13, color: '#6B7078', marginBottom: 16 }}>
              Independent posterior predictions from multi-scale temporal convolutions and Chebyshev spectral graph networks:
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {results.probabilities && Object.entries(results.probabilities).map(([head, probs]) => (
                <HeadCard key={head} headKey={head} probs={probs} />
              ))}
            </div>
          </div>
        )}

        {/* ── Brain Map Tab ── */}
        {activeTab === 'brain-map' && (
          <BrainDashboard graphData={results.graph} prediction={results.prediction} />
        )}

        {/* Disclaimer */}
        <div style={{
          marginTop: 40, padding: '14px 18px',
          background: '#F3EDE3',
          border: '1px solid #D8D1C4',
          borderRadius: 6, fontSize: 12, color: '#6B7078', textAlign: 'center', lineHeight: 1.5,
        }}>
          Research demonstration. All inferences represent computational model estimates and must not be used as standalone clinical diagnostics.
        </div>
      </main>
    </div>
  );
}