import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidthClass = 'max-w-lg',
}) => {
  const titleId = useId();
  const subtitleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-void/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        className={`w-full ${maxWidthClass} bg-surface text-text-primary rounded-t-[var(--radius-panel)] sm:rounded-[var(--radius-panel)] border border-border-strong shadow-[var(--shadow-elevated)] overflow-hidden flex flex-col max-h-[88vh]`}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-elevated/70 border-b border-border-default flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="w-8 h-8 rounded-[var(--radius-icon)] bg-ember/15 border border-ember/35 text-ember-hover flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 id={titleId} className="text-sm font-bold text-text-primary tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p id={subtitleId} className="text-xs text-text-secondary mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-input transition-colors focus-ember cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto scrollbar-obsidian flex-1">{children}</div>

        {/* Optional Modal Footer */}
        {footer && (
          <div className="px-5 py-3.5 bg-elevated/50 border-t border-border-default flex items-center justify-between gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
