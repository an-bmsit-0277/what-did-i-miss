import type { ParsedMessage } from '../types.ts';
import type {
  PlatformAdapter,
  PlatformFormat,
  ImportMeta,
  FormatDetectionResult,
  AdapterParseResult,
  NormalizedConversation,
} from './types.ts';

const BRACKETED_REGEX = /^\[([^\]]+)\]\s*([^:]+):\s*(.*)$/;
const SIMPLE_COLON_REGEX = /^([A-Za-z0-9_][A-Za-z0-9_\s.()'-]{0,35}):\s+(.*)$/;

export class StandardChatAdapter implements PlatformAdapter {
  readonly id = 'standard_chat';
  readonly platform: PlatformFormat = 'standard_txt';
  readonly displayName = 'Standard Chat Format';
  readonly supportedExtensions = ['.txt', '.log', '.csv', '.json'];

  detect(raw: string, _meta?: ImportMeta): FormatDetectionResult {
    const reasons: string[] = [];
    const trimmed = raw.trim();

    // Check generic JSON
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : parsed.messages;
        if (Array.isArray(list) && list.length > 0) {
          const sample = list[0];
          if (sample && (sample.sender || sample.text || sample.message)) {
            reasons.push('Contains generic JSON message list');
            return {
              format: 'standard_json',
              confidence: 0.75,
              formatLabel: 'Standard JSON Chat',
              reasons,
            };
          }
        }
      } catch {
        // Not JSON
      }
    }

    // Check bracketed or simple colon text
    const lines = raw.split(/\r?\n/).slice(0, 20);
    let bracketedMatches = 0;
    let colonMatches = 0;

    for (const line of lines) {
      if (BRACKETED_REGEX.test(line)) {
        bracketedMatches++;
      } else if (SIMPLE_COLON_REGEX.test(line)) {
        colonMatches++;
      }
    }

    if (bracketedMatches >= 2) {
      reasons.push(`Found ${bracketedMatches} lines matching [timestamp] Sender: text`);
      return {
        format: 'standard_txt',
        confidence: 0.7,
        formatLabel: 'Standard Bracketed Text Export',
        reasons,
      };
    }

    if (colonMatches >= 2) {
      reasons.push(`Found ${colonMatches} lines matching "Sender: text" format`);
      return {
        format: 'standard_txt',
        confidence: 0.6,
        formatLabel: 'Standard Plaintext Transcript',
        reasons,
      };
    }

    return {
      format: 'unknown',
      confidence: 0.1,
      formatLabel: 'Unrecognized Text/JSON',
      reasons: ['No standard patterns strongly matched'],
    };
  }

  parse(raw: string, meta?: ImportMeta): AdapterParseResult {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {
        success: false,
        messages: [],
        format: 'standard_txt',
        formatLabel: 'Standard Chat Format',
        error: 'Failed to parse chat export: Provided file is empty.',
      };
    }

    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      return this.parseJson(raw, meta);
    }

    return this.parseTxt(raw, meta);
  }

  private parseJson(raw: string, meta?: ImportMeta): AdapterParseResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return {
        success: false,
        messages: [],
        format: 'standard_json',
        formatLabel: 'Standard JSON Chat',
        error: `Failed to parse JSON chat: Malformed JSON (${(err as Error).message}).`,
      };
    }

    let rawList: Array<Record<string, unknown>> = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as Record<string, unknown>).messages)) {
      rawList = (parsed as { messages: Array<Record<string, unknown>> }).messages;
    } else {
      return {
        success: false,
        messages: [],
        format: 'standard_json',
        formatLabel: 'Standard JSON Chat',
        error: 'Invalid JSON format: Expected array of messages or object with "messages" array.',
      };
    }

    const messages: ParsedMessage[] = [];
    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      if (!item || typeof item !== 'object') continue;

      const sender = String(item.sender || item.author || item.user || 'Unknown');
      const text = String(item.text || item.message || item.content || '').trim();
      if (!text) continue;

      const id = item.id ? String(item.id) : `msg-${i + 1}`;
      const ts = item.timestamp || item.time || item.date;
      const timestamp = ts ? String(ts) : undefined;
      const sourceRef = `ref:msg:${id}`;

      messages.push({
        id,
        sender,
        timestamp,
        text,
        raw: JSON.stringify(item),
        lineIndex: i,
        sourceRef,
      });
    }

    if (messages.length === 0) {
      return {
        success: false,
        messages: [],
        format: 'standard_json',
        formatLabel: 'Standard JSON Chat',
        error: 'Could not extract valid messages from JSON chat.',
      };
    }

    const participants = Array.from(new Set(messages.map((m) => m.sender)));
    const conversation: NormalizedConversation = {
      title: meta?.fileName?.replace(/\.json$/i, '') || 'JSON Conversation',
      platform: 'standard_json',
      formatLabel: 'Standard JSON Chat',
      messages,
      participants,
      dateRange: {
        start: messages[0]?.timestamp,
        end: messages[messages.length - 1]?.timestamp,
      },
      totalMessages: messages.length,
    };

    return {
      success: true,
      conversation,
      messages,
      format: 'standard_json',
      formatLabel: 'Standard JSON Chat',
    };
  }

  private parseTxt(raw: string, meta?: ImportMeta): AdapterParseResult {
    const lines = raw.split(/\r?\n/);
    const messages: ParsedMessage[] = [];
    let currentMessage: ParsedMessage | null = null;
    let msgCounter = 1;
    let matchedRealMessage = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineTrimmed = line.trim();

      const bracketMatch = line.match(BRACKETED_REGEX);
      if (bracketMatch) {
        if (currentMessage) messages.push(currentMessage);
        matchedRealMessage = true;
        const id = `txt-${msgCounter++}`;
        currentMessage = {
          id,
          timestamp: bracketMatch[1].trim(),
          sender: bracketMatch[2].trim(),
          text: bracketMatch[3].trim(),
          raw: line,
          lineIndex: i,
          sourceRef: `ref:msg:${id}`,
        };
        continue;
      }

      const colonMatch = line.match(SIMPLE_COLON_REGEX);
      if (colonMatch && !colonMatch[1].toLowerCase().startsWith('http') && colonMatch[2].trim().length > 0) {
        if (currentMessage) messages.push(currentMessage);
        matchedRealMessage = true;
        const id = `txt-${msgCounter++}`;
        currentMessage = {
          id,
          sender: colonMatch[1].trim(),
          text: colonMatch[2].trim(),
          raw: line,
          lineIndex: i,
          sourceRef: `ref:msg:${id}`,
        };
        continue;
      }

      if (currentMessage && lineTrimmed) {
        currentMessage.text += `\n${lineTrimmed}`;
        currentMessage.raw += `\n${line}`;
      } else if (!currentMessage && lineTrimmed) {
        const id = `txt-${msgCounter++}`;
        currentMessage = {
          id,
          sender: 'Unknown Speaker',
          text: lineTrimmed,
          raw: line,
          lineIndex: i,
          sourceRef: `ref:msg:${id}`,
        };
      }
    }

    if (currentMessage && currentMessage.text.trim()) {
      messages.push(currentMessage);
    }

    if (messages.length === 0 || !matchedRealMessage) {
      return {
        success: false,
        messages: [],
        format: 'standard_txt',
        formatLabel: 'Standard Text Format',
        error: 'Failed to parse text chat: No lines matched valid conversation formats (e.g. "[timestamp] Sender: message" or "Sender: message").',
      };
    }

    const participants = Array.from(new Set(messages.map((m) => m.sender)));
    const conversation: NormalizedConversation = {
      title: meta?.fileName?.replace(/\.txt$/i, '') || 'Chat Transcript',
      platform: 'standard_txt',
      formatLabel: 'Standard Text Transcript',
      messages,
      participants,
      dateRange: {
        start: messages[0]?.timestamp,
        end: messages[messages.length - 1]?.timestamp,
      },
      totalMessages: messages.length,
    };

    return {
      success: true,
      conversation,
      messages,
      format: 'standard_txt',
      formatLabel: 'Standard Text Transcript',
    };
  }
}
