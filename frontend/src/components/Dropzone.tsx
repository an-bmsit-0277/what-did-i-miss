import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileCode2,
  PlayCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { MAX_FILE_SIZE_BYTES } from '@missed/engine';
import { Badge, Button, Card } from './ui';

interface DropzoneProps {
  onFileLoaded: (content: string, fileName: string) => void;
  onLoadSample: () => void;
  onError?: (msg: string) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileLoaded,
  onLoadSample,
  onError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [lastLoadedName, setLastLoadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError?.(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 10MB limit. Please upload a smaller chat export.`
      );
      return;
    }
    if (file.size === 0) {
      onError?.('The selected file is empty (0 bytes).');
      return;
    }

    setIsReading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setIsReading(false);
      const content = e.target?.result as string;
      if (content !== undefined) {
        setLastLoadedName(file.name);
        onFileLoaded(content, file.name);
      }
    };
    reader.onerror = () => {
      setIsReading(false);
      onError?.('Unable to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) processFile(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Card variant="featured" padding="lg" spotlight className="text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <Badge variant="local" icon={<ShieldCheck className="w-3 h-3" />}>
            100% On-Device Parsing
          </Badge>
          <Badge variant="neutral" mono>
            Max 10 MB (.txt / .json)
          </Badge>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Import Conversation Export
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
          Drop a WhatsApp, Slack, or timestamped chat export to extract urgent blockers, decisions, deadlines, and assigned tasks with direct source-message links.
        </p>

        {/* Interactive Drag-and-Drop Zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload conversation export file (.txt or .json, up to 10MB)"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`mt-6 relative rounded-[var(--radius-card)] border-2 border-dashed p-7 sm:p-10 text-center cursor-pointer transition-all duration-150 focus-ember ${
            isDragging
              ? 'border-ember bg-ember/10 scale-[1.01]'
              : 'border-border-strong hover:border-ember/60 bg-canvas/80 hover:bg-elevated/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt,.log"
            onChange={handleInputChange}
            className="hidden"
            aria-label="Select conversation export file"
          />

          <div className="mx-auto w-14 h-14 rounded-2xl bg-ember/15 border border-ember/35 text-ember-hover flex items-center justify-center mb-4 shadow-[var(--shadow-ember-subtle)]">
            <UploadCloud className="w-7 h-7" aria-hidden="true" />
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-text-primary">
            {isReading ? (
              'Reading export file...'
            ) : (
              <>
                Drop your <code className="font-mono text-warm-highlight">.txt</code> or{' '}
                <code className="font-mono text-warm-highlight">.json</code> file here, or{' '}
                <span className="text-ember-hover underline">browse files</span>
              </>
            )}
          </h3>
          <p className="text-xs text-text-secondary mt-1.5">
            Supports WhatsApp exports, Slack JSON arrays/envelopes, bracketed timestamps, and colon transcripts up to 10 MB.
          </p>

          {lastLoadedName && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-semantic-local font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Loaded: {lastLoadedName}</span>
            </div>
          )}

          {/* Format Specification Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <Badge
              variant="neutral"
              icon={<FileCode2 className="w-3 h-3 text-semantic-decision" />}
            >
              JSON Array / Envelope / Slack
            </Badge>
            <Badge
              variant="neutral"
              icon={<FileText className="w-3 h-3 text-ember-hover" />}
            >
              [Timestamp] Sender: Message
            </Badge>
            <Badge
              variant="neutral"
              icon={<FileText className="w-3 h-3 text-semantic-local" />}
            >
              WhatsApp .txt Export
            </Badge>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-default" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
            Or evaluate immediately
          </span>
          <div className="h-px flex-1 bg-border-default" />
        </div>

        {/* Instant Demo CTA */}
        <div className="flex flex-col items-center">
          <Button
            variant="primary"
            size="lg"
            pill
            onClick={onLoadSample}
            leftIcon={<PlayCircle className="w-4 h-4 text-warm-highlight" />}
          >
            Load Built-In Incident Demo Conversation
          </Button>
          <p className="text-[11px] text-text-muted mt-2">
            Loads the 14-message “Payment Gateway Migration Cutover” war-room thread with P0 alerts, decisions, and tasks.
          </p>
        </div>
      </Card>
    </div>
  );
};
