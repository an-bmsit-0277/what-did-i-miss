import React from 'react';
import {
  AlertTriangle,
  AtSign,
  CheckSquare,
  Clock,
  Cpu,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import type { AnalyzerType, FindingCategory, UrgencyLevel } from '@missed/engine';

export type BadgeVariant =
  | 'urgent'
  | 'decision'
  | 'action_item'
  | 'deadline'
  | 'mention'
  | 'local'
  | 'deterministic'
  | 'ai'
  | 'ember'
  | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  mono?: boolean;
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  urgent:
    'bg-semantic-urgent/14 text-[#FF7A5C] border-semantic-urgent/35',
  decision:
    'bg-semantic-decision/14 text-[#7DD3FC] border-semantic-decision/35',
  action_item:
    'bg-semantic-task/14 text-[#FCD34D] border-semantic-task/35',
  deadline:
    'bg-semantic-deadline/14 text-[#D8B4FE] border-semantic-deadline/35',
  mention:
    'bg-semantic-mention/14 text-[#93C5FD] border-semantic-mention/35',
  local:
    'bg-semantic-local/14 text-[#34D399] border-semantic-local/35',
  deterministic:
    'bg-input text-text-secondary border-border-strong',
  ai:
    'bg-semantic-ai/14 text-[#FDBA74] border-semantic-ai/35',
  ember:
    'bg-ember/16 text-warm-highlight border-ember/40',
  neutral:
    'bg-input text-text-secondary border-border-default',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon,
  mono = false,
  className = '',
  children,
  ...rest
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border leading-snug ${
        mono ? 'font-mono' : ''
      } ${BADGE_STYLES[variant]} ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0 inline-flex" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: FindingCategory; className?: string }> = ({
  category,
  className,
}) => {
  switch (category) {
    case 'urgent':
      return (
        <Badge
          variant="urgent"
          icon={<AlertTriangle className="w-2.5 h-2.5" />}
          className={className}
        >
          Urgent Alert
        </Badge>
      );
    case 'decision':
      return (
        <Badge
          variant="decision"
          icon={<Target className="w-2.5 h-2.5" />}
          className={className}
        >
          Decision
        </Badge>
      );
    case 'action_item':
      return (
        <Badge
          variant="action_item"
          icon={<CheckSquare className="w-2.5 h-2.5" />}
          className={className}
        >
          Action Item
        </Badge>
      );
    case 'deadline':
      return (
        <Badge
          variant="deadline"
          icon={<Clock className="w-2.5 h-2.5" />}
          className={className}
        >
          Deadline
        </Badge>
      );
    case 'mention':
      return (
        <Badge
          variant="mention"
          icon={<AtSign className="w-2.5 h-2.5" />}
          className={className}
        >
          Mention
        </Badge>
      );
  }
};

export const PriorityBadge: React.FC<{ urgency: UrgencyLevel; className?: string }> = ({
  urgency,
  className,
}) => {
  if (urgency === 'high') {
    return (
      <Badge variant="urgent" mono className={`uppercase ${className ?? ''}`}>
        P0 • High
      </Badge>
    );
  }
  if (urgency === 'medium') {
    return (
      <Badge variant="action_item" mono className={`uppercase ${className ?? ''}`}>
        P1 • Med
      </Badge>
    );
  }
  return (
    <Badge variant="neutral" mono className={`uppercase ${className ?? ''}`}>
      P2 • Low
    </Badge>
  );
};

export const AnalyzerBadge: React.FC<{ analyzer?: AnalyzerType; className?: string }> = ({
  analyzer = 'deterministic',
  className,
}) => {
  if (analyzer === 'ai') {
    return (
      <Badge
        variant="ai"
        icon={<Sparkles className="w-2.5 h-2.5" />}
        className={className}
      >
        Opt-In AI
      </Badge>
    );
  }
  return (
    <Badge
      variant="local"
      icon={<ShieldCheck className="w-2.5 h-2.5" />}
      title="Extracted deterministically on-device via @missed/engine rule heuristics"
      className={className}
    >
      Deterministic Rule Engine
    </Badge>
  );
};

export const EngineModeBadge: React.FC<{ className?: string }> = ({ className }) => (
  <Badge
    variant="deterministic"
    icon={<Cpu className="w-2.5 h-2.5 text-ember-hover" />}
    mono
    className={className}
  >
    On-Device Heuristics
  </Badge>
);
