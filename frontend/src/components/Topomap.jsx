import React, { useRef, useEffect } from 'react';

/* 10-20 normalized positions (x: left=-1..right=1, y: front=-1..back=1) */
const POSITIONS = {
  Fp1:{ x:-0.31, y:-0.72 }, Fp2:{ x: 0.31, y:-0.72 },
  F7: { x:-0.72, y:-0.30 }, F3: { x:-0.31, y:-0.30 },
  Fz: { x: 0.00, y:-0.30 }, F4: { x: 0.31, y:-0.30 },
  F8: { x: 0.72, y:-0.30 },
  T3: { x:-0.76, y: 0.00 }, C3: { x:-0.31, y: 0.00 },
  Cz: { x: 0.00, y: 0.00 }, C4: { x: 0.31, y: 0.00 },
  T4: { x: 0.76, y: 0.00 },
  T5: { x:-0.72, y: 0.40 }, P3: { x:-0.31, y: 0.40 },
  Pz: { x: 0.00, y: 0.40 }, P4: { x: 0.31, y: 0.40 },
  T6: { x: 0.72, y: 0.40 },
  O1: { x:-0.31, y: 0.74 }, O2: { x: 0.31, y: 0.74 },
};

/* HSL color ramp: low→blue, high→cyan→green */
function intensityColor(t) {
  // t in [0,1]: 0=cold, 1=hot
  if (t < 0.25) return `hsl(${220 + t * 60 / 0.25}deg, 70%, 50%)`;
  if (t < 0.55) return `hsl(${240 + (t - 0.25) * 60 / 0.30}deg, 90%, 55%)`;
  if (t < 0.80) return `hsl(${180 + (t - 0.55) * 30 / 0.25}deg, 90%, 55%)`;
  return `hsl(${160}deg, 100%, ${50 + (t - 0.80) * 30}%)`;
}

const Topomap = ({ attentionVals }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !attentionVals || !attentionVals.length) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R  = Math.min(W, H) / 2 * 0.82;

    ctx.clearRect(0, 0, W, H);

    /* clipping circle */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.clip();

    /* background */
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bgGrad.addColorStop(0, '#0d1829');
    bgGrad.addColorStop(1, '#060b14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    /* values */
    const vals = attentionVals.map(n => n.value || 0);
    const maxV = Math.max(...vals, 1e-8);
    const minV = Math.min(...vals);
    const range = maxV - minV || 1;

    /* heat blobs */
    attentionVals.forEach(node => {
      const pos = POSITIONS[node.label]; if (!pos) return;
      const x = cx + pos.x * R, y = cy + pos.y * R;
      const t = (node.value - minV) / range;
      const blobR = R * 0.25 * (0.4 + t * 0.6);
      const col = intensityColor(t);

      const grad = ctx.createRadialGradient(x, y, 0, x, y, blobR);
      grad.addColorStop(0, col.replace(')', ', 0.55)').replace('hsl', 'hsla'));
      grad.addColorStop(1, col.replace(')', ', 0)').replace('hsl', 'hsla'));

      ctx.beginPath();
      ctx.arc(x, y, blobR, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    ctx.restore();

    /* outer ring */
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(34,211,238,.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* nose marker */
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - R + 1);
    ctx.lineTo(cx, cy - R - 12);
    ctx.lineTo(cx + 10, cy - R + 1);
    ctx.strokeStyle = 'rgba(34,211,238,.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* ear markers */
    [[cx - R, cy - 8, cx - R - 10, cy - 8, cx - R - 10, cy + 8, cx - R, cy + 8],
     [cx + R, cy - 8, cx + R + 10, cy - 8, cx + R + 10, cy + 8, cx + R, cy + 8]
    ].forEach(pts => {
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i+1]);
      ctx.strokeStyle = 'rgba(34,211,238,.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    /* node dots + labels */
    attentionVals.forEach(node => {
      const pos = POSITIONS[node.label]; if (!pos) return;
      const x = cx + pos.x * R, y = cy + pos.y * R;
      const t = (node.value - minV) / range;
      const col = intensityColor(t);

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, x, y - 8);
    });

  }, [attentionVals]);

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
        Spatial Attention Topomap
      </h3>
      <canvas ref={canvasRef} width={300} height={300} style={{ borderRadius: 12 }} />
      {/* Color legend */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, color: '#475569' }}>Low</span>
        <div style={{
          width: 120, height: 6, borderRadius: 3,
          background: 'linear-gradient(90deg, hsl(220,70%,50%), hsl(260,90%,55%), hsl(190,90%,55%), hsl(160,100%,65%))',
        }} />
        <span style={{ fontSize: 10, color: '#475569' }}>High</span>
      </div>
      <p style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
        Colour = mean node-feature magnitude per channel
      </p>
    </div>
  );
};

export default Topomap;
