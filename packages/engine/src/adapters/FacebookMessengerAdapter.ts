import type { ParsedMessage } from '../types.ts';
import type {
  PlatformAdapter,
  PlatformFormat,
  ImportMeta,
  FormatDetectionResult,
  AdapterParseResult,
  NormalizedConversation,
} from './types.ts';

/**
 * Meta's export tool writes UTF-8 encoded bytes misinterpreted as ISO-8859-1 (Latin-1).
 * Universal decoder working across Node.js and Browser environments without crashing.
 */
export function decodeMetaMojibake(str?: string | null): string {
  if (!str) return '';
  try {
    const g = globalThis as unknown as {
      Buffer?: { from(str: string, enc: string): { toString(enc: string): string } };
      TextDecoder?: { new (label?: string): { decode(input?: Uint8Array): string } };
    };
    if (typeof g.Buffer !== 'undefined') {
      return g.Buffer.from(str, 'latin1').toString('utf8');
    }
    if (typeof g.TextDecoder !== 'undefined') {
      const bytes = new Uint8Array([...str].map((char) => char.charCodeAt(0) & 0xff));
      return new g.TextDecoder('utf-8').decode(bytes);
    }
    return str;
  } catch {
    return str;
  }
}

interface MetaJsonMessage {
  sender_name?: string;
  timestamp_ms?: number;
  content?: string;
  type?: string;
  photos?: Array<{ uri?: string }>;
  videos?: Array<{ uri?: string }>;
  audio_files?: Array<{ uri?: string }>;
  files?: Array<{ uri?: string }>;
  sticker?: { uri?: string };
  reply_to?: {
    sender_name?: string;
    content?: string;
    timestamp_ms?: number;
  };
}

interface MetaJsonStructure {
  participants?: Array<{ name: string }>;
  messages?: MetaJsonMessage[];
  title?: string;
  thread_type?: string;
}

export class FacebookMessengerAdapter implements PlatformAdapter {
  readonly id = 'facebook_messenger';
  readonly platform: PlatformFormat = 'facebook_messenger';
  readonly displayName = 'Facebook Messenger Export';
  readonly supportedExtensions = ['.json', '.html', '.htm'];

  detect(raw: string, meta?: ImportMeta): FormatDetectionResult {
    const reasons: string[] = [];
    let score = 0;
    const lowerName = meta?.fileName?.toLowerCase() || '';

    // Check HTML dump signature
    if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || raw.includes('<!DOCTYPE html')) {
      if (raw.includes('_3-96 _2pio') || raw.includes('_3-96 _2let') || raw.includes('_3-94 _2lem')) {
        score = 0.98;
        reasons.push('HTML structure contains standard Facebook Messenger CSS export classes (_3-96, _2pio, _2let)');
        return {
          format: 'facebook_messenger',
          confidence: score,
          formatLabel: 'Facebook Messenger HTML Dump',
          reasons,
        };
      }
    }

    // Check JSON signature
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed) as MetaJsonStructure;
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          const first = parsed.messages[0];
          if (first && 'sender_name' in first && 'timestamp_ms' in first) {
            score = 0.99;
            reasons.push('JSON contains Meta export fields "messages[].sender_name" and "messages[].timestamp_ms"');
            if (Array.isArray(parsed.participants)) {
              reasons.push('JSON contains Meta "participants" array');
            }
            return {
              format: 'facebook_messenger',
              confidence: score,
              formatLabel: 'Facebook Messenger JSON Export',
              reasons,
            };
          }
        }
      } catch {
        // Not valid JSON or not Meta JSON
      }
    }

    return {
      format: 'facebook_messenger',
      confidence: 0.0,
      formatLabel: 'Facebook Messenger Export',
      reasons: ['No Facebook Messenger markers found'],
    };
  }

  parse(raw: string, meta?: ImportMeta): AdapterParseResult {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {
        success: false,
        messages: [],
        format: 'facebook_messenger',
        formatLabel: 'Facebook Messenger Export',
        error: 'Failed to parse Facebook Messenger export: file is empty.',
      };
    }

    // Handle HTML dump
    if (trimmed.startsWith('<') || (meta?.fileName && /\.html?$/i.test(meta.fileName))) {
      return this.parseHtml(raw, meta);
    }

    // Handle JSON export
    return this.parseJson(raw, meta);
  }

  private parseJson(raw: string, meta?: ImportMeta): AdapterParseResult {
    let parsed: MetaJsonStructure;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return {
        success: false,
        messages: [],
        format: 'facebook_messenger',
        formatLabel: 'Facebook Messenger JSON Export',
        error: `Failed to parse Facebook Messenger JSON export: Malformed JSON syntax (${(err as Error).message}).`,
      };
    }

    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      return {
        success: false,
        messages: [],
        format: 'facebook_messenger',
        formatLabel: 'Facebook Messenger JSON Export',
        error: 'Failed to parse Facebook Messenger JSON export: Missing or empty "messages" array.',
      };
    }

    // Meta exports messages in reverse-chronological order (newest first).
    // Sort chronologically ascending to preserve order:
    const sortedRaw = [...parsed.messages].sort(
      (a, b) => (a.timestamp_ms || 0) - (b.timestamp_ms || 0)
    );

    const messages: ParsedMessage[] = [];
    let counter = 1;

    for (let i = 0; i < sortedRaw.length; i++) {
      const item = sortedRaw[i];
      const sender = decodeMetaMojibake(item.sender_name) || 'Unknown';
      let text = decodeMetaMojibake(item.content);

      let mediaType: ParsedMessage['mediaType'] | undefined;
      if (item.photos && item.photos.length > 0) {
        mediaType = 'image';
        if (!text) text = `[Image attachment]`;
      } else if (item.videos && item.videos.length > 0) {
        mediaType = 'video';
        if (!text) text = `[Video attachment]`;
      } else if (item.audio_files && item.audio_files.length > 0) {
        mediaType = 'audio';
        if (!text) text = `[Audio attachment]`;
      } else if (item.files && item.files.length > 0) {
        mediaType = 'document';
        if (!text) text = `[File attachment]`;
      } else if (item.sticker) {
        mediaType = 'sticker';
        if (!text) text = `[Sticker]`;
      }

      if (!text) {
        // Skip entirely empty / reaction-only messages without content
        continue;
      }

      const ts = item.timestamp_ms
        ? new Date(item.timestamp_ms).toISOString().replace('T', ' ').substring(0, 19)
        : undefined;

      const sourceRef = item.timestamp_ms
        ? `ref:fb:${item.timestamp_ms}`
        : `ref:fb:idx-${counter}`;

      let replyToSnippet: string | undefined;
      if (item.reply_to?.content) {
        replyToSnippet = decodeMetaMojibake(item.reply_to.content);
      }

      messages.push({
        id: `fb-${counter++}`,
        sender,
        timestamp: ts,
        text,
        raw: JSON.stringify(item),
        lineIndex: i,
        sourceRef,
        replyToSnippet,
        mediaType,
      });
    }

    if (messages.length === 0) {
      return {
        success: false,
        messages: [],
        format: 'facebook_messenger',
        formatLabel: 'Facebook Messenger JSON Export',
        error: 'Failed to parse Facebook Messenger JSON export: Could not extract any readable message text.',
      };
    }

    const title = decodeMetaMojibake(parsed.title) || meta?.fileName?.replace(/\.json$/i, '') || 'Messenger Conversation';
    const participants = parsed.participants
      ? parsed.participants.map((p) => decodeMetaMojibake(p.name)).filter(Boolean)
      : Array.from(new Set(messages.map((m) => m.sender)));

    const conversation: NormalizedConversation = {
      title,
      platform: 'facebook_messenger',
      formatLabel: 'Facebook Messenger JSON Export',
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
      format: 'facebook_messenger',
      formatLabel: 'Facebook Messenger JSON Export',
    };
  }

  private parseHtml(raw: string, meta?: ImportMeta): AdapterParseResult {
    // Regex parsing for Meta HTML dump:
    // Message container often:
    // <div class="_3-96 _2pio">Sender</div>
    // <div class="_3-96 _2let"><div>Message Text</div></div>
    // <div class="_3-94 _2lem">Oct 09, 2026 9:15am</div>
    const messageBlockRegex = /<div class="[^"]*_3-96 _2pio[^"]*">([^<]+)<\/div>[\s\S]*?<div class="[^"]*_3-96 _2let[^"]*">([\s\S]*?)<\/div>[\s\S]*?<div class="[^"]*_3-94 _2lem[^"]*">([^<]+)<\/div>/g;

    const messages: ParsedMessage[] = [];
    let counter = 1;
    let match: RegExpExecArray | null;

    while ((match = messageBlockRegex.exec(raw)) !== null) {
      const sender = match[1].trim();
      const rawText = match[2].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
      const timestamp = match[3].trim();

      if (!rawText) continue;

      messages.push({
        id: `fb-html-${counter++}`,
        sender,
        timestamp,
        text: rawText,
        raw: match[0],
        lineIndex: counter - 1,
        sourceRef: `ref:fb:html-${counter - 1}`,
      });
    }

    if (messages.length === 0) {
      return {
        success: false,
        messages: [],
        format: 'facebook_messenger',
        formatLabel: 'Facebook Messenger HTML Dump',
        error: 'Failed to parse Facebook Messenger HTML dump: Could not locate messages matching Meta HTML classes.',
      };
    }

    const participants = Array.from(new Set(messages.map((m) => m.sender)));
    const conversation: NormalizedConversation = {
      title: meta?.fileName?.replace(/\.html?$/i, '') || 'Messenger Conversation',
      platform: 'facebook_messenger',
      formatLabel: 'Facebook Messenger HTML Dump',
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
      format: 'facebook_messenger',
      formatLabel: 'Facebook Messenger HTML Dump',
    };
  }
}
