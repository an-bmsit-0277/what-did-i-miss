import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, FileCode2, PlayCircle, ShieldCheck } from 'lucide-react';

interface DropzoneProps {
  onFileLoaded: (content: string, fileName: string) => void;
  onLoadSample: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileLoaded, onLoadSample }) => {
  const [isDragging, setIsDragging] = useState(false);
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
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content !== undefined) {
        onFileLoaded(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Catch Up on Unread Conversations
        </h2>
        <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
          Instantly extract critical blockers, decisions, deadlines, and assigned action items from your chat logs. 100% on-device and private.
        </p>
      </div>

      {/* Main Drag-and-Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.txt,.log"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-semibold text-slate-800">
          Drop your chat export file here, or <span className="text-indigo-600 hover:underline">browse</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Supports <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">.txt</code> (Slack, WhatsApp, transcripts) and <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">.json</code> exports
        </p>

        {/* Supported Format Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
            <FileCode2 className="w-3.5 h-3.5 text-indigo-500" />
            JSON Array or Object
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            Bracketed [Timestamp] Sender
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            WhatsApp Export
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Never Leaves Browser
          </span>
        </div>
      </div>

      {/* Or Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 px-3 text-slate-500 font-semibold tracking-wider">
            Or test immediately
          </span>
        </div>
      </div>

      {/* Instant Demo CTA */}
      <div className="text-center">
        <button
          type="button"
          onClick={onLoadSample}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700 transition-all transform hover:-translate-y-0.5"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Load Realistic Incident Demo Conversation</span>
        </button>
        <p className="text-xs text-slate-500 mt-2">
          Experience the full dashboard right away with 20 realistic triage messages, blockers, decisions, and tasks.
        </p>
      </div>
    </div>
  );
};

