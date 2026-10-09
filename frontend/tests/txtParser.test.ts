import test from 'node:test';
import assert from 'node:assert';
import { parseTxtContent } from '../src/parsers/txtParser.ts';

test('parseTxtContent - bracketed timestamps with sender', () => {
  const content = `[2026-10-09 09:15:22] Maya Lin: Starting the cutover now.
[2026-10-09 09:17:40] Leo Chen: Infrastructure standby is green.`;

  const result = parseTxtContent(content);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messages.length, 2);
  assert.strictEqual(result.messages[0].sender, 'Maya Lin');
  assert.strictEqual(result.messages[0].text, 'Starting the cutover now.');
  assert.strictEqual(result.messages[0].timestamp, '2026-10-09 09:15:22');
  assert.strictEqual(result.formatDetected, 'txt_bracketed');
});

test('parseTxtContent - WhatsApp format export', () => {
  const content = `10/09/26, 09:15 AM - Maya Lin: Critical issue with payment gateway.
10/09/26, 09:18 AM - Leo Chen: Looking into it now.`;

  const result = parseTxtContent(content);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messages.length, 2);
  assert.strictEqual(result.messages[0].sender, 'Maya Lin');
  assert.strictEqual(result.messages[0].text, 'Critical issue with payment gateway.');
  assert.strictEqual(result.formatDetected, 'txt_whatsapp');
});

test('parseTxtContent - Simple colon format without timestamps', () => {
  const content = `Maya Lin: We need a decision by 12:00 PM.
Leo Chen: Agreed, I will prepare the rollback.`;

  const result = parseTxtContent(content);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messages.length, 2);
  assert.strictEqual(result.messages[0].sender, 'Maya Lin');
  assert.strictEqual(result.messages[0].timestamp, undefined);
  assert.ok(result.warning?.includes('did not have timestamps'));
});

test('parseTxtContent - Multi-line message continuation', () => {
  const content = `[2026-10-09 10:00:00] Maya Lin: First line of the message.
Second line continuing the thought.
Third line with more details.
[2026-10-09 10:01:00] Leo Chen: Understood.`;

  const result = parseTxtContent(content);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messages.length, 2);
  assert.strictEqual(
    result.messages[0].text,
    'First line of the message.\nSecond line continuing the thought.\nThird line with more details.'
  );
  assert.strictEqual(result.messages[1].sender, 'Leo Chen');
});

test('parseTxtContent - Empty file', () => {
  const result = parseTxtContent('   \n  ');
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.messages.length, 0);
  assert.ok(result.error?.includes('empty'));
});

test('parseTxtContent - Plain unstructured text fallback', () => {
  const content = `Just some random meeting notes
Without any timestamps or colons`;

  const result = parseTxtContent(content);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.messages.length, 1);
  assert.strictEqual(result.messages[0].sender, 'Unknown Speaker');
});

