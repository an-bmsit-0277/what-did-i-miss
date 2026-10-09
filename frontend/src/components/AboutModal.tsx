import React from 'react';
import { ShieldCheck, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center text-white">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold text-slate-900">About Missed.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 text-xs text-slate-600">
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">
              WhatsApp Web Catch-Up Companion
            </h4>
            <p className="leading-relaxed">
              <strong>Missed.</strong> is designed to help users catch up on unread group chats with a single click. This interface previews the upcoming Chrome extension side panel.
            </p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% On-Device Privacy</span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              All conversation parsing and analysis run completely inside your local browser tab. No chat contents or summaries are ever transmitted over the network.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>Rule-Based Analysis:</strong> Insights are extracted deterministically using linguistic cues and regex heuristics without hallucinations.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>Zero External APIs:</strong> No cloud LLMs or remote databases are used.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

