import test from 'node:test';
import assert from 'node:assert';
import type { ParsedMessage } from '../src/types/index.ts';
import {
  detectUrgency,
  detectDecision,
  detectDeadline,
  detectActionItem,
  detectMention,
} from '../src/heuristics/detectors.ts';
import { analyzeConversation } from '../src/heuristics/analyzer.ts';

const createMsg = (id: string, sender: string, text: string, timestamp?: string): ParsedMessage => ({
  id,
  sender,
  text,
  timestamp,
  raw: text,
  lineIndex: 0,
});

test('detectUrgency - identifies critical and blocker keywords', () => {
  const msg1 = createMsg('1', 'Maya', 'CRITICAL: payment webhook is returning 500 internal server error');
  const finding1 = detectUrgency(msg1);
  assert.ok(finding1);
  assert.strictEqual(finding1?.category, 'urgent');
  assert.strictEqual(finding1?.urgency, 'high');

  const msg2 = createMsg('2', 'Leo', 'BLOCKER: redis connection pool exhausted');
  const finding2 = detectUrgency(msg2);
  assert.ok(finding2);
  assert.strictEqual(finding2?.category, 'urgent');

  const msg3 = createMsg('3', 'Sam', 'Just normal conversation text');
  const finding3 = detectUrgency(msg3);
  assert.strictEqual(finding3, null);
});

test('detectDecision - identifies approval and consensus statements', () => {
  const msg1 = createMsg('1', 'Maya', 'Decision: We approved delaying the cutover to 3:00 PM');
  const finding1 = detectDecision(msg1);
  assert.ok(finding1);
  assert.strictEqual(finding1?.category, 'decision');

  const msg2 = createMsg('2', 'Alex', 'We agreed to roll back the release');
  const finding2 = detectDecision(msg2);
  assert.ok(finding2);
  assert.strictEqual(finding2?.category, 'decision');
});

test('detectDeadline - extracts due dates and times', () => {
  const msg1 = createMsg('1', 'Sam', 'Deadline for smoke test sign-off is 11:15 AM');
  const finding1 = detectDeadline(msg1);
  assert.ok(finding1);
  assert.strictEqual(finding1?.category, 'deadline');
  assert.strictEqual(finding1?.dueDate, '11:15 AM');

  const msg2 = createMsg('2', 'Leo', 'Must be completed before 10:30 AM');
  const finding2 = detectDeadline(msg2);
  assert.ok(finding2);
  assert.strictEqual(finding2?.dueDate, '10:30 AM');
});

test('detectActionItem - extracts tasks and assignees', () => {
  const msg1 = createMsg('1', 'Maya', 'Action item: @Alex Rivera please deploy the banner fix');
  const finding1 = detectActionItem(msg1);
  assert.ok(finding1);
  assert.strictEqual(finding1?.category, 'action_item');
  assert.strictEqual(finding1?.assignee, 'Alex Rivera');

  const msg2 = createMsg('2', 'Leo', 'I will prepare automated rollback trigger');
  const finding2 = detectActionItem(msg2);
  assert.ok(finding2);
  assert.strictEqual(finding2?.assignee, 'Leo');
});

test('detectMention - identifies direct @mentions and queries', () => {
  const msg1 = createMsg('1', 'Priya', '@Leo Chen can you verify the replica lag?');
  const finding1 = detectMention(msg1);
  assert.ok(finding1);
  assert.strictEqual(finding1?.category, 'mention');
  assert.strictEqual(finding1?.assignee, 'Leo Chen');
});

test('analyzeConversation - aggregates findings and generates recap stats', () => {
  const messages: ParsedMessage[] = [
    createMsg('1', 'Maya', 'Good morning team. Starting migration now.', '09:00:00'),
    createMsg('2', 'Maya', 'CRITICAL: webhook down!', '09:05:00'),
    createMsg('3', 'Leo', 'Decision: We approved delaying release.', '09:10:00'),
    createMsg('4', 'Sam', 'Action item: verify fix before 11:00 AM.', '09:15:00'),
  ];

  const analysis = analyzeConversation(messages);
  assert.strictEqual(analysis.recap.totalMessages, 4);
  assert.strictEqual(analysis.recap.participantCount, 3);
  assert.strictEqual(analysis.stats.urgentCount, 1);
  assert.strictEqual(analysis.stats.decisionCount, 1);
  assert.strictEqual(analysis.stats.actionItemCount, 1);
  assert.strictEqual(analysis.stats.deadlinesCount, 1);
  assert.ok(analysis.recap.summaryBullets.length >= 2);
});

