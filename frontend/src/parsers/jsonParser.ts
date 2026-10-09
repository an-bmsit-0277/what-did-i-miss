import type { ParsedMessage, ParseResult } from '../types';

interface PotentialMessageObject {
  id?: string | number;
  client_msg_id?: string;
  sender?: string;
  user?: string;
  author?: string;
  from?: string;
  name?: string;
  username?: string;
  user_profile?: {
    real_name?: string;
    display_name?: string;
    name?: string;
  };
  text?: string;
  message?: string;
  content?: string;
  body?: string;
  timestamp?: string | number;
  time?: string | number;
  ts?: string | number;
  date?: string | number;
  datetime?: string | number;
}

export function parseJsonContent(rawContent: string): ParseResult {
  const trimmed = rawContent.trim();
  if (!trimmed) {
    return {
      success: false,
      messages: [],
      error: 'The provided JSON file is empty.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    return {
      success: false,
      messages: [],
      error: `Malformed JSON format: ${(err as Error).message}. Please verify the JSON syntax.`,
    };
  }

  // Extract array of message candidate objects
  let rawItems: unknown[] = [];
  let formatDetected: ParseResult['formatDetected'] = 'json_standard';

  if (Array.isArray(parsed)) {
    rawItems = parsed;
    // Check if Slack-like format (contains 'ts' string with decimal)
    if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'ts' in parsed[0]) {
      formatDetected = 'json_slack';
    }
  } else if (typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.messages)) {
      rawItems = obj.messages;
    } else if (Array.isArray(obj.data)) {
      rawItems = obj.data;
    } else if (Array.isArray(obj.conversation)) {
      rawItems = obj.conversation;
    } else {
      return {
        success: false,
        messages: [],
        error: 'JSON must be an array of messages or an object containing a "messages" array.',
      };
    }
  } else {
    return {
      success: false,
      messages: [],
      error: 'Invalid JSON structure: Expected an array or object containing conversation messages.',
    };
  }

  if (rawItems.length === 0) {
    return {
      success: false,
      messages: [],
      error: 'The JSON file contains zero messages.',
    };
  }

  const messages: ParsedMessage[] = [];
  let warning: string | undefined;

  for (let idx = 0; idx < rawItems.length; idx++) {
    const item = rawItems[idx];
    if (typeof item !== 'object' || item === null) {
      continue;
    }

    const obj = item as PotentialMessageObject;

    // Sender resolution
    const sender =
      obj.sender ||
      obj.user_profile?.real_name ||
      obj.user_profile?.display_name ||
      obj.user ||
      obj.author ||
      obj.from ||
      obj.name ||
      obj.username ||
      'Unknown';

    // Text resolution
    const text = obj.text ?? obj.message ?? obj.content ?? obj.body ?? '';

    // Timestamp resolution
    let timestamp: string | undefined;
    const rawTs = obj.timestamp ?? obj.time ?? obj.ts ?? obj.date ?? obj.datetime;
    if (rawTs !== undefined && rawTs !== null) {
      if (typeof rawTs === 'number') {
        // If unix epoch in seconds vs ms
        const ms = rawTs < 10000000000 ? rawTs * 1000 : rawTs;
        timestamp = new Date(ms).toISOString().replace('T', ' ').substring(0, 19);
      } else if (typeof rawTs === 'string') {
        // Slack ts strings like "1710000000.000100"
        if (/^\d+(\.\d+)?$/.test(rawTs.trim())) {
          const num = parseFloat(rawTs.trim());
          const ms = num < 10000000000 ? num * 1000 : num;
          timestamp = new Date(ms).toISOString().replace('T', ' ').substring(0, 19);
        } else {
          timestamp = rawTs.trim();
        }
      }
    }

    // Message ID
    const id = obj.id?.toString() || obj.client_msg_id || (obj.ts ? `ts-${obj.ts}` : `msg-${idx + 1}`);

    const cleanText = typeof text === 'string' ? text.trim() : String(text);
    if (!cleanText) {
      continue;
    }

    messages.push({
      id,
      sender: String(sender).trim(),
      timestamp,
      text: cleanText,
      raw: JSON.stringify(item),
      lineIndex: idx,
    });
  }

  if (messages.length === 0) {
    return {
      success: false,
      messages: [],
      error: 'No valid message texts could be extracted from this JSON file.',
    };
  }

  const missingTimestamps = messages.filter((m) => !m.timestamp).length;
  if (missingTimestamps > 0) {
    warning = `${missingTimestamps} message(s) did not have timestamps; ordered by sequence.`;
  }

  return {
    success: true,
    messages,
    formatDetected,
    warning,
  };
}

