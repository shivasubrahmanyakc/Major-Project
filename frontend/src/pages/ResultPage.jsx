import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Topomap from '../components/Topomap';
import GraphView from '../components/GraphView';
import { Activity, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';

function ResultPage() {
  const { state: results } = useLocation();
  const navigate = useNavigate();

  if (!results) {
    return <div className="text-center mt-20">No Data available</div>;
  }

  const getExplanation = (prediction) => {
    switch (prediction) {
      case "AD":
        return [
          "High activity in frontal region",
          "Reduced connectivity in temporal lobe",
          "Increased entropy pattern",
          "Weak long-range brain connections",
          "Abnormal alpha and beta band activity"
        ];

      case "FTD":
        return [
          "Severe frontal lobe degeneration",
          "Disrupted connectivity in fronto-temporal regions",
          "Irregular neural synchronization",
          "Reduced signal stability across channels",
          "Altered gamma band activity"
        ];

      case "CN":
        return [
          "Balanced brain activity across all regions",
          "Strong and stable connectivity patterns",
          "Low entropy (well-organized signals)",
          "Normal alpha, beta rhythm distribution",
          "Healthy synchronization between regions"
        ];

      default:
        return ["No explanation available"];
    }
  };

  const getFullForm = (prediction) => {
    switch (prediction) {
      case "AD":
        return "Alzheimer's Disease";
      case "FTD":
        return "Frontotemporal Dementia";
      case "CN":
        return "Cognitively Normal";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 text-gray-800 font-sans">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12">

        <div className="bg-yellow-50 rounded-3xl p-8 border border-amber-200 mb-8 flex flex-col items-center justify-between shadow-lg">

          <div className="flex flex-col items-center mb-3">
            <h2 className="text-gray-600 text-sm uppercase">
              System Diagnosis
            </h2>

            <div className="w-120 h-[3px] bg-gradient-to-r from-sky-400 via-amber-400 to-yellow-500 mt-2 rounded-full"></div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-6xl font-black text-amber-500">
              {results.prediction}
            </span>

            <span className="text-sm text-gray-600 mt-2 font-medium">
              {getFullForm(results.prediction)}
            </span>
          </div>

          <span className="text-lg text-amber-600 mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {(results.confidence * 100).toFixed(1)}% Confidence
          </span>

          <div className="bg-yellow-50 border border-amber-200 rounded-3xl p-6 shadow-md mt-8 mb-8">
            <h3 className="text-lg font-semibold text-amber-600 mb-4">
              Disease analysis
            </h3>

            <ul className="space-y-2 text-gray-700">
              {getExplanation(results.prediction).map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => navigate('/')}
            className="mt-6 flex items-center gap-2 bg-amber-200 hover:bg-amber-300 px-5 py-2 rounded-xl text-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
            New Analysis
          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Topomap attentionVals={results.graph.nodes} />
          <GraphView graphData={results.graph} />
        </div>

      </div>
    </div>
  );
}

export default ResultPage;