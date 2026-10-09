import React from 'react';
import type { FindingItem } from '../types';
import {
  AlertTriangle,
  CheckSquare,
  Target,
  Clock,
  AtSign,
  ArrowRight,
  User,
  Calendar,
} from 'lucide-react';

interface FindingCardProps {
  finding: FindingItem;
  onJumpToMessage: (messageId: string) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onJumpToMessage }) => {
  const getCategoryConfig = (category: FindingItem['category']) => {
    switch (category) {
      case 'urgent':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Urgent Alert',
        };
      case 'action_item':
        return {
          icon: <CheckSquare className="w-3.5 h-3.5 text-amber-600" />,
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Action Item',
        };
      case 'decision':
        return {
          icon: <Target className="w-3.5 h-3.5 text-indigo-600" />,
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          label: 'Decision',
        };
      case 'deadline':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-purple-600" />,
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Deadline',
        };
      case 'mention':
        return {
          icon: <AtSign className="w-3.5 h-3.5 text-blue-600" />,
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Mention',
        };
    }
  };

  const getUrgencyBadge = (urgency: FindingItem['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const catConfig = getCategoryConfig(finding.category);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-indigo-300 transition-all hover:shadow-sm flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${catConfig.badgeBg}`}
            >
              {catConfig.icon}
              {catConfig.label}
            </span>

            <span
              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] tracking-wide uppercase border ${getUrgencyBadge(
                finding.urgency
              )}`}
            >
              {finding.urgency} Priority
            </span>
          </div>

          {finding.timestamp && (
            <span className="text-[11px] text-slate-400 font-mono">
              {finding.timestamp.split(' ')[1] || finding.timestamp}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-slate-850 mb-1.5 leading-snug">
          {finding.title}
        </h4>

        {/* Snippet */}
        <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 rounded-lg p-2.5 border border-slate-150 italic font-sans mb-3">
          "{finding.snippet}"
        </p>
      </div>

      {/* Footer / Context & Jump CTA */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-700">By {finding.sender}</span>
          {finding.assignee && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-medium border border-amber-200">
              <User className="w-3 h-3" />
              {finding.assignee}
            </span>
          )}
          {finding.dueDate && (
            <span className="inline-flex items-center gap-1 text-[11px] text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded font-medium border border-purple-200">
              <Calendar className="w-3 h-3" />
              {finding.dueDate}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onJumpToMessage(finding.sourceMessageId)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 group-hover:translate-x-0.5 transition-transform ml-2"
          title="Jump directly to source message in transcript"
        >
          <span>Source</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

