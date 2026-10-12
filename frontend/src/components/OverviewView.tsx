import React from 'react';
import type { ConversationAnalysis, FindingItem } from '@missed/engine';
import {
  Sparkles,
  AlertTriangle,
  Target,
  CheckSquare,
  Square,
  ArrowRight,
  User,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Badge, Card, CategoryBadge, EmptyState, PriorityBadge } from './ui';

interface OverviewViewProps {
  analysis: ConversationAnalysis;
  filteredFindings?: FindingItem[];
  completedTaskIds: Set<string>;
  onToggleTask: (taskId: string) => void;
  onJumpToMessage: (sourceMessageId: string) => void;
  onViewAllTasks: () => void;
  onViewAllImportant: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  analysis,
  filteredFindings,
  completedTaskIds,
  onToggleTask,
  onJumpToMessage,
  onViewAllTasks,
  onViewAllImportant,
}) => {
  const { recap } = analysis;
  const activeFindings = filteredFindings ?? analysis.findings;

  const urgentFindings = activeFindings
    .filter((f) => f.category === 'urgent')
    .slice(0, 3);

  const decisionsAndDeadlines = activeFindings
    .filter((f) => f.category === 'decision' || f.category === 'deadline')
    .slice(0, 3);

  const tasks = activeFindings
    .filter((f) => f.category === 'action_item')
    .slice(0, 4);

  return (
    <div className="p-4 space-y-5">
      {/* 1. Executive Recap Card with Subtle Ember Spotlight */}
      <Card variant="featured" padding="sm" spotlight>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-ember-hover shrink-0" aria-hidden="true" />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Executive Catch-Up Recap
            </h3>
          </div>
          {recap.startTime && (
            <span className="text-[10px] font-mono text-text-muted">
              {recap.startTime.split(' ')[1] || recap.startTime}
              {recap.endTime ? ` → ${recap.endTime.split(' ')[1] || recap.endTime}` : ''}
            </span>
          )}
        </div>

        <ul className="space-y-1.5 text-xs text-text-secondary">
          {recap.summaryBullets.slice(0, 3).map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-ember-hover font-bold mt-0.5" aria-hidden="true">
                •
              </span>
              <span className="text-text-primary/95">{bullet}</span>
            </li>
          ))}
        </ul>

        {recap.topTopics.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-border-default">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted mr-1">
              Signals:
            </span>
            {recap.topTopics.slice(0, 5).map((topic, idx) => (
              <Badge key={idx} variant="neutral" mono>
                #{topic}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* 2. Needs Immediate Attention (Urgent Alerts) */}
      {urgentFindings.length > 0 && (
        <section aria-label="Urgent alerts" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle
                className="w-3.5 h-3.5 text-semantic-urgent shrink-0"
                aria-hidden="true"
              />
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Needs Attention ({urgentFindings.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={onViewAllImportant}
              className="text-[11px] text-ember-hover hover:text-warm-highlight font-semibold inline-flex items-center gap-0.5 focus-ember rounded cursor-pointer"
            >
              <span>Inspect all</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {urgentFindings.map((finding) => (
              <div
                key={finding.id}
                className="rounded-2xl bg-elevated border border-semantic-urgent/35 p-3 hover:border-semantic-urgent/60 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <CategoryBadge category="urgent" />
                    <PriorityBadge urgency={finding.urgency} />
                  </div>
                  {finding.timestamp && (
                    <span className="text-[10px] text-text-muted font-mono">
                      {finding.timestamp.split(' ')[1] || finding.timestamp}
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-text-primary mb-1.5 leading-snug">
                  {finding.title}
                </p>
                <p className="text-[11px] text-text-secondary bg-canvas/80 rounded-xl p-2 border border-border-default mb-2 leading-relaxed">
                  “{finding.snippet}”
                </p>

                <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1.5 border-t border-border-subtle">
                  <span className="truncate">
                    From <strong className="text-text-primary font-medium">{finding.sender}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onJumpToMessage(finding.sourceMessageId)}
                    className="inline-flex items-center gap-1 text-ember-hover hover:text-warm-highlight font-semibold text-[11px] focus-ember rounded cursor-pointer"
                  >
                    <span>Trace source</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Decisions & Deadlines */}
      {decisionsAndDeadlines.length > 0 && (
        <section aria-label="Decisions and deadlines" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target
                className="w-3.5 h-3.5 text-semantic-decision shrink-0"
                aria-hidden="true"
              />
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Decisions & Deadlines
              </h3>
            </div>
            <button
              type="button"
              onClick={onViewAllImportant}
              className="text-[11px] text-ember-hover hover:text-warm-highlight font-semibold inline-flex items-center gap-0.5 focus-ember rounded cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {decisionsAndDeadlines.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-elevated border border-border-default hover:border-border-strong p-3 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <CategoryBadge category={item.category} />
                    {item.dueDate && (
                      <Badge
                        variant="deadline"
                        mono
                        icon={<Clock className="w-2.5 h-2.5" />}
                      >
                        {item.dueDate}
                      </Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onJumpToMessage(item.sourceMessageId)}
                    className="text-ember-hover hover:text-warm-highlight font-semibold text-[11px] inline-flex items-center gap-0.5 focus-ember rounded cursor-pointer shrink-0"
                  >
                    <span>Source</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
                <p className="text-xs text-text-primary/95 leading-relaxed">
                  {item.snippet}
                </p>
                <div className="mt-1.5 text-[10px] text-text-muted">
                  Logged by <span className="text-text-secondary font-medium">{item.sender}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Actionable Tasks */}
      <section aria-label="Actionable tasks" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckSquare
              className="w-3.5 h-3.5 text-semantic-task shrink-0"
              aria-hidden="true"
            />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Actionable Tasks ({tasks.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onViewAllTasks}
            className="text-[11px] text-ember-hover hover:text-warm-highlight font-semibold inline-flex items-center gap-0.5 focus-ember rounded cursor-pointer"
          >
            <span>All tasks</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            title="No action items detected"
            description="No explicit task assignments matched your current filter in this thread."
          />
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isCompleted = completedTaskIds.has(task.id);

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-3 transition-all flex items-start gap-2.5 ${
                    isCompleted
                      ? 'border-border-default bg-canvas/50 opacity-65'
                      : 'bg-elevated border-border-default hover:border-ember/40'
                  }`}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isCompleted}
                    aria-label={isCompleted ? 'Mark task incomplete' : 'Mark task complete'}
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 text-ember-hover hover:text-warm-highlight shrink-0 focus-ember rounded cursor-pointer"
                    title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-semantic-local" />
                    ) : (
                      <Square className="w-4 h-4 text-text-muted hover:text-ember-hover" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-snug ${
                        isCompleted
                          ? 'line-through text-text-muted'
                          : 'text-text-primary font-medium'
                      }`}
                    >
                      {task.snippet}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-text-secondary">
                      {task.assignee && (
                        <Badge
                          variant="action_item"
                          icon={<User className="w-2.5 h-2.5" />}
                        >
                          @{task.assignee}
                        </Badge>
                      )}
                      <span className="text-text-muted truncate">from {task.sender}</span>
                      <button
                        type="button"
                        onClick={() => onJumpToMessage(task.sourceMessageId)}
                        className="text-ember-hover hover:text-warm-highlight font-semibold ml-auto inline-flex items-center gap-0.5 focus-ember rounded cursor-pointer shrink-0"
                      >
                        <span>Source</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
