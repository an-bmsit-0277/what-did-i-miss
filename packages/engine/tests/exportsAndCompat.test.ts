import test from 'node:test';
import assert from 'node:assert';
import * as engine from '@missed/engine';
import {
  SAMPLE_CONVERSATION_RAW,
  SAMPLE_MESSAGES,
  parseConversation,
  parseJsonContent,
  parseTxtContent,
  analyzeConversation,
  detectUrgency,
  detectDecision,
  detectDeadline,
  detectActionItem,
  detectMention,
  generateRecap,
} from '@missed/engine';

// Import via frontend compatibility re-export paths
import {
  parseConversation as feParseConversation,
  parseJsonContent as feParseJsonContent,
  parseTxtContent as feParseTxtContent,
} from '../../../frontend/src/parsers/index.ts';
import { parseJsonContent as feDirectJson } from '../../../frontend/src/parsers/jsonParser.ts';
import { parseTxtContent as feDirectTxt } from '../../../frontend/src/parsers/txtParser.ts';
import { analyzeConversation as feAnalyzeConversation } from '../../../frontend/src/heuristics/analyzer.ts';
import {
  detectUrgency as feDetectUrgency,
  detectDecision as feDetectDecision,
  detectDeadline as feDetectDeadline,
  detectActionItem as feDetectActionItem,
  detectMention as feDetectMention,
} from '../../../frontend/src/heuristics/detectors.ts';
import { generateRecap as feGenerateRecap } from '../../../frontend/src/heuristics/recapGenerator.ts';
import {
  SAMPLE_MESSAGES as feSampleMessages,
  SAMPLE_CONVERSATION_RAW as feSampleRaw,
} from '../../../frontend/src/data/sampleConversation.ts';

test('engine/exports - workspace package @missed/engine resolves public API', () => {
  assert.strictEqual(typeof engine.parseConversation, 'function');
  assert.strictEqual(typeof engine.parseJsonContent, 'function');
  assert.strictEqual(typeof engine.parseTxtContent, 'function');
  assert.strictEqual(typeof engine.analyzeConversation, 'function');
  assert.strictEqual(typeof engine.detectUrgency, 'function');
  assert.strictEqual(typeof engine.detectDecision, 'function');
  assert.strictEqual(typeof engine.detectDeadline, 'function');
  assert.strictEqual(typeof engine.detectActionItem, 'function');
  assert.strictEqual(typeof engine.detectMention, 'function');
  assert.strictEqual(typeof engine.generateRecap, 'function');
  assert.strictEqual(Array.isArray(SAMPLE_MESSAGES), true);
  assert.strictEqual(SAMPLE_MESSAGES.length, 20);
  assert.strictEqual(typeof SAMPLE_CONVERSATION_RAW, 'string');

  const parsedRaw = parseConversation(SAMPLE_CONVERSATION_RAW, 'sample.txt');
  assert.strictEqual(parsedRaw.success, true);
  assert.strictEqual(parsedRaw.messages.length, 20);
});

test('engine/compat - frontend re-export paths resolve to exact @missed/engine implementations', () => {
  assert.strictEqual(feParseConversation, parseConversation);
  assert.strictEqual(feParseJsonContent, parseJsonContent);
  assert.strictEqual(feParseTxtContent, parseTxtContent);
  assert.strictEqual(feDirectJson, parseJsonContent);
  assert.strictEqual(feDirectTxt, parseTxtContent);
  assert.strictEqual(feAnalyzeConversation, analyzeConversation);
  assert.strictEqual(feDetectUrgency, detectUrgency);
  assert.strictEqual(feDetectDecision, detectDecision);
  assert.strictEqual(feDetectDeadline, detectDeadline);
  assert.strictEqual(feDetectActionItem, detectActionItem);
  assert.strictEqual(feDetectMention, detectMention);
  assert.strictEqual(feGenerateRecap, generateRecap);
  assert.strictEqual(feSampleMessages, SAMPLE_MESSAGES);
  assert.strictEqual(feSampleRaw, SAMPLE_CONVERSATION_RAW);
});

