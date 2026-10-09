import React from 'react';
import type { FindingCategory } from '../types';
import {
  Search,
  Filter,
  Users,
  AlertTriangle,
  CheckSquare,
  Target,
  Clock,
  AtSign,
  Layers,
} from 'lucide-react';

interface FilterBarProps {
  activeCategory: FindingCategory | 'all';
  onCategoryChange: (category: FindingCategory | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedParticipant: string;
  onParticipantChange: (sender: string) => void;
  participants: string[];
  categoryCounts: Record<FindingCategory | 'all', number>;
  myFilter: string;
  onMyFilterChange: (name: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  selectedParticipant,
  onParticipantChange,
  participants,
  categoryCounts,
  myFilter,
  onMyFilterChange,
}) => {
  const categories: Array<{
    id: FindingCategory | 'all';
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'all', label: 'All Findings', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'urgent', label: 'Urgent', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> },
    { id: 'action_item', label: 'Action Items', icon: <CheckSquare className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'decision', label: 'Decisions', icon: <Target className="w-3.5 h-3.5 text-indigo-500" /> },
    { id: 'deadline', label: 'Deadlines', icon: <Clock className="w-3.5 h-3.5 text-purple-500" /> },
    { id: 'mention', label: 'Mentions', icon: <AtSign className="w-3.5 h-3.5 text-blue-500" /> },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6 space-y-3">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1 flex-shrink-0">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Participant Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100">
        {/* Keyword Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search findings and transcript..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>

        {/* Participant Filter Dropdown */}
        <div className="sm:col-span-4 relative">
          <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <select
            value={selectedParticipant}
            onChange={(e) => onParticipantChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 text-slate-700 appearance-none"
          >
            <option value="all">All Participants ({participants.length})</option>
            {participants.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Personalized "Filter for Me" */}
        <div className="sm:col-span-3 relative">
          <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={myFilter}
            onChange={(e) => onMyFilterChange(e.target.value)}
            placeholder="Filter for me (@name)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
            title="Type your name to show tasks and mentions addressed to you"
          />
        </div>
      </div>
    </div>
  );
};

