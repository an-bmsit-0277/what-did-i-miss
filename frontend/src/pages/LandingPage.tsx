import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SAMPLE_MESSAGES,
  analyzeConversation,
  type ConversationAnalysis,
} from '@missed/engine';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Database,
  FileText,
  Lock,
  LogOut,
  Pin,
  Play,
  ShieldCheck,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CategoryBadge,
  EngineModeBadge,
  PriorityBadge,
} from '../components/ui';
import { AboutModal } from '../components/AboutModal';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { status, user, signOut } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Deterministic on-device sample analysis
  const sampleAnalysis: ConversationAnalysis = useMemo(() => {
    return analyzeConversation(SAMPLE_MESSAGES);
  }, []);

  const previewFindings = sampleAnalysis.findings.slice(0, 3);

  const handleInspectFinding = (sourceMessageId: string) => {
    navigate(`/demo?highlight=${sourceMessageId}`);
  };

  return (
    <div className="min-h-screen bg-void text-text-primary flex flex-col font-sans selection:bg-ember/30 selection:text-warm-highlight">
      {/* =====================================================================
          1. Small, Restrained Navigation Header
         ===================================================================== */}
      <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md border-b border-border-default/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Subtle Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2 group focus-ember rounded py-1"
          >
            <span className="w-2 h-2 rounded-full bg-ember shadow-[0_0_8px_rgba(255,82,27,0.6)]" />
            <span className="font-serif italic text-lg sm:text-xl tracking-tight text-text-primary">
              Missed.
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted hidden sm:inline pl-1">
              / catch-up
            </span>
          </Link>

          {/* Understated Text Links */}
          <nav
            aria-label="Editorial navigation"
            className="hidden md:flex items-center gap-7 text-[12px] text-text-secondary tracking-wide font-normal"
          >
            <a
              href="#narrative"
              className="hover:text-text-primary transition-colors"
            >
              How It Works
            </a>
            <a
              href="#capabilities"
              className="hover:text-text-primary transition-colors"
            >
              Signals
            </a>
            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-text-primary transition-colors cursor-pointer"
            >
              Privacy & Model
            </button>
            <Link
              to="/demo"
              className="text-amber-highlight hover:text-warm-highlight font-medium flex items-center gap-1 transition-colors"
            >
              <span>Guest Demo</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </nav>

          {/* Restrained Actions */}
          <div className="flex items-center gap-3">
            {status === 'authenticated' && user ? (
              <div className="flex items-center gap-2.5">
                <Link to="/workspace">
                  <Button
                    variant="primary"
                    size="xs"
                    pill
                    rightIcon={<ArrowRight className="w-3 h-3" />}
                  >
                    Open Workspace
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface transition-colors focus-ember cursor-pointer"
                  title={`Sign out (${user.email})`}
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs text-text-secondary hover:text-text-primary px-2.5 py-1 transition-colors font-medium"
                >
                  Log In
                </Link>
                <Link to="/signup" className="flex items-center gap-2 group">
                  <span className="text-xs font-semibold text-text-primary hidden sm:inline">
                    Sign Up Free
                  </span>
                  <span className="btn-circle-action group-hover:scale-105" aria-hidden="true">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. Cinematic Hero Section — Full-Bleed Composition & Serif Typography
         ===================================================================== */}
      <section className="relative min-h-[82vh] lg:min-h-[86vh] flex items-center justify-center border-b border-border-default/90 bg-cinematic-mesh overflow-hidden px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Layered Subtle Atmosphere */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,82,27,0.15),transparent_60%)]"
          aria-hidden="true"
        />

        <div className="max-w-7xl w-full mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Oversized Editorial Serif Headline */}
            <div className="lg:col-span-7 space-y-6 lg:space-y-8 motion-fade-up">
              <div className="inline-flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full border border-border-default bg-surface text-[11px] font-mono tracking-widest uppercase text-text-muted">
                  Deterministic Chat Triage
                </span>
                <EngineModeBadge />
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl xl:text-[80px] font-normal tracking-tight leading-[1.04] text-text-primary">
                The conversation moved on.{' '}
                <span className="italic text-warm-highlight">
                  You don’t have to read it all.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-text-secondary max-w-xl font-normal leading-relaxed">
                Missed. inspects raw chat exports on your device to isolate urgent blockers, verified decisions, assigned action items, and temporal deadlines—anchoring every signal to its original source message.
              </p>

              {/* Action Pair with Small Circular Action Control */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/signup" className="flex items-center gap-3 group focus-ember rounded-full">
                  <span className="btn-circle-action group-hover:scale-105" aria-hidden="true">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-semibold text-text-primary group-hover:text-ember-hover transition-colors">
                    Create Personal Workspace
                  </span>
                </Link>

                <div className="h-4 w-px bg-border-default hidden sm:block" />

                <Link
                  to="/demo"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border-default bg-surface/70 hover:bg-elevated hover:border-border-strong text-xs text-text-secondary hover:text-text-primary transition-all focus-ember"
                >
                  <Play className="w-3 h-3 text-ember-hover fill-current" />
                  <span>Explore Interactive Demo (No Account)</span>
                </Link>
              </div>

              {/* Quiet Metadata Rule */}
              <div className="pt-6 border-t border-border-default/80 flex flex-wrap items-center gap-6 text-[11px] text-text-muted font-mono">
                <div>
                  <span className="text-text-primary font-bold">100%</span> on-device analysis
                </div>
                <div>•</div>
                <div>
                  <span className="text-text-primary font-bold">Zero</span> hallucinated summaries
                </div>
                <div>•</div>
                <div>
                  <span className="text-text-primary font-bold">1-click</span> timeline citation
                </div>
              </div>
            </div>

            {/* Right Column: Abstract Conversation Signal Preview Card */}
            <div className="lg:col-span-5 motion-scale-in">
              <div className="relative">
                {/* Subtle Amber Edge Lighting */}
                <div
                  className="absolute -inset-1 rounded-[var(--radius-card-lg)] bg-gradient-to-tr from-ember/25 via-transparent to-amber-highlight/15 blur-lg opacity-60 pointer-events-none"
                  aria-hidden="true"
                />

                <Card
                  variant="featured"
                  padding="none"
                  className="relative bg-surface/95 border border-border-default shadow-[var(--shadow-elevated)] overflow-hidden motion-card-lift"
                >
                  {/* Card Header */}
                  <div className="px-4 py-3 bg-elevated/90 border-b border-border-default flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-ember animate-pulse" />
                      <span className="text-xs font-semibold text-text-primary truncate">
                        Incident Cutover Thread
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted">
                      {sampleAnalysis.recap.totalMessages} msgs • {sampleAnalysis.recap.participantCount} senders
                    </span>
                  </div>

                  {/* High-Information Density Signals */}
                  <div className="p-4 space-y-2.5 bg-canvas/60">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted flex items-center justify-between">
                      <span>Extracted Signals</span>
                      <span>Click to trace →</span>
                    </div>

                    {previewFindings.map((finding) => (
                      <button
                        key={finding.id}
                        type="button"
                        onClick={() => handleInspectFinding(finding.sourceMessageId)}
                        className="w-full text-left rounded-xl bg-surface hover:bg-elevated border border-border-default hover:border-ember/45 p-3 transition-all group focus-ember cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <CategoryBadge category={finding.category} />
                            <PriorityBadge urgency={finding.urgency} />
                          </div>
                          <span className="text-[10px] font-mono text-ember-hover group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                            Trace <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <p className="text-xs text-text-primary font-medium line-clamp-2 leading-snug">
                          {finding.snippet}
                        </p>
                        <div className="mt-1 text-[10px] text-text-muted font-mono flex items-center justify-between">
                          <span>{finding.sender}</span>
                          <span>{finding.timestamp || ''}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 bg-elevated/70 border-t border-border-default flex items-center justify-between text-xs">
                    <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-semantic-local" />
                      Local deterministic parsing
                    </span>
                    <Link
                      to="/demo"
                      className="text-ember-hover hover:text-warm-highlight font-medium flex items-center gap-1"
                    >
                      <span>Explore Thread</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. Below the Fold: 4-Step Narrative Sequence
         ===================================================================== */}
      <section
        id="narrative"
        aria-label="How Missed. works"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 space-y-24"
      >
        {/* Narrative Header */}
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-ember-hover">
            The Catch-Up Sequence
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-text-primary tracking-tight">
            How Missed. transforms raw chat noise into structured clarity.
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Standard conversational summaries strip away accountability and nuance. Missed. decomposes conversation streams into verified, deep-linked decision records.
          </p>
        </div>

        {/* Chapter 01: Ingestion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center border-t border-border-default pt-12">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-serif text-4xl sm:text-5xl text-ember font-light italic">
              01
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary">
              Import raw conversation streams.
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Drop in exported <code className="font-mono text-text-primary">.txt</code> or{' '}
              <code className="font-mono text-text-primary">.json</code> files from WhatsApp, Slack channels, or developer incident war rooms. All parsing occurs directly in browser memory without sending private logs to remote LLM endpoints.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-text-muted font-mono">
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-ember-hover" />
                TXT & JSON Standard
              </span>
              <span>•</span>
              <span>10MB Limit Guard</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border-default bg-surface p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-text-muted text-[11px] pb-2 border-b border-border-default">
                <span>[Raw Chat Export Fragment]</span>
                <span>UTF-8 • Stream Parser</span>
              </div>
              <p className="text-text-muted">
                <span className="text-text-secondary">[08:24] Sarah (Lead):</span> Starting payment gateway switchover now. All hands on standby.
              </p>
              <p className="text-[#FF7A5C] bg-semantic-urgent/10 p-2 rounded border border-semantic-urgent/30">
                <span className="text-text-secondary">[08:31] Marcus:</span> BLOCKER: Webhook signature verification failing on v2 endpoints. 14% failure rate!
              </p>
              <p className="text-[#7DD3FC] bg-semantic-decision/10 p-2 rounded border border-semantic-decision/30">
                <span className="text-text-secondary">[08:36] Elena (CTO):</span> Rollback approved. Revert immediately to v1 endpoints until fixed.
              </p>
            </div>
          </div>
        </div>

        {/* Chapter 02: Extraction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center border-t border-border-default pt-12">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-serif text-4xl sm:text-5xl text-ember font-light italic">
              02
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary">
              Surface high-priority blockers and sign-offs.
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Multi-factor heuristic detectors scan for production blockers, consensus statements, task assignments (<code className="font-mono text-text-primary">@assignee</code>), and deadlines. Signals are ranked by urgency score rather than arrival time.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <CategoryBadge category="urgent" />
              <CategoryBadge category="decision" />
              <CategoryBadge category="action_item" />
              <CategoryBadge category="deadline" />
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Card variant="featured" padding="md" className="space-y-2 motion-card-lift">
              <div className="flex items-center justify-between">
                <Badge variant="urgent" icon={<AlertTriangle className="w-3 h-3" />}>
                  P0 Outage
                </Badge>
                <PriorityBadge urgency="high" />
              </div>
              <h4 className="text-xs font-bold text-text-primary">
                Webhook signature failure
              </h4>
              <p className="text-[11px] text-text-secondary">
                14% transaction drop on v2 payment gateway endpoints.
              </p>
            </Card>

            <Card variant="default" padding="md" className="space-y-2 motion-card-lift">
              <div className="flex items-center justify-between">
                <CategoryBadge category="decision" />
                <span className="text-[10px] font-mono text-text-muted">Sign-off</span>
              </div>
              <h4 className="text-xs font-bold text-text-primary">
                Rollback to v1 approved
              </h4>
              <p className="text-[11px] text-text-secondary">
                Elena (CTO) authorized immediate rollback to maintain uptime.
              </p>
            </Card>
          </div>
        </div>

        {/* Chapter 03: 1-Click Citation Trace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center border-t border-border-default pt-12">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-serif text-4xl sm:text-5xl text-ember font-light italic">
              03
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary">
              Jump to the exact source message in 1 click.
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Every extracted finding retains its precise <code className="font-mono text-text-primary">sourceMessageId</code>. Click any card to scroll the conversation timeline directly to the original quote, with surrounding context preserved in the side panel drawer.
            </p>
            <div className="pt-2">
              <Link to="/demo">
                <Button
                  variant="secondary"
                  size="xs"
                  pill
                  rightIcon={<ArrowRight className="w-3 h-3" />}
                >
                  Test Citation Jump in Demo
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-ember/40 bg-surface p-4 shadow-[0_0_24px_rgba(255,82,27,0.12)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-ember-hover">
                <Pin className="w-3.5 h-3.5" />
                <span>Deep-Linked Timeline Target (#msg-004)</span>
              </div>
              <div className="p-3 rounded-xl bg-canvas border border-border-default">
                <div className="flex items-center justify-between text-[11px] text-text-muted mb-1 font-mono">
                  <span className="font-bold text-text-primary">Marcus (DevOps)</span>
                  <span>08:31:14 UTC</span>
                </div>
                <p className="text-xs text-text-primary">
                  &ldquo;BLOCKER: Webhook signature verification failing on v2 endpoints. 14% failure rate! Investigating secret mismatch.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter 04: Workspace & Private Persistence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center border-t border-border-default pt-12">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-serif text-4xl sm:text-5xl text-ember font-light italic">
              04
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary">
              Work as a guest, or save to private cloud.
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Guest demo operates in pure browser isolation with zero accounts required. Create a free account to persist conversations to Supabase PostgreSQL, synchronized under strict Row-Level Security (<code className="font-mono text-text-primary">auth.uid() = owner_id</code>).
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link to="/signup">
                <Button variant="primary" size="sm" pill rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Create Free Account
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="ghost" size="sm" pill>
                  Guest Demo
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Card variant="ivory" padding="lg" className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-void text-text-primary text-[10px] font-mono font-semibold">
                <Lock className="w-2.5 h-2.5 text-ember-hover" />
                POSTGRESQL ROW-LEVEL SECURITY
              </div>
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-text-on-ivory">
                Tenant-isolated data architecture.
              </h4>
              <p className="text-xs text-text-on-ivory/80 leading-relaxed">
                Your conversations, messages, and task checkmarks are scoped exclusively to your authenticated identity. No other tenant can query your records, and local guest sessions never touch the database.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-text-on-ivory font-mono">
                <Database className="w-3.5 h-3.5" />
                <span>Supabase Auth + PostgreSQL RLS Guard</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. Cinematic Call-to-Action Banner
         ===================================================================== */}
      <section className="border-t border-border-default/90 bg-cinematic-mesh py-16 lg:py-24 text-center px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-text-muted">
            Ready to catch up?
          </span>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-text-primary tracking-tight">
            Stop scrolling unread threads.{' '}
            <span className="italic text-warm-highlight">Get the signal.</span>
          </h2>

          <p className="text-xs sm:text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            Import an export file now or try the incident cutover demo. Deterministic, source-linked, and private by default.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/signup">
              <Button
                variant="primary"
                size="md"
                pill
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign Up Free
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="secondary" size="md" pill>
                Launch Guest Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. Editorial Footer
         ===================================================================== */}
      <footer className="border-t border-border-default bg-canvas py-8 text-xs text-text-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-serif italic text-base text-text-primary">Missed.</span>
            <span className="text-text-muted font-mono text-[11px]">
              — Conversation Intelligence Workspace
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs">
            <Link to="/demo" className="hover:text-text-primary transition-colors">
              Guest Demo
            </Link>
            <Link to="/signup" className="hover:text-text-primary transition-colors">
              Sign Up
            </Link>
            <Link to="/login" className="hover:text-text-primary transition-colors">
              Log In
            </Link>
            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-text-primary transition-colors cursor-pointer"
            >
              Privacy & Model Architecture
            </button>
          </div>
        </div>
      </footer>

      {/* Privacy & Architecture Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
};
