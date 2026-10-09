import React from 'react';
import {
  ShieldCheck,
  RotateCcw,
  Copy,
  Check,
  Upload,
  PlayCircle,
  MessageSquareText,
} from 'lucide-react';

interface HeaderProps {
  onLoadSample: () => void;
  onUploadClick: () => void;
  onReset: () => void;
  onCopySummary: () => void;
  copied: boolean;
  hasActiveConversation: boolean;
  fileName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onUploadClick,
  onReset,
  onCopySummary,
  copied,
  hasActiveConversation,
  fileName,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                What Did I Miss?
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Privacy-first catch-up assistant for unread conversations
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% On-Device
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            Rule-Based NLP
          </span>
          {fileName && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium truncate max-w-[200px]">
              📄 {fileName}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {hasActiveConversation && (
            <>
              <button
                type="button"
                onClick={onCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
                title="Copy Executive Summary & Action Items to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
                title="Clear current conversation"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs shadow-indigo-300"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Load Sample</span>
          </button>
        </div>
      </div>
    </header>
  );
};

