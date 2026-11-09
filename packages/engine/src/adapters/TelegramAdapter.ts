import type { ParsedMessage } from '../types.ts';
import type {
  PlatformAdapter,
  PlatformFormat,
  ImportMeta,
  FormatDetectionResult,
  AdapterParseResult,
  NormalizedConversation,
} from './types.ts';

interface TelegramTextEntity {
  type: string;
  text: string;
  href?: string;
}

interface TelegramRawMessage {
  id: number | string;
  type?: 'message' | 'service';
  date?: string;
  date_unixtime?: string | number;
  from?: string;
  from_id?: string;
  actor?: string;
  action?: string;
  reply_to_message_id?: number | string;
  text?: string | Array<string | TelegramTextEntity>;
  media_type?: string;
  file?: string;
  photo?: string;
}

interface TelegramChatExport {
  name?: string;
  type?: string;
  id?: number | string;
  messages?: TelegramRawMessage[];
}

export function flattenTelegramText(text: unknown): string {
  if (typeof text === 'string') return text;
  if (Array.isArray(text)) {
    return text
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          return String(part.text);
        }
        return '';
      })
      .join('');
  }
  return '';
}

export class TelegramAdapter implements PlatformAdapter {
  readonly id = 'telegram';
  readonly platform: PlatformFormat = 'telegram';
  readonly displayName = 'Telegram Desktop Export';
  readonly supportedExtensions = ['.json'];

  detect(raw: string, _meta?: ImportMeta): FormatDetectionResult {
    const reasons: string[] = [];
    const trimmed = raw.trim();

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed) as TelegramChatExport;
        const validChatTypes = [
          'saved_messages',
          'personal_chat',
          'private_group',
          'public_supergroup',
          'private_supergroup',
          'public_channel',
          'private_channel',
        ];

        const hasTelegramType = typeof parsed.type === 'string' && validChatTypes.includes(parsed.type);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          const sample = parsed.messages.slice(0, 5);
          const hasTgFields = sample.some(
            (m) =>
              'date_unixtime' in m ||
              'from_id' in m ||
              'reply_to_message_id' in m ||
              m.type === 'service'
          );

          if (hasTelegramType || hasTgFields) {
            reasons.push('Contains Telegram Desktop export schema (type, messages with date_unixtime/from_id)');
            return {
              format: 'telegram',
              confidence: 0.99,
              formatLabel: 'Telegram Desktop Export (.json)',
              reasons,
            };
          }
        }
      } catch {
        // Not valid JSON
      }
    }

    return {
      format: 'telegram',
      confidence: 0.0,
      formatLabel: 'Telegram Desktop Export',
      reasons: ['No Telegram markers found'],
    };
  }

  parse(raw: string, meta?: ImportMeta): AdapterParseResult {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {
        success: false,
        messages: [],
        format: 'telegram',
        formatLabel: 'Telegram Desktop Export',
        error: 'Failed to parse Telegram export: the JSON file is empty.',
      };
    }

    let parsed: TelegramChatExport;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return {
        success: false,
        messages: [],
        format: 'telegram',
        formatLabel: 'Telegram Desktop Export',
        error: `Failed to parse Telegram JSON export: Malformed JSON syntax (${(err as Error).message}).`,
      };
    }

    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      return {
        success: false,
        messages: [],
        format: 'telegram',
        formatLabel: 'Telegram Desktop Export',
        error: 'Failed to parse Telegram JSON export: Missing or empty "messages" array.',
      };
    }

    // Build lookup for reply text resolution
    const messageTextMap = new Map<string, string>();
    for (const item of parsed.messages) {
      const text = flattenTelegramText(item.text).trim();
      if (text) {
        messageTextMap.set(String(item.id), text);
      }
    }

    const messages: ParsedMessage[] = [];
    let counter = 1;

    for (let i = 0; i < parsed.messages.length; i++) {
      const item = parsed.messages[i];
      const isService = item.type === 'service';
      const sender = isService
        ? item.actor || 'System'
        : item.from || 'Unknown';

      let text = flattenTelegramText(item.text).trim();
      if (isService && !text && item.action) {
        text = `[Service: ${item.action}]`;
      }

      let mediaType: ParsedMessage['mediaType'] | undefined;
      if (item.photo) {
        mediaType = 'image';
        if (!text) text = '[Photo attachment]';
      } else if (item.media_type === 'video_file' || item.media_type === 'animation') {
        mediaType = 'video';
        if (!text) text = '[Video attachment]';
      } else if (item.media_type === 'audio_file' || item.media_type === 'voice_message') {
        mediaType = 'audio';
        if (!text) text = '[Voice message]';
      } else if (item.media_type === 'sticker') {
        mediaType = 'sticker';
        if (!text) text = '[Sticker]';
      } else if (item.file) {
        mediaType = 'document';
        if (!text) text = '[File attachment]';
      }

      if (!text) {
        continue;
      }

      // Timestamp
      let timestamp = item.date;
      if (item.date_unixtime) {
        const unixSec = typeof item.date_unixtime === 'number'
          ? item.date_unixtime
          : parseInt(item.date_unixtime, 10);
        if (!isNaN(unixSec)) {
          timestamp = new Date(unixSec * 1000).toISOString().replace('T', ' ').substring(0, 19);
        }
      }

      const sourceRef = `ref:tg:${item.id}`;

      let replyToMessageId: string | undefined;
      let replyToSnippet: string | undefined;

      if (item.reply_to_message_id) {
        replyToMessageId = String(item.reply_to_message_id);
        const originalText = messageTextMap.get(replyToMessageId);
        if (originalText) {
          replyToSnippet = originalText.slice(0, 100);
        }
      }

      messages.push({
        id: `tg-${item.id ?? counter++}`,
        sender,
        timestamp,
        text,
        raw: JSON.stringify(item),
        lineIndex: i,
        sourceRef,
        replyToMessageId,
        replyToSnippet,
        mediaType,
        isSystem: isService,
      });
    }

    if (messages.length === 0) {
      return {
        success: false,
        messages: [],
        format: 'telegram',
        formatLabel: 'Telegram Desktop Export',
        error: 'Failed to parse Telegram JSON export: No valid messages found.',
      };
    }

    const participants = Array.from(
      new Set(
        messages
          .filter((m) => !m.isSystem && m.sender !== 'System')
          .map((m) => m.sender)
      )
    );

    const title = parsed.name || meta?.fileName?.replace(/\.json$/i, '') || 'Telegram Chat';

    const conversation: NormalizedConversation = {
      title,
      platform: 'telegram',
      formatLabel: 'Telegram Desktop Export (.json)',
      messages,
      participants,
      dateRange: {
        start: messages[0]?.timestamp,
        end: messages[messages.length - 1]?.timestamp,
      },
      totalMessages: messages.length,
      metadata: {
        chatId: parsed.id,
        chatType: parsed.type,
      },
    };

    return {
      success: true,
      conversation,
      messages,
      format: 'telegram',
      formatLabel: 'Telegram Desktop Export (.json)',
    };
  }
}

