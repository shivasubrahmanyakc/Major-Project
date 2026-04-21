import React, { useRef, useEffect } from 'react';

const POSITIONS = {
  Fp1: { x: -0.3, y: -0.7 },
  Fp2: { x: 0.3, y: -0.7 },
  F7:  { x: -0.7, y: -0.3 },
  F3:  { x: -0.3, y: -0.3 },
  Fz:  { x: 0.0, y: -0.3 },
  F4:  { x: 0.3, y: -0.3 },
  F8:  { x: 0.7, y: -0.3 },
  T3:  { x: -0.7, y: 0.0 },
  C3:  { x: -0.3, y: 0.0 },
  Cz:  { x: 0.0, y: 0.0 },
  C4:  { x: 0.3, y: 0.0 },
  T4:  { x: 0.7, y: 0.0 },
  T5:  { x: -0.7, y: 0.4 },
  P3:  { x: -0.3, y: 0.4 },
  Pz:  { x: 0.0, y: 0.4 },
  P4:  { x: 0.3, y: 0.4 },
  T6:  { x: 0.7, y: 0.4 },
  O1:  { x: -0.3, y: 0.7 },
  O2:  { x: 0.3, y: 0.7 },
};

const Topomap = ({ attentionVals }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !attentionVals) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * 0.8;

    ctx.clearRect(0, 0, width, height);

    // Draw base head
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw nose
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY - radius);
    ctx.lineTo(centerX, centerY - radius - 15);
    ctx.lineTo(centerX + 12, centerY - radius);
    ctx.fillStyle = '#334155';
    ctx.fill();

    // Find max attention to normalize
    const maxAttn = Math.max(...attentionVals.map(n => n.value));

    // Draw gradient nodes
    attentionVals.forEach(node => {
      const pos = POSITIONS[node.label];
      if (!pos) return;

      const x = centerX + pos.x * radius;
      const y = centerY + pos.y * radius;
      
      const intensity = node.value / (maxAttn || 1);
      
      // Radiant glow
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 50 * intensity + 20);
      grad.addColorStop(0, `rgba(56, 189, 248, ${intensity * 0.9})`);
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      
      ctx.beginPath();
      ctx.arc(x, y, 50 * intensity + 20, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // Draw exact node points
    attentionVals.forEach(node => {
      const pos = POSITIONS[node.label];
      if (!pos) return;

      const x = centerX + pos.x * radius;
      const y = centerY + pos.y * radius;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#bae6fd';
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, x, y - 8);
    });

  }, [attentionVals]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl hover:border-slate-700 transition-colors w-full h-full min-h-[350px]">
      <h3 className="text-slate-300 font-semibold mb-6 tracking-wide text-sm uppercase">Spatial Attention Topomap</h3>
      <canvas 
        ref={canvasRef} 
        width={320} 
        height={320}
        className="max-w-full scale-105"
      />
      <p className="text-xs text-sky-400 mt-6 bg-sky-900/30 px-3 py-1 rounded-full border border-sky-800/50">Blue indicates high CNN activation</p>
    </div>
  );
};

export default Topomap;
