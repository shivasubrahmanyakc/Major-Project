import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  const isAbout = pathname === '/about';

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(230, 223, 211, 0.94)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(216, 209, 196, 0.8)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 clamp(1.25rem, 3.2vw, 4.5rem)',
        height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo: NS Monogram + NeuralScan AI */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontFamily: "var(--font-serif)",
            fontSize: 24,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: '#14161A',
            display: 'flex',
            alignItems: 'baseline',
            gap: 1,
          }}>
            <span style={{ fontStyle: 'italic', marginRight: 1 }}>N</span>S
          </div>
          <div style={{
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            fontWeight: 600,
            color: '#14161A',
            letterSpacing: '-0.01em',
          }}>
            NeuralScan <span style={{ fontWeight: 400, color: '#6B7078', marginLeft: 2 }}>AI</span>
          </div>
        </Link>

        {/* Navigation Items (Clean & Non-repetitive) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* 1. Research & Architecture link */}
          <Link
            to="/about"
            style={{
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isAbout ? 600 : 400,
              fontFamily: 'var(--font-sans)',
              color: isAbout ? '#84512E' : '#14161A',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => { if (!isAbout) e.currentTarget.style.color = '#84512E'; }}
            onMouseLeave={e => { if (!isAbout) e.currentTarget.style.color = '#14161A'; }}
          >
            Architecture & Research
          </Link>

          {/* 2. Primary Action Button */}
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              padding: '8px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              color: '#FFFFFF',
              background: '#84512E',
              border: '1px solid #744525',
              boxShadow: '0 1px 2px rgba(132, 81, 46, 0.15)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#6D4122'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#84512E'; }}
          >
            Analyze EEG
          </Link>
        </div>
      </div>
    </nav>
  );
}