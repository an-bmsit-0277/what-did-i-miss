import React from 'react';
import { Search, X, Users } from 'lucide-react';

interface CompactFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedParticipant: string;
  onParticipantChange: (p: string) => void;
  participants: string[];
}

export const CompactFilter: React.FC<CompactFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedParticipant,
  onParticipantChange,
  participants,
}) => {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50/70 border-b border-slate-200 text-xs">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter text, sender, tasks..."
          className="w-full pl-8 pr-6 py-1 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Participant Filter Dropdown */}
      {participants.length > 0 && (
        <div className="relative w-36 flex-shrink-0">
          <Users className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
          <select
            value={selectedParticipant}
            onChange={(e) => onParticipantChange(e.target.value)}
            className="w-full pl-6 pr-4 py-1 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-700 truncate focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Everyone</option>
            {participants.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

