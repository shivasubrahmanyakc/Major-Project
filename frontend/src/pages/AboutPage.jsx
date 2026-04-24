import React from 'react';
import Navbar from '../components/Navbar';

function AboutPage() {
  return (
    <div className="min-h-screen bg-amber-50 text-gray-800 font-sans">

      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Title */}
        <h1 className="text-4xl font-extrabold mb-6 text-gray-900">
          About Neuro<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-amber-400 to-yellow-500">Insight</span>
        </h1>

        <p className="text-gray-600 mb-10">
          NeuroInsight is an advanced EEG-based brain disorder classification system that processes raw brain signals through multiple computational phases to predict neurological conditions.
        </p>

        {/* PHASE 1 */}
        <Section title="Phase 1: Raw Signal Processing (Preprocess)">
          <ul className="list-disc pl-6 space-y-2">
            <li><b>File Ingestion:</b> Reads .set file using MNE.</li>
            <li><b>Channel Mapping:</b> Converts channel names to uppercase.</li>
            <li><b>Channel Pruning:</b> Keeps 19 standard EEG channels.</li>
            <li><b>Channel Reordering:</b> Maintains fixed neural network order.</li>
            <li><b>Notch Filtering:</b> Removes 50 Hz electrical noise.</li>
            <li><b>Band-pass Filtering:</b> Keeps 0.5–45 Hz signals.</li>
            <li><b>Re-referencing:</b> Uses common average reference.</li>
            <li><b>Resampling:</b> Standardizes to 256 Hz.</li>
          </ul>
        </Section>

        {/* PHASE 2 */}
        <Section title="Phase 2: Slicing & Artifact Cleaning (Segment)">
          <ul className="list-disc pl-6 space-y-2">
            <li><b>Unit Conversion:</b> Converts volts to microvolts.</li>
            <li><b>Windowing:</b> Splits into 4-sec segments (1024 samples).</li>
            <li><b>Overlap:</b> 50% overlap for continuity.</li>
            <li><b>Artifact Removal:</b> Removes signals beyond ±150μV.</li>
            <li><b>Fallback:</b> Pads data if all segments are rejected.</li>
          </ul>
        </Section>

        {/* PHASE 3 */}
        <Section title="Phase 3: Feature Extraction (Graph & Frequency)">
          <ul className="list-disc pl-6 space-y-2">
            <li><b>Band Power:</b> Extracts Delta, Theta, Alpha, Beta, Gamma bands.</li>
            <li><b>PSD Calculation:</b> Uses Welch’s method.</li>
            <li><b>Log Scaling:</b> Stabilizes variance.</li>
            <li><b>Coherence Matrix:</b> Builds 19×19 connectivity graph.</li>
          </ul>
        </Section>

        {/* PHASE 4 */}
        <Section title="Phase 4: Formatting & Normalization">
          <ul className="list-disc pl-6 space-y-2">
            <li><b>Reshaping:</b> Converts to (N, 1024, 19).</li>
            <li><b>Standard Scaling:</b> Applies pre-trained scaler.</li>
          </ul>
        </Section>

        {/* PHASE 5 */}
        <Section title="Phase 5: Model Inference">
          <ul className="list-disc pl-6 space-y-2">
            <li><b>Prediction:</b> CNN-BiLSTM processes signals.</li>
            <li><b>Averaging:</b> Combines segment predictions.</li>
            <li><b>Output:</b> Classifies AD, CN, FTD.</li>
            <li><b>Attention:</b> Highlights important brain regions.</li>
          </ul>
        </Section>

      </div>
    </div>
  );
}

/* 🔥 Reusable Section Component */
function Section({ title, children }) {
  return (
    <div className="mb-10 bg-yellow-50 border border-amber-200 rounded-2xl p-6 shadow-md">
      <h2 className="text-xl font-semibold text-amber-600 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default AboutPage;