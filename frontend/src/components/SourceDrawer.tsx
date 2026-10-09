import React from 'react';
import type { ParsedMessage } from '../types';
import { X, Pin, ExternalLink } from 'lucide-react';

interface SourceDrawerProps {
  isOpen: boolean;
  sourceMessageId: string | null;
  messages: ParsedMessage[];
  onClose: () => void;
  onOpenFullTranscript?: () => void;
}

export const SourceDrawer: React.FC<SourceDrawerProps> = ({
  isOpen,
  sourceMessageId,
  messages,
  onClose,
  onOpenFullTranscript,
}) => {
  if (!isOpen || !sourceMessageId) return null;

  const targetIdx = messages.findIndex((m) => m.id === sourceMessageId);
  if (targetIdx === -1) return null;

  const targetMsg = messages[targetIdx];
  const prevMsg = targetIdx > 0 ? messages[targetIdx - 1] : null;
  const nextMsg = targetIdx < messages.length - 1 ? messages[targetIdx + 1] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Pin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Source Message Context</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Stream Preview */}
        <div className="p-4 space-y-3 overflow-y-auto bg-[#efeae2]/30 flex-1">
          {/* Preceding Message */}
          {prevMsg && (
            <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200/70 text-xs text-slate-500 opacity-75">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-semibold text-slate-600">{prevMsg.sender}</span>
                <span className="font-mono text-slate-400">{prevMsg.timestamp}</span>
              </div>
              <p className="line-clamp-2">{prevMsg.text}</p>
            </div>
          )}

          {/* Target Message (Highlighted) */}
          <div className="bg-white rounded-xl p-3.5 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-200/60">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-bold text-emerald-950 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {targetMsg.sender}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {targetMsg.timestamp}
              </span>
            </div>
            <p className="text-xs text-slate-900 font-medium whitespace-pre-wrap leading-relaxed">
              {targetMsg.text}
            </p>
          </div>

          {/* Succeeding Message */}
          {nextMsg && (
            <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200/70 text-xs text-slate-500 opacity-75">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-semibold text-slate-600">{nextMsg.sender}</span>
                <span className="font-mono text-slate-400">{nextMsg.timestamp}</span>
              </div>
              <p className="line-clamp-2">{nextMsg.text}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Message {targetIdx + 1} of {messages.length}
          </span>
          <div className="flex items-center gap-2">
            {onOpenFullTranscript && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullTranscript();
                }}
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 text-xs"
              >
                <span>Full chat</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

