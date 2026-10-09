import test from 'node:test';
import assert from 'node:assert';
import { SAMPLE_MESSAGES } from '../src/data/sampleConversation.ts';
import { analyzeConversation } from '../src/heuristics/analyzer.ts';

test('sourceLinking - all findings in sample conversation link to valid source messages', () => {
  const analysis = analyzeConversation(SAMPLE_MESSAGES);
  const messageMap = new Map(SAMPLE_MESSAGES.map((m) => [m.id, m]));

  assert.ok(analysis.findings.length > 0, 'Analysis must yield findings');

  for (const finding of analysis.findings) {
    // 1. Must have a sourceMessageId
    assert.ok(finding.sourceMessageId, `Finding ${finding.id} must have sourceMessageId`);

    // 2. Source message must exist in the conversation
    const sourceMsg = messageMap.get(finding.sourceMessageId);
    assert.ok(
      sourceMsg,
      `Finding ${finding.id} references sourceMessageId ${finding.sourceMessageId} which does not exist`
    );

    // 3. Sender must match
    assert.strictEqual(
      finding.sender,
      sourceMsg.sender,
      `Finding ${finding.id} sender "${finding.sender}" does not match source sender "${sourceMsg.sender}"`
    );

    // 4. Source text must contain the finding snippet
    assert.strictEqual(
      sourceMsg.text,
      finding.snippet,
      `Finding snippet must match source message text`
    );
  }
});

test('sourceLinking - maintains message link fidelity across custom message streams', () => {
  const customMessages = [
    {
      id: 'custom-101',
      sender: 'Alice',
      text: 'Good morning, starting standup.',
      raw: '...',
      lineIndex: 0,
    },
    {
      id: 'custom-102',
      sender: 'Bob',
      text: 'CRITICAL: Production server is down, urgent fix needed!',
      raw: '...',
      lineIndex: 1,
    },
    {
      id: 'custom-103',
      sender: 'Charlie',
      text: 'Decision: We approved rolling back the deployment.',
      raw: '...',
      lineIndex: 2,
    },
  ];

  const analysis = analyzeConversation(customMessages);
  assert.strictEqual(analysis.findings.length, 2);

  const urgentFinding = analysis.findings.find((f) => f.category === 'urgent');
  assert.ok(urgentFinding);
  assert.strictEqual(urgentFinding?.sourceMessageId, 'custom-102');

  const decisionFinding = analysis.findings.find((f) => f.category === 'decision');
  assert.ok(decisionFinding);
  assert.strictEqual(decisionFinding?.sourceMessageId, 'custom-103');
});

