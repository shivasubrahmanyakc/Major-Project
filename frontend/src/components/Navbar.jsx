import React from 'react';
import { Brain } from 'lucide-react';

function Navbar() {
  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-sky-200 via-amber-100 to-yellow-200 border-b border-amber-200 shadow-sm">
      <div className="w-full px-6 py-4 flex items-center justify-between">

        {/* LEFT: Website Name */}
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Neuro
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-amber-400 to-yellow-500">
            Insight
          </span>
        </h1>

        {/* RIGHT: Logo */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-sky-100 to-amber-100 rounded-xl border border-amber-200 shadow-sm">
            <Brain className="w-5 h-5 text-amber-500" />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Navbar;