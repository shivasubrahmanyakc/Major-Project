import React, { useRef, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const EDGE_COLORS = (w) => {
  if (w >= 0.75) return { color: 'rgba(244,63,94,.85)',  particle: 'rgba(244,63,94,1)'  };
  if (w >= 0.60) return { color: 'rgba(245,158,11,.75)', particle: 'rgba(245,158,11,1)' };
  if (w >= 0.50) return { color: 'rgba(124,58,237,.65)', particle: 'rgba(124,58,237,1)' };
  return              { color: 'rgba(34,211,238,.40)',  particle: 'rgba(34,211,238,1)'  };
};

export default function GraphView({ graphData }) {
  if (!graphData?.nodes?.edges && !graphData?.edges) {
    return (
      <div style={{
        background: 'rgba(8,13,26,.8)', border: '1px solid rgba(99,129,255,.12)',
        borderRadius: 20, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 340, color: '#475569', fontSize: 13,
      }}>
        No graph data available
      </div>
    );
  }

  const processedData = {
    nodes: (graphData.nodes || []).map(n => ({ ...n, val: (n.value || 0.1) * 8 + 2 })),
    links: (graphData.edges || []).map(e => ({
      source: e.source, target: e.target, weight: e.weight,
    })),
  };

  return (
    <div style={{
      background: 'rgba(8,13,26,.8)',
      border: '1px solid rgba(99,129,255,.12)',
      borderRadius: 20, padding: 24,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <h3 style={{
        fontSize: 13, fontWeight: 700, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
      }}>
        Functional Connectivity Graph
      </h3>

      <div style={{
        borderRadius: 12, overflow: 'hidden',
        background: 'rgba(3,5,15,.6)',
        border: '1px solid rgba(99,129,255,.1)',
        width: 300, height: 300,
      }}>
        <ForceGraph2D
          width={300}
          height={300}
          graphData={processedData}
          nodeLabel="label"
          nodeColor={node => {
            const v = node.value || 0;
            if (v > 0.75) return '#f43f5e';
            if (v > 0.50) return '#f59e0b';
            if (v > 0.25) return '#6366f1';
            return '#22d3ee';
          }}
          nodeRelSize={5}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.label;
            const fontSize = Math.max(8, 10 / globalScale);
            ctx.font = `500 ${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = 'rgba(226,232,240,.85)';
            ctx.textAlign = 'center';
            ctx.fillText(label, node.x, node.y - 7);
          }}
          linkColor={link => EDGE_COLORS(link.weight).color}
          linkWidth={link => Math.max(0.5, link.weight * 3)}
          linkDirectionalParticles={link => (link.weight > 0.55 ? 3 : link.weight > 0.45 ? 2 : 1)}
          linkDirectionalParticleColor={link => EDGE_COLORS(link.weight).particle}
          linkDirectionalParticleWidth={2.5}
          linkDirectionalParticleSpeed={link => link.weight * 0.008}
          backgroundColor="transparent"
          cooldownTime={3000}
        />
      </div>

      {/* Legend */}
      <div style={{ marginTop: 14, display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { color: '#f43f5e', label: '≥ 0.75 (very strong)' },
          { color: '#f59e0b', label: '≥ 0.60' },
          { color: '#7c3aed', label: '≥ 0.50' },
          { color: '#22d3ee', label: '< 0.50' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 3, borderRadius: 2, background: item.color }} />
            <span style={{ fontSize: 10, color: '#475569' }}>{item.label}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
        Nodes = EEG channels | Edge weight = spectral coherence
      </p>
    </div>
  );
}
