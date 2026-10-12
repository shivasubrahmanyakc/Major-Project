import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

/* ── Inline icon helpers ── */
const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const FileIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ── Dropzone sub-component ── */
function Dropzone({ label, sublabel, file, onFile, onClear, accept = ".set" }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handle = (f) => { if (f) onFile(f); };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handle(e.dataTransfer.files[0]);
  };

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#6B7078',
        marginBottom: 8,
      }}>
        {label}
      </p>
      {!file ? (
        <div
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `1.5px dashed ${dragging ? '#84512E' : '#C8C0B2'}`,
            borderRadius: 8,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(132,81,46,0.04)' : '#F5EFEB',
            transition: 'all .2s ease',
            minHeight: 120,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <div style={{ color: '#84512E', opacity: 0.85 }}><UploadIcon /></div>
          <div>
            <p style={{ fontSize: 13, color: '#14161A', fontWeight: 500 }}>
              Drop .set file or <span style={{ color: '#84512E', textDecoration: 'underline' }}>browse file</span>
            </p>
            <p style={{ fontSize: 11, color: '#6B7078', marginTop: 3 }}>{sublabel}</p>
          </div>
          <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
            onChange={e => handle(e.target.files[0])} />
        </div>
      ) : (
        <div style={{
          borderRadius: 8, padding: '12px 16px',
          background: '#F5EFEB',
          border: '1px solid #D8D1C4',
          display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <span style={{ color: '#84512E' }}><FileIcon /></span>
            <span style={{ fontSize: 13, color: '#14161A', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {file.name}
            </span>
          </div>
          <button onClick={onClear} style={{
            flexShrink: 0, background: '#EAE2D5', border: '1px solid #D5CEBF',
            borderRadius: 6, color: '#6B7078', cursor: 'pointer', padding: '4px 6px',
            display: 'flex', alignItems: 'center',
          }}><XIcon /></button>
        </div>
      )}
    </div>
  );
}

/* ── Main Upload Page ── */
export default function UploadPage() {
  const [activeTab, setActiveTab] = useState('local'); // 'local' | 'upload'
  const [localFiles, setLocalFiles] = useState([]);
  const [selectedLocalFile, setSelectedLocalFile] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/local-files')
      .then(res => {
        const files = res.data?.files || [];
        setLocalFiles(files);
        if (files.length > 0) {
          setSelectedLocalFile(files[0].filename);
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
    ? !!selectedLocalFile
    : !!uploadedFile;

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    setError(null);
    if (activeTab === 'local') {
      navigate('/processing', {
        state: {
          localRest: selectedLocalFile,
          localPhotic: null,
        }
      });
    } else {
      navigate('/processing', {
        state: {
          restFile: uploadedFile,
          photicFile: null,
        }
      });
    }
  };

  const selectStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    background: '#FAF7F2',
    border: '1px solid #D8D1C4',
    color: '#14161A',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(3rem, 5vw, 5rem) 24px 80px' }}>

        {/* ── Editorial Hero Section (SapientPriors Style) ── */}
        <div style={{ marginBottom: 44 }} className="animate-fade-up">
          {/* Eyebrow with extending hairline rule */}
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
            Clinical Neuroinformatics
            <span style={{ height: 1, flex: 1, background: '#D9D2C5' }} />
          </p>

          {/* Heading in Newsreader */}
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
            Deciphering neurodegenerative patterns from continuous EEG.
          </h1>

          {/* Subheading in Inter */}
          <p style={{
            margin: 0,
            maxWidth: '42rem',
            fontFamily: "var(--font-sans)",
            fontSize: 'clamp(1.05rem, 0.98rem + 0.3vw, 1.25rem)',
            lineHeight: 1.6,
            color: '#3A3E45',
          }}>
            A multimodal 5-seed Temporal + Graph Neural Network Ensemble evaluating Alzheimer's Disease (AD), Frontotemporal Dementia (FTD), and Cognitively Normal (CN) EEG recordings.
          </p>
        </div>

        {/* ── Main Input Card ── */}
        <div style={{
          background: '#FAF6F0',
          border: '1px solid #D8D1C4',
          borderRadius: 10,
          padding: '28px 32px 32px',
          marginBottom: 36,
          boxShadow: '0 1px 3px rgba(20, 22, 26, 0.04)',
        }} className="animate-fade-up">

          {/* Mode Switch Tabs */}
          <div style={{
            display: 'flex', gap: 10, marginBottom: 24,
            borderBottom: '1px solid #E2DBD0',
            paddingBottom: 14,
          }}>
            <button
              onClick={() => setActiveTab('local')}
              style={{
                background: activeTab === 'local' ? '#84512E' : 'transparent',
                border: activeTab === 'local' ? '1px solid #744525' : '1px solid transparent',
                borderRadius: 6,
                padding: '7px 16px',
                color: activeTab === 'local' ? '#FFFFFF' : '#3A3E45',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all .15s ease',
              }}
            >
              <span>📁</span> Local EEG Files {localFiles.length > 0 && `(${localFiles.length})`}
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              style={{
                background: activeTab === 'upload' ? '#84512E' : 'transparent',
                border: activeTab === 'upload' ? '1px solid #744525' : '1px solid transparent',
                borderRadius: 6,
                padding: '7px 16px',
                color: activeTab === 'upload' ? '#FFFFFF' : '#3A3E45',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all .15s ease',
              }}
            >
              <span>📤</span> Upload .set Files
            </button>
          </div>

          {/* Tab 1: Local Files Selector */}
          {activeTab === 'local' && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                background: '#F3EDE3',
                border: '1px solid #D8D1C4',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 20,
                fontSize: 13,
                color: '#3A3E45',
                lineHeight: 1.5,
              }}>
                <span style={{ color: '#14161A', fontWeight: 600 }}>Active Directory:</span>
                <code style={{ marginLeft: 8, color: '#84512E', fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: 4, border: '1px solid #D8D1C4' }}>
                  EEG_SET_FILES
                </code>
                <p style={{ marginTop: 4, fontSize: 12, color: '#6B7078' }}>
                  Dataset files are ingested directly with companion .fdt multi-channel traces mapped automatically.
                </p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#6B7078',
                  marginBottom: 8,
                }}>
                  EEG Signals (.set)
                </label>
                <select
                  style={selectStyle}
                  value={selectedLocalFile}
                  onChange={e => setSelectedLocalFile(e.target.value)}
                >
                  <option value="">-- Choose EEG Signal File --</option>
                  {localFiles.map(f => (
                    <option key={f.filename} value={f.filename}>{f.filename}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Tab 2: Drag & Drop Dropzone for EEG Signals */}
          {activeTab === 'upload' && (
            <div style={{ marginBottom: 24 }}>
              <Dropzone
                label="EEG Signals (.set)"
                sublabel="Upload .set multi-channel recording from your computer"
                file={uploadedFile}
                onFile={setUploadedFile}
                onClear={() => setUploadedFile(null)}
              />
            </div>
          )}

          {/* Condition indicator */}
          {canAnalyze && (
            <div style={{
              marginBottom: 20, padding: '10px 14px',
              background: '#F3EDE3',
              border: '1px solid #D8D1C4',
              borderRadius: 6, fontSize: 13, color: '#3A3E45',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ color: '#84512E', fontWeight: 700 }}>•</span>
              EEG signal recording selected for analysis
            </div>
          )}

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px',
              background: '#F7E8E4',
              border: '1px solid #E2C2BA',
              borderRadius: 6, fontSize: 13, color: '#8A2B1D',
            }}>{error}</div>
          )}

          {/* Primary Action Button (SapientPriors Cognac Pill) */}
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            id="analyze-btn"
            style={{
              width: '100%', padding: '14px 20px',
              borderRadius: 8, border: 'none',
              cursor: canAnalyze ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
              fontSize: 14, fontWeight: 600,
              letterSpacing: '0.01em',
              background: canAnalyze ? '#84512E' : '#D0C8BB',
              color: canAnalyze ? '#FFFFFF' : '#8A8275',
              transition: 'background 0.15s ease',
              boxShadow: canAnalyze ? '0 1px 3px rgba(132, 81, 46, 0.2)' : 'none',
            }}
            onMouseEnter={e => { if (canAnalyze) e.currentTarget.style.background = '#6D4122'; }}
            onMouseLeave={e => { if (canAnalyze) e.currentTarget.style.background = '#84512E'; }}
          >
            {canAnalyze ? 'Run NeuralScan Classification' : 'Select a recording to begin analysis'}
          </button>
        </div>

        {/* ── Feature Highlights (Editorial Cards) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 16,
        }}>
          {[
            { tag: 'ENSEMBLE', title: '5-Seed Deep Stacking', desc: 'Averages predictions over 5 independently trained checkpoints to reduce variance.' },
            { tag: 'FUSION', title: 'Spatial-Temporal Fusion', desc: 'Fuses temporal waveform representations with topological inter-electrode coherence.' },
            { tag: 'SPATIAL', title: 'Chebyshev Graph GCN', desc: 'Models 19-channel inter-electrode spectral coherence across canonical bands.' },
            { tag: 'TEMPORAL', title: 'Multi-scale CNN Encoder', desc: 'Processes 4-second time series segments to extract transient oscillatory signatures.' },
          ].map((f, i) => (
            <div key={i} style={{
              background: '#FAF6F0',
              border: '1px solid #D8D1C4',
              borderRadius: 8,
              padding: '20px 18px',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: '#84512E',
                display: 'block',
                marginBottom: 6,
              }}>
                {f.tag}
              </span>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 18,
                fontWeight: 600,
                color: '#14161A',
                marginBottom: 6,
                letterSpacing: '-0.01em',
              }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13, color: '#6B7078', lineHeight: 1.5, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}