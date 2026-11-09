import React, { useState } from 'react';
import { ExternalLink, Check, Copy, MessageCircle } from 'lucide-react';

interface SourceLinkAffordanceProps {
  sourceRef?: string;
  className?: string;
  compact?: boolean;
}

export const SourceLinkAffordance: React.FC<SourceLinkAffordanceProps> = ({
  sourceRef,
  className = '',
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!sourceRef) return null;

  const isWhatsApp = sourceRef.startsWith('https://wa.me');

  if (isWhatsApp) {
    return (
      <a
        href={sourceRef}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/25 ${className}`}
        title="Open message in WhatsApp"
      >
        <MessageCircle className="w-3 h-3 text-emerald-400" />
        <span>{compact ? 'wa.me' : 'Open in WhatsApp'}</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
      </a>
    );
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sourceRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Clean label presentation (e.g. ref:tg:101 -> tg:101 or ref:fb:171000... -> fb:171000...)
  const displayLabel = sourceRef.startsWith('ref:') ? sourceRef.slice(4) : sourceRef;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 font-mono text-[10px] text-text-muted hover:text-text-primary bg-white/[0.04] hover:bg-white/[0.08] px-2 py-0.5 rounded-md border border-white/[0.08] transition-colors cursor-pointer group ${className}`}
      title={`Trace reference ID: ${sourceRef}. Click to copy.`}
    >
      <span className="text-ember font-semibold">#</span>
      <span>{displayLabel}</span>
      {copied ? (
        <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-2.5 h-2.5 text-text-muted group-hover:text-text-secondary opacity-60 shrink-0" />
      )}
    </button>
  );
};

