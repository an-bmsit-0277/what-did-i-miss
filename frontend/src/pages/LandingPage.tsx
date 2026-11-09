import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SAMPLE_MESSAGES,
  analyzeConversation,
  type ConversationAnalysis,
} from '@missed/engine';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Database,
  FileText,
  Lock,
  LogOut,
  Menu,
  Pin,
  Play,
  X,
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

// -----------------------------------------------------------------------------
// Hero Slide Visual Components (Dark, Cinematic, Conversation-Themed SVGs)
// -----------------------------------------------------------------------------

const SlideVisualOne: React.FC = () => (
  <svg
    viewBox="0 0 1600 900"
    preserveAspectRatio="xMidYMid slice"
    className="w-full h-full object-cover"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="s1-ember-bloom" cx="65%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#FF521B" stopOpacity="0.16" />
        <stop offset="45%" stopColor="#E8952F" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#0B0A08" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="s1-dark-vignette" cx="50%" cy="50%" r="70%">
        <stop offset="40%" stopColor="#0B0A08" stopOpacity="0" />
        <stop offset="100%" stopColor="#0B0A08" stopOpacity="0.85" />
      </radialGradient>
    </defs>

    {/* Deep Charcoal Ground */}
    <rect width="100%" height="100%" fill="#0B0A08" />

    {/* Concentric Editorial Signal Rings */}
    <g stroke="rgba(255, 255, 255, 0.04)" fill="none" strokeWidth="1">
      <circle cx="1050" cy="400" r="180" strokeDasharray="3 6" />
      <circle cx="1050" cy="400" r="320" />
      <circle cx="1050" cy="400" r="480" strokeDasharray="4 8" />
      <circle cx="1050" cy="400" r="660" />
    </g>

    {/* Luminous Ember/Amber Core Bloom */}
    <circle cx="1050" cy="400" r="540" fill="url(#s1-ember-bloom)" />

    {/* Constellation of Conversation Nodes and Connection Threads */}
    <g stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1">
      <line x1="780" y1="280" x2="980" y2="340" />
      <line x1="980" y1="340" x2="1140" y2="260" />
      <line x1="980" y1="340" x2="1080" y2="480" />
      <line x1="1080" y1="480" x2="1280" y2="440" />
      <line x1="1080" y1="480" x2="940" y2="580" />
      <line x1="940" y1="580" x2="820" y2="480" />
      <line x1="820" y1="480" x2="780" y2="280" />
      <line x1="1140" y1="260" x2="1320" y2="320" />
    </g>

    {/* Active Blocker & Decision Vector Lines */}
    <line
      x1="980"
      y1="340"
      x2="1080"
      y2="480"
      stroke="#FF521B"
      strokeWidth="1.5"
      strokeOpacity="0.6"
    />
    <line
      x1="1080"
      y1="480"
      x2="1280"
      y2="440"
      stroke="#E8952F"
      strokeWidth="1.5"
      strokeOpacity="0.5"
    />

    {/* Glowing Nodes */}
    <circle cx="780" cy="280" r="4" fill="#FAF7F2" opacity="0.4" />
    <circle cx="980" cy="340" r="6" fill="#FF521B" />
    <circle cx="980" cy="340" r="14" fill="#FF521B" opacity="0.2" />
    <circle cx="1140" cy="260" r="4" fill="#FAF7F2" opacity="0.5" />
    <circle cx="1080" cy="480" r="7" fill="#E8952F" />
    <circle cx="1080" cy="480" r="18" fill="#E8952F" opacity="0.18" />
    <circle cx="1280" cy="440" r="5" fill="#FAF7F2" opacity="0.6" />
    <circle cx="940" cy="580" r="4" fill="#FAF7F2" opacity="0.4" />
    <circle cx="820" cy="480" r="4" fill="#FAF7F2" opacity="0.3" />
    <circle cx="1320" cy="320" r="4" fill="#FAF7F2" opacity="0.4" />

    {/* Fine Technical Annotations */}
    <text x="996" y="336" fill="#FAF7F2" opacity="0.4" fontSize="10" fontFamily="JetBrains Mono, monospace">
      [SIG: URGENT_BLOCKER]
    </text>
    <text x="1096" y="476" fill="#E8952F" opacity="0.6" fontSize="10" fontFamily="JetBrains Mono, monospace">
      [SIG: DECISION_REVERT]
    </text>

    {/* Vignette Overlay */}
    <rect width="100%" height="100%" fill="url(#s1-dark-vignette)" />
  </svg>
);

const SlideVisualTwo: React.FC = () => (
  <svg
    viewBox="0 0 1600 900"
    preserveAspectRatio="xMidYMid slice"
    className="w-full h-full object-cover"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="s2-noise-sweep" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#0B0A08" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#0E0C0A" stopOpacity="0.4" />
        <stop offset="85%" stopColor="#FF521B" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#0B0A08" stopOpacity="0.8" />
      </linearGradient>
      <radialGradient id="s2-amber-glow" cx="72%" cy="45%" r="45%">
        <stop offset="0%" stopColor="#E8952F" stopOpacity="0.18" />
        <stop offset="60%" stopColor="#FF521B" stopOpacity="0.04" />
        <stop offset="100%" stopColor="#0B0A08" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Deep Charcoal Ground */}
    <rect width="100%" height="100%" fill="#0B0A08" />
    <rect width="100%" height="100%" fill="url(#s2-noise-sweep)" />
    <circle cx="1150" cy="400" r="500" fill="url(#s2-amber-glow)" />

    {/* Horizon Reference Grid */}
    <g stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1">
      <line x1="0" y1="450" x2="1600" y2="450" />
      <line x1="0" y1="350" x2="1600" y2="350" strokeDasharray="4 8" />
      <line x1="0" y1="550" x2="1600" y2="550" strokeDasharray="4 8" />
    </g>

    {/* Frequency Bars Transforming from Turbulent Noise to Sorted Signals */}
    {Array.from({ length: 48 }).map((_, i) => {
      const x = 500 + i * 22;
      // Heights start chaotic on left, resolve to structured harmonic pulses on right
      const rawFactor = i < 20 ? Math.sin(i * 1.7) * 90 + 30 : Math.sin((i - 20) * 0.4) * 140 + 60;
      const height = Math.max(15, Math.abs(rawFactor));
      const opacity = i < 20 ? 0.08 + (i / 20) * 0.15 : 0.25 + ((i - 20) / 28) * 0.55;
      const isAccent = i > 30 && i % 4 === 0;

      return (
        <rect
          key={i}
          x={x}
          y={450 - height / 2}
          width="5"
          height={height}
          rx="2.5"
          fill={isAccent ? '#FF521B' : i > 25 ? '#FAF7F2' : 'rgba(255, 255, 255, 0.3)'}
          opacity={isAccent ? 0.8 : opacity}
        />
      );
    })}

    {/* Editorial Technical Readouts */}
    <text x="520" y="320" fill="#FAF7F2" opacity="0.3" fontSize="10" fontFamily="JetBrains Mono, monospace">
      INCOMING UNREAD STREAM: 1,482 EVENTS/MIN
    </text>
    <text x="1160" y="320" fill="#E8952F" opacity="0.7" fontSize="10" fontFamily="JetBrains Mono, monospace">
      EXTRACTED SIGNALS: 5 CRITICAL ARTIFACTS
    </text>
  </svg>
);

const SlideVisualThree: React.FC = () => (
  <svg
    viewBox="0 0 1600 900"
    preserveAspectRatio="xMidYMid slice"
    className="w-full h-full object-cover"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="s3-bloom" cx="70%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FF521B" stopOpacity="0.14" />
        <stop offset="50%" stopColor="#E8952F" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#0B0A08" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="s3-timeline-fade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0B0A08" stopOpacity="0.9" />
        <stop offset="30%" stopColor="#FAF7F2" stopOpacity="0.12" />
        <stop offset="70%" stopColor="#FAF7F2" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#0B0A08" stopOpacity="0.9" />
      </linearGradient>
    </defs>

    {/* Deep Charcoal Ground */}
    <rect width="100%" height="100%" fill="#0B0A08" />
    <circle cx="1100" cy="450" r="520" fill="url(#s3-bloom)" />

    {/* Layered Horizontal Thread Rails */}
    <g stroke="url(#s3-timeline-fade)" strokeWidth="1">
      <line x1="300" y1="280" x2="1500" y2="280" />
      <line x1="350" y1="380" x2="1500" y2="380" />
      <line x1="280" y1="480" x2="1500" y2="480" strokeWidth="1.5" />
      <line x1="400" y1="580" x2="1500" y2="580" />
      <line x1="320" y1="680" x2="1500" y2="680" strokeDasharray="4 8" />
    </g>

    {/* Vertical Synchronization Rungs connecting channels */}
    <g stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="3 6">
      <line x1="680" y1="240" x2="680" y2="720" />
      <line x1="920" y1="240" x2="920" y2="720" />
      <line x1="1180" y1="240" x2="1180" y2="720" />
      <line x1="1380" y1="240" x2="1380" y2="720" />
    </g>

    {/* Thread Timeline Anchors */}
    <g fill="#0E0C0A" stroke="#FAF7F2" strokeWidth="1">
      <rect x="672" y="272" width="16" height="16" rx="4" opacity="0.5" />
      <rect x="912" y="472" width="16" height="16" rx="4" stroke="#FF521B" fill="#FF521B" />
      <circle cx="920" cy="480" r="18" fill="#FF521B" opacity="0.25" stroke="none" />
      <rect x="1172" y="372" width="16" height="16" rx="4" stroke="#E8952F" />
      <rect x="1372" y="572" width="16" height="16" rx="4" opacity="0.5" />
    </g>

    {/* Platform Thread Badges in Margin */}
    <text x="320" y="274" fill="#FAF7F2" opacity="0.4" fontSize="11" fontFamily="JetBrains Mono, monospace">
      01 // WHATSAPP WAR ROOM
    </text>
    <text x="370" y="374" fill="#FAF7F2" opacity="0.4" fontSize="11" fontFamily="JetBrains Mono, monospace">
      02 // SLACK ARCHITECTURE
    </text>
    <text x="300" y="474" fill="#FF521B" opacity="0.8" fontSize="11" fontFamily="JetBrains Mono, monospace">
      03 // INCIDENT DISPATCH [ACTIVE]
    </text>
    <text x="420" y="574" fill="#FAF7F2" opacity="0.4" fontSize="11" fontFamily="JetBrains Mono, monospace">
      04 // MESSENGER DISCUSSIONS
    </text>
  </svg>
);

// -----------------------------------------------------------------------------
// Hero Slide Configurations adhering strictly to Prompt Copy
// -----------------------------------------------------------------------------
interface HeroSlide {
  id: number;
  eyebrow: string;
  headlinePrefix: string;
  headlineItalic: string;
  caption: string;
  subtext: string;
  animationClass: string;
  VisualComponent: React.FC;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    eyebrow: 'CONVERSATION INTELLIGENCE.',
    headlinePrefix: 'NEVER MISS',
    headlineItalic: 'what matters.',
    caption: 'DETERMINISTIC CATCH-UP TRIAGE — PRIVATE BY DESIGN.',
    subtext:
      'Inspect raw chat exports on your device to isolate urgent blockers, verified decisions, assigned tasks, and temporal deadlines—anchoring every signal to its original source message.',
    animationClass: 'animate-ken-burns-1',
    VisualComponent: SlideVisualOne,
  },
  {
    id: 2,
    eyebrow: 'FROM NOISE TO SIGNAL.',
    headlinePrefix: 'CATCH UP',
    headlineItalic: 'in minutes.',
    caption: 'IMPORT · TRIAGE · FOLLOW UP.',
    subtext:
      'Filter hundreds of conversational hours into structured, auditable catch-up timelines. Zero hallucinations, zero cloud dependencies for local triage.',
    animationClass: 'animate-ken-burns-2',
    VisualComponent: SlideVisualTwo,
  },
  {
    id: 3,
    eyebrow: 'EVERY THREAD, ACCOUNTED FOR.',
    headlinePrefix: 'YOUR CHATS,',
    headlineItalic: 'organized.',
    caption: 'WHATSAPP · MESSENGER · LIVE CHAT',
    subtext:
      'Ingest WhatsApp, Slack, and developer log exports into unified, tenant-isolated private workspaces with 1-click citation traceability.',
    animationClass: 'animate-ken-burns-3',
    VisualComponent: SlideVisualThree,
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { status, user, signOut } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-rotating Ken Burns carousel (slideshow rotates every ~5.5s)
  useEffect(() => {
    // Respect prefers-reduced-motion: stay static on slide 0
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Keyboard navigation for carousel slides
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    } else if (e.key === 'ArrowLeft') {
      setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    }
  }, []);

  // Deterministic on-device sample analysis
  const sampleAnalysis: ConversationAnalysis = useMemo(() => {
    return analyzeConversation(SAMPLE_MESSAGES);
  }, []);

  const previewFindings = sampleAnalysis.findings.slice(0, 3);

  const handleInspectFinding = (sourceMessageId: string) => {
    navigate(`/demo?highlight=${sourceMessageId}`);
  };

  const currentSlide = HERO_SLIDES[activeSlide];

  return (
    <div
      className="min-h-screen bg-[#0B0A08] text-text-primary flex flex-col font-sans selection:bg-ember/30 selection:text-warm-highlight"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Missed. Conversation Intelligence"
    >
      {/* =====================================================================
          1. Minimal Top Nav (Matching Vision/Sandhill Editorial Reference)
         ===================================================================== */}
      <header className="sticky top-0 z-40 bg-[#0B0A08]/85 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Minimal Wordmark & Kicker */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus-ember rounded py-1"
          >
            <span
              className="w-2.5 h-2.5 rounded-full bg-ember shadow-[0_0_10px_rgba(255,82,27,0.7)] group-hover:scale-110 transition-transform"
              aria-hidden="true"
            />
            <div className="flex flex-col">
              <span className="font-serif italic text-xl tracking-tight text-text-primary group-hover:text-ember-hover transition-colors">
                Missed<span className="text-ember not-italic">.</span>
              </span>
              <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-text-muted hidden sm:inline">
                Never miss what matters
              </span>
            </div>
          </Link>

          {/* Right: Uppercase Editorial Links with Hairline Underline on Hover */}
          <nav
            aria-label="Editorial navigation"
            className="hidden md:flex items-center gap-8 text-[11px] tracking-[0.16em] uppercase font-medium"
          >
            <a
              href="#narrative"
              className="nav-link-underline text-text-secondary hover:text-text-primary focus-ember py-1"
            >
              How It Works
            </a>
            <a
              href="#signals"
              className="nav-link-underline text-text-secondary hover:text-text-primary focus-ember py-1"
            >
              Signals
            </a>
            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="nav-link-underline text-text-secondary hover:text-text-primary focus-ember py-1 cursor-pointer"
            >
              Privacy & Model
            </button>
            <Link
              to="/demo"
              className="nav-link-underline text-text-secondary hover:text-text-primary focus-ember py-1"
            >
              Workspace
            </Link>
          </nav>

          {/* Right Actions: Sign In / Get Started */}
          <div className="hidden sm:flex items-center gap-4">
            {status === 'authenticated' && user ? (
              <div className="flex items-center gap-3">
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
                  className="nav-link-underline text-[11px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary px-2 py-1 font-medium focus-ember"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2.5 group focus-ember rounded-full pl-2"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary group-hover:text-ember-hover transition-colors">
                    Get Started
                  </span>
                  <span
                    className="btn-circle-action w-7 h-7 group-hover:scale-105"
                    aria-hidden="true"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg focus-ember"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.08] bg-[#0B0A08]/95 px-6 py-5 space-y-4 text-xs font-mono tracking-widest uppercase">
            <a
              href="#narrative"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-text-secondary hover:text-text-primary py-1"
            >
              How It Works
            </a>
            <a
              href="#signals"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-text-secondary hover:text-text-primary py-1"
            >
              Signals
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsAboutOpen(true);
              }}
              className="block text-left w-full text-text-secondary hover:text-text-primary py-1"
            >
              Privacy & Model
            </button>
            <Link
              to="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#E8952F] py-1"
            >
              Explore Demo (No Account)
            </Link>
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-2 text-text-primary font-semibold"
              >
                <span>Get Started</span>
                <span className="btn-circle-action w-6 h-6">
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          2. Full-Bleed Cinematic Hero Section (~90vh+) with Ken Burns Slides
         ===================================================================== */}
      <section
        className="relative min-h-[90vh] lg:min-h-[94vh] flex flex-col justify-between overflow-hidden bg-[#0B0A08] border-b border-white/[0.08]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-label="Featured conversation triage gallery"
      >
        {/* Fixed Film-Grain Overlay: Pointer-events-none SVG feTurbulence noise at ~5% opacity */}
        <div className="film-grain" aria-hidden="true" />

        {/* 3 Layered Rotating Slides with Ken Burns Animation & 1.2s Crossfade */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === activeSlide;
            const VisualComponent = slide.VisualComponent;

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1200 ease-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {/* Slow Ken Burns scale/pan container */}
                <div
                  className={`w-full h-full transform ${
                    isActive ? slide.animationClass : 'scale-100'
                  }`}
                >
                  <VisualComponent />
                </div>
              </div>
            );
          })}
        </div>

        {/* Dark Scrim Overlay: Ensures Hero Typography Remains 100% Readable Across Breakpoints */}
        <div
          className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#0B0A08] via-[#0B0A08]/75 to-[#0B0A08]/40"
          aria-hidden="true"
        />

        {/* Hero Main Content Area */}
        <div className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-8 flex-1 flex flex-col justify-center">
          {/* Animated Headline Container: Zooms scale(0.94) -> 1 + fade on slide transition */}
          <div key={activeSlide} className="max-w-4xl space-y-4 sm:space-y-6 animate-headline-zoom">
            {/* Eyebrow / Kicker: 11-12px uppercase, letter-spacing ~0.28em, amber */}
            <div className="inline-flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8952F] shadow-[0_0_8px_rgba(232,149,47,0.8)]" />
              <span className="eyebrow-editorial">
                {currentSlide.eyebrow}
              </span>
            </div>

            {/* Oversized Serif Headline: clamp(3.5rem, 9vw, 8.5rem), tight leading, letter-spacing -0.02em */}
            <h1 className="hero-headline font-serif font-normal text-text-primary tracking-tight text-balance">
              {currentSlide.headlinePrefix}{' '}
              <span className="italic font-normal text-[#E8952F] block sm:inline">
                {currentSlide.headlineItalic}
              </span>
            </h1>

            {/* Subtext Paragraph */}
            <p className="text-sm sm:text-base text-text-secondary max-w-2xl font-normal leading-relaxed">
              {currentSlide.subtext}
            </p>

            {/* Primary Action Controls */}
            <div className="flex flex-wrap items-center gap-4 pt-3 sm:pt-4">
              <Link
                to="/signup"
                className="flex items-center gap-3 group focus-ember rounded-full"
              >
                <span
                  className="btn-circle-action group-hover:scale-105"
                  aria-hidden="true"
                >
                  <ArrowRight className="w-4 h-4" />
                </span>
                <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-text-primary group-hover:text-ember-hover transition-colors">
                  Create Personal Workspace
                </span>
              </Link>

              <div className="h-4 w-px bg-white/[0.12] hidden sm:block" />

              <Link
                to="/demo"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.1] bg-[#0E0C0A]/80 hover:bg-[#141210] hover:border-white/[0.18] text-xs font-mono tracking-wider text-text-secondary hover:text-text-primary transition-all focus-ember"
              >
                <Play className="w-3 h-3 text-ember-hover fill-current" />
                <span>Launch Interactive Demo</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Bottom Bar: Caption (left), Slide Selector (center), Circular Down-Arrow (right) */}
        <div className="relative z-20 border-t border-white/[0.08] bg-[#0B0A08]/60 backdrop-blur-xs py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Bottom-Left: Caption in tiny uppercase white/50 */}
            <div className="min-w-0 flex-1">
              <p
                key={`caption-${activeSlide}`}
                className="text-[10px] sm:text-[11px] font-mono tracking-[0.28em] uppercase text-white/50 truncate animate-fade-in"
              >
                {currentSlide.caption}
              </p>
            </div>

            {/* Bottom-Center: Minimalist Slide Switcher (01 / 02 / 03) */}
            <div
              className="flex items-center gap-2 sm:gap-4 shrink-0"
              role="tablist"
              aria-label="Gallery slides"
            >
              {HERO_SLIDES.map((slide, idx) => {
                const isCurrent = idx === activeSlide;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    aria-label={`Slide 0${idx + 1}`}
                    onClick={() => setActiveSlide(idx)}
                    className={`font-mono text-[11px] tracking-widest px-2 py-1 transition-all focus-ember rounded cursor-pointer ${
                      isCurrent
                        ? 'text-text-primary font-bold border-b border-ember'
                        : 'text-text-muted hover:text-text-secondary border-b border-transparent'
                    }`}
                  >
                    0{idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Bottom-Right: Orange Circular Down-Arrow Button */}
            <div className="shrink-0 pl-2">
              <a
                href="#narrative"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('narrative')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-circle-action group focus-ember"
                aria-label="Scroll to how Missed. works"
              >
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. Below the Fold: 4-Step Editorial Narrative Sequence (01–04)
         ===================================================================== */}
      <section
        id="narrative"
        aria-label="How Missed. works"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 space-y-24"
      >
        {/* Narrative Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8952F]" />
            <span className="eyebrow-editorial">
              The Catch-Up Sequence
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-text-primary tracking-tight">
            How Missed. transforms raw chat noise into structured clarity.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Standard conversational summaries strip away accountability and nuance. Missed. decomposes raw conversation streams into verified, deep-linked decision records.
          </p>
        </div>

        {/* Step 01: Ingestion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center border-t border-white/[0.08] pt-12">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-serif text-5xl sm:text-7xl font-light text-[#E8952F] tracking-tight block">
              01
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-normal text-text-primary">
              Import raw conversation streams.
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Drop in exported <code className="font-mono text-text-primary">.txt</code> or{' '}
              <code className="font-mono text-text-primary">.json</code> files from WhatsApp, Slack channels, or developer incident war rooms. All parsing occurs directly in browser memory without sending private logs to remote LLM endpoints.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-text-muted font-mono">
              <span className="inline-flex items-center gap-1.5 text-text-secondary">
                <FileText className="w-3.5 h-3.5 text-ember-hover" />
                TXT & JSON Standard
              </span>
              <span>•</span>
              <span>10MB In-Memory Limit Guard</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E0C0A] p-5 sm:p-6 space-y-3 font-mono text-xs shadow-[var(--shadow-elevated)] motion-card-lift">
              <div className="flex items-center justify-between text-text-muted text-[11px] pb-2 border-b border-white/[0.08]">
                <span>[Raw Chat Export Fragment]</span>
                <span>UTF-8 • Stream Parser</span>
              </div>
              <p className="text-text-muted leading-relaxed">
                <span className="text-text-secondary">[08:24] Sarah (Lead):</span> Starting payment gateway switchover now. All hands on standby.
              </p>
              <p className="text-[#FF7A5C] bg-semantic-urgent/10 p-2.5 rounded-lg border border-semantic-urgent/30 leading-relaxed">
                <span className="text-text-secondary">[08:31] Marcus:</span> BLOCKER: Webhook signature verification failing on v2 endpoints. 14% failure rate!
              </p>
              <p className="text-[#7DD3FC] bg-semantic-decision/10 p-2.5 rounded-lg border border-semantic-decision/30 leading-relaxed">
                <span className="text-text-secondary">[08:36] Elena (CTO):</span> Rollback approved. Revert immediately to v1 endpoints until fixed.
              </p>
            </div>
          </div>
        </div>

        {/* Step 02: Extraction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center border-t border-white/[0.08] pt-12">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-serif text-5xl sm:text-7xl font-light text-[#E8952F] tracking-tight block">
              02
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-normal text-text-primary">
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

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card variant="featured" padding="md" className="space-y-2.5 bg-[#0E0C0A] border-white/[0.08] motion-card-lift">
              <div className="flex items-center justify-between">
                <Badge variant="urgent" icon={<AlertTriangle className="w-3 h-3" />}>
                  P0 Outage
                </Badge>
                <PriorityBadge urgency="high" />
              </div>
              <h4 className="text-xs font-bold text-text-primary">
                Webhook signature failure
              </h4>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                14% transaction drop on v2 payment gateway endpoints.
              </p>
            </Card>

            <Card variant="default" padding="md" className="space-y-2.5 bg-[#0E0C0A] border-white/[0.08] motion-card-lift">
              <div className="flex items-center justify-between">
                <CategoryBadge category="decision" />
                <span className="text-[10px] font-mono text-text-muted">Sign-off</span>
              </div>
              <h4 className="text-xs font-bold text-text-primary">
                Rollback to v1 approved
              </h4>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Elena (CTO) authorized immediate rollback to maintain uptime.
              </p>
            </Card>
          </div>
        </div>

        {/* Step 03: 1-Click Citation Trace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center border-t border-white/[0.08] pt-12">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-serif text-5xl sm:text-7xl font-light text-[#E8952F] tracking-tight block">
              03
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-normal text-text-primary">
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
            <div className="rounded-2xl border border-ember/40 bg-[#0E0C0A] p-5 shadow-[0_0_24px_rgba(255,82,27,0.12)] space-y-3 motion-card-lift">
              <div className="flex items-center gap-2 text-xs font-mono text-ember-hover">
                <Pin className="w-3.5 h-3.5" />
                <span>Deep-Linked Timeline Target (#msg-004)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080706] border border-white/[0.08]">
                <div className="flex items-center justify-between text-[11px] text-text-muted mb-1.5 font-mono">
                  <span className="font-bold text-text-primary">Marcus (DevOps)</span>
                  <span>08:31:14 UTC</span>
                </div>
                <p className="text-xs text-text-primary leading-relaxed">
                  &ldquo;BLOCKER: Webhook signature verification failing on v2 endpoints. 14% failure rate! Investigating secret mismatch.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 04: Workspace & Private Persistence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center border-t border-white/[0.08] pt-12">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-serif text-5xl sm:text-7xl font-light text-[#E8952F] tracking-tight block">
              04
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-normal text-text-primary">
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
            <Card variant="default" padding="lg" className="space-y-4 bg-[#141210] border-white/[0.08] shadow-[var(--shadow-elevated)] motion-card-lift">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-void text-text-primary text-[10px] font-mono font-semibold border border-white/[0.08]">
                <Lock className="w-2.5 h-2.5 text-ember-hover" />
                POSTGRESQL ROW-LEVEL SECURITY
              </div>
              <h4 className="font-serif text-xl sm:text-2xl font-normal text-text-primary">
                Tenant-isolated data architecture.
              </h4>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Your conversations, messages, and task checkmarks are scoped exclusively to your authenticated identity. No other tenant can query your records, and local guest sessions never touch the database.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-text-muted font-mono">
                <Database className="w-3.5 h-3.5 text-ember-hover" />
                <span>Supabase Auth + PostgreSQL RLS Guard</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. Live Deterministic Signal Preview Section
         ===================================================================== */}
      <section
        id="signals"
        aria-label="Interactive signals preview"
        className="border-t border-white/[0.08] bg-[#0E0C0A] py-16 sm:py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8952F]" />
                <span className="eyebrow-editorial">
                  Live Engine Verification
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-text-primary tracking-tight">
                Extracted Signals from Sample Incident War Room
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <EngineModeBadge />
              <Link
                to="/demo"
                className="text-xs font-mono uppercase tracking-wider text-ember-hover hover:text-warm-highlight flex items-center gap-1"
              >
                <span>Full Interactive Demo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {previewFindings.map((finding) => (
              <button
                key={finding.id}
                type="button"
                onClick={() => handleInspectFinding(finding.sourceMessageId)}
                className="text-left rounded-2xl bg-[#080706] hover:bg-[#12100E] border border-white/[0.08] hover:border-ember/45 p-5 transition-all group focus-ember cursor-pointer motion-card-lift space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <CategoryBadge category={finding.category} />
                    <PriorityBadge urgency={finding.urgency} />
                  </div>
                  <span className="text-[10px] font-mono text-ember-hover group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                    Trace <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
                <p className="text-xs text-text-primary font-medium line-clamp-3 leading-snug">
                  {finding.snippet}
                </p>
                <div className="pt-2 border-t border-white/[0.06] text-[10px] text-text-muted font-mono flex items-center justify-between">
                  <span>{finding.sender}</span>
                  <span>{finding.timestamp || ''}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. Cinematic Editorial Call-to-Action Banner
         ===================================================================== */}
      <section className="border-t border-white/[0.08] bg-[#0B0A08] py-20 lg:py-28 text-center px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8952F]" />
            <span className="eyebrow-editorial">
              Ready to catch up?
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-text-primary tracking-tight">
            Stop scrolling unread threads.{' '}
            <span className="italic font-normal text-[#E8952F]">Get the signal.</span>
          </h2>

          <p className="text-xs sm:text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            Import an export file now or try the incident cutover demo. Deterministic, source-linked, and private by default.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
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
          6. Editorial Footer
         ===================================================================== */}
      <footer className="border-t border-white/[0.08] bg-[#080706] py-10 text-xs text-text-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-serif italic text-lg text-text-primary">Missed.</span>
            <span className="text-text-muted font-mono text-[11px]">
              — Conversation Intelligence Workspace
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] font-mono tracking-wider uppercase">
            <Link to="/demo" className="hover:text-text-primary transition-colors">
              Guest Demo
            </Link>
            <Link to="/signup" className="hover:text-text-primary transition-colors">
              Sign Up
            </Link>
            <Link to="/login" className="hover:text-text-primary transition-colors">
              Sign In
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
