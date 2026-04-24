import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

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
    navigate('/processing', { state: { file } });
  };

  return (
    <div className="min-h-screen bg-amber-50 text-gray-800 font-sans selection:bg-amber-300/40">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12">

        <header className="mb-14 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-2xl mb-6 border border-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.3)] relative">
            <div className="absolute inset-0 bg-amber-300 blur-xl opacity-20 -z-10 rounded-full"></div>
            <Activity className="w-10 h-10 text-amber-500" />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            Neuro<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">Insight</span>
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Advanced diagnostic system for EEG-based brain disorder classification
          </p>
        </header>

        <div className="max-w-xl mx-auto">
          <div className="bg-yellow-50 border border-amber-200 rounded-3xl p-8 shadow-2xl relative overflow-hidden">

            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-amber-300 rounded-2xl cursor-pointer hover:bg-amber-100 hover:border-amber-400 transition-all">
              
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="bg-amber-100 p-4 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-amber-500" />
                </div>

                <p className="mb-2 text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Click to upload</span>
                </p>

                <p className="text-xs text-gray-500 uppercase">EEGLAB .set</p>
              </div>

              <input
                type="file"
                className="hidden"
                accept=".set"
                onChange={handleFileChange}
              />
            </label>

            {file && (
              <div className="mt-6 flex items-center justify-between bg-amber-100 p-4 rounded-xl border border-amber-200">
                <span className="text-sm text-gray-800">{file.name}</span>

                <button
                  onClick={handleUpload}
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white px-5 py-2 rounded-lg"
                >
                  Analyze Network
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 text-red-500 text-sm">{error}</div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default UploadPage;