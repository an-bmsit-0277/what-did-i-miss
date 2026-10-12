import React, { useState } from 'react';
import type { FindingItem } from '@missed/engine';
import {
  CheckSquare,
  Square,
  ArrowRight,
  User,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Badge, EmptyState, PriorityBadge, SegmentedTabs, type TabItem } from './ui';

interface TasksViewProps {
  tasks: FindingItem[];
  completedTaskIds: Set<string>;
  onToggleTask: (taskId: string) => void;
  onJumpToMessage: (sourceMessageId: string) => void;
}

type TaskFilterMode = 'all' | 'pending' | 'completed';

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  completedTaskIds,
  onToggleTask,
  onJumpToMessage,
}) => {
  const [taskFilter, setTaskFilter] = useState<TaskFilterMode>('all');

  const pendingCount = tasks.filter((t) => !completedTaskIds.has(t.id)).length;
  const completedCount = tasks.filter((t) => completedTaskIds.has(t.id)).length;

  const filteredTasks = tasks.filter((task) => {
    const isCompleted = completedTaskIds.has(task.id);
    if (taskFilter === 'pending') return !isCompleted;
    if (taskFilter === 'completed') return isCompleted;
    return true;
  });

  const subTabs: ReadonlyArray<TabItem<TaskFilterMode>> = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'pending', label: 'Pending', count: pendingCount, badgeVariant: 'amber' },
    { id: 'completed', label: 'Completed', count: completedCount },
  ];

  return (
    <div className="p-4 space-y-3.5">
      {/* Sub-Filter Tabs */}
      <SegmentedTabs
        tabs={subTabs}
        activeTab={taskFilter}
        onChange={setTaskFilter}
        ariaLabel="Filter tasks by completion state"
        size="sm"
        className="w-full"
      />

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-5 h-5 text-semantic-local" />}
          title={
            taskFilter === 'completed'
              ? 'No completed tasks yet'
              : 'All caught up on tasks'
          }
          description={
            taskFilter === 'completed'
              ? 'Check off action items as you review the thread to track your catch-up progress.'
              : 'No pending action items match your current search or participant filter.'
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isCompleted = completedTaskIds.has(task.id);

            return (
              <div
                key={task.id}
                className={`rounded-2xl border p-3.5 transition-all flex items-start gap-3 ${
                  isCompleted
                    ? 'border-border-default bg-canvas/55 opacity-65'
                    : 'bg-elevated border-border-default hover:border-ember/40'
                }`}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isCompleted}
                  aria-label={isCompleted ? 'Mark task incomplete' : 'Mark task completed'}
                  onClick={() => onToggleTask(task.id)}
                  className="mt-0.5 text-ember-hover hover:text-warm-highlight shrink-0 focus-ember rounded cursor-pointer"
                  title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                >
                  {isCompleted ? (
                    <CheckSquare className="w-4 h-4 text-semantic-local" />
                  ) : (
                    <Square className="w-4 h-4 text-text-muted hover:text-ember-hover" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  {/* Priority & Assignee Badges */}
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <PriorityBadge urgency={task.urgency} />

                    {task.assignee && (
                      <Badge
                        variant="action_item"
                        icon={<User className="w-2.5 h-2.5" />}
                      >
                        @{task.assignee}
                      </Badge>
                    )}

                    {task.dueDate && (
                      <Badge
                        variant="deadline"
                        mono
                        icon={<Calendar className="w-2.5 h-2.5" />}
                      >
                        {task.dueDate}
                      </Badge>
                    )}
                  </div>

                  {/* Task Description */}
                  <p
                    className={`text-xs leading-relaxed ${
                      isCompleted
                        ? 'line-through text-text-muted'
                        : 'text-text-primary font-medium'
                    }`}
                  >
                    {task.snippet}
                  </p>

                  {/* Footer & Source Trace Link */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border-subtle text-[11px] text-text-secondary">
                    <span className="truncate">
                      Assigned by <strong className="text-text-primary font-medium">{task.sender}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => onJumpToMessage(task.sourceMessageId)}
                      className="text-ember-hover hover:text-warm-highlight font-semibold inline-flex items-center gap-1 ml-2 focus-ember rounded cursor-pointer shrink-0"
                    >
                      <span>Source</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
