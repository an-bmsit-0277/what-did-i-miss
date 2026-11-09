import React, { useState, useRef, useCallback } from 'react';
import {
  defaultRegistry,
  MAX_FILE_SIZE_BYTES,
  type FormatDetectionResult,
  type AdapterParseResult,
} from '@missed/engine';
import {
  Upload,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  X,
  MessageSquare,
  Users,
  Calendar,
  Link as LinkIcon,
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (content: string, fileName: string, result: AdapterParseResult) => void;
  isSyncing?: boolean;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
  isSyncing = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number; content: string } | null>(null);
  const [detection, setDetection] = useState<FormatDetectionResult | null>(null);
  const [parseResult, setParseResult] = useState<AdapterParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setDetection(null);
    setParseResult(null);
    setError(null);
    setIsDragging(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = useCallback((file: File) => {
    setError(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 10MB limit. Please upload a smaller chat export.`);
      return;
    }

    if (file.size === 0) {
      setError('The selected file is empty (0 bytes).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (typeof content !== 'string') return;

      setSelectedFile({
        name: file.name,
        size: file.size,
        content,
      });

      // Live Detection and Parse
      const detected = defaultRegistry.detect(content, {
        fileName: file.name,
        fileSize: file.size,
      });
      setDetection(detected);

      const parsed = defaultRegistry.parse(content, {
        fileName: file.name,
        fileSize: file.size,
      });

      if (!parsed.success) {
        setParseResult(null);
        setError(parsed.error || 'Failed to parse chat export.');
      } else {
        setParseResult(parsed);
      }
    };

    reader.onerror = () => {
      setError('Could not read the uploaded file. Please verify file permissions.');
    };

    reader.readAsText(file);
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleConfirm = () => {
    if (!selectedFile || !parseResult || !parseResult.success) return;
    onConfirmImport(selectedFile.content, selectedFile.name, parseResult);
    handleClose();
  };

  if (!isOpen) return null;

  const conv = parseResult?.conversation;
  const confidencePercent = detection ? Math.round(detection.confidence * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0E0C0A] border border-white/[0.12] shadow-2xl p-6 sm:p-8 space-y-6 z-10 scrollbar-obsidian animate-in zoom-in-95 duration-200">
        {/* Header with amber eyebrow & close button */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1.5">
            <span className="eyebrow-editorial">PLATFORM IMPORT</span>
            <h2 id="import-modal-title" className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-text-primary">
              Import Conversation<span className="text-ember font-sans">.</span>
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Auto-detect and triage exports from WhatsApp, Telegram Desktop, Facebook Messenger, Slack, or plain text.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Close import dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supported Platforms Banner */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span className="text-text-muted uppercase tracking-wider text-[10px]">Supported:</span>
          <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-text-secondary border border-white/[0.06]">
            WhatsApp (.txt, _chat.txt)
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-text-secondary border border-white/[0.06]">
            Telegram Desktop (.json)
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-text-secondary border border-white/[0.06]">
            Messenger (.json, .html)
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-text-secondary border border-white/[0.06]">
            Slack (.json)
          </span>
        </div>

        {/* Dropzone or Preview */}
        {!parseResult?.success ? (
          <div className="space-y-4">
            <div
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center group ${
                isDragging
                  ? 'border-ember bg-ember/5 shadow-[0_0_24px_rgba(255,82,27,0.2)]'
                  : 'border-white/[0.12] hover:border-white/[0.25] bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.json,.html,.htm,.log"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-ember mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">
                Drag and drop your chat export here
              </p>
              <p className="text-xs text-text-muted mb-4">
                or <span className="text-ember underline underline-offset-2">browse files</span> on your computer
              </p>
              <span className="text-[11px] font-mono text-text-muted px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
                Max file size: 10 MB
              </span>
            </div>

            {/* Error Message Callout */}
            {error && (
              <div className="rounded-2xl p-4 bg-red-950/30 border border-red-500/30 space-y-2 text-left">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Import Format Failure</span>
                </div>
                <p className="text-xs text-red-200/90 leading-relaxed font-sans">
                  {error}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Live Detection & Preview Stage */
          <div className="space-y-5">
            {/* Detected Header Box */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ember/15 border border-ember/30 flex items-center justify-center text-ember shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary">
                      {parseResult.formatLabel}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      {confidencePercent}% match
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">
                    {selectedFile?.name} ({(selectedFile ? selectedFile.size / 1024 : 0).toFixed(1)} KB)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetState}
                className="text-[11px] text-text-muted hover:text-text-primary px-3 py-1.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                Change File
              </button>
            </div>

            {/* 4-Stat Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
                <div className="flex items-center gap-1.5 text-text-muted text-[10px] uppercase font-mono tracking-wider">
                  <MessageSquare className="w-3 h-3 text-ember" />
                  <span>Messages</span>
                </div>
                <p className="text-lg font-bold font-mono text-text-primary">
                  {parseResult.messages.length}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
                <div className="flex items-center gap-1.5 text-text-muted text-[10px] uppercase font-mono tracking-wider">
                  <Users className="w-3 h-3 text-ember" />
                  <span>Participants</span>
                </div>
                <p className="text-lg font-bold font-mono text-text-primary">
                  {conv?.participants.length || 0}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
                <div className="flex items-center gap-1.5 text-text-muted text-[10px] uppercase font-mono tracking-wider">
                  <Calendar className="w-3 h-3 text-ember" />
                  <span>Time Span</span>
                </div>
                <p className="text-xs font-mono text-text-primary truncate" title={conv?.dateRange?.start}>
                  {conv?.dateRange?.start ? conv.dateRange.start.split(' ')[0] : 'N/A'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
                <div className="flex items-center gap-1.5 text-text-muted text-[10px] uppercase font-mono tracking-wider">
                  <LinkIcon className="w-3 h-3 text-ember" />
                  <span>Source Links</span>
                </div>
                <p className="text-xs font-mono text-emerald-400">
                  {parseResult.format === 'whatsapp' ? 'wa.me deep link' : 'Stable ref IDs'}
                </p>
              </div>
            </div>

            {/* Participants pills */}
            {conv && conv.participants.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  Detected Participants:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {conv.participants.slice(0, 6).map((name, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-text-secondary"
                    >
                      {name}
                    </span>
                  ))}
                  {conv.participants.length > 6 && (
                    <span className="px-2 py-0.5 rounded-md bg-white/[0.02] text-xs text-text-muted font-mono">
                      +{conv.participants.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* First Messages Snippet Preview */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                Message Preview:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-obsidian">
                {parseResult.messages.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-[#141210] border border-white/[0.06] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-text-primary">{m.sender}</span>
                      <span className="font-mono text-text-muted text-[10px]">{m.timestamp || 'No timestamp'}</span>
                    </div>
                    <p className="text-text-secondary line-clamp-2 leading-relaxed">
                      {m.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl border border-white/[0.12] text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {parseResult?.success && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-ember hover:bg-ember-hover text-white text-xs font-semibold flex items-center gap-2 shadow-[0_2px_16px_rgba(255,82,27,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Confirm & Triage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
