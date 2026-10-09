import React from 'react';
import { AlertTriangle, CheckSquare, Target } from 'lucide-react';
import type { ActiveTab } from '../types';

interface SummaryCountersProps {
  urgentCount: number;
  taskCount: number;
  completedTaskCount: number;
  decisionCount: number;
  onSelectTab: (tab: ActiveTab) => void;
}

export const SummaryCounters: React.FC<SummaryCountersProps> = ({
  urgentCount,
  taskCount,
  completedTaskCount,
  decisionCount,
  onSelectTab,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 px-3.5 py-2.5 bg-white border-b border-slate-100">
      {/* Urgent Counter */}
      <button
        type="button"
        onClick={() => onSelectTab('important')}
        className="flex items-center gap-2 p-2 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200/70 text-left transition-colors group cursor-pointer"
        title="View urgent items in Important tab"
      >
        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider">
            Urgent
          </div>
          <div className="text-sm font-extrabold text-rose-900 leading-tight">
            {urgentCount}
          </div>
        </div>
      </button>

      {/* Tasks Counter */}
      <button
        type="button"
        onClick={() => onSelectTab('tasks')}
        className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/70 text-left transition-colors group cursor-pointer"
        title="View task checklist in Tasks tab"
      >
        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <CheckSquare className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
            Tasks
          </div>
          <div className="text-sm font-extrabold text-amber-900 leading-tight">
            {taskCount - completedTaskCount}
            {completedTaskCount > 0 && (
              <span className="text-[10px] font-medium text-amber-600 ml-1">
                ({completedTaskCount}✓)
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Decisions Counter */}
      <button
        type="button"
        onClick={() => onSelectTab('important')}
        className="flex items-center gap-2 p-2 rounded-xl bg-sky-50/70 hover:bg-sky-100/70 border border-sky-200/70 text-left transition-colors group cursor-pointer"
        title="View decisions in Important tab"
      >
        <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <Target className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-sky-700 uppercase tracking-wider">
            Decisions
          </div>
          <div className="text-sm font-extrabold text-sky-900 leading-tight">
            {decisionCount}
          </div>
        </div>
      </button>
    </div>
  );
};

