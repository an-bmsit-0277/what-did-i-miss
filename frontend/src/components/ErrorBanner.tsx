import React from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
  error?: string;
  warning?: string;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, warning, onDismiss }) => {
  if (!error && !warning) return null;

  const isError = Boolean(error);
  const message = error || warning;

  return (
    <div
      className={`max-w-7xl mx-auto my-3 px-4 py-3 rounded-xl border flex items-center justify-between gap-3 shadow-2xs ${
        isError
          ? 'bg-rose-50 border-rose-200 text-rose-800'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isError ? (
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        )}
        <div className="text-sm">
          <strong className="font-semibold">{isError ? 'Import Error: ' : 'Notice: '}</strong>
          <span>{message}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

