import React from 'react';
import { Sparkles, MessageSquareText } from 'lucide-react';
import { Button, Badge } from './ui';

interface ConversationBarProps {
  title: string;
  messageCount: number;
  isSample: boolean;
  isAnalyzing: boolean;
  onCatchMeUp: () => void;
}

export const ConversationBar: React.FC<ConversationBarProps> = ({
  title,
  messageCount,
  isSample,
  isAnalyzing,
  onCatchMeUp,
}) => {
  return (
    <div className="bg-elevated/70 border-b border-border-default px-4 py-3 flex items-center justify-between gap-3">
      {/* Conversation Metadata */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <MessageSquareText
            className="w-3.5 h-3.5 text-ember-hover shrink-0"
            aria-hidden="true"
          />
          <h2
            className="text-xs sm:text-sm font-bold text-text-primary truncate tracking-tight"
            title={title}
          >
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-text-secondary">
          <span className="font-mono text-text-primary font-semibold">
            {messageCount}
          </span>
          <span>messages indexed</span>
          <span className="text-border-strong" aria-hidden="true">
            •
          </span>
          <Badge variant={isSample ? 'ember' : 'neutral'}>
            {isSample ? 'Built-in Incident Demo' : 'Local Export'}
          </Badge>
        </div>
      </div>

      {/* Prominent Solar Ember "Catch me up" Action */}
      <Button
        variant="primary"
        size="sm"
        pill
        loading={isAnalyzing}
        disabled={messageCount === 0}
        onClick={onCatchMeUp}
        leftIcon={<Sparkles className="w-3.5 h-3.5 text-warm-highlight" />}
        title="Run deterministic heuristic pass and refresh recap, priorities, and tasks"
      >
        {isAnalyzing ? 'Analyzing...' : 'Catch me up'}
      </Button>
    </div>
  );
};
