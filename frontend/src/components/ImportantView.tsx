import React, { useState } from 'react';
import type { FindingItem } from '../types';
import {
  AlertTriangle,
  Target,
  Clock,
  AtSign,
  ArrowRight,
  User,
  Calendar,
  Layers,
} from 'lucide-react';

interface ImportantViewProps {
  findings: FindingItem[];
  onJumpToMessage: (sourceMessageId: string) => void;
}

export const ImportantView: React.FC<ImportantViewProps> = ({ findings, onJumpToMessage }) => {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'decision' | 'deadline' | 'mention'>('all');

  // Filter to only non-action-item findings (or all important signals)
  const importantItems = findings.filter((f) => f.category !== 'action_item');

  const filteredItems = importantItems.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const getCategoryConfig = (category: FindingItem['category']) => {
    switch (category) {
      case 'urgent':
        return {
          icon: <AlertTriangle className="w-3 h-3 text-rose-600" />,
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Urgent Alert',
        };
      case 'decision':
        return {
          icon: <Target className="w-3 h-3 text-sky-600" />,
          badge: 'bg-sky-50 text-sky-700 border-sky-200',
          label: 'Decision',
        };
      case 'deadline':
        return {
          icon: <Clock className="w-3 h-3 text-purple-600" />,
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Deadline',
        };
      case 'mention':
        return {
          icon: <AtSign className="w-3 h-3 text-blue-600" />,
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Mention',
        };
      default:
        return {
          icon: <Layers className="w-3 h-3 text-slate-600" />,
          badge: 'bg-slate-50 text-slate-700 border-slate-200',
          label: 'Note',
        };
    }
  };

  return (
    <div className="p-3.5 space-y-3">
      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        {[
          { id: 'all', label: `All (${importantItems.length})` },
          { id: 'urgent', label: `Urgent (${importantItems.filter((i) => i.category === 'urgent').length})` },
          { id: 'decision', label: `Decisions (${importantItems.filter((i) => i.category === 'decision').length})` },
          { id: 'deadline', label: `Deadlines (${importantItems.filter((i) => i.category === 'deadline').length})` },
          { id: 'mention', label: `Mentions (${importantItems.filter((i) => i.category === 'mention').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              filter === tab.id
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
          No important items in this category.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const config = getCategoryConfig(item.category);

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:border-slate-300 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${config.badge}`}
                    >
                      {config.icon}
                      {config.label}
                    </span>

                    {item.urgency === 'high' && (
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 rounded border border-rose-200 uppercase">
                        High
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.timestamp?.split(' ')[1] || item.timestamp}
                  </span>
                </div>

                {/* Title & Snippet */}
                <p className="text-xs font-semibold text-slate-900 mb-1 leading-snug">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-600 italic bg-slate-50 rounded p-2 border border-slate-150 leading-relaxed">
                  "{item.snippet}"
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>By {item.sender}</span>
                    {item.assignee && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-800 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                        <User className="w-2.5 h-2.5" />
                        @{item.assignee}
                      </span>
                    )}
                    {item.dueDate && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-800 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                        <Calendar className="w-2.5 h-2.5" />
                        {item.dueDate}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onJumpToMessage(item.sourceMessageId)}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 ml-2 flex-shrink-0"
                  >
                    <span>Source</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

