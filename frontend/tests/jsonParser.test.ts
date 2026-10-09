import test from 'node:test';
import assert from 'node:assert';
import { parseJsonContent } from '../src/parsers/jsonParser.ts';

test('parseJsonContent - valid array of messages', () => {
  const jsonStr = JSON.stringify([
    { id: '1', sender: 'Alice', text: 'Hello team', timestamp: '2026-10-09 10:00:00' },
    { id: '2', sender: 'Bob', text: 'Hey Alice', timestamp: '2026-10-09 10:01:00' },
  ]);
  const result = parseJsonContent(jsonStr);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messages.length, 2);
  assert.strictEqual(result.messages[0].sender, 'Alice');
  assert.strictEqual(result.messages[1].text, 'Hey Alice');
  assert.strictEqual(result.formatDetected, 'json_standard');
});

test('parseJsonContent - envelope object with messages array', () => {
  const jsonStr = JSON.stringify({
    channel: 'incident-war-room',
    messages: [
      { user: 'Maya Lin', message: 'CRITICAL: payment webhook is down', time: '10:15 AM' },
      { author: 'Leo Chen', content: 'On it', time: '10:16 AM' },
    ],
  });
  const result = parseJsonContent(jsonStr);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messages.length, 2);
  assert.strictEqual(result.messages[0].sender, 'Maya Lin');
  assert.strictEqual(result.messages[0].text, 'CRITICAL: payment webhook is down');
  assert.strictEqual(result.messages[1].sender, 'Leo Chen');
});

test('parseJsonContent - Slack export format with epoch ts and user_profile', () => {
  const jsonStr = JSON.stringify([
    {
      client_msg_id: 'slack-001',
      ts: '1710000000.000100',
      text: 'Action item: deploy fix before EOD',
      user_profile: { real_name: 'Priya Sharma' },
    },
  ]);
  const result = parseJsonContent(jsonStr);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messages.length, 1);
  assert.strictEqual(result.messages[0].sender, 'Priya Sharma');
  assert.strictEqual(result.messages[0].text, 'Action item: deploy fix before EOD');
  assert.strictEqual(result.formatDetected, 'json_slack');
  assert.ok(result.messages[0].timestamp !== undefined);
});

test('parseJsonContent - missing timestamps triggers non-blocking warning', () => {
  const jsonStr = JSON.stringify([
    { sender: 'Sam', text: 'Where is the documentation?' },
  ]);
  const result = parseJsonContent(jsonStr);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messages.length, 1);
  assert.strictEqual(result.messages[0].timestamp, undefined);
  assert.ok(result.warning?.includes('did not have timestamps'));
});

test('parseJsonContent - malformed JSON', () => {
  const result = parseJsonContent('{ invalid json syntax');
  assert.strictEqual(result.success, false);
  assert.ok(result.error?.includes('Malformed JSON'));
});

test('parseJsonContent - empty string and whitespace', () => {
  const result = parseJsonContent('   \n  ');
  assert.strictEqual(result.success, false);
  assert.ok(result.error?.includes('empty'));
});

test('parseJsonContent - empty array', () => {
  const result = parseJsonContent('[]');
  assert.strictEqual(result.success, false);
  assert.ok(result.error?.includes('zero messages'));
});

