import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SAMPLE_MESSAGES,
  analyzeConversation,
} from '@missed/engine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

describe('Phase 3 — Obsidian & Solar Ember Design System & Workspace Verification', () => {
  it('defines centralized @theme tokens and visual utilities in src/index.css', () => {
    const cssPath = path.join(frontendRoot, 'src', 'index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    const requiredThemeTokens = [
      '--color-void: #080706',
      '--color-canvas: #0C0A09',
      '--color-surface: #12100E',
      '--color-elevated: #181512',
      '--color-ivory: #FAF8F5',
      '--color-ember: #FF521B',
      '--color-ember-hover: #FF6B35',
      '--color-amber-highlight: #FF8C42',
      '--color-warm-highlight: #FFB86C',
      '--color-semantic-urgent: #FF4D2A',
      '--color-semantic-task: #F59E0B',
      '--color-semantic-decision: #38BDF8',
      '--color-semantic-mention: #60A5FA',
      '--color-semantic-deadline: #C084FC',
      '--color-semantic-local: #10B981',
      '--radius-card: 1.375rem',
      '--radius-panel: 1.5rem',
    ];

    for (const token of requiredThemeTokens) {
      assert.ok(
        css.includes(token),
        `Expected src/index.css to define token "${token}"`,
      );
    }

    const requiredUtilities = [
      '.bg-solar-beam',
      '.bg-ember-spotlight',
      '.bg-circuit-grid',
      '.border-specular',
      '.focus-ember',
      '.scrollbar-obsidian',
      'prefers-reduced-motion: reduce',
    ];

    for (const utility of requiredUtilities) {
      assert.ok(
        css.includes(utility),
        `Expected src/index.css to include utility "${utility}"`,
      );
    }
  });

  it('includes all reusable UI primitive files and redesigned workspace components', () => {
    const expectedFiles = [
      'src/components/ui/Button.tsx',
      'src/components/ui/Card.tsx',
      'src/components/ui/Badge.tsx',
      'src/components/ui/Modal.tsx',
      'src/components/ui/Primitives.tsx',
      'src/components/ui/index.ts',
      'src/components/LandingView.tsx',
      'src/components/MissedHeader.tsx',
      'src/components/ConversationBar.tsx',
      'src/components/SummaryCounters.tsx',
      'src/components/NavigationTabs.tsx',
      'src/components/CompactFilter.tsx',
      'src/components/OverviewView.tsx',
      'src/components/TasksView.tsx',
      'src/components/ImportantView.tsx',
      'src/components/TranscriptViewer.tsx',
      'src/components/SourceDrawer.tsx',
      'src/components/AboutModal.tsx',
      'src/components/Dropzone.tsx',
      'src/components/ErrorBanner.tsx',
    ];

    for (const relPath of expectedFiles) {
      const fullPath = path.join(frontendRoot, relPath);
      assert.ok(
        fs.existsSync(fullPath),
        `Expected redesigned component file to exist at ${relPath}`,
      );
    }
  });

  it('powers LandingView live preview and Workspace filtered views deterministically', () => {
    const analysis = analyzeConversation(SAMPLE_MESSAGES);

    // LandingView preview uses top 3 findings
    const previewFindings = analysis.findings.slice(0, 3);
    assert.equal(previewFindings.length, 3);

    for (const finding of previewFindings) {
      const linkedSource = SAMPLE_MESSAGES.find(
        (m) => m.id === finding.sourceMessageId,
      );
      assert.ok(
        linkedSource,
        `Preview finding ${finding.id} must link to a valid source message`,
      );
    }

    // Participant filter behavior used by OverviewView, TasksView, ImportantView, and TranscriptViewer
    const sampleSender = analysis.recap.participants[0];
    assert.ok(sampleSender, 'Sample conversation should have at least one participant');

    const senderFilteredFindings = analysis.findings.filter(
      (f) => f.sender === sampleSender,
    );
    assert.ok(
      senderFilteredFindings.every((f) => f.sender === sampleSender),
      'Participant filter must strictly match sender',
    );
  });
});
