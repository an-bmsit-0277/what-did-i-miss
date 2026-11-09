import type { ParsedMessage } from '../types.ts';
import type {
  PlatformAdapter,
  PlatformFormat,
  ImportMeta,
  FormatDetectionResult,
  AdapterParseResult,
  NormalizedConversation,
} from './types.ts';

interface SlackRawMessage {
  client_msg_id?: string;
  ts?: string;
  user?: string;
  user_profile?: {
    real_name?: string;
    display_name?: string;
    name?: string;
  };
  text?: string;
  thread_ts?: string;
  reply_count?: number;
  subtype?: string;
}

export class SlackJsonAdapter implements PlatformAdapter {
  readonly id = 'slack';
  readonly platform: PlatformFormat = 'slack';
  readonly displayName = 'Slack JSON Export';
  readonly supportedExtensions = ['.json'];

  detect(raw: string, _meta?: ImportMeta): FormatDetectionResult {
    const reasons: string[] = [];
    const trimmed = raw.trim();

    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.messages)
          ? parsed.messages
          : null;

        if (list && list.length > 0) {
          const sample = list.slice(0, 5);
          const hasSlackTs = sample.some(
            (m: unknown) => typeof m === 'object' && m !== null && 'ts' in m && /^\d+\.\d+$/.test(String((m as { ts?: unknown }).ts))
          );
          const hasSlackFields = sample.some(
            (m: unknown) =>
              typeof m === 'object' &&
              m !== null &&
              ('client_msg_id' in m || 'user_profile' in m || 'thread_ts' in m)
          );

          if (hasSlackTs) {
            reasons.push('Contains Slack microsecond epoch timestamp signature ("ts": "17... . ...")');
            if (hasSlackFields) {
              reasons.push('Contains Slack message structure ("client_msg_id", "user_profile", or "thread_ts")');
            }
            return {
              format: 'slack',
              confidence: hasSlackFields ? 0.98 : 0.85,
              formatLabel: 'Slack JSON Export',
              reasons,
            };
          }
        }
      } catch {
        // Not JSON
      }
    }

    return {
      format: 'slack',
      confidence: 0.0,
      formatLabel: 'Slack JSON Export',
      reasons: ['No Slack JSON markers found'],
    };
  }

  parse(raw: string, meta?: ImportMeta): AdapterParseResult {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {
        success: false,
        messages: [],
        format: 'slack',
        formatLabel: 'Slack JSON Export',
        error: 'Failed to parse Slack JSON export: file is empty.',
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      return {
        success: false,
        messages: [],
        format: 'slack',
        formatLabel: 'Slack JSON Export',
        error: `Failed to parse Slack JSON export: Malformed JSON (${(err as Error).message}).`,
      };
    }

    let rawList: SlackRawMessage[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as Record<string, unknown>).messages)) {
      rawList = (parsed as { messages: SlackRawMessage[] }).messages;
    } else {
      return {
        success: false,
        messages: [],
        format: 'slack',
        formatLabel: 'Slack JSON Export',
        error: 'Failed to parse Slack JSON export: Expected an array of messages or an object with a "messages" array.',
      };
    }

    const messages: ParsedMessage[] = [];
    let counter = 1;

    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      if (!item || typeof item !== 'object') continue;

      const sender =
        item.user_profile?.real_name ||
        item.user_profile?.display_name ||
        item.user_profile?.name ||
        item.user ||
        'Unknown';

      const text = (item.text || '').trim();
      if (!text) continue;

      let timestamp: string | undefined;
      if (item.ts) {
        const num = parseFloat(item.ts);
        if (!isNaN(num)) {
          timestamp = new Date(num * 1000).toISOString().replace('T', ' ').substring(0, 19);
        }
      }

      const sourceRef = item.ts ? `ref:slack:${item.ts}` : `ref:slack:${counter}`;

      messages.push({
        id: item.client_msg_id || (item.ts ? `slack-${item.ts}` : `slack-${counter++}`),
        sender,
        timestamp,
        text,
        raw: JSON.stringify(item),
        lineIndex: i,
        sourceRef,
        replyToMessageId: item.thread_ts && item.thread_ts !== item.ts ? `slack-${item.thread_ts}` : undefined,
      });
    }

    if (messages.length === 0) {
      return {
        success: false,
        messages: [],
        format: 'slack',
        formatLabel: 'Slack JSON Export',
        error: 'Failed to parse Slack JSON export: No valid messages extracted.',
      };
    }

    const participants = Array.from(new Set(messages.map((m) => m.sender)));
    const conversation: NormalizedConversation = {
      title: meta?.fileName?.replace(/\.json$/i, '') || 'Slack Export',
      platform: 'slack',
      formatLabel: 'Slack JSON Export',
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
      format: 'slack',
      formatLabel: 'Slack JSON Export',
    };
  }
}
