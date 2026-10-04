import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/',      label: 'Analyze' },
  { to: '/about', label: 'About'   },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(3,5,15,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(99,129,255,0.10)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Brain icon SVG */}
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(34,211,238,.2), rgba(124,58,237,.2))',
            border: '1px solid rgba(34,211,238,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: 18,
            background: 'linear-gradient(135deg, #22d3ee, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            NeuralScan AI
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: 8 }}>
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link key={to} to={to} style={{
                textDecoration: 'none',
                padding: '6px 18px',
                borderRadius: 9999,
                fontSize: 14, fontWeight: 500,
                transition: 'all .2s',
                background: active ? 'rgba(34,211,238,0.12)' : 'transparent',
                color: active ? '#22d3ee' : '#94a3b8',
                border: active ? '1px solid rgba(34,211,238,.25)' : '1px solid transparent',
              }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 9999,
          background: 'rgba(16,185,129,.08)',
          border: '1px solid rgba(16,185,129,.2)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 6px #10b981',
          }} />
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>
            5-Model Ensemble
          </span>
        </div>
      </div>
    </nav>
  );
}