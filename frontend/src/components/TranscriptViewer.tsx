import React, { useEffect, useMemo, useRef } from 'react';
import type { FindingItem, ParsedMessage } from '@missed/engine';
import { MessageSquare, Pin, Sparkles } from 'lucide-react';
import { Badge, CategoryBadge, EmptyState } from './ui';

interface TranscriptViewerProps {
  messages: ParsedMessage[];
  findings?: FindingItem[];
  highlightedMessageId: string | null;
  searchQuery: string;
  selectedParticipant?: string;
  onSelectMessage?: (messageId: string) => void;
}

const SENDER_ACCENTS: readonly string[] = [
  'text-[#FF8C42]',
  'text-[#38BDF8]',
  'text-[#34D399]',
  'text-[#C084FC]',
  'text-[#FBBF24]',
  'text-[#60A5FA]',
];

function getSenderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_ACCENTS[Math.abs(hash) % SENDER_ACCENTS.length] ?? 'text-warm-highlight';
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  messages,
  findings = [],
  highlightedMessageId,
  searchQuery,
  selectedParticipant = 'all',
  onSelectMessage,
}) => {
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Map messageId -> findings linked to that message
  const findingsByMessageId = useMemo(() => {
    const map = new Map<string, FindingItem[]>();
    for (const f of findings) {
      const existing = map.get(f.sourceMessageId);
      if (existing) {
        existing.push(f);
      } else {
        map.set(f.sourceMessageId, [f]);
      }
    }
    return map;
  }, [findings]);

  // Filter visible messages if participant filter is active (always keep highlighted message visible)
  const visibleMessages = useMemo(() => {
    if (!selectedParticipant || selectedParticipant === 'all') {
      return messages;
    }
    return messages.filter(
      (m) => m.sender === selectedParticipant || m.id === highlightedMessageId
    );
  }, [messages, selectedParticipant, highlightedMessageId]);

  useEffect(() => {
    if (highlightedMessageId) {
      const el = messageRefs.current.get(highlightedMessageId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedMessageId]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="bg-ember/30 text-warm-highlight rounded px-1 py-0.2 font-semibold border border-ember/40"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <section
      aria-label="Conversation transcript timeline"
      className="bg-surface rounded-[var(--radius-panel)] border-specular flex flex-col h-full max-h-[760px] overflow-hidden"
    >
      {/* Transcript Header */}
      <div className="px-4 py-3.5 bg-elevated/80 border-b border-border-default flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-icon)] bg-ember/15 border border-ember/35 text-ember-hover flex items-center justify-center font-bold text-xs">
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-text-primary leading-tight">
              Chronological Transcript Timeline
            </h3>
            <span className="text-[11px] text-text-secondary">
              Showing <strong className="font-mono text-text-primary">{visibleMessages.length}</strong> of{' '}
              <strong className="font-mono text-text-primary">{messages.length}</strong> messages
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge
            variant="ember"
            mono
            icon={<Sparkles className="w-2.5 h-2.5" />}
          >
            {findingsByMessageId.size} signal messages
          </Badge>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-canvas bg-circuit-grid scrollbar-obsidian">
        {visibleMessages.length === 0 ? (
          <EmptyState
            title="No messages for this sender"
            description="Reset the participant filter to view the full conversation timeline."
          />
        ) : (
          visibleMessages.map((msg, idx) => {
            const isHighlighted = highlightedMessageId === msg.id;
            const linkedFindings = findingsByMessageId.get(msg.id) ?? [];
            const hasFindings = linkedFindings.length > 0;
            const senderColor = getSenderColor(msg.sender);

            return (
              <div
                key={msg.id}
                ref={(el) => {
                  if (el) messageRefs.current.set(msg.id, el);
                  else messageRefs.current.delete(msg.id);
                }}
                onClick={() => onSelectMessage?.(msg.id)}
                className={`group rounded-2xl p-3.5 transition-all duration-200 relative ${
                  isHighlighted
                    ? 'bg-elevated border-2 border-ember shadow-[var(--shadow-ember)] ring-2 ring-ember/25'
                    : hasFindings
                    ? 'bg-surface/95 border border-border-strong hover:border-ember/40'
                    : 'bg-surface/75 border border-border-default hover:border-border-strong'
                } ${onSelectMessage ? 'cursor-pointer' : ''}`}
              >
                {/* Traced Source Message Pin */}
                {isHighlighted && (
                  <div className=" -top-2.5 right-3 absolute px-2.5 py-0.5 rounded-full bg-ember text-text-primary text-[10px] font-bold flex items-center gap-1 shadow-[var(--shadow-ember)]">
                    <Pin className="w-2.5 h-2.5" aria-hidden="true" />
                    <span>Traced Source Message</span>
                  </div>
                )}

                {/* Sender & Timestamp Row */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-text-muted">
                      #{idx + 1}
                    </span>
                    <span className={`text-xs font-bold truncate ${senderColor}`}>
                      {highlightText(msg.sender, searchQuery)}
                    </span>
                  </div>

                  {msg.timestamp && (
                    <span className="text-[10px] text-text-muted font-mono shrink-0">
                      {msg.timestamp}
                    </span>
                  )}
                </div>

                {/* Message Text */}
                <p className="text-text-primary/95 text-xs leading-relaxed whitespace-pre-wrap">
                  {highlightText(msg.text, searchQuery)}
                </p>

                {/* Associated Findings Indicator Row */}
                {hasFindings && (
                  <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-text-muted mr-1">
                      Extracted:
                    </span>
                    {linkedFindings.map((f) => (
                      <CategoryBadge key={f.id} category={f.category} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
