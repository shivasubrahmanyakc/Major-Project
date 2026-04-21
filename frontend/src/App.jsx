import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Brain, Activity, RefreshCw } from 'lucide-react';
import Topomap from './components/Topomap';
import GraphView from './components/GraphView';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/predict-set', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResults(response.data);
    } catch (err) {
      console.error(err);
      setError('An error occurred during prediction. Ensure backend is running and a .set file was provided.');
    } finally {
      setLoading(false);
    }
  };

  const renderProbabilities = () => {
    if (!results) return null;
    const classes = ["AD", "CN", "FTD"];
    
    return (
      <div className="flex gap-4 mt-6 w-full max-w-xl mx-auto">
        {results.probabilities.map((prob, idx) => (
          <div key={classes[idx]} className="flex-1 bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col items-center">
            <span className="text-slate-400 text-sm font-medium">{classes[idx]}</span>
            <span className={`text-2xl font-bold mt-1 ${idx === classes.indexOf(results.prediction) ? 'text-sky-400' : 'text-slate-200'}`}>
              {(prob * 100).toFixed(1)}%
            </span>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full ${idx === classes.indexOf(results.prediction) ? 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'bg-slate-600'}`} 
                  style={{ width: `${prob * 100}%` }}
                ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-sky-500/30">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-14 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-sky-500/10 rounded-2xl mb-6 border border-sky-500/20 shadow-[0_0_30px_rgba(14,165,233,0.15)] relative">
            <div className="absolute inset-0 bg-sky-400 blur-xl opacity-20 -z-10 rounded-full"></div>
            <Brain className="w-10 h-10 text-sky-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Neural<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Scan</span> AI
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Advanced diagnostic system for EEG-based brain disorder classification utilizing CNN temporal learning and GCN graph coherence.
          </p>
        </header>

        {/* Main Content Area */}
        {!results && !loading && (
          <div className="max-w-xl mx-auto animate-in fade-in duration-500">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl transition-all hover:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-sky-500/5 rounded-full blur-3xl -z-10"></div>
              
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-700/70 rounded-2xl cursor-pointer hover:bg-slate-800/50 hover:border-sky-500/50 transition-all group relative overflow-hidden">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="bg-slate-800 group-hover:bg-sky-500/20 p-4 rounded-full mb-4 transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-sky-400 transition-colors" />
                  </div>
                  <p className="mb-2 text-sm text-slate-300">
                    <span className="font-semibold text-white">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 tracking-wider uppercase font-medium">EEGLAB .set format</p>
                </div>
                <input type="file" className="hidden" accept=".set" onChange={handleFileChange} />
              </label>

              {file && (
                <div className="mt-6 flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-sky-500/20 p-2 rounded-lg">
                      <Activity className="w-5 h-5 text-sky-400 shrink-0" />
                    </div>
                    <span className="text-sm truncate font-medium text-slate-300">{file.name}</span>
                  </div>
                  <button 
                    onClick={handleUpload}
                    className="shrink-0 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] transform hover:-translate-y-0.5"
                  >
                    Analyze Network
                  </button>
                </div>
              )}
              {error && <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-in slide-in-from-top-2">{error}</div>}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-300">
            <div className="relative w-28 h-28 flex items-center justify-center mb-8">
              <div className="absolute inset-0 border-t-2 border-l-2 border-sky-400 rounded-full animate-[spin_1s_linear_infinite]" />
              <div className="absolute inset-3 border-r-2 border-b-2 border-indigo-400 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
              <div className="absolute inset-6 bg-slate-900 rounded-full"></div>
              <Brain className="w-8 h-8 text-sky-400 animate-pulse relative z-10 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight flex items-center gap-2">
              Processing Pipeline Processing<span className="animate-pulse">...</span>
            </h3>
            <p className="text-slate-400 text-sm max-w-xs text-center leading-relaxed">
              Extracting temporal bands, generating coherence matrices, and applying GCN structural embeddings.
            </p>
          </div>
        )}

        {/* Results Area */}
        {results && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            {/* Top Prediction Bar */}
            <div className="bg-[#0f141e] rounded-[2rem] p-8 border border-slate-800 shadow-2xl shadow-sky-900/10 mb-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
              <div className="absolute -left-20 -top-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
              
              <div className="relative z-10 text-center md:text-left">
                <h2 className="text-slate-400 font-medium text-xs tracking-[0.2em] uppercase mb-3">System Diagnosis</h2>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-6">
                  <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-sky-100 to-sky-400 drop-shadow-sm">
                    {results.prediction}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-lg text-sky-300 font-semibold bg-sky-500/10 px-4 py-1.5 rounded-full border border-sky-500/20">
                    <Activity className="w-4 h-4" />
                    {(results.confidence * 100).toFixed(1)}% Confidence
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => { setFile(null); setResults(null); }}
                className="mt-8 md:mt-0 relative z-10 flex items-center gap-2 text-slate-300 hover:text-white transition-all bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="font-medium text-sm">New Analysis</span>
              </button>
            </div>

            {/* Split Visualization Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Topomap attentionVals={results.graph.nodes} />
              <GraphView graphData={results.graph} />
            </div>

            {/* Probabilities */}
            <div className="text-center bg-[#0f141e] rounded-[2rem] p-8 border border-slate-800 relative overflow-hidden">
               <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <h3 className="text-slate-400 font-medium tracking-[0.1em] uppercase text-xs mb-6 inline-block bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full relative z-10">Softmax Model Probabilities</h3>
              {renderProbabilities()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
