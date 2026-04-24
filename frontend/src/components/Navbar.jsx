import React from 'react';
import { Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-sky-200 via-amber-100 to-yellow-200 border-b border-amber-300 shadow-sm">
      
      <div className="w-full px-4 py-4 flex items-center justify-between">

        {/* LEFT: Website Name */}
        <h1 
            onClick={() => navigate('/')}
            className="text-xl font-bold cursor-pointer"
            >
            <span
                className={`transition-colors duration-500 ${
                location.pathname === '/'
                    ? 'text-amber-600'
                    : 'text-gray-900'
                }`}
            >
                Neuro
            </span>

            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-amber-400 to-yellow-500">
                Insight
            </span>
        </h1>

        {/* RIGHT: About + Logo */}
        <div className="flex items-center gap-4">

          {/* About Button */}
          <button
            onClick={() => navigate('/about')}
            className={`px-4 py-1.5 rounded-lg font-medium transition border ${
  location.pathname === '/about'
    ? 'border-amber-500 text-amber-700 bg-amber-100'
    : 'border-amber-300 text-gray-700 hover:bg-amber-100'
}`}
          >
            About
          </button>

          {/* Logo */}
          <div className="p-2 bg-gradient-to-br from-sky-100 to-amber-100 rounded-xl border border-amber-200 shadow-sm">
            <Brain className="w-5 h-5 text-amber-500" />
          </div>

        </div>

      </div>
    </div>
  );
}

export default Navbar;