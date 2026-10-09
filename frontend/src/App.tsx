import { useState, useMemo, useRef } from 'react';
import type { ParsedMessage, ActiveTab, ConversationAnalysis } from './types';
import { SAMPLE_MESSAGES } from './data/sampleConversation';
import { parseConversation } from './parsers';
import { analyzeConversation } from './heuristics/analyzer';
import { MissedHeader } from './components/MissedHeader';
import { ConversationBar } from './components/ConversationBar';
import { SummaryCounters } from './components/SummaryCounters';
import { NavigationTabs } from './components/NavigationTabs';
import { CompactFilter } from './components/CompactFilter';
import { OverviewView } from './components/OverviewView';
import { TasksView } from './components/TasksView';
import { ImportantView } from './components/ImportantView';
import { TranscriptViewer } from './components/TranscriptViewer';
import { SourceDrawer } from './components/SourceDrawer';
import { AboutModal } from './components/AboutModal';
import { ErrorBanner } from './components/ErrorBanner';
import { Dropzone } from './components/Dropzone';
import { Columns2, Smartphone, ShieldCheck } from 'lucide-react';

export default function App() {
  // Main conversation state - starts with built-in realistic incident sample
  const [messages, setMessages] = useState<ParsedMessage[]>(SAMPLE_MESSAGES);
  const [activeFileName, setActiveFileName] = useState<string>('Payment Gateway Migration Cutover');
  const [isSampleLoaded, setIsSampleLoaded] = useState<boolean>(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedParticipant, setSelectedParticipant] = useState<string>('all');

  // Interactive task completion (session-persisted state)
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Deep-link source target message ID & inspection drawer
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Analysis / Loading state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisKey, setAnalysisKey] = useState<number>(0);

  // UI state
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [warning, setWarning] = useState<string | undefined>(undefined);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'split' | 'sidepanel'>('split');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run deterministic heuristic analysis
  const analysis: ConversationAnalysis = useMemo(() => {
    // analysisKey dependency ensures manual "Catch me up" re-evaluation triggers
    void analysisKey;
    return analyzeConversation(messages);
  }, [messages, analysisKey]);

  // Handle "Catch me up" primary action button
  const handleCatchMeUp = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysisKey((k) => k + 1);
      setIsAnalyzing(false);
    }, 250);
  };

  // Load Built-in Sample Conversation
  const handleLoadSample = () => {
    setMessages(SAMPLE_MESSAGES);
    setActiveFileName('Payment Gateway Migration Cutover');
    setIsSampleLoaded(true);
    setError(undefined);
    setWarning(undefined);
    setCompletedTaskIds(new Set());
    handleCatchMeUp();
  };

  // Load User Export File
  const handleFileLoaded = (content: string, fileName: string) => {
    setError(undefined);
    setWarning(undefined);

    const result = parseConversation(content, fileName);
    if (!result.success) {
      setError(result.error || 'Failed to parse conversation file.');
      return;
    }

    if (result.warning) {
      setWarning(result.warning);
    }

    setMessages(result.messages);
    setActiveFileName(fileName);
    setIsSampleLoaded(false);
    setCompletedTaskIds(new Set());
    setHighlightedMessageId(null);
    handleCatchMeUp();
  };

  // Reset conversation
  const handleReset = () => {
    setMessages([]);
    setActiveFileName('');
    setIsSampleLoaded(false);
    setCompletedTaskIds(new Set());
    setError(undefined);
    setWarning(undefined);
    setHighlightedMessageId(null);
  };

  // Native File Picker trigger
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content !== undefined) {
          handleFileLoaded(content, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  // Toggle task completion checkbox
  const handleToggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Deep-link jump to source message
  const handleJumpToMessage = (sourceMessageId: string) => {
    setHighlightedMessageId(sourceMessageId);
    // In sidepanel mode, open the context drawer
    if (layoutMode === 'sidepanel') {
      setIsDrawerOpen(true);
    }
  };

  // Copy Executive Summary to Clipboard
  const handleCopySummary = async () => {
    const { recap, findings } = analysis;
    let md = `# Catch-Up Summary: ${activeFileName}\n\n`;
    recap.summaryBullets.forEach((b) => {
      md += `- ${b}\n`;
    });

    const tasks = findings.filter((f) => f.category === 'action_item');
    if (tasks.length > 0) {
      md += `\n## Action Items\n`;
      tasks.forEach((t) => {
        const checked = completedTaskIds.has(t.id) ? '[x]' : '[ ]';
        const assignee = t.assignee ? ` (@${t.assignee})` : '';
        md += `- ${checked} ${t.snippet}${assignee}\n`;
      });
    }

    const decisions = findings.filter((f) => f.category === 'decision');
    if (decisions.length > 0) {
      md += `\n## Decisions\n`;
      decisions.forEach((d) => {
        md += `- ${d.snippet}\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Filtered findings based on search query & participant
  const filteredFindings = useMemo(() => {
    return analysis.findings.filter((item) => {
      if (selectedParticipant !== 'all' && item.sender !== selectedParticipant) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inSnippet = item.snippet.toLowerCase().includes(q);
        const inTitle = item.title.toLowerCase().includes(q);
        const inSender = item.sender.toLowerCase().includes(q);
        const inAssignee = item.assignee?.toLowerCase().includes(q) ?? false;
        return inSnippet || inTitle || inSender || inAssignee;
      }
      return true;
    });
  }, [analysis.findings, searchQuery, selectedParticipant]);

  const allTasks = useMemo(() => {
    return filteredFindings.filter((f) => f.category === 'action_item');
  }, [filteredFindings]);

  const hasActiveConversation = messages.length > 0;

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans select-none antialiased">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt,.log"
        onChange={handleNativeFileChange}
        className="hidden"
      />

      {/* Top Preview Control Bar for Desktop */}
      <div className="bg-slate-900 text-slate-300 px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-tight">Missed.</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 hidden sm:inline">
            Chrome Extension Companion for WhatsApp Web Preview
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="hidden md:flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => setLayoutMode('sidepanel')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                layoutMode === 'sidepanel'
                  ? 'bg-emerald-600 text-white font-medium shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="View exact 380px Chrome Extension Side Panel in isolation"
            >
              <Smartphone className="w-3 h-3" />
              <span>Side Panel (380px)</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                layoutMode === 'split'
                  ? 'bg-emerald-600 text-white font-medium shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="View Side Panel alongside WhatsApp Web Chat Transcript"
            >
              <Columns2 className="w-3 h-3" />
              <span>Companion Split View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium"
          >
            Privacy & Info
          </button>
        </div>
      </div>

      {/* Error & Warning Notifications */}
      <ErrorBanner
        error={error}
        warning={warning}
        onDismiss={() => {
          setError(undefined);
          setWarning(undefined);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-6 flex items-start justify-center">
        {!hasActiveConversation ? (
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-md p-6 text-center my-8">
            <Dropzone
              onFileLoaded={handleFileLoaded}
              onLoadSample={handleLoadSample}
            />
          </div>
        ) : (
          <div className="w-full flex items-start justify-center gap-6">
            {/* 1. Chrome Extension Side Panel Container (approx 360–400px wide) */}
            <div className="w-full max-w-[400px] bg-white rounded-2xl border border-slate-200/90 shadow-lg overflow-hidden flex flex-col flex-shrink-0 transition-all">
              {/* Header */}
              <MissedHeader
                onRefresh={handleCatchMeUp}
                onLoadSample={handleLoadSample}
                onUploadClick={handleTriggerUpload}
                onCopySummary={handleCopySummary}
                onReset={handleReset}
                onOpenAbout={() => setIsAboutOpen(true)}
                copied={copied}
                hasActiveConversation={hasActiveConversation}
                isAnalyzing={isAnalyzing}
              />

              {/* Conversation Selector / Header with "Catch me up" Button */}
              <ConversationBar
                title={activeFileName}
                messageCount={messages.length}
                isSample={isSampleLoaded}
                isAnalyzing={isAnalyzing}
                onCatchMeUp={handleCatchMeUp}
              />

              {/* Three Small Summary Counters */}
              <SummaryCounters
                urgentCount={analysis.stats.urgentCount}
                taskCount={analysis.stats.actionItemCount}
                completedTaskCount={completedTaskIds.size}
                decisionCount={analysis.stats.decisionCount}
                onSelectTab={setActiveTab}
              />

              {/* Navigation Tabs (Overview, Tasks, Important) */}
              <NavigationTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                taskCount={allTasks.length - completedTaskIds.size}
                importantCount={
                  analysis.stats.urgentCount + analysis.stats.decisionCount
                }
              />

              {/* Compact Search & Participant Filters */}
              <CompactFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedParticipant={selectedParticipant}
                onParticipantChange={setSelectedParticipant}
                participants={analysis.recap.participants}
              />

              {/* Tab Views */}
              <div className="max-h-[560px] overflow-y-auto bg-slate-50/40 scrollbar-thin">
                {activeTab === 'overview' && (
                  <OverviewView
                    analysis={analysis}
                    completedTaskIds={completedTaskIds}
                    onToggleTask={handleToggleTask}
                    onJumpToMessage={handleJumpToMessage}
                    onViewAllTasks={() => setActiveTab('tasks')}
                    onViewAllImportant={() => setActiveTab('important')}
                  />
                )}

                {activeTab === 'tasks' && (
                  <TasksView
                    tasks={allTasks}
                    completedTaskIds={completedTaskIds}
                    onToggleTask={handleToggleTask}
                    onJumpToMessage={handleJumpToMessage}
                  />
                )}

                {activeTab === 'important' && (
                  <ImportantView
                    findings={filteredFindings}
                    onJumpToMessage={handleJumpToMessage}
                  />
                )}
              </div>

              {/* Compact Extension Footer */}
              <div className="px-3 py-2 bg-white border-t border-slate-150 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  100% on-device heuristic analysis
                </span>
                <button
                  type="button"
                  onClick={() => setLayoutMode(layoutMode === 'split' ? 'sidepanel' : 'split')}
                  className="text-emerald-700 hover:text-emerald-800 font-medium md:inline hidden"
                >
                  {layoutMode === 'split' ? 'Hide chat' : 'View chat'}
                </button>
              </div>
            </div>

            {/* 2. Companion WhatsApp Chat Transcript Preview (Visible in Split View on desktop) */}
            {layoutMode === 'split' && (
              <div className="hidden lg:block flex-1 max-w-2xl h-[720px]">
                <TranscriptViewer
                  messages={messages}
                  highlightedMessageId={highlightedMessageId}
                  searchQuery={searchQuery}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Source Message Context Drawer (Available in Side Panel mode) */}
      <SourceDrawer
        isOpen={isDrawerOpen}
        sourceMessageId={highlightedMessageId}
        messages={messages}
        onClose={() => setIsDrawerOpen(false)}
        onOpenFullTranscript={() => setLayoutMode('split')}
      />

      {/* About & Privacy Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
