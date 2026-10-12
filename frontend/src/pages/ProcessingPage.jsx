import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const STEPS = [
  { label: 'Ingesting multi-channel EEG recording',   tag: 'I/O' },
  { label: 'Applying 50 Hz notch & band-pass filter', tag: 'DSP' },
  { label: 'Segmenting 4-second epochs (512 samples)', tag: 'EPOCH' },
  { label: 'Extracting 16 spectral node features',    tag: 'FEAT' },
  { label: 'Computing cross-spectral coherence',      tag: 'GRAPH' },
  { label: 'Evaluating 5-seed neural ensemble',        tag: 'MODEL' },
  { label: 'Calibrating multi-head posterior fusion', tag: 'INFER' },
];

export default function ProcessingPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const [step,     setStep]     = useState(0);
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState(null);
  const called = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setStep(s => Math.min(s + 1, STEPS.length - 1));
      setProgress(p => Math.min(p + 100 / (STEPS.length + 1), 90));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!state || called.current) return;
    const hasUpload = state.restFile || state.photicFile;
    const hasLocal  = state.localRest || state.localPhotic;
    if (!hasUpload && !hasLocal) { navigate('/'); return; }
    called.current = true;

    const run = async () => {
      try {
        let res;
        if (hasLocal) {
          res = await axios.post('http://127.0.0.1:8000/predict-local', {
            rest_file: state.localRest,
            photic_file: state.localPhotic,
          }, { timeout: 120000 });
        } else {
          const fd = new FormData();
          if (state.restFile)   fd.append('rest_file',   state.restFile);
          if (state.photicFile) fd.append('photic_file', state.photicFile);
          res = await axios.post('http://127.0.0.1:8000/predict', fd, { timeout: 120000 });
        }
        setProgress(100);
        setTimeout(() => navigate('/result', { state: res.data }), 600);
      } catch (err) {
        console.error(err);
        const msg = err?.response?.data?.detail
                 || (err?.code === 'ECONNABORTED' ? 'Inference request timed out.' : null)
                 || err?.message
                 || 'Backend error encountered.';
        setError(msg);
      }
    };
    run();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{
        maxWidth: 620, margin: '0 auto', padding: '60px 24px 80px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Eyebrow */}
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
          width: '100%',
        }}>
          Pipeline Execution
          <span style={{ height: 1, flex: 1, background: '#D9D2C5' }} />
        </p>

        {/* Heading in Newsreader */}
        <h2 style={{
          fontFamily: "var(--font-serif)",
          fontSize: 'clamp(2rem, 1rem + 2.4vw, 3rem)',
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: '#14161A',
          marginBottom: 10,
          textAlign: 'center',
        }}>
          Processing neurophysiological signals.
        </h2>

        <p style={{
          fontSize: 14, color: '#3A3E45', textAlign: 'center',
          marginBottom: 32, maxWidth: 420, lineHeight: 1.6,
        }}>
          Evaluating spatial coherence topologies and temporal multi-scale convolutional kernels.
        </p>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 5, borderRadius: 3,
          background: '#D9D2C5', overflow: 'hidden', marginBottom: 8,
        }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: '#84512E',
            width: `${progress}%`,
            transition: 'width .5s ease',
          }} />
        </div>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12, color: '#84512E', fontWeight: 600,
          marginBottom: 30, letterSpacing: '0.04em',
        }}>
          {Math.round(progress)}% COMPLETE
        </p>

        {/* Steps card */}
        <div style={{
          width: '100%',
          background: '#FAF6F0',
          border: '1px solid #D8D1C4',
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {STEPS.map((s, i) => {
            const done    = i < step;
            const current = i === step;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 12px', borderRadius: 6,
                background: current ? '#F3EDE3' : 'transparent',
                border: current ? '1px solid #D5CEBF' : '1px solid transparent',
                transition: 'all .15s ease',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: done ? '#84512E' : current ? '#14161A' : '#A09789',
                  minWidth: 42,
                }}>
                  {done ? 'DONE' : s.tag}
                </span>

                <span style={{
                  fontSize: 13,
                  fontWeight: current ? 600 : 400,
                  color: done ? '#14161A' : current ? '#84512E' : '#6B7078',
                  flex: 1,
                }}>
                  {s.label}
                </span>

                {current && (
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    border: '1.5px solid #D8D1C4',
                    borderTopColor: '#84512E',
                    animation: 'spin .8s linear infinite',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{
            marginTop: 24, padding: '14px 18px',
            background: '#F7E8E4',
            border: '1px solid #E2C2BA',
            borderRadius: 8, fontSize: 13, color: '#8A2B1D',
            width: '100%', textAlign: 'center',
          }}>
            <strong>Error: </strong>{error}
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'block', margin: '12px auto 0',
                padding: '8px 16px', borderRadius: 6,
                background: '#FFFFFF', border: '1px solid #D8D1C4',
                color: '#14161A', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>
              ← Back to Upload
            </button>
          </div>
        )}
      </main>
    </div>
  );
}