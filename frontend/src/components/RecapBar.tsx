import React from 'react';
import type { ConversationAnalysis } from '../types';
import {
  MessageSquare,
  Users,
  AlertTriangle,
  CheckSquare,
  Target,
  Clock,
  Tag,
  Sparkles,
} from 'lucide-react';

interface RecapBarProps {
  analysis: ConversationAnalysis;
}

export const RecapBar: React.FC<RecapBarProps> = ({ analysis }) => {
  const { recap, stats } = analysis;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {/* Messages */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Messages</span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-xl font-bold text-slate-900">{recap.totalMessages}</span>
        </div>

        {/* Participants */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Participants</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-xl font-bold text-slate-900">{recap.participantCount}</span>
        </div>

        {/* Urgent Alerts */}
        <div className={`rounded-xl p-3 border flex flex-col justify-between ${
          stats.urgentCount > 0
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-rose-700">Urgent Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-xl font-bold text-rose-700">{stats.urgentCount}</span>
        </div>

        {/* Decisions */}
        <div className={`rounded-xl p-3 border flex flex-col justify-between ${
          stats.decisionCount > 0
            ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-indigo-700">Decisions</span>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-xl font-bold text-indigo-700">{stats.decisionCount}</span>
        </div>

        {/* Action Items */}
        <div className={`rounded-xl p-3 border flex flex-col justify-between ${
          stats.actionItemCount > 0
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-amber-700">Action Items</span>
            <CheckSquare className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xl font-bold text-amber-700">{stats.actionItemCount}</span>
        </div>

        {/* Deadlines */}
        <div className={`rounded-xl p-3 border flex flex-col justify-between ${
          stats.deadlinesCount > 0
            ? 'bg-purple-50 border-purple-200 text-purple-900'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-purple-700">Deadlines</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-xl font-bold text-purple-700">{stats.deadlinesCount}</span>
        </div>
      </div>

      {/* Executive Recap & Topics Container */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl p-4 border border-slate-200/90 flex flex-col md:flex-row gap-4 items-start justify-between">
        {/* Executive Bullets */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Executive Catch-Up Summary
            </h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {recap.summaryBullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span className="leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Domain Topics */}
        {recap.topTopics.length > 0 && (
          <div className="md:w-64 border-t md:border-t-0 md:border-l border-slate-200/80 pt-3 md:pt-0 md:pl-4 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Key Topics
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recap.topTopics.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs"
                >
                  #{topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

