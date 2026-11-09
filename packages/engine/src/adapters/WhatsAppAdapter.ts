import type { ParsedMessage } from '../types.ts';
import type {
  PlatformAdapter,
  PlatformFormat,
  ImportMeta,
  FormatDetectionResult,
  AdapterParseResult,
  NormalizedConversation,
} from './types.ts';

// 1. Android WhatsApp format: 10/09/26, 09:15 AM - Maya Lin: Good morning team.
const WA_ANDROID_MSG_REGEX =
  /^(\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s*[-–—]\s*([^:]+?):\s*([\s\S]*)$/;

// 2. Android WhatsApp system notice: 10/09/26, 09:14 AM - Messages and calls are end-to-end encrypted...
const WA_ANDROID_SYS_REGEX =
  /^(\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s*[-–—]\s*([^:]+)$/;

// 3. iOS WhatsApp format: [10/09/26, 09:15:22 AM] Maya Lin: Good morning team.
const WA_IOS_MSG_REGEX =
  /^\[((?:\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)|(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?[,\s]+\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}))\]\s*([^:]+?):\s*([\s\S]*)$/;

// 4. iOS WhatsApp system notice: [10/09/26, 09:14:00 AM] Messages and calls are end-to-end encrypted...
const WA_IOS_SYS_REGEX =
  /^\[((?:\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)|(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?[,\s]+\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}))\]\s*([^:]+)$/;

const MEDIA_OMITTED_REGEX =
  /<(?:media omitted|image omitted|video omitted|audio omitted|sticker omitted|document omitted)>|(?:image|video|audio|sticker|document|voice note|contact card|location)\s+omitted/i;

const SYSTEM_PHRASES_REGEX =
  /(end-to-end encrypted|created group|added|removed|left|changed the subject|changed this group's icon|security code changed|disappearing messages|pinned a message)/i;

export function detectMediaType(text: string): ParsedMessage['mediaType'] | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('image omitted')) return 'image';
  if (lower.includes('video omitted')) return 'video';
  if (lower.includes('audio omitted') || lower.includes('voice note')) return 'audio';
  if (lower.includes('sticker omitted')) return 'sticker';
  if (lower.includes('document omitted')) return 'document';
  if (lower.includes('contact card omitted')) return 'contact';
  if (lower.includes('location:')) return 'location';
  if (MEDIA_OMITTED_REGEX.test(text)) return 'other';
  return undefined;
}

export function buildWhatsAppSourceRef(sender: string, text: string): { sourceRef: string; senderPhone?: string } {
  const digits = sender.replace(/\D/g, '');
  const snippet = encodeURIComponent(text.slice(0, 100));

  // If sender has at least 7 digits (international MSISDN or local phone number)
  if (digits.length >= 7) {
    return {
      senderPhone: digits,
      sourceRef: `https://wa.me/${digits}?text=${snippet}`,
    };
  }

  // Fallback: name-based wa.me prefill URL
  const nameEncoded = encodeURIComponent(sender);
  return {
    sourceRef: `https://wa.me/?text=${nameEncoded}%3A%20${snippet}`,
  };
}

export class WhatsAppAdapter implements PlatformAdapter {
  readonly id = 'whatsapp';
  readonly platform: PlatformFormat = 'whatsapp';
  readonly displayName = 'WhatsApp Export';
  readonly supportedExtensions = ['.txt'];

  detect(raw: string, meta?: ImportMeta): FormatDetectionResult {
    const reasons: string[] = [];
    let score = 0;

    const fileName = meta?.fileName?.toLowerCase() || '';
    if (fileName.includes('_chat.txt') || fileName.includes('whatsapp chat')) {
      score += 0.3;
      reasons.push('Filename matches WhatsApp export convention ("_chat.txt" or "WhatsApp Chat")');
    }

    const lines = raw.split(/\r?\n/).slice(0, 30);
    let matchedLines = 0;
    let hasEncryptedHeader = false;
    let hasMediaOmitted = false;
    let hasPhoneSender = false;

    for (const line of lines) {
      if (SYSTEM_PHRASES_REGEX.test(line)) {
        hasEncryptedHeader = true;
      }
      if (MEDIA_OMITTED_REGEX.test(line)) {
        hasMediaOmitted = true;
      }
      if (WA_ANDROID_MSG_REGEX.test(line) || WA_IOS_MSG_REGEX.test(line)) {
        matchedLines++;
        if (/\+\d{1,3}[\s-]?\(?\d{1,4}\)?/.test(line)) {
          hasPhoneSender = true;
        }
      }
    }

    if (matchedLines >= 2) {
      score += 0.85;
      reasons.push(`Found ${matchedLines} lines matching WhatsApp timestamp & sender patterns`);
    } else if (matchedLines === 1) {
      score += 0.5;
      reasons.push('Found WhatsApp message pattern match');
    }

    if (hasEncryptedHeader) {
      score += 0.1;
      reasons.push('Contains WhatsApp security or system notice phrase');
    }

    if (hasMediaOmitted) {
      score += 0.05;
      reasons.push('Contains WhatsApp media omitted marker');
    }

    if (hasPhoneSender) {
      score += 0.05;
      reasons.push('Contains international phone number sender');
    }

    const confidence = Math.min(1.0, Math.max(0.0, score));

    return {
      format: 'whatsapp',
      confidence,
      formatLabel: 'WhatsApp Export (.txt)',
      reasons,
    };
  }

  parse(raw: string, meta?: ImportMeta): AdapterParseResult {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {
        success: false,
        messages: [],
        format: 'whatsapp',
        formatLabel: 'WhatsApp Export',
        error: 'Failed to parse WhatsApp export: the provided file content is empty.',
      };
    }

    const lines = raw.split(/\r?\n/);
    const messages: ParsedMessage[] = [];
    let currentMsg: ParsedMessage | null = null;
    let counter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineTrimmed = line.trim();
      if (!lineTrimmed && !currentMsg) continue;

      // 1. Android standard message
      const androidMatch = line.match(WA_ANDROID_MSG_REGEX);
      if (androidMatch) {
        if (currentMsg) messages.push(currentMsg);

        const timestamp = androidMatch[1].trim();
        const sender = androidMatch[2].trim();
        const text = androidMatch[3].trim();
        const mediaType = detectMediaType(text);
        const { sourceRef, senderPhone } = buildWhatsAppSourceRef(sender, text);

        currentMsg = {
          id: `wa-${counter++}`,
          timestamp,
          sender,
          text,
          raw: line,
          lineIndex: i,
          sourceRef,
          senderPhone,
          mediaType,
        };
        continue;
      }

      // 2. iOS standard message
      const iosMatch = line.match(WA_IOS_MSG_REGEX);
      if (iosMatch) {
        if (currentMsg) messages.push(currentMsg);

        const timestamp = iosMatch[1].trim();
        const sender = iosMatch[2].trim();
        const text = iosMatch[3].trim();
        const mediaType = detectMediaType(text);
        const { sourceRef, senderPhone } = buildWhatsAppSourceRef(sender, text);

        currentMsg = {
          id: `wa-${counter++}`,
          timestamp,
          sender,
          text,
          raw: line,
          lineIndex: i,
          sourceRef,
          senderPhone,
          mediaType,
        };
        continue;
      }

      // 3. Android system notice
      const androidSysMatch = line.match(WA_ANDROID_SYS_REGEX);
      if (androidSysMatch && SYSTEM_PHRASES_REGEX.test(androidSysMatch[2])) {
        if (currentMsg) messages.push(currentMsg);

        currentMsg = {
          id: `wa-${counter++}`,
          timestamp: androidSysMatch[1].trim(),
          sender: 'System',
          text: androidSysMatch[2].trim(),
          raw: line,
          lineIndex: i,
          isSystem: true,
        };
        continue;
      }

      // 4. iOS system notice
      const iosSysMatch = line.match(WA_IOS_SYS_REGEX);
      if (iosSysMatch && SYSTEM_PHRASES_REGEX.test(iosSysMatch[2])) {
        if (currentMsg) messages.push(currentMsg);

        currentMsg = {
          id: `wa-${counter++}`,
          timestamp: iosSysMatch[1].trim(),
          sender: 'System',
          text: iosSysMatch[2].trim(),
          raw: line,
          lineIndex: i,
          isSystem: true,
        };
        continue;
      }

      // 5. Continuation lines (multi-line messages)
      if (currentMsg) {
        currentMsg.text += `\n${line}`;
        currentMsg.raw += `\n${line}`;
        if (!currentMsg.mediaType) {
          currentMsg.mediaType = detectMediaType(line);
        }
      }
    }

    if (currentMsg) {
      messages.push(currentMsg);
    }

    if (messages.length === 0) {
      return {
        success: false,
        messages: [],
        format: 'whatsapp',
        formatLabel: 'WhatsApp Export',
        error:
          'Failed to parse WhatsApp export: No valid messages found. Expected timestamped lines such as "DD/MM/YY, HH:MM - Sender: text" or "[DD/MM/YY, HH:MM:SS] Sender: text".',
      };
    }

    const participants = Array.from(
      new Set(
        messages
          .filter((m) => !m.isSystem && m.sender !== 'System')
          .map((m) => m.sender)
      )
    );

    const firstTs = messages.find((m) => m.timestamp)?.timestamp;
    const lastTs = [...messages].reverse().find((m) => m.timestamp)?.timestamp;

    const conversation: NormalizedConversation = {
      title: meta?.fileName ? meta.fileName.replace(/\.txt$/i, '') : 'WhatsApp Chat',
      platform: 'whatsapp',
      formatLabel: 'WhatsApp Export (.txt)',
      messages,
      participants,
      dateRange: {
        start: firstTs,
        end: lastTs,
      },
      totalMessages: messages.length,
      metadata: {
        hasSystemNotices: messages.some((m) => m.isSystem),
        hasMediaOmitted: messages.some((m) => Boolean(m.mediaType)),
      },
    };

    return {
      success: true,
      conversation,
      messages,
      format: 'whatsapp',
      formatLabel: 'WhatsApp Export (.txt)',
    };
  }
}
