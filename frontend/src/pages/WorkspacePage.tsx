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
  MessageSquare,
  Settings,
  ArrowRight,
  Flame,
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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<'conversations' | 'import' | 'settings'>('conversations');
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
    <div className="min-h-screen bg-[#0B0A08] text-text-primary flex flex-col md:flex-row font-sans antialiased selection:bg-ember/30 selection:text-warm-highlight">
      {/* Film-grain texture layer */}
      <div className="film-grain pointer-events-none fixed inset-0 z-10" aria-hidden="true" />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt,.log"
        onChange={handleNativeFileChange}
        className="hidden"
      />

      {/* =====================================================================
          Desktop Slim Left Sidebar (Charcoal, Hairline Right Border)
         ===================================================================== */}
      <aside className="hidden md:flex w-60 lg:w-64 shrink-0 bg-[#0B0A08] border-r border-white/[0.08] flex-col justify-between p-4 h-screen sticky top-0 z-20">
        <div className="space-y-6">
          {/* Serif Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/[0.03] transition-colors focus-ember group"
          >
            <div className="w-7 h-7 rounded-full bg-ember/15 border border-ember/35 flex items-center justify-center text-ember-hover group-hover:bg-ember group-hover:text-text-primary transition-colors shadow-[0_0_12px_rgba(255,82,27,0.25)]">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif italic text-lg tracking-tight text-text-primary">
              Missed<span className="text-ember">.</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted ml-auto">
              triage
            </span>
          </Link>

          {/* Navigation Items: Conversations, Import, Settings */}
          <nav className="space-y-1.5" aria-label="Sidebar navigation">
            <button
              type="button"
              onClick={() => setActiveNav('conversations')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeNav === 'conversations'
                  ? 'bg-white/[0.08] text-text-primary font-semibold border border-white/[0.12] shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-ember" />
                <span>Conversations</span>
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-text-muted">
                {cloudConversations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={handleTriggerUpload}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-ember" />
              <span>Import Export</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-text-muted" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Quick Active Thread Glance */}
          <div className="pt-4 border-t border-white/[0.06] space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted px-2 block">
              Active Thread
            </span>
            <div className="p-3 rounded-xl bg-[#0E0C0A] border border-white/[0.08] text-xs">
              <p className="font-medium text-text-primary truncate" title={activeFileName}>
                {activeFileName || 'Untitled'}
              </p>
              <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-text-muted">
                <span>{messages.length} msgs</span>
                <span>•</span>
                <span className={isCloudSaved ? 'text-ember-hover' : 'text-emerald-400'}>
                  {isCloudSaved ? 'Cloud Saved' : 'Local Memory'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sidebar: User Email & Subtle Logout */}
        <div className="pt-4 border-t border-white/[0.08] space-y-2">
          {user ? (
            <>
              <div className="px-3 py-1">
                <span className="text-[10px] uppercase tracking-wider text-text-muted block font-mono">
                  Signed in as
                </span>
                <span className="font-mono text-[11px] text-text-secondary truncate block max-w-[190px]" title={user.email}>
                  {user.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors cursor-pointer"
                title="Sign out of Missed."
              >
                <LogOut className="w-3.5 h-3.5 text-ember" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <div className="px-3 py-2 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-mono block">
                Guest Demo
              </span>
              <Link
                to="/signup"
                className="w-full py-2 px-3 rounded-xl bg-ember hover:bg-ember-hover text-white text-[11px] font-medium flex items-center justify-center gap-1.5 shadow-[0_2px_12px_rgba(255,82,27,0.3)] transition-all"
              >
                <span>Sign Up to Save</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* =====================================================================
          Mobile Header Bar (Only visible on screens < md)
         ===================================================================== */}
      <div className="md:hidden sticky top-0 z-30 bg-[#0B0A08]/95 backdrop-blur-md border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-ember shadow-[0_0_8px_rgba(255,82,27,0.7)]" />
          <span className="font-serif italic text-base tracking-tight text-text-primary">
            Missed<span className="text-ember">.</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerUpload}
            className="p-1.5 rounded-lg bg-white/[0.05] text-text-secondary hover:text-text-primary text-xs"
            title="Import Export"
          >
            <Upload className="w-4 h-4 text-ember" />
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-white/[0.05] text-text-secondary hover:text-text-primary text-xs"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          {user && (
            <button
              type="button"
              onClick={() => signOut()}
              className="p-1.5 rounded-lg bg-white/[0.05] text-text-secondary hover:text-text-primary text-xs"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-ember" />
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          Main Content Area (Near-black ground #0B0A08)
         ===================================================================== */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#0B0A08] overflow-y-auto">
        {/* Notifications */}
        <ErrorBanner
          error={error}
          warning={warning}
          onDismiss={() => {
            setError(undefined);
            setWarning(undefined);
          }}
        />

        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Guest Demo Banner if unauthenticated */}
          {!accessToken && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-400 text-[10px] font-mono tracking-widest uppercase shrink-0">
                  Guest Demo Mode
                </span>
                <span className="text-text-secondary">
                  Running entirely in browser memory. Zero cloud writes until you create an account.
                </span>
              </div>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1 text-ember-hover hover:text-warm-highlight font-medium hover:underline text-xs shrink-0"
              >
                <span>Sign Up to Save to Cloud</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Header Row: Serif Page Title + Account-State Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight">
                  {activeFileName || 'Triage Workspace'}
                </h1>

                {/* Core Trust Signal Badge: Cloud Saved vs Local Memory */}
                {isCloudSaved ? (
                  <Badge
                    variant="ember"
                    icon={<Cloud className="w-3 h-3 text-ember" />}
                    className="border border-ember/40 bg-ember/10 text-ember-hover text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full"
                  >
                    Cloud Saved
                  </Badge>
                ) : (
                  <Badge
                    variant="neutral"
                    icon={<ShieldCheck className="w-3 h-3 text-emerald-400" />}
                    className="border border-white/20 bg-white/5 text-white/70 text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full"
                  >
                    Local Memory
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-muted">
                Deterministic catch-up triage on chat exports with source message fidelity.
              </p>
            </div>

            {/* Right Controls: Save to Cloud, Split/Sidepanel switcher, Import Export */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              {!isCloudSaved && rawFileContent && accessToken && (
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

              {/* Split vs Side Panel Switcher */}
              <div
                role="group"
                aria-label="Workspace layout mode"
                className="hidden lg:flex items-center gap-1 bg-[#141210] p-1 rounded-full border border-white/[0.08] text-[11px]"
              >
                <button
                  type="button"
                  onClick={() => setLayoutMode('split')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer focus-ember ${
                    layoutMode === 'split'
                      ? 'bg-[#1E1A17] text-text-primary font-semibold border border-ember/40 shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Columns2 className="w-3 h-3 text-ember" />
                  <span>Split View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('sidepanel')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer focus-ember ${
                    layoutMode === 'sidepanel'
                      ? 'bg-[#1E1A17] text-text-primary font-semibold border border-ember/40 shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Smartphone className="w-3 h-3 text-ember" />
                  <span>Side Panel</span>
                </button>
              </div>

              <Button
                variant="secondary"
                size="xs"
                pill
                onClick={handleTriggerUpload}
                leftIcon={<Upload className="w-3 h-3 text-ember" />}
              >
                Import Export
              </Button>
            </div>
          </div>

          {/* ===================================================================
              Conversation List: Dense, scannable cards/rows with title, date,
              priority counts, hairline separators, motion-card-lift.
             =================================================================== */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="eyebrow-editorial">SAVED CONVERSATIONS</span>
                <span className="text-[11px] font-mono text-text-muted">
                  ({cloudConversations.length} total)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                >
                  Load Sample Incident
                </button>
                <button
                  type="button"
                  onClick={handleTriggerUpload}
                  className="text-ember-hover hover:text-warm-highlight font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Import</span>
                </button>
              </div>
            </div>

            {isLoadingList ? (
              <div className="p-6 text-center text-xs text-text-muted font-mono animate-pulse bg-[#0E0C0A] rounded-2xl border border-white/[0.08]">
                Fetching cloud records...
              </div>
            ) : cloudConversations.length === 0 ? (
              /* Editorial Empty State when no conversations exist */
              <div className="p-8 text-center bg-[#0E0C0A] rounded-2xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-text-muted mx-auto">
                  <FolderOpen className="w-6 h-6 text-ember" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-normal text-text-primary">
                    No conversations imported yet
                  </h3>
                  <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                    Import a WhatsApp, Slack, TXT, or JSON export to automatically surface blockers, decisions, and action items.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleTriggerUpload}
                    className="px-4 py-2.5 rounded-full bg-ember hover:bg-ember-hover text-white font-medium text-xs tracking-wider uppercase inline-flex items-center gap-2 shadow-[0_2px_14px_rgba(255,82,27,0.3)] cursor-pointer transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import your first conversation</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-4 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-text-secondary hover:text-text-primary text-xs font-medium cursor-pointer transition-colors"
                  >
                    Load Sample Incident
                  </button>
                </div>
              </div>
            ) : (
              /* Dense Scannable Grid of Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cloudConversations.map((c) => {
                  const isActive = activeCloudId === c.id;
                  const formattedDate = c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '';

                  return (
                    <div
                      key={c.id}
                      onClick={() => loadCloudConversation(c.id)}
                      className={`motion-card-lift p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isActive
                          ? 'bg-[#141210] border-ember/50 shadow-[0_4px_20px_rgba(255,82,27,0.18)]'
                          : 'bg-[#0E0C0A] border-white/[0.08] hover:border-white/[0.16]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-ember shadow-[0_0_6px_rgba(255,82,27,0.8)]" />
                            )}
                            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                              {c.sourceFormat || 'CHAT'}
                            </span>
                            {formattedDate && (
                              <span className="text-[10px] font-mono text-text-muted">
                                • {formattedDate}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-semibold text-text-primary truncate" title={c.title}>
                            {c.title}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteConversation(c.id, e)}
                          className="text-text-muted hover:text-semantic-urgent p-1 rounded-md hover:bg-white/[0.05] transition-colors cursor-pointer shrink-0"
                          title="Delete cloud conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Priority counts chips */}
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
                        <span className="text-text-muted">
                          {c.messageCount} msgs
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isActive ? (
                            <>
                              {analysis.stats.urgentCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-semantic-urgent/15 text-semantic-urgent font-bold" title="Blockers">
                                  {analysis.stats.urgentCount} urg
                                </span>
                              )}
                              {analysis.stats.decisionCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-semantic-decision/15 text-semantic-decision" title="Decisions">
                                  {analysis.stats.decisionCount} dec
                                </span>
                              )}
                              {analysis.stats.actionItemCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-semantic-task/15 text-semantic-task" title="Tasks">
                                  {analysis.stats.actionItemCount} act
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-text-muted">
                              {c.participantCount} participants
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ===================================================================
              Detail / Triage Pane & Timeline
             =================================================================== */}
          <main className="w-full flex items-start justify-center pt-2">
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
                <div className="w-full max-w-[430px] bg-[#0E0C0A] rounded-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col flex-shrink-0">
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

                  <div className="max-h-[560px] overflow-y-auto bg-[#0B0A08]/40 scrollbar-obsidian">
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

                  <div className="px-4 py-2.5 bg-[#141210] border-t border-white/[0.08] flex items-center justify-between text-[11px] text-text-secondary">
                    <span className="flex items-center gap-1.5 font-mono text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
                  <div className="hidden lg:block flex-1 max-w-2xl h-[780px] w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0E0C0A]">
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
        </div>

        {/* Footer Account Actions */}
        <footer className="mt-auto border-t border-white/[0.08] bg-[#0B0A08] px-6 py-4 text-xs text-text-muted flex items-center justify-between">
          <span className="font-mono text-[11px]">
            {user ? `Authenticated as ${user.email}` : 'Guest Session'}
          </span>
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-text-secondary cursor-pointer"
            >
              Privacy & Architecture
            </button>
            {user && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="hover:text-semantic-urgent cursor-pointer"
              >
                Delete Account
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* Source Drawer for Side Panel Mode */}
      <SourceDrawer
        isOpen={isDrawerOpen}
        sourceMessageId={highlightedMessageId}
        messages={messages}
        onClose={() => setIsDrawerOpen(false)}
        onOpenFullTranscript={() => setLayoutMode('split')}
      />

      {/* Privacy Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Workspace Settings"
        subtitle="Account preferences, storage isolation, and security controls"
        footer={
          <div className="flex items-center justify-end w-full">
            <Button
              variant="secondary"
              size="sm"
              pill
              onClick={() => setIsSettingsOpen(false)}
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5 p-3 rounded-xl bg-[#141210] border border-white/[0.08]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Account</span>
            <p className="font-medium text-text-primary">
              {user ? user.email : 'Guest Session (Local Memory)'}
            </p>
            <p className="text-[11px] text-text-muted">
              {user ? 'Secured via Supabase Row-Level Security' : 'No account active'}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Information</span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsAboutOpen(true);
                }}
                className="w-full text-left p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Privacy & Architecture Specification →
              </button>
            </div>
          </div>

          {user && (
            <div className="pt-2 border-t border-white/[0.08] space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-semantic-urgent">Danger Zone</span>
              <p className="text-[11px] text-text-muted">
                Permanently delete your account and all associated cloud conversations.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsDeleteModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-red-500/30 text-semantic-urgent hover:bg-red-500/10 text-xs font-medium cursor-pointer transition-colors"
              >
                Delete Account
              </button>
            </div>
          )}
        </div>
      </Modal>

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
