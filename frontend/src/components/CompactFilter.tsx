import React, { useId } from 'react';
import { Users } from 'lucide-react';
import { SearchInput } from './ui';

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
  const selectId = useId();

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-canvas/80 border-b border-border-default text-xs">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Filter findings, senders, or @mentions..."
      />

      {participants.length > 0 && (
        <div className="relative w-36 shrink-0">
          <label htmlFor={selectId} className="sr-only">
            Filter by participant
          </label>
          <Users
            className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <select
            id={selectId}
            value={selectedParticipant}
            onChange={(e) => onParticipantChange(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-[11px] rounded-full border border-border-default bg-input text-text-primary truncate focus:outline-none focus:border-ember-hover focus:ring-1 focus:ring-ember-hover cursor-pointer"
          >
            <option value="all">All Senders ({participants.length})</option>
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
