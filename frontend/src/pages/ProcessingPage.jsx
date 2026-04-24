import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Brain } from 'lucide-react';
import Navbar from '../components/Navbar';

function ProcessingPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 2 : prev));
    }, 200);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-amber-50 text-gray-800 flex flex-col">

      {/* ✅ Navbar stays at top */}
      <Navbar />

      {/* ✅ ONLY this part should be centered */}
      <div className="flex flex-col items-center justify-center flex-1">

        <div className="relative w-28 h-28 flex items-center justify-center mb-8">
          <div className="absolute inset-0 border-t-2 border-l-2 border-amber-400 rounded-full animate-[spin_1s_linear_infinite]" />
          <div className="absolute inset-3 border-r-2 border-b-2 border-yellow-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
          <div className="absolute inset-6 bg-yellow-50 rounded-full"></div>
          <Brain className="w-8 h-8 text-amber-500 animate-pulse relative z-10" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Processing Pipeline...
        </h3>

        <p className="text-gray-600 text-sm text-center max-w-xs mb-6">
          Extracting temporal bands, generating coherence matrices, and applying GCN.
        </p>

        <div className="w-64 bg-amber-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="mt-3 text-sm text-amber-600 font-medium">
          {progress}% Processing...
        </p>

      </div>
    </div>
  );
}

export default ProcessingPage;