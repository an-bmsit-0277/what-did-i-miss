import type { ParseResult } from '../types/index.ts';
import { parseJsonContent } from './jsonParser.ts';
import { parseTxtContent } from './txtParser.ts';

export function parseConversation(content: string, fileName?: string): ParseResult {
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
