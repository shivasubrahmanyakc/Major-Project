import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Topomap from '../components/Topomap';
import GraphView from '../components/GraphView';
import { Activity, RefreshCw } from 'lucide-react';

function ResultPage() {
  const { state: results } = useLocation();
  const navigate = useNavigate();

  if (!results) {
    return <div className="text-center mt-20">No Data available</div>;
    }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Prediction Header */}
        <div className="bg-[#0f141e] rounded-3xl p-8 border border-slate-800 mb-8 flex flex-col items-center justify-between">

          <h2 className="text-slate-400 text-sm uppercase mb-3">
            System Diagnosis
          </h2>

          <span className="text-6xl font-black text-sky-400">
            {results.prediction}
          </span>

          <span className="text-lg text-sky-300 mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {(results.confidence * 100).toFixed(1)}% Confidence
          </span>

          <button
            onClick={() => navigate('/')}
            className="mt-6 flex items-center gap-2 bg-slate-800 px-5 py-2 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
            New Analysis
          </button>

        </div>

        {/* Graph + Topomap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Topomap attentionVals={results.graph.nodes} />
          <GraphView graphData={results.graph} />
        </div>

      </div>
    </div>
  );
}

export default ResultPage;