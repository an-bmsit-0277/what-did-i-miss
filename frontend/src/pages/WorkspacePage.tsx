import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SAMPLE_MESSAGES,
  MAX_FILE_SIZE_BYTES,
  parseConversation,
  analyzeConversation,
  type ParsedMessage,
  type ActiveTab,
  type ConversationAnalysis,
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
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  WorkspaceSkeleton,
} from '../components/ui';
import {
  Cloud,
  Columns2,
  Smartphone,
  ShieldCheck,
  LogOut,
  Trash2,
  Upload,
  Plus,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type ConversationSummary, ApiError } from '../api/client.ts';

export const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, signOut, deleteAccount } = useAuth();

  // Cloud conversations list state
  const [cloudConversations, setCloudConversations] = useState<ConversationSummary[]>([]);
  const [activeCloudId, setActiveCloudId] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(() => Boolean(accessToken));
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  // Active conversation data
  const [messages, setMessages] = useState<ParsedMessage[]>(SAMPLE_MESSAGES);
  const [activeFileName, setActiveFileName] = useState<string>(
    'Payment Gateway Migration Cutover'
  );
  const [isSampleLoaded, setIsSampleLoaded] = useState<boolean>(true);
  const [isCloudSaved, setIsCloudSaved] = useState<boolean>(false);

  // Raw file content kept in memory if user wishes to save to cloud later
  const [rawFileContent, setRawFileContent] = useState<string | null>(null);

  // Navigation & tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedParticipant, setSelectedParticipant] = useState<string>('all');
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'split' | 'sidepanel'>('split');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Cloud Conversations from Backend
  const fetchCloudConversations = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingList(true);
    try {
      const response = await api.listConversations(accessToken);
      setCloudConversations(response.items);
    } catch (err: any) {
      console.warn('Failed to fetch cloud conversations:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [accessToken]);

  useEffect(() => {
    let isMounted = true;
    if (accessToken) {
      api.listConversations(accessToken)
        .then((res) => {
          if (isMounted) {
            setCloudConversations(res.items);
            setIsLoadingList(false);
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch cloud conversations:', err);
          if (isMounted) {
            setIsLoadingList(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  // Load a Cloud Conversation by ID
  const loadCloudConversation = useCallback(
    async (id: string) => {
      if (!accessToken) return;
      setIsSyncingCloud(true);
      setError(undefined);
      try {
        const detail = await api.getConversation(accessToken, id);

        // Map persisted messages to ParsedMessage format
        const mappedMessages: ParsedMessage[] = detail.messages.map((m) => ({
          id: m.externalId || m.id,
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp || undefined,
          raw: m.text,
          lineIndex: m.seq,
        }));

        setMessages(mappedMessages);
        setActiveFileName(detail.conversation.title);
        setIsSampleLoaded(false);
        setIsCloudSaved(true);
        setActiveCloudId(id);
        setRawFileContent(null);

        // Pre-populate completed tasks
        const completedIds = new Set(
          detail.tasks.filter((t) => t.completed).map((t) => t.findingId)
        );
        setCompletedTaskIds(completedIds);
        setHighlightedMessageId(null);
        setSearchQuery('');
        setSelectedParticipant('all');
      } catch (err: any) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Failed to load conversation from cloud.'
        );
      } finally {
        setIsSyncingCloud(false);
      }
    },
    [accessToken]
  );

  // Run deterministic analysis locally on current messages
  const analysis: ConversationAnalysis = useMemo(() => {
    void analysisKey;
    return analyzeConversation(messages);
  }, [messages, analysisKey]);

  // Handle "Catch me up"
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
    setIsCloudSaved(false);
    setActiveCloudId(null);
    setRawFileContent(null);
    setError(undefined);
    setWarning(undefined);
    setCompletedTaskIds(new Set());
    setSearchQuery('');
    setSelectedParticipant('all');
    handleCatchMeUp();
  };

  // Load Local File (with option to persist to Cloud if user wants)
  const handleFileLoaded = async (content: string, fileName: string) => {
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
    setIsCloudSaved(false);
    setActiveCloudId(null);
    setRawFileContent(content);
    setCompletedTaskIds(new Set());
    setHighlightedMessageId(null);
    setSearchQuery('');
    setSelectedParticipant('all');
    handleCatchMeUp();

    // Automatically attempt cloud save if user is authenticated
    if (accessToken) {
      try {
        setIsSyncingCloud(true);
        const saved = await api.createConversation(accessToken, {
          title: fileName.replace(/\.[^/.]+$/, ''),
          fileName,
          content,
        });
        setIsCloudSaved(true);
        setActiveCloudId(saved.conversation.id);
        await fetchCloudConversations();
      } catch (saveErr: any) {
        console.warn('Could not auto-save to cloud:', saveErr);
        // Do not crash local analysis if cloud save fails
        setWarning('Analyzed locally. Cloud persistence failed: ' + saveErr.message);
      } finally {
        setIsSyncingCloud(false);
      }
    }
  };

  // Manual trigger to Save current local conversation to cloud
  const handleSaveToCloud = async () => {
    if (!accessToken || !rawFileContent) return;
    setIsSyncingCloud(true);
    setError(undefined);
    try {
      const saved = await api.createConversation(accessToken, {
        title: activeFileName,
        fileName: `${activeFileName}.txt`,
        content: rawFileContent,
      });
      setIsCloudSaved(true);
      setActiveCloudId(saved.conversation.id);
      await fetchCloudConversations();
    } catch (err: any) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to save conversation to cloud.'
      );
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Delete cloud conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!accessToken) return;
    try {
      await api.deleteConversation(accessToken, id);
      if (activeCloudId === id) {
        handleLoadSample();
      }
      await fetchCloudConversations();
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete conversation.');
    }
  };

  // Toggle task completion (with cloud sync if cloud-saved)
  const handleToggleTask = async (taskId: string) => {
    const isCompleted = completedTaskIds.has(taskId);
    const nextCompleted = !isCompleted;

    // Optimistic local update
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (nextCompleted) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });

    // If viewing a cloud conversation, sync to backend
    if (accessToken && isCloudSaved) {
      try {
        await api.updateTask(accessToken, taskId, nextCompleted);
      } catch (err: any) {
        // Rollback on failure
        setCompletedTaskIds((prev) => {
          const next = new Set(prev);
          if (isCompleted) {
            next.add(taskId);
          } else {
            next.delete(taskId);
          }
          return next;
        });
        setError(
          err instanceof ApiError
            ? `Task update failed: ${err.message}`
            : 'Could not sync task state to cloud.'
        );
      }
    }
  };

  const handleReset = () => {
    setMessages([]);
    setActiveFileName('');
    setIsSampleLoaded(false);
    setIsCloudSaved(false);
    setActiveCloudId(null);
    setRawFileContent(null);
    setCompletedTaskIds(new Set());
    setError(undefined);
    setWarning(undefined);
    setHighlightedMessageId(null);
    setSearchQuery('');
    setSelectedParticipant('all');
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(
          `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 10MB limit.`
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
          void handleFileLoaded(content, file.name);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
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

  // Account Deletion
  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE_MY_ACCOUNT') return;
    setIsDeletingAccount(true);
    try {
      const res = await deleteAccount();
      if (res.success) {
        navigate('/', { replace: true });
      } else {
        setError(res.error || 'Failed to delete account.');
      }
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
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
          Top Editorial Workspace Navigation Header
         ===================================================================== */}
      <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur-md border-b border-border-default/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Subtle Wordmark & Thread Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 focus-ember rounded py-1 group shrink-0">
              <span className="w-2 h-2 rounded-full bg-ember shadow-[0_0_8px_rgba(255,82,27,0.6)]" />
              <span className="font-serif italic text-base tracking-tight text-text-primary">
                Missed.
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted hidden sm:inline">
                / workspace
              </span>
            </Link>

            <span className="text-border-strong hidden sm:inline">|</span>

            {/* Cloud Status Indicator Badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isCloudSaved ? (
                <Badge variant="ember" icon={<Cloud className="w-3 h-3 text-ember-hover" />}>
                  Cloud Saved
                </Badge>
              ) : (
                <Badge variant="neutral" icon={<ShieldCheck className="w-3 h-3 text-semantic-local" />}>
                  Local Memory
                </Badge>
              )}
            </div>
          </div>

          {/* Right Actions: Layout Toggle, User Profile, Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Split vs Side Panel Switcher */}
            <div
              role="group"
              aria-label="Workspace layout mode"
              className="hidden md:flex items-center gap-1 bg-surface p-1 rounded-full border border-border-default text-[11px]"
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

            {/* User Account Badge & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-border-default">
              <span className="text-xs text-text-secondary font-mono hidden sm:inline truncate max-w-[130px]">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface hover:bg-elevated border border-border-default text-xs text-text-secondary hover:text-text-primary focus-ember transition-colors cursor-pointer"
                title="Sign out of Missed."
              >
                <LogOut className="w-3.5 h-3.5 text-ember-hover" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cloud Conversations Rail */}
      <section className="bg-surface/50 border-b border-border-default/80 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[11px] font-mono uppercase tracking-widest text-text-muted shrink-0 flex items-center gap-1">
              <FolderOpen className="w-3 h-3 text-ember-hover" />
              Threads:
            </span>

            {isLoadingList ? (
              <span className="text-text-muted text-[11px] font-mono animate-pulse">
                fetching cloud records...
              </span>
            ) : cloudConversations.length === 0 ? (
              <span className="text-text-muted text-[11px] font-mono">
                No cloud conversations yet. Upload an export below.
              </span>
            ) : (
              cloudConversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => loadCloudConversation(c.id)}
                  className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-all ${
                    activeCloudId === c.id
                      ? 'bg-elevated border-ember/50 text-text-primary font-semibold shadow-[0_0_12px_rgba(255,82,27,0.15)]'
                      : 'bg-canvas/80 border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong'
                  }`}
                >
                  <span className="truncate max-w-[120px]">{c.title}</span>
                  <span className="text-[10px] font-mono text-text-muted">
                    ({c.messageCount})
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(c.id, e)}
                    className="text-text-muted hover:text-semantic-urgent p-0.5 rounded cursor-pointer"
                    title="Delete cloud conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {!isCloudSaved && rawFileContent && (
              <Button
                variant="primary"
                size="xs"
                pill
                onClick={handleSaveToCloud}
                loading={isSyncingCloud}
                leftIcon={<Cloud className="w-3 h-3" />}
              >
                Save Active to Cloud
              </Button>
            )}
            <Button
              variant="secondary"
              size="xs"
              pill
              onClick={handleTriggerUpload}
              leftIcon={<Upload className="w-3 h-3 text-ember-hover" />}
            >
              Import Export
            </Button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <ErrorBanner
        error={error}
        warning={warning}
        onDismiss={() => {
          setError(undefined);
          setWarning(undefined);
        }}
      />

      {/* Main Catch-Up Surface */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 py-4 sm:py-6 flex items-start justify-center">
        {!hasActiveConversation ? (
          <div className="w-full max-w-md my-8">
            <EmptyState
              title="No Conversation Active"
              description="Import a WhatsApp, Slack, or TXT chat export to catch up on blockers and decisions, or load the built-in incident sample."
              icon={<Plus className="w-6 h-6" />}
              action={
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    variant="primary"
                    size="sm"
                    pill
                    onClick={handleTriggerUpload}
                    leftIcon={<Upload className="w-4 h-4" />}
                  >
                    Import Chat File
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    pill
                    onClick={handleLoadSample}
                  >
                    Load Sample Incident
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
            {/* Primary Catch-Up Side Panel */}
            <div className="w-full max-w-[420px] bg-surface rounded-[var(--radius-card-lg)] border border-border-default/90 shadow-[var(--shadow-obsidian-lg)] overflow-hidden flex flex-col flex-shrink-0 border-specular">
              <MissedHeader
                onRefresh={handleCatchMeUp}
                onLoadSample={handleLoadSample}
                onUploadClick={handleTriggerUpload}
                onCopySummary={handleCopySummary}
                onReset={handleReset}
                onOpenAbout={() => setIsAboutOpen(true)}
                copied={copied}
                hasActiveConversation={hasActiveConversation}
                isAnalyzing={isAnalyzing || isSyncingCloud}
              />

              <ConversationBar
                title={activeFileName}
                messageCount={messages.length}
                isSample={isSampleLoaded}
                isAnalyzing={isAnalyzing || isSyncingCloud}
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

              <div className="max-h-[560px] overflow-y-auto bg-canvas/40 scrollbar-obsidian">
                {isAnalyzing || isSyncingCloud ? (
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
                  {isCloudSaved
                    ? 'Cloud Persisted (PostgreSQL RLS)'
                    : '100% on-device heuristic engine'}
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

            {/* Companion Conversation Timeline Preview */}
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

      {/* Source Drawer for Side Panel Mode */}
      <SourceDrawer
        isOpen={isDrawerOpen}
        sourceMessageId={highlightedMessageId}
        messages={messages}
        onClose={() => setIsDrawerOpen(false)}
        onOpenFullTranscript={() => setLayoutMode('split')}
      />

      {/* Footer Account Actions */}
      <footer className="border-t border-border-default/80 bg-canvas/80 px-4 py-3 text-xs text-text-muted flex items-center justify-between">
        <span className="font-mono text-[10px]">
          Authenticated as {user?.email}
        </span>
        <div className="flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="hover:text-text-secondary cursor-pointer"
          >
            Privacy & Architecture
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="hover:text-semantic-urgent cursor-pointer"
          >
            Delete Account
          </button>
        </div>
      </footer>

      {/* Privacy Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Account Deletion Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Your Account"
        subtitle="This action permanently deletes all saved conversations and tasks."
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button
              variant="secondary"
              size="sm"
              pill
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              pill
              disabled={deleteConfirmText !== 'DELETE_MY_ACCOUNT' || isDeletingAccount}
              loading={isDeletingAccount}
              onClick={handleConfirmDeleteAccount}
            >
              Permanently Delete Account
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-text-secondary leading-relaxed">
            Deleting your account will cascade-delete all owned conversations, parsed messages, extracted findings, tasks, and settings stored under your tenant ID. This cannot be undone.
          </p>
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-delete"
              className="block text-xs font-semibold text-text-primary"
            >
              Type <code className="font-mono text-ember-hover">DELETE_MY_ACCOUNT</code> to confirm:
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE_MY_ACCOUNT"
              className="w-full px-3 py-2 rounded-lg bg-input border border-border-default text-text-primary text-xs focus-ember"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
