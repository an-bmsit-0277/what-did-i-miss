import { useState, useMemo, useRef } from 'react';
import {
  SAMPLE_MESSAGES,
  MAX_FILE_SIZE_BYTES,
  parseConversation,
  analyzeConversation,
  type ParsedMessage,
  type ActiveTab,
  type ConversationAnalysis,
} from '@missed/engine';
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
import { LandingView } from './components/LandingView';
import {
  Badge,
  Button,
  EngineModeBadge,
  Modal,
  WorkspaceSkeleton,
} from './components/ui';
import {
  Cloud,
  Columns2,
  Compass,
  Flame,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Smartphone,
  Upload,
  X,
} from 'lucide-react';

export default function App() {
  // Primary surface mode: 'workspace' (default catch-up tool) or 'landing' (product overview)
  const [viewMode, setViewMode] = useState<'workspace' | 'landing'>('workspace');

  // Main conversation state - starts with built-in realistic incident sample
  const [messages, setMessages] = useState<ParsedMessage[]>(SAMPLE_MESSAGES);
  const [activeFileName, setActiveFileName] = useState<string>(
    'Payment Gateway Migration Cutover',
  );
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

  // UI & Modal state
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [warning, setWarning] = useState<string | undefined>(undefined);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'split' | 'sidepanel'>('split');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run deterministic heuristic analysis on active conversation
  const analysis: ConversationAnalysis = useMemo(() => {
    void analysisKey;
    return analyzeConversation(messages);
  }, [messages, analysisKey]);

  // Built-in sample analysis for LandingView live preview card
  const sampleAnalysis: ConversationAnalysis = useMemo(() => {
    return analyzeConversation(SAMPLE_MESSAGES);
  }, []);

  // Handle "Catch me up" primary action button
  const handleCatchMeUp = async () => {
    setIsAnalyzing(true);
    setError(undefined);

    // If running inside Chrome Extension environment, query active WhatsApp Web tab
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime?.id) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url && tab.url.includes('web.whatsapp.com') && tab.id) {
          chrome.tabs.sendMessage(
            tab.id,
            { type: 'SCRAPE_WHATSAPP_CHAT' },
            (response: {
              success?: boolean;
              error?: string;
              messages?: ParsedMessage[];
              chatTitle?: string;
            }) => {
              setIsAnalyzing(false);
              if (chrome.runtime.lastError || !response) {
                setWarning(
                  'Could not read from WhatsApp Web. Analyzing active conversation.',
                );
                setAnalysisKey((k) => k + 1);
                return;
              }
              if (!response.success || !response.messages) {
                setError(
                  response.error || 'Failed to read messages from WhatsApp Web.',
                );
                return;
              }
              setMessages(response.messages);
              setActiveFileName(response.chatTitle || 'Active WhatsApp Chat');
              setIsSampleLoaded(false);
              setCompletedTaskIds(new Set());
              setAnalysisKey((k) => k + 1);
            },
          );
          return;
        }
      } catch (err) {
        console.warn('Chrome extension messaging fallback:', err);
      }
    }

    setTimeout(() => {
      setAnalysisKey((k) => k + 1);
      setIsAnalyzing(false);
    }, 220);
  };

  // Load Built-in Sample Conversation
  const handleLoadSample = () => {
    setMessages(SAMPLE_MESSAGES);
    setActiveFileName('Payment Gateway Migration Cutover');
    setIsSampleLoaded(true);
    setError(undefined);
    setWarning(undefined);
    setCompletedTaskIds(new Set());
    setSearchQuery('');
    setSelectedParticipant('all');
    setViewMode('workspace');
    void handleCatchMeUp();
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
    setSearchQuery('');
    setSelectedParticipant('all');
    setViewMode('workspace');
    void handleCatchMeUp();
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
    setSearchQuery('');
    setSelectedParticipant('all');
  };

  // Native File Picker trigger
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(
          `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 10MB limit. Please upload a smaller chat export.`,
        );
        return;
      }
      if (file.size === 0) {
        setError('The selected file is empty (0 bytes).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content !== undefined) {
          handleFileLoaded(content, file.name);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
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
    const isNarrowViewport =
      typeof window !== 'undefined' && window.innerWidth < 1024;
    if (layoutMode === 'sidepanel' || isNarrowViewport) {
      setIsDrawerOpen(true);
    }

    // Also highlight in live WhatsApp Web tab if running in Chrome extension
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime?.id) {
      chrome.tabs
        .query({ active: true, currentWindow: true })
        .then(([tab]: Array<{ id?: number; url?: string }>) => {
          if (tab?.id && tab.url?.includes('web.whatsapp.com')) {
            const finding = analysis.findings.find(
              (f) => f.sourceMessageId === sourceMessageId,
            );
            if (finding) {
              chrome.tabs
                .sendMessage(tab.id, {
                  type: 'HIGHLIGHT_SOURCE_MESSAGE',
                  snippet: finding.snippet,
                })
                .catch(() => {});
            }
          }
        })
        .catch(() => {});
    }
  };

  // Inspect finding from LandingView live preview card directly in Workspace
  const handleInspectFindingFromLanding = (sourceMessageId: string) => {
    if (!isSampleLoaded) {
      setMessages(SAMPLE_MESSAGES);
      setActiveFileName('Payment Gateway Migration Cutover');
      setIsSampleLoaded(true);
    }
    setViewMode('workspace');
    setTimeout(() => {
      handleJumpToMessage(sourceMessageId);
    }, 60);
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
      // Clipboard fallback
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
  const hasActiveFilter =
    searchQuery.trim().length > 0 || selectedParticipant !== 'all';

  return (
    <div className="min-h-screen bg-void text-text-primary flex flex-col font-sans antialiased selection:bg-ember/30 selection:text-warm-highlight">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt,.log"
        onChange={handleNativeFileChange}
        className="hidden"
      />

      {/* =====================================================================
          Top Obsidian Navigation Shell (Sticky Glass Pill Bar)
         ===================================================================== */}
      <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-xl border-b border-border-default">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Left: Brand Identity + Surface Switcher */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode('workspace')}
              className="flex items-center gap-2 text-left group focus-ember rounded-lg cursor-pointer"
            >
              <div className="w-8 h-8 rounded-[var(--radius-icon)] bg-ember/15 border border-ember/40 flex items-center justify-center text-ember-hover group-hover:bg-ember group-hover:text-text-primary transition-colors shadow-[0_0_16px_rgba(255,77,28,0.2)]">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-text-primary">
                    Missed<span className="text-ember-hover">.</span>
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-elevated border border-border-default text-text-muted">
                    v2.0
                  </span>
                </div>
              </div>
            </button>

            {/* Primary Surface Mode Pill Switcher */}
            <nav
              aria-label="Primary view mode"
              className="hidden sm:flex items-center gap-1 bg-surface p-1 rounded-full border border-border-default ml-2"
            >
              <button
                type="button"
                onClick={() => setViewMode('workspace')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer focus-ember ${
                  viewMode === 'workspace'
                    ? 'bg-ember text-text-primary shadow-[0_2px_10px_rgba(255,77,28,0.3)]'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('landing')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer focus-ember ${
                  viewMode === 'landing'
                    ? 'bg-ember text-text-primary shadow-[0_2px_10px_rgba(255,77,28,0.3)]'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Product Overview</span>
              </button>
            </nav>
          </div>

          {/* Right: Layout Mode Controls, Import, Cloud Sync & Privacy */}
          <div className="hidden md:flex items-center gap-2.5">
            {viewMode === 'workspace' && (
              <div
                role="group"
                aria-label="Workspace layout mode"
                className="flex items-center gap-1 bg-surface p-1 rounded-full border border-border-default text-[11px]"
              >
                <button
                  type="button"
                  onClick={() => setLayoutMode('split')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer focus-ember ${
                    layoutMode === 'split'
                      ? 'bg-elevated text-text-primary font-semibold border border-ember/40'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  title="View Catch-Up Workspace alongside full Conversation Timeline"
                >
                  <Columns2 className="w-3 h-3 text-ember-hover" />
                  <span>Companion Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('sidepanel')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer focus-ember ${
                    layoutMode === 'sidepanel'
                      ? 'bg-elevated text-text-primary font-semibold border border-ember/40'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  title="View compact 380px Chrome Extension Side Panel layout"
                >
                  <Smartphone className="w-3 h-3 text-ember-hover" />
                  <span>Side Panel (380px)</span>
                </button>
              </div>
            )}

            <Button
              variant="secondary"
              size="xs"
              pill
              onClick={handleTriggerUpload}
              leftIcon={<Upload className="w-3 h-3 text-ember-hover" />}
            >
              Import
            </Button>

            <button
              type="button"
              onClick={() => setIsCloudModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface hover:bg-elevated text-text-secondary hover:text-text-primary border border-border-default transition-colors cursor-pointer focus-ember"
              title="Cloud Workspace & Account Persistence Status"
            >
              <Cloud className="w-3 h-3 text-amber-highlight" />
              <span>Cloud Sync</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="text-[11px] text-text-secondary hover:text-ember-hover font-medium px-2 py-1 rounded-lg transition-colors cursor-pointer focus-ember"
            >
              Privacy & Info
            </button>
          </div>

          {/* Mobile Compact Controls */}
          <div className="flex md:hidden items-center gap-1.5">
            <Button
              variant="secondary"
              size="xs"
              pill
              onClick={() =>
                setViewMode(viewMode === 'workspace' ? 'landing' : 'workspace')
              }
            >
              {viewMode === 'workspace' ? 'Overview' : 'Workspace'}
            </Button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-surface border border-border-default text-text-secondary hover:text-text-primary focus-ember cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-surface border-b border-border-default px-4 py-3 space-y-2.5">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={viewMode === 'workspace' ? 'primary' : 'secondary'}
                size="xs"
                pill
                onClick={() => {
                  setViewMode('workspace');
                  setIsMobileMenuOpen(false);
                }}
              >
                Catch-Up Workspace
              </Button>
              <Button
                variant={viewMode === 'landing' ? 'primary' : 'secondary'}
                size="xs"
                pill
                onClick={() => {
                  setViewMode('landing');
                  setIsMobileMenuOpen(false);
                }}
              >
                Product Overview
              </Button>
              <Button
                variant="secondary"
                size="xs"
                pill
                onClick={() => {
                  handleTriggerUpload();
                  setIsMobileMenuOpen(false);
                }}
                leftIcon={<Upload className="w-3 h-3" />}
              >
                Import Export
              </Button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border-default text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsCloudModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="text-amber-highlight font-medium"
              >
                Cloud Sync Status
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAboutOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="text-ember-hover font-medium"
              >
                Privacy & Architecture
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Error & Warning Notifications */}
      <ErrorBanner
        error={error}
        warning={warning}
        onDismiss={() => {
          setError(undefined);
          setWarning(undefined);
        }}
      />

      {/* =====================================================================
          Main Content Surface: Product Overview (Landing) OR Catch-Up Workspace
         ===================================================================== */}
      {viewMode === 'landing' ? (
        <main className="flex-1">
          <LandingView
            sampleAnalysis={sampleAnalysis}
            onOpenWorkspace={() => setViewMode('workspace')}
            onLoadSampleAndOpen={handleLoadSample}
            onTriggerUpload={handleTriggerUpload}
            onInspectFindingInWorkspace={handleInspectFindingFromLanding}
            onOpenAbout={() => setIsAboutOpen(true)}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 py-4 sm:py-6 flex items-start justify-center">
          {!hasActiveConversation ? (
            <div className="w-full max-w-lg my-6">
              <Dropzone
                onFileLoaded={handleFileLoaded}
                onLoadSample={handleLoadSample}
                onError={setError}
              />
            </div>
          ) : (
            <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
              {/* 1. Primary Catch-Up Panel (360px–420px Side Panel / Triage Column) */}
              <div className="w-full max-w-[420px] bg-surface rounded-[var(--radius-card-lg)] border border-border-default shadow-[var(--shadow-obsidian-lg)] overflow-hidden flex flex-col flex-shrink-0 border-specular">
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

                {/* Three Summary Counters */}
                <SummaryCounters
                  urgentCount={analysis.stats.urgentCount}
                  taskCount={analysis.stats.actionItemCount}
                  completedTaskCount={completedTaskIds.size}
                  decisionCount={analysis.stats.decisionCount}
                  onSelectTab={setActiveTab}
                />

                {/* Segmented Navigation Tabs (Overview, Tasks, Important) */}
                <NavigationTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  taskCount={Math.max(0, allTasks.length - completedTaskIds.size)}
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
                <div className="max-h-[560px] overflow-y-auto bg-canvas/50 scrollbar-obsidian">
                  {isAnalyzing ? (
                    <WorkspaceSkeleton />
                  ) : (
                    <>
                      {activeTab === 'overview' && (
                        <OverviewView
                          analysis={analysis}
                          filteredFindings={
                            hasActiveFilter ? filteredFindings : undefined
                          }
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
                    </>
                  )}
                </div>

                {/* Compact Extension / Workspace Footer */}
                <div className="px-3.5 py-2.5 bg-elevated/90 border-t border-border-default flex items-center justify-between text-[11px] text-text-secondary">
                  <span className="flex items-center gap-1.5 font-mono text-[10px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-semantic-local shrink-0" />
                    100% on-device heuristic engine
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLayoutMode(layoutMode === 'split' ? 'sidepanel' : 'split')
                    }
                    className="text-ember-hover hover:text-warm-highlight font-semibold hidden lg:inline cursor-pointer focus-ember rounded px-1"
                  >
                    {layoutMode === 'split' ? 'Hide timeline' : 'Show timeline'}
                  </button>
                </div>
              </div>

              {/* 2. Companion Conversation Timeline Preview (Visible in Split View on desktop) */}
              {layoutMode === 'split' && (
                <div className="hidden lg:block flex-1 max-w-2xl h-[740px] w-full">
                  <TranscriptViewer
                    messages={messages}
                    findings={analysis.findings}
                    highlightedMessageId={highlightedMessageId}
                    searchQuery={searchQuery}
                    selectedParticipant={selectedParticipant}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* Source Message Context Drawer (Used in Side Panel mode & narrow viewports) */}
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

      {/* Honest Cloud Persistence Status Modal (Phase 4 Preview) */}
      <Modal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        title="Cloud Sync & Account Persistence"
        subtitle="Architecture Status & Privacy Boundary"
        footer={
          <Button
            variant="primary"
            size="sm"
            pill
            onClick={() => setIsCloudModalOpen(false)}
          >
            Continue in Local Mode
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <EngineModeBadge />
            <Badge variant="decision">Phase 2 API Ready</Badge>
          </div>

          <div className="rounded-2xl bg-elevated border border-border-default p-3.5 space-y-1.5">
            <h4 className="text-xs font-bold text-text-primary">
              Local Deterministic Mode is Active Now
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Your conversations, parsed messages, and heuristic recaps are currently processed and held 100% locally in browser memory. Nothing is uploaded automatically.
            </p>
          </div>

          <div className="rounded-2xl bg-elevated/60 border border-border-default p-3.5 space-y-1.5">
            <h4 className="text-xs font-bold text-text-primary">
              Opt-In Cloud Persistence (Connecting in Phase 4)
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              The backend Express + PostgreSQL + Drizzle ORM service (<code className="font-mono text-text-primary">/api/v1/conversations</code>) and Supabase JWT verification are implemented in <code className="font-mono text-text-primary">server/</code>. Frontend sign-in, saved conversation history, and cloud task syncing connect in Phase 4.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
