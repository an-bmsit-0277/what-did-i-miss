import React from 'react';
import type { FindingItem } from '../types';
import { FindingCard } from './FindingCard';
import { SearchX } from 'lucide-react';

interface FindingsListProps {
  findings: FindingItem[];
  onJumpToMessage: (messageId: string) => void;
}

export const FindingsList: React.FC<FindingsListProps> = ({ findings, onJumpToMessage }) => {
  if (findings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <SearchX className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">No findings matched your filter</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Try selecting "All Findings", clearing your search query, or resetting the participant filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {findings.map((item) => (
        <FindingCard
          key={item.id}
          finding={item}
          onJumpToMessage={onJumpToMessage}
        />
      ))}
    </div>
  );
};

