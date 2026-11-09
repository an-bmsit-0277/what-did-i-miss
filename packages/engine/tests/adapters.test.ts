import test from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  WhatsAppAdapter,
  TelegramAdapter,
  FacebookMessengerAdapter,
  SlackJsonAdapter,
  AdapterRegistry,
  defaultRegistry,
  analyzeConversation,
} from '../src/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');

function readFixture(fileName: string): string {
  return fs.readFileSync(path.join(fixturesDir, fileName), 'utf-8');
}

test('engine/adapters - WhatsAppAdapter handles iOS bracketed format, phone numbers, multiline and media omitted', () => {
  const content = readFixture('whatsapp_ios.txt');
  const adapter = new WhatsAppAdapter();

  const detection = adapter.detect(content, { fileName: 'WhatsApp Chat - Team.txt' });
  assert.strictEqual(detection.format, 'whatsapp');
  assert.ok(detection.confidence >= 0.85, `Expected confidence >= 0.85, got ${detection.confidence}`);

  const result = adapter.parse(content, { fileName: 'WhatsApp Chat - Team.txt' });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.format, 'whatsapp');

  const messages = result.messages;
  assert.ok(messages.length >= 6);

  // System encryption message
  const sysMsg = messages.find((m) => m.isSystem);
  assert.ok(sysMsg, 'Should find system notice');
  assert.ok(sysMsg?.text.includes('end-to-end encrypted'));

  // Phone sender
  const phoneMsg = messages.find((m) => m.sender.includes('+1 (555) 019-2834'));
  assert.ok(phoneMsg, 'Should find phone sender');
  assert.strictEqual(phoneMsg?.senderPhone, '15550192834');
  assert.ok(
    phoneMsg?.sourceRef?.startsWith('https://wa.me/15550192834?text='),
    `Invalid phone sourceRef: ${phoneMsg?.sourceRef}`
  );

  // Multiline message
  const multiMsg = messages.find((m) => m.sender === 'Maya Lin' && m.text.includes('connection pool metrics'));
  assert.ok(multiMsg, 'Should find multiline message');
  assert.ok(multiMsg?.text.includes('Looking into this now.\nCan someone pull the logs from us-east-1?\nAlso check the connection pool metrics.'));
  assert.ok(multiMsg?.sourceRef?.startsWith('https://wa.me/?text=Maya%20Lin%3A%20'));

  // Media omitted
  const mediaMsg = messages.find((m) => m.sender === 'Leo Chen' && m.mediaType);
  assert.ok(mediaMsg, 'Should find media omitted message');
  assert.strictEqual(mediaMsg?.mediaType, 'other');

  // Verify NormalizedConversation summary
  const conv = result.conversation;
  assert.ok(conv);
  assert.strictEqual(conv.platform, 'whatsapp');
  assert.ok(conv.participants.includes('Maya Lin'));
  assert.ok(conv.participants.includes('Leo Chen'));
  assert.ok(!conv.participants.includes('System'));
});

test('engine/adapters - WhatsAppAdapter handles Android dash format and _chat.txt variant', () => {
  const androidContent = readFixture('whatsapp_android.txt');
  const adapter = new WhatsAppAdapter();

  const androidResult = adapter.parse(androidContent, { fileName: 'chat.txt' });
  assert.strictEqual(androidResult.success, true);

  const ukPhoneMsg = androidResult.messages.find((m) => m.sender.includes('+44 7123 456789'));
  assert.ok(ukPhoneMsg);
  assert.strictEqual(ukPhoneMsg?.senderPhone, '447123456789');
  assert.ok(ukPhoneMsg?.sourceRef?.startsWith('https://wa.me/447123456789?text='));

  const imageMsg = androidResult.messages.find((m) => m.mediaType === 'image');
  assert.ok(imageMsg, 'Should detect image omitted');

  // Test _chat.txt export convention
  const chatVariant = readFixture('whatsapp_chat_variant._chat.txt');
  const detectChat = adapter.detect(chatVariant, { fileName: '_chat.txt' });
  assert.strictEqual(detectChat.format, 'whatsapp');
  assert.ok(detectChat.confidence >= 0.9, 'Confidence for _chat.txt should be >= 0.9');
});

test('engine/adapters - FacebookMessengerAdapter decodes mojibake, sorts chronologically, and parses JSON and HTML', () => {
  const jsonContent = readFixture('facebook_messenger.json');
  const adapter = new FacebookMessengerAdapter();

  const detection = adapter.detect(jsonContent, { fileName: 'message_1.json' });
  assert.strictEqual(detection.format, 'facebook_messenger');
  assert.ok(detection.confidence >= 0.95);

  const jsonResult = adapter.parse(jsonContent, { fileName: 'message_1.json' });
  assert.strictEqual(jsonResult.success, true);
  assert.strictEqual(jsonResult.messages.length, 3);

  // Chronological order verification (oldest first: 1710000100000 -> 1710000200000 -> 1710000300000)
  assert.strictEqual(jsonResult.messages[0].sourceRef, 'ref:fb:1710000100000');
  assert.strictEqual(jsonResult.messages[1].sourceRef, 'ref:fb:1710000200000');
  assert.strictEqual(jsonResult.messages[2].sourceRef, 'ref:fb:1710000300000');

  // Mojibake decoding test (What\u00e2\u0080\u0099s -> What’s)
  assert.ok(
    jsonResult.messages[0].text.includes("What’s the timeline") || jsonResult.messages[0].text.includes("What's the timeline"),
    `Failed mojibake decoding: ${jsonResult.messages[0].text}`
  );

  // Quoted reply test
  assert.ok(jsonResult.messages[1].replyToSnippet);
  assert.ok(jsonResult.messages[1].replyToSnippet?.includes("What’s the timeline") || jsonResult.messages[1].replyToSnippet?.includes("What's the timeline"));

  // HTML dump parsing test
  const htmlContent = readFixture('facebook_messenger.html');
  const htmlDetection = adapter.detect(htmlContent, { fileName: 'message_1.html' });
  assert.strictEqual(htmlDetection.format, 'facebook_messenger');
  assert.ok(htmlDetection.confidence >= 0.95);

  const htmlResult = adapter.parse(htmlContent, { fileName: 'message_1.html' });
  assert.strictEqual(htmlResult.success, true);
  assert.strictEqual(htmlResult.messages.length, 2);
  assert.strictEqual(htmlResult.messages[0].sender, 'Maya Lin');
  assert.ok(htmlResult.messages[0].sourceRef?.startsWith('ref:fb:html-'));
});

test('engine/adapters - TelegramAdapter flattens rich text entity arrays, links replies and formats sourceRef', () => {
  const content = readFixture('telegram_desktop.json');
  const adapter = new TelegramAdapter();

  const detection = adapter.detect(content, { fileName: 'result.json' });
  assert.strictEqual(detection.format, 'telegram');
  assert.ok(detection.confidence >= 0.95);

  const result = adapter.parse(content, { fileName: 'result.json' });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messages.length, 3);

  // Service message
  const serviceMsg = result.messages[0];
  assert.strictEqual(serviceMsg.isSystem, true);
  assert.ok(serviceMsg.text.includes('create_group'));

  // Flattened text entity array
  const richMsg = result.messages[2];
  assert.strictEqual(
    richMsg.text,
    'CRITICAL: Memory leak detected in ingestion pipeline. Action item: @Leo deploy hotfix before EOD.'
  );
  assert.strictEqual(richMsg.sourceRef, 'ref:tg:3');
  assert.strictEqual(richMsg.replyToMessageId, '2');
  assert.strictEqual(richMsg.replyToSnippet, 'Starting the emergency triage session.');
});

test('engine/adapters - SlackJsonAdapter parses microsecond timestamps and threads', () => {
  const slackRaw = JSON.stringify([
    {
      client_msg_id: 'c-101',
      ts: '1710000000.000100',
      user_profile: { real_name: 'Maya Lin' },
      text: 'Deploying hotfix now',
    },
    {
      client_msg_id: 'c-102',
      ts: '1710000005.000200',
      thread_ts: '1710000000.000100',
      user_profile: { real_name: 'Leo Chen' },
      text: 'Acknowledged Maya',
    },
  ]);

  const adapter = new SlackJsonAdapter();
  const detection = adapter.detect(slackRaw);
  assert.strictEqual(detection.format, 'slack');
  assert.ok(detection.confidence >= 0.9);

  const result = adapter.parse(slackRaw);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messages[0].sourceRef, 'ref:slack:1710000000.000100');
  assert.strictEqual(result.messages[1].replyToMessageId, 'slack-1710000000.000100');
});

test('engine/adapters - AdapterRegistry detects and routes formats automatically', () => {
  const registry = defaultRegistry;

  const waContent = readFixture('whatsapp_ios.txt');
  const waRes = registry.parse(waContent, { fileName: 'chat.txt' });
  assert.strictEqual(waRes.success, true);
  assert.strictEqual(waRes.format, 'whatsapp');

  const tgContent = readFixture('telegram_desktop.json');
  const tgRes = registry.parse(tgContent, { fileName: 'export.json' });
  assert.strictEqual(tgRes.success, true);
  assert.strictEqual(tgRes.format, 'telegram');

  const fbContent = readFixture('facebook_messenger.json');
  const fbRes = registry.parse(fbContent, { fileName: 'message_1.json' });
  assert.strictEqual(fbRes.success, true);
  assert.strictEqual(fbRes.format, 'facebook_messenger');
});

test('engine/adapters - Heuristic detectors preserve sourceRef in findings', () => {
  const waContent = readFixture('whatsapp_ios.txt');
  const parsed = defaultRegistry.parse(waContent);
  assert.strictEqual(parsed.success, true);

  const analysis = analyzeConversation(parsed.messages);
  assert.ok(analysis.findings.length > 0);

  // Verify that findings inherit the message's sourceRef
  for (const finding of analysis.findings) {
    assert.ok(finding.sourceRef, `Finding ${finding.id} missing sourceRef`);
    assert.ok(
      finding.sourceRef.startsWith('https://wa.me/'),
      `Finding sourceRef should be wa.me link, got ${finding.sourceRef}`
    );
  }
});

test('engine/adapters - Explicit error reporting for corrupted or unsupported files', () => {
  const corruptedContent = readFixture('corrupted_unsupported.txt');
  const registry = new AdapterRegistry();

  const result = registry.parse(corruptedContent, { fileName: 'corrupted_unsupported.txt' });
  assert.strictEqual(result.success, false);
  assert.ok(result.error);
  // Must name the format or state clearly why it failed, never generic
  assert.ok(
    result.error.includes('Unsupported or corrupted') || result.error.includes('Unable to extract conversation messages'),
    `Expected explicit human readable error, got: ${result.error}`
  );

  // Malformed JSON explicitly reports JSON syntax failure
  const malformedJson = '{"name": "Telegram", "messages": [{"id": 1, "date_unixtime": 1700000, ';
  const tgAdapter = new TelegramAdapter();
  const badTg = tgAdapter.parse(malformedJson);
  assert.strictEqual(badTg.success, false);
  assert.ok(badTg.error?.includes('Malformed JSON syntax'));
});
