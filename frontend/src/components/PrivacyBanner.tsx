import React, { useState } from 'react';
import { ShieldCheck, Info, X } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-b border-emerald-200/60 px-4 py-2.5 text-xs text-slate-700">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="flex-shrink-0 p-1 rounded-full bg-emerald-100 text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
          </span>
          <div className="truncate">
            <strong className="font-semibold text-emerald-900">Privacy Boundary:</strong>{' '}
            <span className="text-slate-700">
              Your conversations are processed 100% locally in your browser memory. No data is ever sent to any server or remote AI API.
            </span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Info className="w-3 h-3 text-slate-400" />
              <span>Deterministic rule-based pattern analysis (no generative LLM hallucinations).</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

