import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const STEPS = [
  { label: 'Loading EEG recording',         icon: '📂' },
  { label: 'Applying notch & band-pass filter', icon: '🔧' },
  { label: 'Segmenting 4-second windows',   icon: '⚡' },
  { label: 'Extracting spectral features',  icon: '📊' },
  { label: 'Building coherence graphs',     icon: '🔗' },
  { label: 'Running 5-model ensemble',      icon: '🧠' },
  { label: 'Fusing head predictions',       icon: '✨' },
];

export default function ProcessingPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const [step,     setStep]     = useState(0);
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState(null);
  const called = useRef(false);

  /* step ticker */
  useEffect(() => {
    const t = setInterval(() => {
      setStep(s => Math.min(s + 1, STEPS.length - 1));
      setProgress(p => Math.min(p + 100 / (STEPS.length + 1), 90));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  /* API call */
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
                 || (err?.code === 'ECONNABORTED' ? 'Request timed out — inference is taking longer than expected.' : null)
                 || err?.message
                 || 'Backend error — please check the backend terminal.';
        setError(msg);
      }
    };
    run();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{
        maxWidth: 600, margin: '0 auto', padding: '80px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* Animated brain ring */}
        <div style={{
          position: 'relative', width: 120, height: 120,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 40,
        }}>
          {/* outer ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: '#22d3ee', borderLeftColor: '#22d3ee',
            animation: 'spin 1s linear infinite',
          }} />
          {/* middle ring */}
          <div style={{
            position: 'absolute', inset: 10, borderRadius: '50%',
            border: '2px solid transparent',
            borderRightColor: '#7c3aed', borderBottomColor: '#7c3aed',
            animation: 'rspin 1.4s linear infinite',
          }} />
          {/* inner */}
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(8,13,26,.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
            boxShadow: '0 0 20px rgba(34,211,238,.2)',
          }}>
            🧠
          </div>
          {/* pulse ring */}
          <div style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            border: '1px solid rgba(34,211,238,.3)',
            animation: 'pulse-ring 2s ease-out infinite',
          }} />
        </div>

        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginBottom: 8, textAlign: 'center',
        }}>
          Analysing EEG Signal
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 36, maxWidth: 380 }}>
          The 5-seed ensemble is processing your recording through temporal and graph encoders.
        </p>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 6, borderRadius: 9999,
          background: 'rgba(99,129,255,.1)', overflow: 'hidden', marginBottom: 8,
        }}>
          <div style={{
            height: '100%', borderRadius: 9999,
            background: 'linear-gradient(90deg, #22d3ee, #6366f1, #7c3aed)',
            width: `${progress}%`,
            transition: 'width .6s ease',
            animation: 'progress-glow 2s ease-in-out infinite',
          }} />
        </div>
        <p style={{ fontSize: 12, color: '#22d3ee', marginBottom: 40 }}>
          {Math.round(progress)}% complete
        </p>

        {/* Steps list */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.map((s, i) => {
            const done    = i < step;
            const current = i === step;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                background: current ? 'rgba(34,211,238,.06)' : done ? 'rgba(16,185,129,.04)' : 'rgba(8,13,26,.5)',
                border: current ? '1px solid rgba(34,211,238,.2)' : done ? '1px solid rgba(16,185,129,.15)' : '1px solid rgba(99,129,255,.06)',
                transition: 'all .4s',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                  background: done ? 'rgba(16,185,129,.15)' : current ? 'rgba(34,211,238,.12)' : 'rgba(99,129,255,.06)',
                  border: done ? '1px solid rgba(16,185,129,.3)' : current ? '1px solid rgba(34,211,238,.3)' : '1px solid rgba(99,129,255,.1)',
                }}>
                  {done ? '✓' : s.icon}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: current ? 600 : 400,
                  color: done ? '#6ee7b7' : current ? '#67e8f9' : '#475569',
                  transition: 'color .4s',
                }}>
                  {s.label}
                </span>
                {current && (
                  <div style={{
                    marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(34,211,238,.4)',
                    borderTopColor: '#22d3ee',
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
            background: 'rgba(244,63,94,.08)',
            border: '1px solid rgba(244,63,94,.25)',
            borderRadius: 14, fontSize: 13, color: '#fca5a5',
            width: '100%', textAlign: 'center',
          }}>
            <strong>Error: </strong>{error}
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'block', margin: '12px auto 0',
                padding: '8px 20px', borderRadius: 8,
                background: 'rgba(244,63,94,.15)', border: '1px solid rgba(244,63,94,.3)',
                color: '#f87171', cursor: 'pointer', fontSize: 13,
              }}>
              ← Back to Upload
            </button>
          </div>
        )}
      </main>
    </div>
  );
}