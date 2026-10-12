import React, { useState, useMemo } from 'react';
import Topomap from './Topomap';
import GraphView from './GraphView';
import Brain3D from './Brain3D';

/* ── Channel info for the detail panel ── */
const REGION_MAP = {
  Fp1: 'Frontal', Fp2: 'Frontal', F3: 'Frontal', Fz: 'Frontal', F4: 'Frontal', F7: 'Frontal', F8: 'Frontal',
  C3: 'Central', Cz: 'Central', C4: 'Central',
  T3: 'Temporal', T4: 'Temporal', T5: 'Temporal', T6: 'Temporal',
  P3: 'Parietal', Pz: 'Parietal', P4: 'Parietal',
  O1: 'Occipital', O2: 'Occipital',
};

const REGION_COLORS = {
  Frontal:   '#84512E',
  Central:   '#3A3E45',
  Temporal:  '#6B7078',
  Parietal:  '#14161A',
  Occipital: '#84512E',
};

export default function BrainDashboard({ graphData, prediction }) {
  const [viewMode, setViewMode] = useState('3d'); // '3d', 'split', 'topo', 'graph'

  /* ── Compute region-level stats ── */
  const regionStats = useMemo(() => {
    if (!graphData?.nodes) return [];
    const groups = {};
    graphData.nodes.forEach(n => {
      const reg = REGION_MAP[n.label] || 'Unknown';
      if (!groups[reg]) groups[reg] = { sum: 0, count: 0, max: 0, channels: [] };
      groups[reg].sum += (n.value || 0);
      groups[reg].count += 1;
      groups[reg].max = Math.max(groups[reg].max, n.value || 0);
      groups[reg].channels.push(n.label);
    });
    return Object.entries(groups)
      .map(([name, g]) => ({
        name,
        avg: g.sum / g.count,
        max: g.max,
        count: g.count,
        channels: g.channels,
        color: REGION_COLORS[name] || '#3A3E45',
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [graphData]);

  /* ── Top connectivity pairs ── */
  const topEdges = useMemo(() => {
    if (!graphData?.edges || !graphData?.nodes) return [];
    const nodeMap = {};
    graphData.nodes.forEach(n => { nodeMap[n.id] = n.label; });
    return [...graphData.edges]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(e => ({
        source: nodeMap[e.source] || `Ch${e.source}`,
        target: nodeMap[e.target] || `Ch${e.target}`,
        weight: e.weight,
      }));
  }, [graphData]);

  /* ── Connectivity summary ── */
  const connSummary = useMemo(() => {
    if (!graphData?.edges) return {};
    const weights = graphData.edges.map(e => e.weight);
    const strong = weights.filter(w => w >= 0.7).length;
    const moderate = weights.filter(w => w >= 0.5 && w < 0.7).length;
    const weak = weights.filter(w => w < 0.5).length;
    return { total: weights.length, strong, moderate, weak };
  }, [graphData]);

  return (
    <div className="animate-fade-in">
      {/* ── Subtitle & View Mode Toggles ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 18, flexWrap: 'wrap', gap: 12,
      }}>
        <p style={{ fontSize: 13, color: '#6B7078', maxWidth: 640, margin: 0, lineHeight: 1.5 }}>
          Topographic attention and cross-spectral coherence network for 19-channel 10-20 montages.
        </p>
        <div style={{
          display: 'flex', background: '#FAF6F0', borderRadius: 8,
          border: '1px solid #D8D1C4', padding: 2, flexShrink: 0,
        }}>
          {[
            { key: '3d',    label: '3D Brain Model' },
            { key: 'split', label: '3D + Topomap' },
            { key: 'topo',  label: '2D Topomap' },
            { key: 'graph', label: '2D Network' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setViewMode(key)} style={{
              padding: '6px 14px', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: viewMode === key ? 600 : 400,
              fontFamily: 'var(--font-sans)',
              borderRadius: 6,
              background: viewMode === key ? '#84512E' : 'transparent',
              color: viewMode === key ? '#FFFFFF' : '#3A3E45',
              transition: 'all .15s ease',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main viz area ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: viewMode === 'split' ? '1.2fr 0.8fr' : '1fr',
        gap: 18,
        marginBottom: 20,
      }}>
        {viewMode === '3d' && (
          <Brain3D graphData={graphData} />
        )}
        {viewMode === 'split' && (
          <>
            <Brain3D graphData={graphData} />
            <Topomap attentionVals={graphData?.nodes} prediction={prediction} />
          </>
        )}
        {viewMode === 'topo' && (
          <Topomap attentionVals={graphData?.nodes} prediction={prediction} />
        )}
        {viewMode === 'graph' && (
          <GraphView graphData={graphData} />
        )}
      </div>

      {/* ── Insights row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}>

        {/* ── Region Activity Summary ── */}
        <div style={{
          background: '#FAF6F0',
          border: '1px solid #D8D1C4',
          borderRadius: 8, padding: 20,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#84512E',
            display: 'block',
            marginBottom: 4,
          }}>
            Spatial Attention
          </span>
          <h4 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 18,
            fontWeight: 600,
            color: '#14161A',
            margin: '0 0 14px 0',
          }}>
            Region Activity Magnitude
          </h4>
          {regionStats.map(reg => (
            <div key={reg.name} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: reg.color,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#14161A' }}>{reg.name}</span>
                  <span style={{ fontSize: 11, color: '#6B7078' }}>({reg.channels.join(', ')})</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#84512E' }}>
                  {(reg.avg * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{
                height: 4, borderRadius: 2, background: '#D9D2C5', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${reg.avg * 100}%`,
                  background: reg.color,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Top Connections ── */}
        <div style={{
          background: '#FAF6F0',
          border: '1px solid #D8D1C4',
          borderRadius: 8, padding: 20,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#84512E',
            display: 'block',
            marginBottom: 4,
          }}>
            Spectral Coherence
          </span>
          <h4 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 18,
            fontWeight: 600,
            color: '#14161A',
            margin: '0 0 14px 0',
          }}>
            Strongest Spectral Connections
          </h4>
          {topEdges.map((edge, i) => {
            const pct = edge.weight * 100;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                padding: '6px 8px', borderRadius: 6,
                background: '#F3EDE3',
                border: '1px solid #D8D1C4',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11, fontWeight: 600, color: '#6B7078',
                  minWidth: 18, textAlign: 'center',
                }}>
                  #{i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#14161A', marginBottom: 2 }}>
                    {edge.source} ↔ {edge.target}
                  </div>
                  <div style={{
                    height: 3, borderRadius: 2, background: '#D9D2C5',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${pct}%`,
                      background: '#84512E',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#84512E', minWidth: 45, textAlign: 'right' }}>
                  {edge.weight.toFixed(3)}
                </span>
              </div>
            );
          })}

          {/* Connectivity distribution */}
          <div style={{
            marginTop: 14, paddingTop: 12,
            borderTop: '1px solid #D8D1C4',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: '#6B7078',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Distribution by Threshold
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Strong (≥0.7)', value: connSummary.strong },
                { label: 'Moderate (0.5–0.7)', value: connSummary.moderate },
                { label: 'Weak (<0.5)', value: connSummary.weak },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center', flex: 1, background: '#F3EDE3', padding: '6px 4px', borderRadius: 6, border: '1px solid #D8D1C4' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: '#84512E' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: '#6B7078', fontWeight: 500 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
