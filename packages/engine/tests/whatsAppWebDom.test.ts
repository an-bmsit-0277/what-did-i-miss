import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseWhatsAppWebHtml,
  normalizeWhatsAppWebBubbles,
  serializeWhatsAppMessagesToText,
  WhatsAppAdapter,
  defaultRegistry,
  analyzeConversation,
  type RawWhatsAppWebBubble,
} from '../src/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');

test('WhatsAppWebDomAdapter - extracts group chat, authors, stable IDs, and media omitted states', () => {
  const groupHtml = fs.readFileSync(path.join(fixturesDir, 'whatsapp_web_group.html'), 'utf8');
  const result = parseWhatsAppWebHtml(groupHtml);

  assert.equal(result.success, true);
  assert.equal(result.chatTitle, 'Project Apollo Staging');
  assert.ok(result.messages.length >= 6);

  // Check bubble order & senders
  const senders = result.messages.map((m) => m.sender);
  assert.ok(senders.includes('+1 (555) 019-2834'));
  assert.ok(senders.includes('You'));
  assert.ok(senders.includes('Maya Lin'));
  assert.ok(senders.includes('Leo Chen'));

  // Check stable IDs from data-id attribute
  const urgentMsg = result.messages.find((m) => m.sender === '+1 (555) 019-2834');
  assert.ok(urgentMsg);
  assert.equal(urgentMsg.id, 'false_120363024892@g.us_3EB0C895782B4B3294E2_15550192834@c.us');
  assert.ok(urgentMsg.sourceRef?.startsWith('https://wa.me/15550192834?text='));

  // Check voice note media omitted state
  const voiceMsg = result.messages.find((m) => m.mediaType === 'audio');
  assert.ok(voiceMsg);
  assert.equal(voiceMsg.text, '<Voice note omitted>');

  // Check full heuristics analysis pipeline on extracted messages
  const analysis = analyzeConversation(result.messages);
  assert.ok(analysis.stats.urgentCount >= 1);
  assert.ok(analysis.stats.decisionCount >= 1);
  assert.ok(analysis.stats.actionItemCount >= 1);

  // Urgent finding must retain sourceRef
  const urgentFinding = analysis.findings.find((f) => f.category === 'urgent');
  assert.ok(urgentFinding);
  assert.ok(urgentFinding.sourceRef?.includes('wa.me/15550192834'));
});

test('WhatsAppWebDomAdapter - extracts 1:1 direct chat attributing sender to conversation header', () => {
  const directHtml = fs.readFileSync(path.join(fixturesDir, 'whatsapp_web_direct.html'), 'utf8');
  const result = parseWhatsAppWebHtml(directHtml);

  assert.equal(result.success, true);
  assert.equal(result.chatTitle, 'Maya Lin');
  assert.equal(result.messages.length, 2);

  // Message 1 is incoming, sender attributed to header title 'Maya Lin'
  assert.equal(result.messages[0].sender, 'Maya Lin');
  assert.ok(result.messages[0].text.includes('review the Phase 5 architecture doc'));
  assert.equal(result.messages[0].id, 'false_15550192834@c.us_3EB0AA11223344');

  // Message 2 is outgoing, sender is 'You'
  assert.equal(result.messages[1].sender, 'You');
  assert.ok(result.messages[1].text.includes('test the extension companion'));
  assert.equal(result.messages[1].id, 'true_15550192834@c.us_3EB0BB22334455');
});

test('WhatsAppWebDomAdapter - identifies logged-out / QR code screen and returns NOT_LOGGED_IN code', () => {
  const loggedOutHtml = fs.readFileSync(path.join(fixturesDir, 'whatsapp_web_logged_out.html'), 'utf8');
  const result = parseWhatsAppWebHtml(loggedOutHtml);

  assert.equal(result.success, false);
  assert.equal(result.code, 'NOT_LOGGED_IN');
  assert.ok(result.error?.includes('scan the QR code'));
});

test('WhatsAppWebDomAdapter - normalizes raw bubbles and derives deterministic IDs if data-id is missing', () => {
  const rawBubbles: RawWhatsAppWebBubble[] = [
    {
      sender: 'Alice',
      text: 'Good morning!',
      timestamp: '09:00 AM',
      domOrder: 1,
    },
    {
      sender: 'Bob',
      text: 'Morning Alice! Check this out.',
      timestamp: '09:01 AM',
      domOrder: 2,
    },
  ];

  const normalized = normalizeWhatsAppWebBubbles(rawBubbles, 'Test Team');
  assert.equal(normalized.messages.length, 2);
  assert.ok(normalized.messages[0].id.startsWith('wa-dom-1-'));
  assert.ok(normalized.messages[1].id.startsWith('wa-dom-2-'));
  assert.ok(normalized.messages[0].sourceRef?.startsWith('https://wa.me/'));
});

test('WhatsAppWebDomAdapter - serialization roundtrips with WhatsApp text adapter', () => {
  const groupHtml = fs.readFileSync(path.join(fixturesDir, 'whatsapp_web_group.html'), 'utf8');
  const extracted = parseWhatsAppWebHtml(groupHtml);
  assert.equal(extracted.success, true);

  const serialized = serializeWhatsAppMessagesToText(extracted.messages);
  assert.ok(serialized.length > 50);
  assert.ok(serialized.includes('+1 (555) 019-2834: CRITICAL'));
  assert.ok(serialized.includes('09:14'));

  // Test that standard WhatsAppAdapter parses the serialized output with high fidelity
  const waAdapter = new WhatsAppAdapter();
  const parsed = waAdapter.parse(serialized);
  assert.equal(parsed.success, true);
  assert.equal(parsed.messages.length, extracted.messages.length);
  assert.ok(parsed.messages.some((m) => m.text.includes('CRITICAL outage')));
});

test('WhatsAppWebDomAdapter - AdapterRegistry detects and routes WhatsApp Web HTML', () => {
  const groupHtml = fs.readFileSync(path.join(fixturesDir, 'whatsapp_web_group.html'), 'utf8');
  const detection = defaultRegistry.detect(groupHtml, { fileName: 'whatsapp_web_export.html' });

  assert.equal(detection.format, 'whatsapp');
  assert.ok(detection.confidence >= 0.8);

  const parsed = defaultRegistry.parse(groupHtml, { fileName: 'whatsapp_web_export.html' });
  assert.equal(parsed.success, true);
  assert.equal(parsed.conversation?.title, 'Project Apollo Staging');
});
