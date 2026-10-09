import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  MoreVertical,
  Upload,
  PlayCircle,
  Copy,
  Check,
  Trash2,
  Info,
  Sparkles,
} from 'lucide-react';

interface MissedHeaderProps {
  onRefresh: () => void;
  onLoadSample: () => void;
  onUploadClick: () => void;
  onCopySummary: () => void;
  onReset: () => void;
  onOpenAbout: () => void;
  copied: boolean;
  hasActiveConversation: boolean;
  isAnalyzing: boolean;
}

export const MissedHeader: React.FC<MissedHeaderProps> = ({
  onRefresh,
  onLoadSample,
  onUploadClick,
  onCopySummary,
  onReset,
  onOpenAbout,
  copied,
  hasActiveConversation,
  isAnalyzing,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Privacy Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 flex items-center">
            Missed<span className="text-emerald-500">.</span>
          </span>
        </div>

        {/* Small Privacy Pill */}
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60"
          title="All parsing and heuristic analysis run 100% locally in this browser tab"
        >
          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
          On-Device
        </span>
      </div>

      {/* Right Actions: Refresh + Secondary Menu */}
      <div className="flex items-center gap-1">
        {/* Refresh / Re-analyze button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={!hasActiveConversation || isAnalyzing}
          className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ${
            isAnalyzing ? 'animate-spin text-emerald-600' : ''
          }`}
          title="Re-run analysis"
          aria-label="Re-run analysis"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* 3-Dots Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="More actions"
            aria-label="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-40 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLoadSample();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
              >
                <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Load Sample Chat</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onUploadClick();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Upload Chat (.txt/.json)</span>
              </button>

              {hasActiveConversation && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onCopySummary();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied Summary!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReset();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Clear Conversation</span>
                  </button>
                </>
              )}

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAbout();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-500 flex items-center gap-2"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>About Missed. & Privacy</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

