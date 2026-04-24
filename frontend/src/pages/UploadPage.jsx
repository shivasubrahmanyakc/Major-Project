import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    // 🚀 instant navigation (NO API CALL HERE)
    navigate('/processing', { state: { file } });
    };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-sky-500/30">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <header className="mb-14 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-sky-500/10 rounded-2xl mb-6 border border-sky-500/20 shadow-[0_0_30px_rgba(14,165,233,0.15)] relative">
            <div className="absolute inset-0 bg-sky-400 blur-xl opacity-20 -z-10 rounded-full"></div>
            <Activity className="w-10 h-10 text-sky-400" />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Neural<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Scan</span> AI
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Advanced diagnostic system for EEG-based brain disorder classification.
          </p>
        </header>

        {/* Upload Card */}
        <div className="max-w-xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">

            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-800/50 hover:border-sky-500/50 transition-all">
              
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="bg-slate-800 p-4 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>

                <p className="mb-2 text-sm text-slate-300">
                  <span className="font-semibold text-white">Click to upload</span>
                </p>

                <p className="text-xs text-slate-500 uppercase">EEGLAB .set</p>
              </div>

              <input
                type="file"
                className="hidden"
                accept=".set"
                onChange={handleFileChange}
              />
            </label>

            {file && (
              <div className="mt-6 flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-sm">{file.name}</span>

                <button
                  onClick={handleUpload}
                  className="bg-sky-500 text-white px-5 py-2 rounded-lg"
                >
                  Analyze Network
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 text-red-400 text-sm">{error}</div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default UploadPage;