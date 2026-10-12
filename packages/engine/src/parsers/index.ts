import type { ParseResult } from '../types.ts';
import { parseJsonContent } from './jsonParser.ts';
import { parseTxtContent } from './txtParser.ts';

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

