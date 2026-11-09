import test from 'node:test';
import assert from 'node:assert';
import {
  parseConversation,
  parseJsonContent,
  parseTxtContent,
  MAX_FILE_SIZE_BYTES,
} from '../src/index.ts';

test('engine/parsers - JSON standard array, envelope, and Slack formats', () => {
  const stdRes = parseJsonContent(
    JSON.stringify([
      { id: 'm1', sender: 'Maya', text: 'Starting cutover', timestamp: '2026-10-09 09:00:00' },
      { id: 'm2', sender: 'Leo', text: 'Standby green', timestamp: '2026-10-09 09:01:00' },
    ])
  );
  assert.strictEqual(stdRes.success, true);
  assert.strictEqual(stdRes.formatDetected, 'json_standard');
  assert.strictEqual(stdRes.messages.length, 2);

  const envRes = parseJsonContent(
    JSON.stringify({
      conversation: [{ author: 'Priya', content: 'Any updates?', time: '09:05 AM' }],
    })
  );
  assert.strictEqual(envRes.success, true);
  assert.strictEqual(envRes.messages.length, 1);
  assert.strictEqual(envRes.messages[0].sender, 'Priya');

  const slackRes = parseJsonContent(
    JSON.stringify([
      {
        client_msg_id: 'sl-1',
        ts: '1710000000.000100',
        text: 'CRITICAL: Redis pool exhausted',
        user_profile: { real_name: 'Maya Lin' },
      },
    ])
  );
  assert.strictEqual(slackRes.success, true);
  assert.strictEqual(slackRes.formatDetected, 'json_slack');
  assert.strictEqual(slackRes.messages[0].sender, 'Maya Lin');
});

test('engine/parsers - TXT bracketed, WhatsApp, simple colon, and multiline continuation', () => {
  const bracketed = `[2026-10-09 09:15:22] Maya Lin: Line 1 of message
Continuation line 2
Continuation line 3
[2026-10-09 09:16:00] Leo Chen: Acknowledged.`;
  const brRes = parseTxtContent(bracketed);
  assert.strictEqual(brRes.success, true);
  assert.strictEqual(brRes.formatDetected, 'txt_bracketed');
  assert.strictEqual(brRes.messages.length, 2);
  assert.strictEqual(
    brRes.messages[0].text,
    'Line 1 of message\nContinuation line 2\nContinuation line 3'
  );

  const whatsapp = `10/09/26, 09:15 AM - Maya Lin: Critical issue on staging.
10/09/26, 09:18 AM - Leo Chen: Investigating now.`;
  const waRes = parseTxtContent(whatsapp);
  assert.strictEqual(waRes.success, true);
  assert.strictEqual(waRes.formatDetected, 'txt_whatsapp');
  assert.strictEqual(waRes.messages.length, 2);

  const simpleColon = `Maya Lin: Please check the logs.
Leo Chen: Checking now.`;
  const colRes = parseTxtContent(simpleColon);
  assert.strictEqual(colRes.success, true);
  assert.strictEqual(colRes.formatDetected, 'txt_simple');
  assert.strictEqual(colRes.messages.length, 2);
  assert.ok(colRes.warning?.includes('did not have timestamps'));
});

test('engine/parsers - parseConversation auto-detection and 10MB size limit', () => {
  const autoJson = parseConversation('[{"sender":"Alice","text":"Hello"}]');
  assert.strictEqual(autoJson.success, true);
  assert.strictEqual(autoJson.messages[0].sender, 'Alice');

  const autoTxt = parseConversation('Alice: Hello from plain text', 'chat.txt');
  assert.strictEqual(autoTxt.success, true);
  assert.strictEqual(autoTxt.messages[0].sender, 'Alice');

  assert.strictEqual(MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024);
  const oversized = 'a'.repeat(MAX_FILE_SIZE_BYTES + 10);
  const overRes = parseConversation(oversized, 'huge.txt');
  assert.strictEqual(overRes.success, false);
  assert.ok(overRes.error?.includes('exceeds the 10MB limit'));
});

