import React from 'react';
import type { ConversationAnalysis } from '../types';
import {
  Sparkles,
  AlertTriangle,
  Target,
  Clock,
  CheckSquare,
  Square,
  ArrowRight,
  User,
  ChevronRight,
} from 'lucide-react';

interface OverviewViewProps {
  analysis: ConversationAnalysis;
  completedTaskIds: Set<string>;
  onToggleTask: (taskId: string) => void;
  onJumpToMessage: (sourceMessageId: string) => void;
  onViewAllTasks: () => void;
  onViewAllImportant: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  analysis,
  completedTaskIds,
  onToggleTask,
  onJumpToMessage,
  onViewAllTasks,
  onViewAllImportant,
}) => {
  const { recap, findings } = analysis;

  // Urgent findings (Needs Attention)
  const urgentFindings = findings.filter((f) => f.category === 'urgent').slice(0, 3);

  // Decisions & Deadlines
  const decisionsAndDeadlines = findings
    .filter((f) => f.category === 'decision' || f.category === 'deadline')
    .slice(0, 3);

  // Tasks (What do I need to do?)
  const tasks = findings.filter((f) => f.category === 'action_item').slice(0, 4);

  return (
    <div className="p-3.5 space-y-4">
      {/* 1. What Did I Miss? (Short Executive Recap) */}
      <section className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            What Did I Miss?
          </h3>
        </div>

        <ul className="space-y-1 text-xs text-slate-750">
          {recap.summaryBullets.slice(0, 3).map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-1.5 leading-snug">
              <span className="text-emerald-600 font-bold">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        {recap.topTopics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-200/60">
            {recap.topTopics.slice(0, 4).map((topic, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-600"
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 2. What Needs My Attention? (Highest-Priority Alerts) */}
      {urgentFindings.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Needs Attention ({urgentFindings.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={onViewAllImportant}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5"
            >
              View all
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {urgentFindings.map((finding) => (
              <div
                key={finding.id}
                className="bg-white rounded-xl border border-rose-200/90 p-2.5 shadow-2xs hover:border-rose-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    HIGH PRIORITY
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {finding.timestamp?.split(' ')[1] || finding.timestamp}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-900 mb-1 leading-snug">
                  {finding.title}
                </p>
                <p className="text-[11px] text-slate-600 italic bg-rose-50/40 rounded p-1.5 border border-rose-100 mb-1.5">
                  "{finding.snippet}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="truncate">By {finding.sender}</span>
                  <button
                    type="button"
                    onClick={() => onJumpToMessage(finding.sourceMessageId)}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold text-[11px]"
                  >
                    <span>Source</span>
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
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Decisions & Deadlines
              </h3>
            </div>
            <button
              type="button"
              onClick={onViewAllImportant}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5"
            >
              View all
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {decisionsAndDeadlines.map((item) => {
              const isDecision = item.category === 'decision';
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        isDecision
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {isDecision ? (
                        <>
                          <Target className="w-2.5 h-2.5" /> Decision
                        </>
                      ) : (
                        <>
                          <Clock className="w-2.5 h-2.5" /> Deadline
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => onJumpToMessage(item.sourceMessageId)}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] flex items-center gap-0.5"
                    >
                      Source <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 leading-snug">
                    {item.snippet}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. What Do I Need To Do? (Short Actionable Task List) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Actionable Tasks ({tasks.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onViewAllTasks}
            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5"
          >
            All tasks
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-center text-xs text-slate-500">
            No action items detected in this conversation.
          </div>
        ) : (
          <div className="space-y-1.5">
            {tasks.map((task) => {
              const isCompleted = completedTaskIds.has(task.id);

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-xl border p-2.5 shadow-2xs transition-all flex items-start gap-2.5 ${
                    isCompleted
                      ? 'border-slate-200 bg-slate-50/50 opacity-60'
                      : 'border-slate-200/90 hover:border-emerald-300'
                  }`}
                >
                  {/* Interactive Checkbox */}
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isCompleted}
                    aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 text-emerald-600 hover:text-emerald-700 flex-shrink-0 cursor-pointer"
                    title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 hover:text-emerald-600" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs text-slate-800 leading-snug ${
                        isCompleted ? 'line-through text-slate-400' : 'font-medium'
                      }`}
                    >
                      {task.snippet}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                      {task.assignee && (
                        <span className="inline-flex items-center gap-0.5 text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 font-medium">
                          <User className="w-2.5 h-2.5" />
                          {task.assignee}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onJumpToMessage(task.sourceMessageId)}
                        className="text-emerald-700 hover:text-emerald-800 font-semibold ml-auto flex items-center gap-0.5"
                      >
                        Source <ArrowRight className="w-2.5 h-2.5" />
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

