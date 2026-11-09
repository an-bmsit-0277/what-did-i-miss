import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  MoreVertical,
  Upload,
  PlayCircle,
  Copy,
  Check,
  Trash2,
  Info,
  Flame,
} from 'lucide-react';
import { EngineModeBadge } from './ui';

interface MissedHeaderProps {
  onRefresh: () => void;
  onLoadSample: () => void;
  onUploadClick: () => void;
  onCopySummary: () => void;
  onReset: () => void;
  onOpenAbout: () => void;
  copied: boolean;
  hasActiveConversation: boolean;
  isAnalyzing: boolean;
}

export const MissedHeader: React.FC<MissedHeaderProps> = ({
  onRefresh,
  onLoadSample,
  onUploadClick,
  onCopySummary,
  onReset,
  onOpenAbout,
  copied,
  hasActiveConversation,
  isAnalyzing,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="bg-surface/95 backdrop-blur-xs border-b border-border-default px-4 py-3 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Deterministic Engine Indicator */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[var(--radius-icon)] bg-ember/15 border border-ember/40 flex items-center justify-center text-ember-hover shadow-[var(--shadow-ember-subtle)]">
            <Flame className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <span className="text-base font-bold tracking-tight text-text-primary flex items-center">
            Missed<span className="text-ember">.</span>
          </span>
        </div>

        <EngineModeBadge />
      </div>

      {/* Right Actions: Quick Copy + Refresh + Menu */}
      <div className="flex items-center gap-1">
        {hasActiveConversation && (
          <button
            type="button"
            onClick={onCopySummary}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-elevated hover:bg-input text-text-secondary hover:text-text-primary border border-border-default transition-colors focus-ember cursor-pointer"
            title="Copy Markdown summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-semantic-local" />
                <span className="text-semantic-local font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Export MD</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onRefresh}
          disabled={!hasActiveConversation || isAnalyzing}
          className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors focus-ember cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
            isAnalyzing ? 'animate-spin text-ember-hover' : ''
          }`}
          title="Re-run deterministic analysis"
          aria-label="Re-run deterministic analysis"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Actions Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors focus-ember cursor-pointer"
            title="Workspace actions"
            aria-label="Workspace actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Workspace actions"
              className="absolute right-0 mt-1.5 w-52 bg-elevated rounded-2xl shadow-[var(--shadow-elevated)] border border-border-strong py-1.5 z-40 text-xs text-text-secondary"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLoadSample();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-input hover:text-text-primary flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5 text-ember-hover" />
                <span>Load Incident Demo Chat</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onUploadClick();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-input hover:text-text-primary flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-text-secondary" />
                <span>Import Export (.txt / .json)</span>
              </button>

              {hasActiveConversation && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onCopySummary();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-input hover:text-text-primary flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-semantic-local" />
                        <span className="text-semantic-local font-semibold">
                          Summary Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-text-secondary" />
                        <span>Copy Markdown Recap</span>
                      </>
                    )}
                  </button>

                  <div className="my-1 border-t border-border-default" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onReset();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-semantic-urgent/15 text-semantic-urgent flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Active Thread</span>
                  </button>
                </>
              )}

              <div className="my-1 border-t border-border-default" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAbout();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-input hover:text-text-primary text-text-muted flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Architecture & Privacy</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
