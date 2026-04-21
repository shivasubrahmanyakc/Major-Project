import ForceGraph2D from 'react-force-graph-2d';

const GraphView = ({ graphData }) => {
  if (!graphData || !graphData.nodes || !graphData.edges) {
    return <div className="text-slate-500">No graph data available</div>;
  }

  // Pre-process links to ensure ForceGraph accepts them natively
  const processedData = {
    nodes: graphData.nodes.map(n => ({...n, val: n.value})),
    links: graphData.edges.map(e => ({ source: e.source, target: e.target, weight: e.weight }))
  };

  const getLinkColor = (link) => {
    // High weight = brighter color
    const w = link.weight;
    if (w > 0.7) return 'rgba(244, 63, 94, 0.8)'; // Rose
    if (w > 0.5) return 'rgba(168, 85, 247, 0.6)'; // Purple
    return 'rgba(56, 189, 248, 0.3)'; // Sky
  };

  return (
    <div className="flex flex-col items-center p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl hover:border-slate-700 transition-colors w-full h-full min-h-[350px]">
      <h3 className="text-slate-300 font-semibold mb-6 tracking-wide text-sm uppercase">Functional Connectivity</h3>
      <div className="w-full flex-grow flex items-center justify-center bg-slate-950/50 rounded-2xl overflow-hidden relative border border-slate-800/50 shadow-inner">
        <ForceGraph2D
          width={400}
          height={300}
          graphData={processedData}
          nodeLabel="label"
          nodeColor={() => '#38bdf8'}
          nodeRelSize={6}
          linkColor={getLinkColor}
          linkWidth={link => Math.max(1, link.weight * 4)}
          linkDirectionalParticles={link => (link.weight > 0.6 ? 2 : 1)}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={link => link.weight * 0.01}
          backgroundColor="transparent"
        />
      </div>
      <p className="text-xs text-indigo-400 mt-6 bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-800/50">Nodes = Channels | Particles = Coherence</p>
    </div>
  );
}

export default GraphView;
