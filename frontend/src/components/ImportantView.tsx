import React, { useState } from 'react';
import type { FindingItem } from '@missed/engine';
import {
  ArrowRight,
  User,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  AnalyzerBadge,
  Badge,
  CategoryBadge,
  EmptyState,
  PriorityBadge,
} from './ui';

interface ImportantViewProps {
  findings: FindingItem[];
  onJumpToMessage: (sourceMessageId: string) => void;
}

type CategoryFilter = 'all' | 'urgent' | 'decision' | 'deadline' | 'mention';

export const ImportantView: React.FC<ImportantViewProps> = ({
  findings,
  onJumpToMessage,
}) => {
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const importantItems = findings.filter((f) => f.category !== 'action_item');

  const filteredItems = importantItems.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const filterPills: ReadonlyArray<{ id: CategoryFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: importantItems.length },
    {
      id: 'urgent',
      label: 'Urgent',
      count: importantItems.filter((i) => i.category === 'urgent').length,
    },
    {
      id: 'decision',
      label: 'Decisions',
      count: importantItems.filter((i) => i.category === 'decision').length,
    },
    {
      id: 'deadline',
      label: 'Deadlines',
      count: importantItems.filter((i) => i.category === 'deadline').length,
    },
    {
      id: 'mention',
      label: 'Mentions',
      count: importantItems.filter((i) => i.category === 'mention').length,
    },
  ];

  return (
    <div className="p-4 space-y-3.5">
      {/* Category Filter Pills */}
      <div
        role="group"
        aria-label="Filter important findings by category"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-obsidian text-[11px]"
      >
        {filterPills.map((pill) => {
          const isActive = filter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilter(pill.id)}
              className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 focus-ember cursor-pointer border ${
                isActive
                  ? 'bg-ember/20 text-warm-highlight border-ember/50 shadow-[0_2px_10px_rgba(255,82,27,0.18)]'
                  : 'bg-elevated text-text-secondary border-border-default hover:text-text-primary hover:border-border-strong'
              }`}
            >
              <span>{pill.label}</span>
              <span className="font-mono text-[10px] opacity-80">{pill.count}</span>
            </button>
          );
        })}
      </div>

      {/* Findings List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-5 h-5" />}
          title="No findings in this category"
          description="Try switching category pills or clearing the search filter above."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl bg-elevated border p-3.5 transition-colors ${
                item.category === 'urgent'
                  ? 'border-semantic-urgent/35 hover:border-semantic-urgent/60'
                  : 'border-border-default hover:border-border-strong'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <CategoryBadge category={item.category} />
                  <PriorityBadge urgency={item.urgency} />
                </div>

                {item.timestamp && (
                  <span className="text-[10px] text-text-muted font-mono">
                    {item.timestamp.split(' ')[1] || item.timestamp}
                  </span>
                )}
              </div>

              {/* Finding Title & Quoted Source Snippet */}
              <p className="text-xs font-semibold text-text-primary mb-1.5 leading-snug">
                {item.title}
              </p>
              <p className="text-[11px] text-text-secondary bg-canvas/85 rounded-xl p-2.5 border border-border-default leading-relaxed">
                “{item.snippet}”
              </p>

              {/* Card Footer */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-subtle text-[11px] text-text-secondary gap-2">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="truncate">
                    By <strong className="text-text-primary font-medium">{item.sender}</strong>
                  </span>
                  {item.assignee && (
                    <Badge
                      variant="mention"
                      icon={<User className="w-2.5 h-2.5" />}
                    >
                      @{item.assignee}
                    </Badge>
                  )}
                  {item.dueDate && (
                    <Badge
                      variant="deadline"
                      mono
                      icon={<Calendar className="w-2.5 h-2.5" />}
                    >
                      {item.dueDate}
                    </Badge>
                  )}
                  <AnalyzerBadge analyzer={item.analyzer} className="hidden sm:inline-flex" />
                </div>

                <button
                  type="button"
                  onClick={() => onJumpToMessage(item.sourceMessageId)}
                  className="text-ember-hover hover:text-warm-highlight font-semibold inline-flex items-center gap-1 ml-auto shrink-0 focus-ember rounded cursor-pointer"
                >
                  <span>Source</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
