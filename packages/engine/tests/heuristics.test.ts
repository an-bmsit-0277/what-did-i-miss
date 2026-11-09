import test from 'node:test';
import assert from 'node:assert';
import {
  analyzeConversation,
  detectUrgency,
  detectDecision,
  detectDeadline,
  detectActionItem,
  detectMention,
  SAMPLE_MESSAGES,
  type ParsedMessage,
} from '../src/index.ts';

const makeMsg = (id: string, sender: string, text: string, timestamp?: string): ParsedMessage => ({
  id,
  sender,
  text,
  timestamp,
  raw: text,
  lineIndex: 0,
});

test('engine/heuristics - deterministic detectors set analyzer to deterministic', () => {
  const urg = detectUrgency(makeMsg('1', 'Maya', 'CRITICAL: database outage'));
  assert.ok(urg);
  assert.strictEqual(urg.analyzer, 'deterministic');
  assert.strictEqual(urg.category, 'urgent');

  const dec = detectDecision(makeMsg('2', 'Maya', 'Decision: We approved the rollback'));
  assert.ok(dec);
  assert.strictEqual(dec.analyzer, 'deterministic');
  assert.strictEqual(dec.category, 'decision');

  const dl = detectDeadline(makeMsg('3', 'Sam', 'Deadline is 11:15 AM'));
  assert.ok(dl);
  assert.strictEqual(dl.analyzer, 'deterministic');
  assert.strictEqual(dl.category, 'deadline');

  const act = detectActionItem(makeMsg('4', 'Leo', 'Action item: @Alex deploy the patch'));
  assert.ok(act);
  assert.strictEqual(act.analyzer, 'deterministic');
  assert.strictEqual(act.category, 'action_item');

  const men = detectMention(makeMsg('5', 'Priya', '@Leo can you confirm?'));
  assert.ok(men);
  assert.strictEqual(men.analyzer, 'deterministic');
  assert.strictEqual(men.category, 'mention');
});

test('engine/heuristics - priority scoring orders findings by urgency and relevanceScore', () => {
  const messages: ParsedMessage[] = [
    makeMsg('m1', 'Priya', 'FYI @Leo thanks for the update', '09:00'),
    makeMsg('m2', 'Leo', 'I will update the status page', '09:01'),
    makeMsg('m3', 'Maya', 'Decision: We agreed to postpone cutover', '09:02'),
    makeMsg('m4', 'Maya', 'BLOCKER: staging webhook returning 500 internal server error', '09:03'),
  ];

  const analysis = analyzeConversation(messages);
  assert.ok(analysis.findings.length >= 4);

  // First finding must be the urgent blocker (high urgency, relevanceScore 95)
  assert.strictEqual(analysis.findings[0].category, 'urgent');
  assert.strictEqual(analysis.findings[0].sourceMessageId, 'm4');

  // Every finding must default to deterministic analyzer
  for (const f of analysis.findings) {
    assert.strictEqual(f.analyzer, 'deterministic');
  }
});

test('engine/heuristics - source-message linking integrity on SAMPLE_MESSAGES', () => {
  const analysis = analyzeConversation(SAMPLE_MESSAGES);
  const byId = new Map(SAMPLE_MESSAGES.map((m) => [m.id, m]));

  assert.strictEqual(SAMPLE_MESSAGES.length, 20);
  assert.ok(analysis.findings.length > 0);

  for (const finding of analysis.findings) {
    const src = byId.get(finding.sourceMessageId);
    assert.ok(src, `Source message ${finding.sourceMessageId} must exist`);
    assert.strictEqual(finding.sender, src.sender);
    assert.strictEqual(finding.snippet, src.text);
    assert.strictEqual(finding.analyzer, 'deterministic');
  }
});

