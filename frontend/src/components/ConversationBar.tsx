import React from 'react';
import { Sparkles, MessageCircle, RefreshCw } from 'lucide-react';

interface ConversationBarProps {
  title: string;
  messageCount: number;
  isSample: boolean;
  isAnalyzing: boolean;
  onCatchMeUp: () => void;
}

export const ConversationBar: React.FC<ConversationBarProps> = ({
  title,
  messageCount,
  isSample,
  isAnalyzing,
  onCatchMeUp,
}) => {
  return (
    <div className="bg-slate-50/90 border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between gap-2">
      {/* Conversation Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <h2 className="text-xs font-bold text-slate-900 truncate" title={title}>
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
          <span>{messageCount} messages</span>
          <span className="text-slate-300">•</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200/80 text-slate-600">
            {isSample ? 'Sample Chat' : 'Imported File'}
          </span>
        </div>
      </div>

      {/* Prominent "Catch me up" Primary Action Button */}
      <button
        type="button"
        onClick={onCatchMeUp}
        disabled={isAnalyzing || messageCount === 0}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-xs flex-shrink-0 ${
          isAnalyzing
            ? 'bg-emerald-700 cursor-wait opacity-90'
            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-200'
        }`}
        title="Analyze conversation and refresh recap, priorities, and tasks"
      >
        {isAnalyzing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Catch me up</span>
          </>
        )}
      </button>
    </div>
  );
};

