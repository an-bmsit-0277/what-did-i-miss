import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Search,
  X,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// 1. Keyboard-Accessible Segmented Tabs
// -----------------------------------------------------------------------------
export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  badgeVariant?: 'default' | 'urgent' | 'amber';
}

export interface SegmentedTabsProps<T extends string> {
  tabs: ReadonlyArray<TabItem<T>>;
  activeTab: T;
  onChange: (tab: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
}: SegmentedTabsProps<T>) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (tabs.length === 0) return;
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const targetTab = tabs[nextIndex];
      if (targetTab) {
        onChange(targetTab.id);
      }
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center p-1 rounded-full bg-canvas border border-border-default gap-1 select-none ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isSelected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-150 focus-ember cursor-pointer whitespace-nowrap ${
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
            } ${
              isSelected
                ? 'bg-elevated text-text-primary border border-ember/40 shadow-[0_2px_12px_rgba(255,82,27,0.18)]'
                : 'text-text-secondary hover:text-text-primary border border-transparent'
            }`}
          >
            {tab.icon && <span className="shrink-0" aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && tab.count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isSelected
                    ? tab.badgeVariant === 'urgent'
                      ? 'bg-semantic-urgent/20 text-[#FF7A5C]'
                      : 'bg-ember/20 text-warm-highlight'
                    : 'bg-input text-text-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. Empty State Primitive
// -----------------------------------------------------------------------------
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`rounded-[var(--radius-card)] bg-canvas/70 border border-border-default p-6 text-center flex flex-col items-center justify-center ${className}`}
    >
      {icon && (
        <div className="w-10 h-10 rounded-[var(--radius-icon)] bg-elevated border border-border-strong text-ember-hover flex items-center justify-center mb-3">
          {icon}
        </div>
      )}
      <h4 className="text-xs sm:text-sm font-semibold text-text-primary">{title}</h4>
      <p className="text-xs text-text-secondary mt-1 max-w-xs leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 3. Skeleton Loading Primitives
// -----------------------------------------------------------------------------
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-lg bg-elevated border border-border-subtle ${className}`}
  />
);

export const WorkspaceSkeleton: React.FC = () => (
  <div role="status" aria-label="Analyzing conversation" className="p-4 space-y-3">
    <SkeletonBlock className="h-20 w-full rounded-2xl" />
    <SkeletonBlock className="h-24 w-full rounded-2xl" />
    <SkeletonBlock className="h-16 w-full rounded-2xl" />
    <span className="sr-only">Analyzing conversation messages...</span>
  </div>
);

// -----------------------------------------------------------------------------
// 4. Accessible Search Input
// -----------------------------------------------------------------------------
export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  label = 'Filter findings and messages',
  placeholder = 'Search messages, senders, tasks...',
  className = '',
  id,
  ...rest
}) => {
  const inputId = id ?? 'workspace-search-input';
  return (
    <div className={`relative flex-1 ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-7 py-1.5 text-xs rounded-full bg-input text-text-primary border border-border-default placeholder:text-text-muted focus:outline-none focus:border-ember-hover focus:ring-1 focus:ring-ember-hover transition-colors"
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search filter"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded-full focus-ember cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 5. Accessible Toggle Switch
// -----------------------------------------------------------------------------
export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="text-xs font-semibold text-text-primary block">{label}</span>
        {description && (
          <span className="text-[11px] text-text-secondary block mt-0.5">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors duration-150 focus-ember ${
          checked
            ? 'bg-ember border-amber-highlight/50'
            : 'bg-input border-border-strong'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-text-primary shadow-xs transform transition-transform duration-150 mt-0.5 ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};

// -----------------------------------------------------------------------------
// 6. Status Banner (Error / Warning / Info / Success)
// -----------------------------------------------------------------------------
export interface StatusBannerProps {
  tone: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  tone,
  title,
  message,
  onDismiss,
}) => {
  const toneConfig = {
    error: {
      container: 'bg-semantic-urgent/12 border-semantic-urgent/40 text-[#FCA5A5]',
      icon: <AlertCircle className="w-4 h-4 text-semantic-urgent shrink-0" />,
      defaultTitle: 'Import Error',
    },
    warning: {
      container: 'bg-semantic-task/12 border-semantic-task/40 text-[#FDE68A]',
      icon: <AlertTriangle className="w-4 h-4 text-semantic-task shrink-0" />,
      defaultTitle: 'Format Notice',
    },
    info: {
      container: 'bg-semantic-decision/12 border-semantic-decision/35 text-[#BAE6FD]',
      icon: <Info className="w-4 h-4 text-semantic-decision shrink-0" />,
      defaultTitle: 'Info',
    },
    success: {
      container: 'bg-semantic-local/12 border-semantic-local/35 text-[#A7F3D0]',
      icon: <CheckCircle2 className="w-4 h-4 text-semantic-local shrink-0" />,
      defaultTitle: 'Ready',
    },
  }[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${toneConfig.container}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 text-xs">
        {toneConfig.icon}
        <div className="min-w-0">
          <strong className="font-semibold text-text-primary mr-1.5">
            {title ?? toneConfig.defaultTitle}:
          </strong>
          <span>{message}</span>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-void/40 transition-colors focus-ember cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
