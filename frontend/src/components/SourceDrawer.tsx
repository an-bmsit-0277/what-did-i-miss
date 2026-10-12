import React from 'react';
import type { ParsedMessage } from '@missed/engine';
import { Pin, ExternalLink } from 'lucide-react';
import { Button, Modal } from './ui';

interface SourceDrawerProps {
  isOpen: boolean;
  sourceMessageId: string | null;
  messages: ParsedMessage[];
  onClose: () => void;
  onOpenFullTranscript?: () => void;
}

export const SourceDrawer: React.FC<SourceDrawerProps> = ({
  isOpen,
  sourceMessageId,
  messages,
  onClose,
  onOpenFullTranscript,
}) => {
  const targetIdx = sourceMessageId
    ? messages.findIndex((m) => m.id === sourceMessageId)
    : -1;

  if (!isOpen || !sourceMessageId || targetIdx === -1) return null;

  const targetMsg = messages[targetIdx]!;
  const prevMsg = targetIdx > 0 ? messages[targetIdx - 1] : null;
  const nextMsg = targetIdx < messages.length - 1 ? messages[targetIdx + 1] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Source Message Trace"
      subtitle={`Message #${targetIdx + 1} of ${messages.length} in conversation timeline`}
      icon={<Pin className="w-4 h-4" />}
      maxWidthClass="max-w-md"
      footer={
        <>
          <span className="text-[11px] font-mono text-text-muted">
            ID: {targetMsg.id}
          </span>
          <div className="flex items-center gap-2">
            {onOpenFullTranscript && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenFullTranscript();
                }}
                rightIcon={<ExternalLink className="w-3 h-3" />}
              >
                Open Split Timeline
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </>
      }
    >
      <div className="space-y-3">
        {/* Preceding Message Context */}
        {prevMsg && (
          <div className="rounded-2xl p-3 bg-canvas/80 border border-border-default text-xs text-text-secondary opacity-80">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="font-semibold text-text-primary">{prevMsg.sender}</span>
              <span className="font-mono text-text-muted">{prevMsg.timestamp}</span>
            </div>
            <p className="line-clamp-2 leading-relaxed">{prevMsg.text}</p>
          </div>
        )}

        {/* Highlighted Target Source Message */}
        <div className="rounded-2xl p-4 bg-elevated border-2 border-ember shadow-[var(--shadow-ember-subtle)]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-warm-highlight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ember" aria-hidden="true" />
              {targetMsg.sender}
            </span>
            <span className="font-mono text-[10px] text-text-muted">
              {targetMsg.timestamp}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-primary font-medium whitespace-pre-wrap leading-relaxed">
            {targetMsg.text}
          </p>
        </div>

        {/* Succeeding Message Context */}
        {nextMsg && (
          <div className="rounded-2xl p-3 bg-canvas/80 border border-border-default text-xs text-text-secondary opacity-80">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="font-semibold text-text-primary">{nextMsg.sender}</span>
              <span className="font-mono text-text-muted">{nextMsg.timestamp}</span>
            </div>
            <p className="line-clamp-2 leading-relaxed">{nextMsg.text}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
