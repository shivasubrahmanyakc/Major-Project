import React, { useRef, useEffect, useState, useCallback } from 'react';

/* ── 10-20 electrode positions ── */
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

/* Warm stone to rich cognac colormap */
function heatColor(t) {
  t = Math.max(0, Math.min(1, t));
  const stops = [
    { p: 0.00, r: 243, g: 237, b: 227 }, // linen tint #F3EDE3
    { p: 0.25, r: 216, g: 209, b: 196 }, // warm stone #D8D1C4
    { p: 0.50, r: 184, g: 147, b: 114 }, // muted terracotta
    { p: 0.75, r: 132, g:  81, b:  46 }, // cognac #84512E
    { p: 1.00, r:  40, g:  25, b:  15 }, // deep espresso
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].p && t <= stops[i + 1].p) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const f = (t - lo.p) / (hi.p - lo.p + 1e-9);
  const r = Math.round(lo.r + f * (hi.r - lo.r));
  const g = Math.round(lo.g + f * (hi.g - lo.g));
  const b = Math.round(lo.b + f * (hi.b - lo.b));
  return { r, g, b };
}

function interpolateValue(px, py, electrodes, power = 2.5) {
  let wSum = 0, vSum = 0;
  for (const e of electrodes) {
    const dx = px - e.x, dy = py - e.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < 1e-6) return e.value;
    const w = 1 / Math.pow(d2, power / 2);
    wSum += w;
    vSum += w * e.value;
  }
  return vSum / (wSum + 1e-12);
}

const Topomap = ({ attentionVals }) => {
  const canvasRef = useRef(null);
  const [hover, setHover] = useState(null);

  const electrodes = React.useMemo(() => {
    if (!attentionVals?.length) return [];
    const vals = attentionVals.map(n => n.value || 0);
    const maxV = Math.max(...vals, 1e-8);
    const minV = Math.min(...vals);
    const range = maxV - minV || 1;
    return attentionVals.map(n => {
      const pos = POSITIONS[n.label];
      if (!pos) return null;
      return {
        label: n.label,
        x: pos.x, y: pos.y,
        rawValue: n.value || 0,
        value: (n.value - minV) / range,
      };
    }).filter(Boolean);
  }, [attentionVals]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !electrodes.length) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * canvas.width;
    const my = (e.clientY - rect.top) / rect.height * canvas.height;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const R = Math.min(canvas.width, canvas.height) / 2 * 0.80;

    let closest = null, closestDist = 20;
    electrodes.forEach(el => {
      const ex = cx + el.x * R, ey = cy + el.y * R;
      const d = Math.sqrt((mx - ex) ** 2 + (my - ey) ** 2);
      if (d < closestDist) {
        closest = { ...el, screenX: ex, screenY: ey };
        closestDist = d;
      }
    });
    setHover(closest);
  }, [electrodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !electrodes.length) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 * 0.80;

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#E6DFD3';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.clip();

    const step = 3;
    const imgData = ctx.createImageData(W, H);
    for (let py = 0; py < H; py += step) {
      for (let px = 0; px < W; px += step) {
        const dx = px - cx, dy = py - cy;
        if (dx * dx + dy * dy > R * R) continue;
        const nx = dx / R, ny = dy / R;
        const val = interpolateValue(nx, ny, electrodes);
        const { r, g, b } = heatColor(val);
        for (let sy = 0; sy < step && py + sy < H; sy++) {
          for (let sx = 0; sx < step && px + sx < W; sx++) {
            const idx = ((py + sy) * W + (px + sx)) * 4;
            imgData.data[idx] = r;
            imgData.data[idx + 1] = g;
            imgData.data[idx + 2] = b;
            imgData.data[idx + 3] = 230;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.clip();
    ctx.strokeStyle = '#D8D1C4';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
    ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
    ctx.stroke();

    ctx.restore();

    /* Head outline */
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = '#14161A';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    /* Nose */
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - R + 2);
    ctx.lineTo(cx, cy - R - 14);
    ctx.lineTo(cx + 12, cy - R + 2);
    ctx.strokeStyle = '#14161A';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = '#6B7078';
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NOSE', cx, cy - R - 18);

    /* Ears */
    const earW = 8, earH = 18;
    ctx.beginPath();
    ctx.ellipse(cx - R - 4, cy, earW / 2, earH / 2, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#6B7078';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx + R + 4, cy, earW / 2, earH / 2, 0, 0, 2 * Math.PI);
    ctx.stroke();

    /* Electrodes */
    electrodes.forEach(el => {
      const ex = cx + el.x * R, ey = cy + el.y * R;
      const isHovered = hover && hover.label === el.label;
      const dotR = isHovered ? 6 : 4;

      ctx.beginPath();
      ctx.arc(ex, ey, dotR, 0, 2 * Math.PI);
      ctx.fillStyle = '#14161A';
      ctx.fill();
      ctx.strokeStyle = '#FAF7F2';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#14161A';
      ctx.font = isHovered ? 'bold 11px Inter, sans-serif' : '600 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(el.label, ex, ey + dotR + 3);
    });

  }, [electrodes, hover]);

  if (!attentionVals?.length) {
    return (
      <div style={{
        background: '#FAF6F0', border: '1px solid #D8D1C4',
        borderRadius: 8, padding: 24, display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: 380, color: '#6B7078', fontSize: 13,
      }}>
        No topographic data available
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
          2D Scalp Topographic Map
        </h3>
      </div>

      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          style={{
            borderRadius: 6,
            cursor: 'crosshair',
            border: '1px solid #D8D1C4',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
        />

        {hover && (
          <div style={{
            position: 'absolute',
            left: Math.min(hover.screenX + 14, 250),
            top: Math.max(hover.screenY - 36, 10),
            background: '#FAF6F0',
            border: '1px solid #D8D1C4',
            borderRadius: 4,
            padding: '6px 12px',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(20,22,26,0.06)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#14161A', marginBottom: 2 }}>
              {hover.label}
            </div>
            <div style={{ fontSize: 11, color: '#6B7078' }}>
              Importance: <strong style={{ color: '#84512E' }}>{(hover.rawValue * 100).toFixed(1)}%</strong>
            </div>
          </div>
        )}
      </div>

      {/* Color Legend */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7078', fontWeight: 600 }}>LOW</span>
        <div style={{
          width: 140, height: 8, borderRadius: 4,
          background: 'linear-gradient(90deg, #F3EDE3, #D8D1C4, #84512E, #28190F)',
          border: '1px solid #D8D1C4',
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7078', fontWeight: 600 }}>HIGH</span>
      </div>

      <p style={{ fontSize: 11, color: '#6B7078', marginTop: 8, textAlign: 'center', maxWidth: 300 }}>
        Inverse-distance weighted scalp interpolation of mean node-feature magnitude
      </p>
    </div>
  );
};

export default Topomap;
