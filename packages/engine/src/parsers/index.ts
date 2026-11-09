import type { ParseResult } from '../types.ts';
import { parseJsonContent } from './jsonParser.ts';
import { parseTxtContent } from './txtParser.ts';
import { defaultRegistry } from '../adapters/registry.ts';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export function parseConversation(content: string, fileName?: string): ParseResult {
  if (content.length > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (content.length / (1024 * 1024)).toFixed(1);
    return {
      success: false,
      messages: [],
      error: `File size (${sizeMb}MB) exceeds the 10MB limit. Please upload a smaller chat export.`,
    };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return {
      success: false,
      messages: [],
      error: 'The uploaded file is empty.',
    };
  }

  const lowerName = (fileName || '').toLowerCase();

  // If HTML format (e.g. Facebook Messenger HTML dump)
  if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || trimmed.startsWith('<!DOCTYPE html')) {
    const fbAdapter = defaultRegistry.getAdapter('facebook_messenger');
    if (fbAdapter) {
      const htmlRes = fbAdapter.parse(content, { fileName });
      return {
        success: htmlRes.success,
        messages: htmlRes.messages,
        formatDetected: 'facebook_messenger',
        error: htmlRes.error,
        warning: htmlRes.warning,
      };
    }
  }

  // Check if format detection identifies a platform with strong confidence
  const detection = defaultRegistry.detect(content, { fileName });
  if (detection.confidence >= 0.8) {
    const adapterRes = defaultRegistry.parse(content, { fileName });
    if (adapterRes.success) {
      let formatDetected: ParseResult['formatDetected'] = undefined;
      if (detection.format === 'whatsapp') formatDetected = 'txt_whatsapp';
      else if (detection.format === 'slack') formatDetected = 'json_slack';
      else if (detection.format === 'standard_json') formatDetected = 'json_standard';
      else if (detection.format === 'standard_txt') formatDetected = 'txt_bracketed';
      else if (detection.format === 'telegram') formatDetected = 'telegram';
      else if (detection.format === 'facebook_messenger') formatDetected = 'facebook_messenger';

      return {
        success: true,
        messages: adapterRes.messages,
        formatDetected,
        warning: adapterRes.warning,
      };
    }
  }

  // If filename clearly indicates JSON
  if (lowerName.endsWith('.json')) {
    return parseJsonContent(content);
  }

  // If filename clearly indicates TXT / LOG
  if (lowerName.endsWith('.txt') || lowerName.endsWith('.log') || lowerName.endsWith('.csv')) {
    return parseTxtContent(content);
  }

  // Auto-detection based on content inspection:
  // Check if content looks like JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    const jsonAttempt = parseJsonContent(content);
    if (jsonAttempt.success) {
      return jsonAttempt;
    }
  }

  // Fallback to text parsing
  return parseTxtContent(content);
}

export { parseJsonContent, parseTxtContent };

