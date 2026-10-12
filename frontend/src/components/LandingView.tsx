import React from 'react';
import type { ConversationAnalysis } from '@missed/engine';
import {
  AlertTriangle,
  ArrowRight,
  Flame,
  Lock,
  Pin,
  PlayCircle,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CategoryBadge,
  EngineModeBadge,
  PriorityBadge,
} from './ui';

interface LandingViewProps {
  sampleAnalysis: ConversationAnalysis;
  onOpenWorkspace: () => void;
  onLoadSampleAndOpen: () => void;
  onTriggerUpload: () => void;
  onInspectFindingInWorkspace: (sourceMessageId: string) => void;
  onOpenAbout: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  sampleAnalysis,
  onOpenWorkspace,
  onLoadSampleAndOpen,
  onTriggerUpload,
  onInspectFindingInWorkspace,
  onOpenAbout,
}) => {
  const previewFindings = sampleAnalysis.findings.slice(0, 3);

  return (
    <div className="w-full">
      {/* =====================================================================
          1. Hero Section — Diagonal Solar Beam & Live Engine Preview
         ===================================================================== */}
      <section className="bg-solar-beam border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Editorial Headline & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 flex-wrap">
                <Badge
                  variant="ember"
                  icon={<Flame className="w-3 h-3" />}
                >
                  Conversation Intelligence Workspace
                </Badge>
                <EngineModeBadge />
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold text-text-primary tracking-tight leading-[1.08]">
                Catch up on what matters.{' '}
                <span className="text-ember-hover">Skip the noise.</span>
              </h1>

              <p className="text-sm sm:text-base text-text-secondary max-w-xl leading-relaxed">
                Missed. parses <code className="font-mono text-text-primary">.txt</code> and{' '}
                <code className="font-mono text-text-primary">.json</code> chat exports on your device to surface urgent blockers, decisions, action items, deadlines, and direct{' '}
                <code className="font-mono text-text-primary">@mentions</code>—with every finding deep-linked to its exact source message.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  variant="primary"
                  size="lg"
                  pill
                  onClick={onOpenWorkspace}
                  leftIcon={<PlayCircle className="w-4 h-4 text-warm-highlight" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Open Catch-Up Workspace
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  pill
                  onClick={onTriggerUpload}
                  leftIcon={<Upload className="w-4 h-4 text-ember-hover" />}
                >
                  Import .txt / .json Export
                </Button>
              </div>

              {/* Key Trust Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border-default max-w-lg">
                <div>
                  <div className="text-lg sm:text-xl font-extrabold font-mono text-text-primary">
                    100%
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    On-device deterministic engine
                  </div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold font-mono text-ember-hover">
                    5 Signals
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    Urgent, Tasks, Decisions, Deadlines, Mentions
                  </div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold font-mono text-text-primary">
                    1-Click
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    Source message timeline trace
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic Live @missed/engine Preview Card */}
            <div className="lg:col-span-5">
              <Card variant="featured" padding="none" spotlight className="overflow-hidden">
                <div className="px-4 py-3 bg-elevated/90 border-b border-border-default flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-ember" aria-hidden="true" />
                    <span className="text-xs font-bold text-text-primary truncate">
                      Live Demo: Payment Gateway Cutover
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted shrink-0">
                    {sampleAnalysis.recap.totalMessages} msgs • {sampleAnalysis.recap.participantCount} senders
                  </span>
                </div>

                {/* Live Mini Counters */}
                <div className="grid grid-cols-3 gap-2 p-3.5 bg-canvas/70 border-b border-border-default text-center">
                  <div className="rounded-xl bg-surface p-2 border border-semantic-urgent/30">
                    <div className="text-[10px] text-text-secondary uppercase">Urgent</div>
                    <div className="text-sm font-extrabold font-mono text-[#FF7A5C]">
                      {sampleAnalysis.stats.urgentCount}
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface p-2 border border-semantic-task/30">
                    <div className="text-[10px] text-text-secondary uppercase">Tasks</div>
                    <div className="text-sm font-extrabold font-mono text-[#FCD34D]">
                      {sampleAnalysis.stats.actionItemCount}
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface p-2 border border-semantic-decision/30">
                    <div className="text-[10px] text-text-secondary uppercase">Decisions</div>
                    <div className="text-sm font-extrabold font-mono text-[#7DD3FC]">
                      {sampleAnalysis.stats.decisionCount}
                    </div>
                  </div>
                </div>

                {/* Authentic Extracted Findings Preview */}
                <div className="p-3.5 space-y-2.5 bg-surface">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted flex items-center justify-between">
                    <span>Top Extracted Signals (@missed/engine)</span>
                    <span>Click to trace →</span>
                  </div>

                  {previewFindings.map((finding) => (
                    <button
                      key={finding.id}
                      type="button"
                      onClick={() => onInspectFindingInWorkspace(finding.sourceMessageId)}
                      className="w-full text-left rounded-2xl bg-elevated hover:bg-input border border-border-default hover:border-ember/45 p-3 transition-all group focus-ember cursor-pointer"
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
                      <div className="mt-1 text-[10px] text-text-muted font-mono">
                        {finding.sender} {finding.timestamp ? `• ${finding.timestamp}` : ''}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="px-4 py-3 bg-elevated/70 border-t border-border-default flex items-center justify-between">
                  <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-semantic-local" />
                    Computed locally in browser
                  </span>
                  <Button variant="ghost" size="xs" onClick={onLoadSampleAndOpen}>
                    Explore Full Thread →
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. Asymmetric Bento Feature Grid
         ===================================================================== */}
      <section
        aria-label="Core capabilities"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8"
      >
        <div className="max-w-2xl space-y-2">
          <Badge variant="neutral" mono>
            DETERMINISTIC TRIAGE PIPELINE
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Built for post-absence catch-up, incident war-rooms, and noisy group threads.
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Instead of generic wall-of-text summaries that strip away who said what, Missed. structures every signal by category and urgency while keeping the original transcript one click away.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Bento 1: Urgent Blockers & Priority Scoring (7 cols) */}
          <Card variant="featured" padding="lg" spotlight className="md:col-span-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="urgent"
                  icon={<AlertTriangle className="w-3 h-3" />}
                >
                  P0 Urgency & Blocker Detection
                </Badge>
                <span className="text-[11px] font-mono text-text-muted">
                  Multi-factor relevance scoring
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                Surface critical outages, rollbacks, and escalations first.
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Deterministic lexical detectors scan for production blockers, severity markers, and urgent escalations, ranking findings into <code className="font-mono text-text-primary">High</code>, <code className="font-mono text-text-primary">Medium</code>, and <code className="font-mono text-text-primary">Low</code> priority tiers.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-border-default flex flex-wrap items-center gap-2">
              <PriorityBadge urgency="high" />
              <PriorityBadge urgency="medium" />
              <PriorityBadge urgency="low" />
              <span className="text-[11px] text-text-muted ml-auto font-mono">
                Zero hallucinated alerts
              </span>
            </div>
          </Card>

          {/* Bento 2: Source-Message Traceability (5 cols) */}
          <Card variant="default" padding="lg" className="md:col-span-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-[var(--radius-icon)] bg-ember/15 border border-ember/35 text-ember-hover flex items-center justify-center">
                <Pin className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-text-primary tracking-tight">
                1-Click Source Message Traceability
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Every finding card retains its exact <code className="font-mono text-text-primary">sourceMessageId</code>. Click any alert, decision, or task to scroll the timeline directly to the source message—or inspect surrounding context in Side Panel mode.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-border-default flex items-center justify-between text-xs">
              <span className="text-text-secondary font-mono">
                Timeline + Context Drawer
              </span>
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="text-ember-hover hover:text-warm-highlight font-semibold inline-flex items-center gap-1 focus-ember rounded cursor-pointer"
              >
                <span>Try in workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>

          {/* Bento 3: Decisions & Commitments (4 cols) */}
          <Card variant="default" padding="md" className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <CategoryBadge category="decision" />
            </div>
            <h3 className="text-base font-bold text-text-primary">
              Decisions & Approvals
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Isolates consensus statements, architectural sign-offs, and confirmed rollback or release choices so you know what the team agreed on while you were away.
            </p>
          </Card>

          {/* Bento 4: Action Items & Deadlines (4 cols) */}
          <Card variant="default" padding="md" className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category="action_item" />
              <CategoryBadge category="deadline" />
            </div>
            <h3 className="text-base font-bold text-text-primary">
              Interactive Task Checklist & Deadlines
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Extracts assigned action items (<code className="font-mono text-text-primary">@assignee</code>) and temporal targets (EOD, specific hours, dates) into a checkable task list you can export as GitHub-flavored Markdown.
            </p>
          </Card>

          {/* Bento 5: Warm Ivory Contrast Card — Privacy & Honest Architecture (4 cols) */}
          <Card variant="ivory" padding="md" className="md:col-span-4 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-void text-text-primary text-[10px] font-mono font-semibold">
                <Lock className="w-2.5 h-2.5 text-ember-hover" />
                PRIVACY & HONESTY FIRST
              </div>
              <h3 className="text-base font-extrabold text-text-on-ivory tracking-tight">
                Deterministic by Default. Zero Unconsented Uploads.
              </h3>
              <p className="text-xs text-text-on-ivory/80 leading-relaxed">
                Local imports run 100% in your browser via <code className="font-mono font-semibold">@missed/engine</code>. We never disguise regex heuristics as generative AI.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-text-on-ivory/15 flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-text-on-ivory/70">
                Chrome MV3 Prototype Included
              </span>
              <button
                type="button"
                onClick={onOpenAbout}
                className="font-bold text-ember hover:underline cursor-pointer"
              >
                Read disclosure →
              </button>
            </div>
          </Card>
        </div>
      </section>

      {/* =====================================================================
          3. Footer
         ===================================================================== */}
      <footer className="border-t border-border-default bg-canvas/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-ember/15 border border-ember/40 flex items-center justify-center text-ember-hover">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-text-primary">Missed.</span>{' '}
              <span className="text-text-muted">— What Did I Miss?</span>
              <p className="text-[11px] text-text-muted mt-0.5">
                Shared <code className="font-mono">@missed/engine</code> • React 19 • Tailwind CSS v4 • Chrome MV3 Side Panel Prototype
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onOpenWorkspace}
              className="hover:text-text-primary transition-colors cursor-pointer"
            >
              Launch Workspace
            </button>
            <button
              type="button"
              onClick={onTriggerUpload}
              className="hover:text-text-primary transition-colors cursor-pointer"
            >
              Import Chat Export
            </button>
            <button
              type="button"
              onClick={onOpenAbout}
              className="hover:text-text-primary transition-colors cursor-pointer"
            >
              Privacy & Architecture
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
