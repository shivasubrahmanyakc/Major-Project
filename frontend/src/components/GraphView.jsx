import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

/* ── 10-20 anatomical positions ── */
const POSITIONS = {
  Fp1: { x: -0.31, y: -0.72 }, Fp2: { x:  0.31, y: -0.72 },
  F7:  { x: -0.72, y: -0.30 }, F3:  { x: -0.31, y: -0.30 },
  Fz:  { x:  0.00, y: -0.30 }, F4:  { x:  0.31, y: -0.30 },
  F8:  { x:  0.72, y: -0.30 },
  T3:  { x: -0.82, y:  0.00 }, C3:  { x: -0.31, y:  0.00 },
  Cz:  { x:  0.00, y:  0.00 }, C4:  { x:  0.31, y:  0.00 },
  T4:  { x:  0.82, y:  0.00 },
  T5:  { x: -0.72, y:  0.40 }, P3:  { x: -0.31, y:  0.40 },
  Pz:  { x:  0.00, y:  0.40 }, P4:  { x:  0.31, y:  0.40 },
  T6:  { x:  0.72, y:  0.40 },
  O1:  { x: -0.31, y:  0.74 }, O2:  { x:  0.31, y:  0.74 },
};

const REGION_MAP = {
  Fp1: 'frontal', Fp2: 'frontal', F3: 'frontal', Fz: 'frontal', F4: 'frontal', F7: 'frontal', F8: 'frontal',
  C3: 'central', Cz: 'central', C4: 'central',
  T3: 'temporal', T4: 'temporal', T5: 'temporal', T6: 'temporal',
  P3: 'parietal', Pz: 'parietal', P4: 'parietal',
  O1: 'occipital', O2: 'occipital',
};

const REGION_COLORS = {
  frontal:   { fill: '#84512E', border: '#14161A' },
  central:   { fill: '#3A3E45', border: '#14161A' },
  temporal:  { fill: '#6B7078', border: '#14161A' },
  parietal:  { fill: '#14161A', border: '#14161A' },
  occipital: { fill: '#84512E', border: '#14161A' },
};

function edgeColor(w, alpha = 1) {
  if (w >= 0.80) return `rgba(132, 81, 46, ${alpha})`;
  if (w >= 0.65) return `rgba(168, 108, 67, ${alpha})`;
  if (w >= 0.50) return `rgba(90, 84, 75, ${alpha})`;
  return `rgba(158, 149, 135, ${alpha * 0.75})`;
}

const LAYOUT_MODES = {
  anatomical: 'Anatomical',
  circular:   'Circular',
};

export default function GraphView({ graphData }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [hoverEdge, setHoverEdge] = useState(null);
  const [layout, setLayout] = useState('anatomical');
  const [minWeight, setMinWeight] = useState(0.35);
  const [showParticles, setShowParticles] = useState(true);
  const particlesRef = useRef([]);

  const { nodes, edges, stats } = useMemo(() => {
    if (!graphData?.nodes || !graphData?.edges) return { nodes: [], edges: [], stats: {} };

    const ns = graphData.nodes.map((n, i) => {
      const pos = POSITIONS[n.label];
      const region = REGION_MAP[n.label] || 'central';
      const angle = (i / graphData.nodes.length) * 2 * Math.PI - Math.PI / 2;
      return {
        ...n,
        region,
        ax: pos?.x || 0, ay: pos?.y || 0,
        cx: Math.cos(angle) * 0.7,
        cy: Math.sin(angle) * 0.7,
      };
    });

    const es = graphData.edges || [];
    const weights = es.map(e => e.weight);
    const avgW = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;
    const maxW = weights.length ? Math.max(...weights) : 0;
    const density = weights.length / (ns.length * (ns.length - 1) / 2);

    return {
      nodes: ns,
      edges: es,
      stats: {
        totalEdges: es.length,
        avgWeight: avgW.toFixed(3),
        maxWeight: maxW.toFixed(3),
        density: (density * 100).toFixed(1),
      },
    };
  }, [graphData]);

  const visibleEdges = useMemo(() =>
    edges.filter(e => e.weight >= minWeight),
  [edges, minWeight]);

  useEffect(() => {
    if (!visibleEdges.length) { particlesRef.current = []; return; }
    particlesRef.current = visibleEdges.map((e, idx) => ({
      edgeIdx: idx,
      t: Math.random(),
      speed: 0.003 + e.weight * 0.006,
    }));
  }, [visibleEdges]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * canvas.width;
    const my = (e.clientY - rect.top) / rect.height * canvas.height;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const R = Math.min(canvas.width, canvas.height) / 2 * 0.78;

    let closestNode = null, closestDist = 18;
    nodes.forEach(nd => {
      const nx = layout === 'anatomical' ? nd.ax : nd.cx;
      const ny = layout === 'anatomical' ? nd.ay : nd.cy;
      const sx = cx + nx * R, sy = cy + ny * R;
      const d = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
      if (d < closestDist) {
        closestNode = { ...nd, screenX: sx, screenY: sy };
        closestDist = d;
      }
    });

    if (closestNode) {
      setHover(closestNode);
      setHoverEdge(null);
      return;
    }
    setHover(null);

    let closestEdge = null, edgeMinD = 8;
    visibleEdges.forEach(ed => {
      const srcN = nodes.find(n => n.id === ed.source);
      const tgtN = nodes.find(n => n.id === ed.target);
      if (!srcN || !tgtN) return;
      const sx = cx + (layout === 'anatomical' ? srcN.ax : srcN.cx) * R;
      const sy = cy + (layout === 'anatomical' ? srcN.ay : srcN.cy) * R;
      const tx = cx + (layout === 'anatomical' ? tgtN.ax : tgtN.cx) * R;
      const ty = cy + (layout === 'anatomical' ? tgtN.ay : tgtN.cy) * R;

      const dx = tx - sx, dy = ty - sy;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;
      const u = Math.max(0, Math.min(1, ((mx - sx) * dx + (my - sy) * dy) / (len * len)));
      const px = sx + u * dx, py = sy + u * dy;
      const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);

      if (dist < edgeMinD) {
        closestEdge = {
          ...ed,
          srcLabel: srcN.label, tgtLabel: tgtN.label,
          screenX: (sx + tx) / 2, screenY: (sy + ty) / 2,
        };
        edgeMinD = dist;
      }
    });
    setHoverEdge(closestEdge);
  }, [nodes, visibleEdges, layout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 * 0.78;
    let running = true;

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = '#E6DFD3';
      ctx.fillRect(0, 0, W, H);

      if (layout === 'anatomical') {
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.05, 0, 2 * Math.PI);
        ctx.strokeStyle = '#D8D1C4';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      /* Edges */
      visibleEdges.forEach(edge => {
        const srcN = nodes.find(n => n.id === edge.source);
        const tgtN = nodes.find(n => n.id === edge.target);
        if (!srcN || !tgtN) return;

        const sx = cx + (layout === 'anatomical' ? srcN.ax : srcN.cx) * R;
        const sy = cy + (layout === 'anatomical' ? srcN.ay : srcN.cy) * R;
        const tx = cx + (layout === 'anatomical' ? tgtN.ax : tgtN.cx) * R;
        const ty = cy + (layout === 'anatomical' ? tgtN.ay : tgtN.cy) * R;

        const isHoveredEdge = hoverEdge && hoverEdge.source === edge.source && hoverEdge.target === edge.target;
        const isConnected = hover && (hover.id === edge.source || hover.id === edge.target);
        const dimmed = (hover || hoverEdge) && !isConnected && !isHoveredEdge;

        const alpha = dimmed ? 0.08 : (isHoveredEdge ? 1 : (isConnected ? 0.9 : 0.6));
        const lineW = isHoveredEdge ? 3 : (isConnected ? 2.5 : Math.max(0.75, edge.weight * 2.5));

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = edgeColor(edge.weight, alpha);
        ctx.lineWidth = lineW;
        ctx.stroke();
      });

      /* Pulses */
      if (showParticles) {
        particlesRef.current.forEach(p => {
          p.t += p.speed;
          if (p.t > 1) p.t -= 1;

          const edge = visibleEdges[p.edgeIdx];
          if (!edge) return;
          const srcN = nodes.find(n => n.id === edge.source);
          const tgtN = nodes.find(n => n.id === edge.target);
          if (!srcN || !tgtN) return;

          const sx = cx + (layout === 'anatomical' ? srcN.ax : srcN.cx) * R;
          const sy = cy + (layout === 'anatomical' ? srcN.ay : srcN.cy) * R;
          const tx = cx + (layout === 'anatomical' ? tgtN.ax : tgtN.cx) * R;
          const ty = cy + (layout === 'anatomical' ? tgtN.ay : tgtN.cy) * R;

          const px = sx + (tx - sx) * p.t;
          const py = sy + (ty - sy) * p.t;

          const dimmed = (hover || hoverEdge) && !(hover && (hover.id === edge.source || hover.id === edge.target))
            && !(hoverEdge && hoverEdge.source === edge.source && hoverEdge.target === edge.target);
          if (dimmed) return;

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#84512E';
          ctx.fill();
        });
      }

      /* Nodes */
      nodes.forEach(nd => {
        const nx = layout === 'anatomical' ? nd.ax : nd.cx;
        const ny = layout === 'anatomical' ? nd.ay : nd.cy;
        const sx = cx + nx * R, sy = cy + ny * R;
        const region = REGION_COLORS[nd.region] || REGION_COLORS.central;
        const isHovered = hover && hover.id === nd.id;
        const isConnected = hoverEdge && (hoverEdge.source === nd.id || hoverEdge.target === nd.id);
        const dimmed = (hover && !isHovered) || (hoverEdge && !isConnected);

        const baseR = 4 + (nd.value || 0) * 6;
        const dotR = isHovered ? baseR * 1.3 : (isConnected ? baseR * 1.15 : baseR);

        ctx.beginPath();
        ctx.arc(sx, sy, dotR, 0, 2 * Math.PI);
        ctx.fillStyle = dimmed ? '#C8C0B2' : region.fill;
        ctx.fill();
        ctx.strokeStyle = '#FAF7F2';
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.stroke();

        ctx.fillStyle = dimmed ? '#8C867D' : '#14161A';
        ctx.font = isHovered ? 'bold 11px Inter, sans-serif' : '600 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(nd.label, sx, sy - dotR - 3);
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [nodes, visibleEdges, layout, hover, hoverEdge, showParticles]);

  if (!graphData?.nodes?.length) {
    return (
      <div style={{
        background: '#FAF6F0', border: '1px solid #D8D1C4',
        borderRadius: 8, padding: 24, display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: 380, color: '#6B7078', fontSize: 13,
      }}>
        No network data available
      </div>
    );
  }

  return (
    <div style={{
      background: '#FAF6F0',
      border: '1px solid #D8D1C4',
      borderRadius: 8, padding: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h3 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 17, fontWeight: 600, color: '#14161A',
          margin: 0,
        }}>
          2D Functional Connectivity Network
        </h3>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        <div style={{
          display: 'flex', background: '#F3EDE3', borderRadius: 6,
          border: '1px solid #D8D1C4', overflow: 'hidden',
        }}>
          {Object.entries(LAYOUT_MODES).map(([key, label]) => (
            <button key={key} onClick={() => setLayout(key)} style={{
              padding: '4px 10px', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, transition: 'all .15s',
              fontFamily: 'var(--font-sans)',
              background: layout === key ? '#84512E' : 'transparent',
              color: layout === key ? '#FFFFFF' : '#3A3E45',
            }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7078', fontWeight: 600 }}>MIN:</span>
          <input
            type="range"
            min={0.20} max={0.80} step={0.05}
            value={minWeight}
            onChange={e => setMinWeight(parseFloat(e.target.value))}
            style={{ width: 80, accentColor: '#84512E', height: 4, cursor: 'pointer' }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#84512E', fontWeight: 700, minWidth: 28 }}>
            {minWeight.toFixed(2)}
          </span>
        </div>

        <button onClick={() => setShowParticles(p => !p)} style={{
          padding: '4px 10px', border: '1px solid #D8D1C4',
          borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
          background: showParticles ? '#84512E' : '#FAF6F0',
          color: showParticles ? '#FFFFFF' : '#3A3E45',
        }}>
          Pulses
        </button>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          style={{
            borderRadius: 6,
            cursor: 'pointer',
            border: '1px solid #D8D1C4',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHover(null); setHoverEdge(null); }}
        />

        {/* Node Tooltip */}
        {hover && (
          <div style={{
            position: 'absolute',
            left: Math.min(hover.screenX + 14, 250),
            top: Math.max(hover.screenY - 45, 10),
            background: '#FAF6F0',
            border: '1px solid #D8D1C4',
            borderRadius: 6,
            padding: '8px 12px',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(20,22,26,0.06)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#14161A' }}>
              {hover.label} ({hover.region})
            </div>
            <div style={{ fontSize: 11, color: '#6B7078' }}>
              Importance: <strong style={{ color: '#84512E' }}>{((hover.value || 0) * 100).toFixed(1)}%</strong>
            </div>
            <div style={{ fontSize: 11, color: '#6B7078' }}>
              Links: <strong style={{ color: '#84512E' }}>
                {visibleEdges.filter(e => e.source === hover.id || e.target === hover.id).length}
              </strong>
            </div>
          </div>
        )}

        {/* Edge Tooltip */}
        {hoverEdge && (
          <div style={{
            position: 'absolute',
            left: Math.min(hoverEdge.screenX + 14, 250),
            top: Math.max(hoverEdge.screenY - 35, 10),
            background: '#FAF6F0',
            border: '1px solid #D8D1C4',
            borderRadius: 6,
            padding: '8px 12px',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(20,22,26,0.06)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#14161A' }}>
              {hoverEdge.srcLabel} ↔ {hoverEdge.tgtLabel}
            </div>
            <div style={{ fontSize: 11, color: '#6B7078' }}>
              Coherence: <strong style={{ color: '#84512E' }}>{hoverEdge.weight.toFixed(4)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{
        marginTop: 12, display: 'flex', gap: 14, flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {[
          { label: 'Active Edges', value: visibleEdges.length },
          { label: 'Mean Coherence', value: stats.avgWeight },
          { label: 'Peak Coherence', value: stats.maxWeight },
          { label: 'Network Density', value: `${stats.density}%` },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#84512E' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#6B7078', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {[
          { color: '#84512E', label: '≥ 0.80' },
          { color: '#A86C43', label: '≥ 0.65' },
          { color: '#5A544B', label: '≥ 0.50' },
          { color: '#9E9587', label: '< 0.50' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 14, height: 3, borderRadius: 2, background: item.color }} />
            <span style={{ fontSize: 10, color: '#6B7078' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
