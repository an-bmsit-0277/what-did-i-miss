import React, { useEffect, useRef } from 'react';
import type { ParsedMessage } from '../types';
import { Pin } from 'lucide-react';

interface TranscriptViewerProps {
  messages: ParsedMessage[];
  highlightedMessageId: string | null;
  searchQuery: string;
}

// Consistent sender color palette (WhatsApp-style group chat sender colors)
const SENDER_COLORS: Record<string, string> = {
  'Maya Lin': 'text-emerald-700',
  'Leo Chen': 'text-teal-700',
  'Priya Sharma': 'text-indigo-700',
  'Sam Thorne': 'text-purple-700',
  'Alex Rivera': 'text-amber-700',
};

function getSenderColor(name: string): string {
  if (SENDER_COLORS[name]) return SENDER_COLORS[name];
  const list = [
    'text-emerald-700',
    'text-blue-700',
    'text-violet-700',
    'text-amber-700',
    'text-rose-700',
    'text-cyan-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return list[Math.abs(hash) % list.length];
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  messages,
  highlightedMessageId,
  searchQuery,
}) => {
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (highlightedMessageId) {
      const el = messageRefs.current.get(highlightedMessageId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedMessageId]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full max-h-[750px] overflow-hidden">
      {/* Header bar styled like WhatsApp Chat Header */}
      <div className="p-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            WA
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">
              Chat Transcript Timeline
            </h3>
            <span className="text-[10px] text-slate-500">
              {messages.length} messages loaded
            </span>
          </div>
        </div>
      </div>

      {/* WhatsApp Chat Wallpaper Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#efeae2] scrollbar-thin">
        {messages.map((msg) => {
          const isHighlighted = highlightedMessageId === msg.id;
          const senderColor = getSenderColor(msg.sender);

          return (
            <div
              key={msg.id}
              ref={(el) => {
                if (el) messageRefs.current.set(msg.id, el);
                else messageRefs.current.delete(msg.id);
              }}
              className={`flex flex-col transition-all duration-300 ${
                isHighlighted ? 'scale-[1.01]' : ''
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-2.5 shadow-2xs text-xs relative ${
                  isHighlighted
                    ? 'bg-emerald-50 border-2 border-emerald-500 ring-2 ring-emerald-300/60'
                    : 'bg-white border border-slate-200/60'
                }`}
              >
                {/* Highlight Badge */}
                {isHighlighted && (
                  <div className="absolute -top-2.5 right-2 px-2 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center gap-1 shadow-2xs">
                    <Pin className="w-2.5 h-2.5" />
                    Source Message
                  </div>
                )}

                {/* Author Name */}
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className={`text-[11px] font-bold ${senderColor}`}>
                    {highlightText(msg.sender, searchQuery)}
                  </span>
                </div>

                {/* Body Text */}
                <p className="text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {highlightText(msg.text, searchQuery)}
                </p>

                {/* Timestamp */}
                {msg.timestamp && (
                  <div className="text-[9px] text-slate-400 font-mono text-right mt-1">
                    {msg.timestamp.split(' ')[1] || msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
