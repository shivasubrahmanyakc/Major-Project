import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

/* ── tiny inline icon helpers ─────────────────────────────────────── */
const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const BrainIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

/* ── Dropzone sub-component ─────────────────────────────────────────── */
function Dropzone({ label, sublabel, color, file, onFile, onClear, accept = ".set" }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handle = (f) => { if (f) onFile(f); };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handle(e.dataTransfer.files[0]);
  };

  const colorMap = {
    cyan:   { border: 'rgba(34,211,238,.35)',  bg: 'rgba(34,211,238,.06)',  text: '#22d3ee', glow: 'rgba(34,211,238,.15)' },
    violet: { border: 'rgba(124,58,237,.35)',  bg: 'rgba(124,58,237,.06)',  text: '#a78bfa', glow: 'rgba(124,58,237,.15)' },
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </p>
      {!file ? (
        <div
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragging ? c.text : c.border}`,
            borderRadius: 16,
            padding: '32px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? c.bg : 'transparent',
            transition: 'all .2s',
            minHeight: 140,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          <div style={{ color: c.text, opacity: 0.7 }}><UploadIcon /></div>
          <div>
            <p style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>Drop .set file or <span style={{ color: c.text, textDecoration: 'underline' }}>browse</span></p>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{sublabel}</p>
          </div>
          <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
            onChange={e => handle(e.target.files[0])} />
        </div>
      ) : (
        <div style={{
          borderRadius: 16, padding: '16px 18px',
          background: c.bg,
          border: `1px solid ${c.border}`,
          display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
          boxShadow: `0 0 20px ${c.glow}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <span style={{ color: c.text }}><FileIcon /></span>
            <span style={{ fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {file.name}
            </span>
          </div>
          <button onClick={onClear} style={{
            flexShrink: 0, background: 'rgba(244,63,94,.15)', border: '1px solid rgba(244,63,94,.3)',
            borderRadius: 8, color: '#f43f5e', cursor: 'pointer', padding: '4px 6px',
            display: 'flex', alignItems: 'center',
          }}><XIcon /></button>
        </div>
      )}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────── */
export default function UploadPage() {
  const [activeTab, setActiveTab] = useState('local'); // 'local' | 'upload'
  const [localFiles, setLocalFiles] = useState([]);
  const [selectedRestLocal, setSelectedRestLocal] = useState('');
  const [selectedPhoticLocal, setSelectedPhoticLocal] = useState('');

  const [restFile,   setRestFile]   = useState(null);
  const [photicFile, setPhoticFile] = useState(null);
  const [error,      setError]      = useState(null);
  const navigate = useNavigate();

  // Fetch local EEG_SET_FILES from backend
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/local-files')
      .then(res => {
        const files = res.data?.files || [];
        setLocalFiles(files);
        if (files.length > 0) {
          // Preselect first rest file if available
          const restGuess = files.find(f => f.filename.toLowerCase().includes('rest')) || files[0];
          if (restGuess) setSelectedRestLocal(restGuess.filename);
          const photicGuess = files.find(f => f.filename.toLowerCase().includes('photic') && f.filename !== restGuess.filename);
          if (photicGuess) setSelectedPhoticLocal(photicGuess.filename);
          setActiveTab('local');
        } else {
          setActiveTab('upload');
        }
      })
      .catch(() => {
        setActiveTab('upload');
      });
  }, []);

  const canAnalyze = activeTab === 'local'
    ? (!!selectedRestLocal || !!selectedPhoticLocal)
    : (!!restFile || !!photicFile);

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    setError(null);
    if (activeTab === 'local') {
      navigate('/processing', {
        state: {
          localRest: selectedRestLocal || null,
          localPhotic: selectedPhoticLocal || null,
        }
      });
    } else {
      navigate('/processing', { state: { restFile, photicFile } });
    }
  };

  const selectStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    background: 'rgba(15,23,42,.8)',
    border: '1px solid rgba(99,129,255,.25)',
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', marginBottom: 50 }} className="animate-fade-up">
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
            <div style={{
              position: 'absolute', inset: -20,
              background: 'radial-gradient(circle, rgba(34,211,238,.25) 0%, transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />
            <div style={{
              width: 68, height: 68, borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(34,211,238,.2), rgba(124,58,237,.2))',
              border: '1px solid rgba(34,211,238,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
              animation: 'float 4s ease-in-out infinite',
              color: '#22d3ee',
            }} className="animate-float">
              <BrainIcon />
            </div>
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(34px, 5vw, 54px)',
            fontWeight: 800, lineHeight: 1.15,
            marginBottom: 14,
          }}>
            <span style={{ color: '#e2e8f0' }}>Neural</span>
            <span className="brand-text">Scan</span>
            <span style={{ color: '#e2e8f0' }}> AI</span>
          </h1>

          <p style={{
            fontSize: 16, color: '#94a3b8', maxWidth: 540, margin: '0 auto 12px',
            lineHeight: 1.6,
          }}>
            Clinical EEG classification with a 5-seed Temporal + Graph Neural Network Ensemble.
            Differentiates <strong style={{ color: '#e2e8f0' }}>Alzheimer's Disease (AD)</strong>, {' '}
            <strong style={{ color: '#e2e8f0' }}>Frontotemporal Dementia (FTD)</strong>, and {' '}
            <strong style={{ color: '#e2e8f0' }}>Cognitively Normal (CN)</strong>.
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 9999,
            background: 'rgba(244,63,94,.08)',
            border: '1px solid rgba(244,63,94,.2)',
            fontSize: 12, color: '#fca5a5', fontWeight: 500,
          }}>
            ⚠️ Research prototype — 19-channel 10-20 standard
          </div>
        </div>

        {/* ── Main Input Card ── */}
        <div style={{
          background: 'rgba(8,13,26,.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99,129,255,.16)',
          borderRadius: 24,
          padding: '36px 36px 40px',
          marginBottom: 40,
          boxShadow: '0 0 80px rgba(34,211,238,.06)',
        }} className="animate-fade-up">

          {/* Mode Switch Tabs */}
          <div style={{
            display: 'flex', gap: 12, marginBottom: 28,
            borderBottom: '1px solid rgba(99,129,255,.12)',
            paddingBottom: 16,
          }}>
            <button
              onClick={() => setActiveTab('local')}
              style={{
                background: activeTab === 'local' ? 'rgba(34,211,238,.12)' : 'transparent',
                border: activeTab === 'local' ? '1px solid rgba(34,211,238,.4)' : '1px solid transparent',
                borderRadius: 10,
                padding: '8px 16px',
                color: activeTab === 'local' ? '#22d3ee' : '#94a3b8',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all .2s',
              }}
            >
              <span>📁</span> Select from EEG_SET_FILES {localFiles.length > 0 && `(${localFiles.length} detected)`}
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              style={{
                background: activeTab === 'upload' ? 'rgba(167,139,250,.12)' : 'transparent',
                border: activeTab === 'upload' ? '1px solid rgba(167,139,250,.4)' : '1px solid transparent',
                borderRadius: 10,
                padding: '8px 16px',
                color: activeTab === 'upload' ? '#a78bfa' : '#94a3b8',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all .2s',
              }}
            >
              <span>📤</span> Drag & Drop .set Files
            </button>
          </div>

          {/* Tab 1: Local Files Selector */}
          {activeTab === 'local' && (
            <div style={{ marginBottom: 28 }}>
              <div style={{
                background: 'rgba(34,211,238,.04)',
                border: '1px solid rgba(34,211,238,.15)',
                borderRadius: 14,
                padding: '14px 18px',
                marginBottom: 20,
                fontSize: 13,
                color: '#94a3b8',
                lineHeight: 1.5,
              }}>
                <span style={{ color: '#22d3ee', fontWeight: 600 }}>Connected to your EEG folder:</span>
                <code style={{ marginLeft: 8, color: '#e2e8f0', background: 'rgba(0,0,0,.3)', padding: '2px 6px', borderRadius: 4 }}>
                  EEG_SET_FILES
                </code>
                <p style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
                  Files are loaded directly from disk — companion .fdt data is read automatically without upload delay.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {/* Rest recording picker */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#22d3ee', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Eyes-Closed Rest (.set)
                  </label>
                  <select
                    style={selectStyle}
                    value={selectedRestLocal}
                    onChange={e => setSelectedRestLocal(e.target.value)}
                  >
                    <option value="">-- Choose REST Recording --</option>
                    {localFiles.map(f => (
                      <option key={f.filename} value={f.filename}>{f.filename}</option>
                    ))}
                  </select>
                </div>

                {/* Photic recording picker */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Photic Stimulation (.set) <span style={{ color: '#64748b', fontSize: 11 }}>(Optional)</span>
                  </label>
                  <select
                    style={selectStyle}
                    value={selectedPhoticLocal}
                    onChange={e => setSelectedPhoticLocal(e.target.value)}
                  >
                    <option value="">-- None / Single Condition --</option>
                    {localFiles.map(f => (
                      <option key={f.filename} value={f.filename}>{f.filename}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Drag & Drop Dropzones */}
          {activeTab === 'upload' && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                Drop or browse .set files. Companion .fdt files in <code>EEG_SET_FILES</code> are auto-linked.
              </p>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <Dropzone
                  label="Eyes-Closed Rest"
                  sublabel="Baseline resting-state EEG"
                  color="cyan"
                  file={restFile}
                  onFile={setRestFile}
                  onClear={() => setRestFile(null)}
                />
                <Dropzone
                  label="Photic Stimulation"
                  sublabel="Intermittent light stimulation EEG"
                  color="violet"
                  file={photicFile}
                  onFile={setPhoticFile}
                  onClear={() => setPhoticFile(null)}
                />
              </div>
            </div>
          )}

          {/* Mode indicator banner */}
          {canAnalyze && (
            <div style={{
              marginBottom: 24, padding: '10px 16px',
              background: 'rgba(16,185,129,.06)',
              border: '1px solid rgba(16,185,129,.2)',
              borderRadius: 12, fontSize: 13, color: '#6ee7b7',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>
                {(activeTab === 'local' ? (selectedRestLocal && selectedPhoticLocal) : (restFile && photicFile)) ? '✅' : '⚡'}
              </span>
              {(activeTab === 'local' ? (selectedRestLocal && selectedPhoticLocal) : (restFile && photicFile))
                ? 'Dual-recording mode active — running fusion of rest + photic signals'
                : 'Single-recording mode active'}
            </div>
          )}

          {error && (
            <div style={{
              marginBottom: 20, padding: '10px 16px',
              background: 'rgba(244,63,94,.08)',
              border: '1px solid rgba(244,63,94,.25)',
              borderRadius: 12, fontSize: 13, color: '#fca5a5',
            }}>{error}</div>
          )}

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            id="analyze-btn"
            style={{
              width: '100%', padding: '16px 24px',
              borderRadius: 14, border: 'none', cursor: canAnalyze ? 'pointer' : 'not-allowed',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 16, fontWeight: 700, letterSpacing: 0.5,
              background: canAnalyze
                ? 'linear-gradient(135deg, #22d3ee 0%, #6366f1 50%, #7c3aed 100%)'
                : 'rgba(99,129,255,.1)',
              color: canAnalyze ? '#fff' : '#64748b',
              transition: 'all .25s',
              boxShadow: canAnalyze ? '0 0 30px rgba(34,211,238,.3)' : 'none',
            }}
          >
            {canAnalyze ? '⚡ Run NeuralScan Analysis' : 'Select or upload at least one recording to begin'}
          </button>
        </div>

        {/* ── Feature highlights ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
        }}>
          {[
            { icon: '🧠', title: '5-Seed Deep Ensemble', desc: 'Averaged over 5 independently trained checkpoints' },
            { icon: '📡', title: 'Dual-Condition Fusion', desc: 'Rest + photic multi-modal cross-attention' },
            { icon: '🔗', title: 'Spectral Coherence Graph', desc: '19-channel inter-electrode functional connectivity' },
            { icon: '⚡', title: 'Multi-scale Temporal CNN', desc: 'Learns frequency & transient temporal waveforms' },
          ].map((f, i) => (
            <div key={i} style={{
              background: 'rgba(15,23,42,.6)',
              border: '1px solid rgba(99,129,255,.12)',
              borderRadius: 16,
              padding: '20px 18px',
            }}>
              <span style={{ fontSize: 24, display: 'block', marginBottom: 10 }}>{f.icon}</span>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}