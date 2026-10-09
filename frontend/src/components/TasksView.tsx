import React, { useState } from 'react';
import type { FindingItem } from '../types';
import {
  CheckSquare,
  Square,
  ArrowRight,
  User,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface TasksViewProps {
  tasks: FindingItem[];
  completedTaskIds: Set<string>;
  onToggleTask: (taskId: string) => void;
  onJumpToMessage: (sourceMessageId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  completedTaskIds,
  onToggleTask,
  onJumpToMessage,
}) => {
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const pendingCount = tasks.filter((t) => !completedTaskIds.has(t.id)).length;
  const completedCount = tasks.filter((t) => completedTaskIds.has(t.id)).length;

  const filteredTasks = tasks.filter((task) => {
    const isCompleted = completedTaskIds.has(task.id);
    if (taskFilter === 'pending') return !isCompleted;
    if (taskFilter === 'completed') return isCompleted;
    return true;
  });

  return (
    <div className="p-3.5 space-y-3">
      {/* Sub-Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
        <button
          type="button"
          onClick={() => setTaskFilter('all')}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            taskFilter === 'all'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          type="button"
          onClick={() => setTaskFilter('pending')}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            taskFilter === 'pending'
              ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setTaskFilter('completed')}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            taskFilter === 'completed'
              ? 'bg-white text-slate-800 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
          {taskFilter === 'completed'
            ? 'No tasks completed yet. Check tasks off as you catch up!'
            : 'No tasks match your current filter.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const isCompleted = completedTaskIds.has(task.id);

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border p-3 shadow-2xs transition-all flex items-start gap-3 ${
                  isCompleted
                    ? 'border-slate-200 bg-slate-50/60 opacity-60'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                {/* Working Checkbox */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isCompleted}
                  aria-label={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                  onClick={() => onToggleTask(task.id)}
                  className="mt-0.5 text-emerald-600 hover:text-emerald-700 flex-shrink-0 cursor-pointer"
                  title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                >
                  {isCompleted ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 hover:text-emerald-600" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  {/* Priority & Meta Badges */}
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider border ${
                        task.urgency === 'high'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {task.urgency} Priority
                    </span>

                    {task.assignee && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-medium">
                        <User className="w-2.5 h-2.5" />
                        {task.assignee}
                      </span>
                    )}

                    {task.dueDate && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 font-medium">
                        <Calendar className="w-2.5 h-2.5" />
                        {task.dueDate}
                      </span>
                    )}
                  </div>

                  {/* Task Text */}
                  <p
                    className={`text-xs text-slate-800 leading-snug ${
                      isCompleted ? 'line-through text-slate-400' : 'font-medium'
                    }`}
                  >
                    {task.snippet}
                  </p>

                  {/* Footer & Source Link */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="truncate">Raised by {task.sender}</span>
                    <button
                      type="button"
                      onClick={() => onJumpToMessage(task.sourceMessageId)}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 ml-2"
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

