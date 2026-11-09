import { useState, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  SAMPLE_MESSAGES,
  MAX_FILE_SIZE_BYTES,
  parseConversation,
  analyzeConversation,
  type ParsedMessage,
  type ActiveTab,
  type ConversationAnalysis,
  type AdapterParseResult,
} from '@missed/engine';
import { MissedHeader } from '../components/MissedHeader';
import { ConversationBar } from '../components/ConversationBar';
import { SummaryCounters } from '../components/SummaryCounters';
import { NavigationTabs } from '../components/NavigationTabs';
import { CompactFilter } from '../components/CompactFilter';
import { OverviewView } from '../components/OverviewView';
import { TasksView } from '../components/TasksView';
import { ImportantView } from '../components/ImportantView';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { SourceDrawer } from '../components/SourceDrawer';
import { AboutModal } from '../components/AboutModal';
import { ErrorBanner } from '../components/ErrorBanner';
import { Dropzone } from '../components/Dropzone';
import { ImportModal } from '../components/ImportModal';
import { Badge, Button, WorkspaceSkeleton } from '../components/ui';
import {
  Flame,
  Columns2,
  Smartphone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  User,
  Home,
} from 'lucide-react';

export const DemoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialHighlight = searchParams.get('highlight');

  // Main conversation state - starts with built-in realistic incident sample
  const [messages, setMessages] = useState<ParsedMessage[]>(SAMPLE_MESSAGES);
  const [activeFileName, setActiveFileName] = useState<string>(
    'Payment Gateway Migration Cutover'
  );
  const [isSampleLoaded, setIsSampleLoaded] = useState<boolean>(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedParticipant, setSelectedParticipant] = useState<string>('all');

  // Interactive task completion (purely session-persisted local state)
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Deep-link source target message ID & inspection drawer
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(
    initialHighlight
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(() => {
    return Boolean(
      initialHighlight &&
        typeof window !== 'undefined' &&
        window.innerWidth < 1024
    );
  });

  // Analysis / Loading state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisKey, setAnalysisKey] = useState<number>(0);

  // UI state
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [warning, setWarning] = useState<string | undefined>(undefined);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'split' | 'sidepanel'>('split');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run deterministic heuristic analysis locally
  const analysis: ConversationAnalysis = useMemo(() => {
    void analysisKey;
    return analyzeConversation(messages);
  }, [messages, analysisKey]);

  // Handle "Catch me up" primary action button
  const handleCatchMeUp = () => {
    setIsAnalyzing(true);
    setError(undefined);
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
    handleCatchMeUp();
  };

  // Handle Confirmed Multi-Platform Import from ImportModal
  const handleConfirmImport = (
    _content: string,
    fileName: string,
    result: AdapterParseResult
  ) => {
    setError(undefined);
    setWarning(undefined);

    if (!result.success || result.messages.length === 0) {
      setError(result.error || 'Failed to parse conversation file.');
      return;
    }

    if (result.warning) {
      setWarning(result.warning);
    }

    const title = result.conversation?.title || fileName.replace(/\.[^/.]+$/, '');
    setMessages(result.messages);
    setActiveFileName(title);
    setIsSampleLoaded(false);
    setCompletedTaskIds(new Set());
    setHighlightedMessageId(null);
    setSearchQuery('');
    setSelectedParticipant('all');
    handleCatchMeUp();
  };

  // Load User Export File locally into browser memory
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
    setSearchQuery('');
    setSelectedParticipant('all');
  };

  const handleTriggerUpload = () => {
    setIsImportModalOpen(true);
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(
          `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 10MB limit. Please upload a smaller chat export.`
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

  const handleJumpToMessage = (sourceMessageId: string) => {
    setHighlightedMessageId(sourceMessageId);
    const isNarrowViewport =
      typeof window !== 'undefined' && window.innerWidth < 1024;
    if (layoutMode === 'sidepanel' || isNarrowViewport) {
      setIsDrawerOpen(true);
    }
  };

  const handleCopySummary = async () => {
    const { recap, findings } = analysis;
    let md = `# Catch-Up Summary: ${activeFileName} (Demo)\n\n`;
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt,.log"
        onChange={handleNativeFileChange}
        className="hidden"
      />

      {/* =====================================================================
          Top Guest Demo Notice Banner
         ===================================================================== */}
      <div className="bg-canvas border-b border-border-default px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="ember" icon={<Sparkles className="w-3 h-3 text-amber-highlight" />}>
            Guest Demo Mode
          </Badge>
          <span className="text-text-secondary text-[11px] hidden sm:inline">
            Local browser memory • Zero cloud writes • Free exploration
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/signup">
            <Button
              variant="primary"
              size="xs"
              pill
              rightIcon={<ArrowRight className="w-3 h-3" />}
            >
              Sign Up to Save to Cloud
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="xs" pill leftIcon={<User className="w-3 h-3 text-ember-hover" />}>
              Log In
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur-xl border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 focus-ember rounded-lg group">
              <div className="w-8 h-8 rounded-[var(--radius-icon)] bg-ember/15 border border-ember/40 flex items-center justify-center text-ember-hover group-hover:bg-ember group-hover:text-text-primary transition-colors">
                <Flame className="w-4 h-4" />
              </div>
              <span className="font-serif font-semibold text-base tracking-tight text-text-primary">
                Missed<span className="text-ember-hover">.</span> <span className="font-sans text-xs text-text-muted font-normal ml-1">Demo</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Split vs Side Panel Layout Switcher */}
            <div
              role="group"
              aria-label="Workspace layout mode"
              className="hidden md:flex items-center gap-1 bg-canvas p-1 rounded-full border border-border-default text-[11px]"
            >
              <button
                type="button"
                onClick={() => setLayoutMode('split')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer focus-ember ${
                  layoutMode === 'split'
                    ? 'bg-elevated text-text-primary font-semibold border border-ember/40'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Columns2 className="w-3 h-3 text-ember-hover" />
                <span>Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('sidepanel')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer focus-ember ${
                  layoutMode === 'sidepanel'
                    ? 'bg-elevated text-text-primary font-semibold border border-ember/40'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Smartphone className="w-3 h-3 text-ember-hover" />
                <span>Side Panel (380px)</span>
              </button>
            </div>

            <Button
              variant="secondary"
              size="xs"
              pill
              onClick={() => setIsAboutOpen(true)}
            >
              Privacy & Info
            </Button>

            <Link to="/">
              <Button
                variant="ghost"
                size="xs"
                pill
                leftIcon={<Home className="w-3 h-3" />}
              >
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Notifications */}
      <ErrorBanner
        error={error}
        warning={warning}
        onDismiss={() => {
          setError(undefined);
          setWarning(undefined);
        }}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 py-4 flex items-start justify-center">
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
            {/* Primary Catch-Up Side Panel */}
            <div className="w-full max-w-[420px] bg-surface rounded-[var(--radius-card-lg)] border border-border-default shadow-[var(--shadow-obsidian-lg)] overflow-hidden flex flex-col flex-shrink-0 border-specular">
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

              <ConversationBar
                title={activeFileName}
                messageCount={messages.length}
                isSample={isSampleLoaded}
                isAnalyzing={isAnalyzing}
                onCatchMeUp={handleCatchMeUp}
              />

              <SummaryCounters
                urgentCount={analysis.stats.urgentCount}
                taskCount={analysis.stats.actionItemCount}
                completedTaskCount={completedTaskIds.size}
                decisionCount={analysis.stats.decisionCount}
                onSelectTab={setActiveTab}
              />

              <NavigationTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                taskCount={Math.max(0, allTasks.length - completedTaskIds.size)}
                importantCount={
                  analysis.stats.urgentCount + analysis.stats.decisionCount
                }
              />

              <CompactFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedParticipant={selectedParticipant}
                onParticipantChange={setSelectedParticipant}
                participants={analysis.recap.participants}
              />

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

              <div className="px-3.5 py-2.5 bg-elevated/90 border-t border-border-default flex items-center justify-between text-[11px] text-text-secondary">
                <span className="flex items-center gap-1.5 font-mono text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-semantic-local shrink-0" />
                  100% on-device demo analysis
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

            {/* Companion Conversation Timeline (Split View) */}
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

      {/* Context Drawer for Side Panel Mode */}
      <SourceDrawer
        isOpen={isDrawerOpen}
        sourceMessageId={highlightedMessageId}
        messages={messages}
        onClose={() => setIsDrawerOpen(false)}
        onOpenFullTranscript={() => setLayoutMode('split')}
      />

      {/* Privacy Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Styled Multi-Platform Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
};
