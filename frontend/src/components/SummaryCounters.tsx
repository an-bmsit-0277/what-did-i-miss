import React from 'react';
import { AlertTriangle, CheckSquare, Target } from 'lucide-react';
import type { ActiveTab } from '@missed/engine';

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
  const remainingTasks = Math.max(0, taskCount - completedTaskCount);

  return (
    <div className="grid grid-cols-3 gap-2.5 px-4 py-3 bg-surface border-b border-border-default">
      {/* Urgent Counter */}
      <button
        type="button"
        onClick={() => onSelectTab('important')}
        className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-elevated/90 hover:bg-input border border-semantic-urgent/30 hover:border-semantic-urgent/60 text-left transition-all group focus-ember cursor-pointer"
        title="Inspect urgent blockers in Important tab"
      >
        <div className="w-8 h-8 rounded-[var(--radius-icon)] bg-semantic-urgent/15 text-semantic-urgent border border-semantic-urgent/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
            Urgent
          </div>
          <div className="text-base font-extrabold font-mono text-text-primary leading-tight">
            {urgentCount}
          </div>
        </div>
      </button>

      {/* Tasks Counter */}
      <button
        type="button"
        onClick={() => onSelectTab('tasks')}
        className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-elevated/90 hover:bg-input border border-semantic-task/30 hover:border-semantic-task/60 text-left transition-all group focus-ember cursor-pointer"
        title="Inspect action items in Tasks tab"
      >
        <div className="w-8 h-8 rounded-[var(--radius-icon)] bg-semantic-task/15 text-semantic-task border border-semantic-task/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
            Tasks
          </div>
          <div className="text-base font-extrabold font-mono text-text-primary leading-tight flex items-baseline gap-1">
            <span>{remainingTasks}</span>
            {completedTaskCount > 0 && (
              <span className="text-[10px] font-mono font-medium text-semantic-local">
                +{completedTaskCount}✓
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Decisions Counter */}
      <button
        type="button"
        onClick={() => onSelectTab('important')}
        className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-elevated/90 hover:bg-input border border-semantic-decision/30 hover:border-semantic-decision/60 text-left transition-all group focus-ember cursor-pointer"
        title="Inspect decisions in Important tab"
      >
        <div className="w-8 h-8 rounded-[var(--radius-icon)] bg-semantic-decision/15 text-semantic-decision border border-semantic-decision/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Target className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
            Decisions
          </div>
          <div className="text-base font-extrabold font-mono text-text-primary leading-tight">
            {decisionCount}
          </div>
        </div>
      </button>
    </div>
  );
};
