import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Brain } from 'lucide-react';

function ProcessingPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [progress, setProgress] = useState(0);

  // 🔥 Fake progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 2 : prev));
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // 🔥 API call
  useEffect(() => {
    if (!state || !state.file) {
      navigate('/');
      return;
    }

    const runPrediction = async () => {
      try {
        const formData = new FormData();
        formData.append('file', state.file);

        const res = await axios.post('http://127.0.0.1:8000/predict-set', formData);

        // ✅ Complete progress before navigating
        setProgress(100);

        setTimeout(() => {
          navigate('/result', { state: res.data });
        }, 500);

      } catch (err) {
        console.error("API ERROR:", err);
        navigate('/');
      }
    };

    runPrediction();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-slate-200">

      {/* 🔥 Original Animation */}
      <div className="relative w-28 h-28 flex items-center justify-center mb-8">
        <div className="absolute inset-0 border-t-2 border-l-2 border-sky-400 rounded-full animate-[spin_1s_linear_infinite]" />
        <div className="absolute inset-3 border-r-2 border-b-2 border-indigo-400 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
        <div className="absolute inset-6 bg-slate-900 rounded-full"></div>
        <Brain className="w-8 h-8 text-sky-400 animate-pulse relative z-10" />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-white mb-2">
        Processing Pipeline...
      </h3>

      {/* Subtitle */}
      <p className="text-slate-400 text-sm text-center max-w-xs mb-6">
        Extracting temporal bands, generating coherence matrices, and applying GCN.
      </p>

      {/* 🔥 Progress Bar */}
      <div className="w-64 bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Percentage */}
      <p className="mt-3 text-sm text-sky-400 font-medium">
        {progress}% Processing...
      </p>

    </div>
  );
}

export default ProcessingPage;