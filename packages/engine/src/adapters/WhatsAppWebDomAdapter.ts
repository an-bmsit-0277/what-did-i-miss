import type { ParsedMessage } from '../types.ts';
import type {
  PlatformAdapter,
  PlatformFormat,
  ImportMeta,
  FormatDetectionResult,
  AdapterParseResult,
  NormalizedConversation,
} from './types.ts';
import { buildWhatsAppSourceRef, detectMediaType } from './WhatsAppAdapter.ts';

export interface RawWhatsAppWebBubble {
  id?: string;
  sender?: string;
  text?: string;
  timestamp?: string;
  prePlainText?: string;
  isOutgoing?: boolean;
  mediaType?: ParsedMessage['mediaType'];
  isMediaOmitted?: boolean;
  isDeleted?: boolean;
  isSystem?: boolean;
  domOrder?: number;
}

export interface WhatsAppWebExtractionOptions {
  defaultTitle?: string;
}

export interface WhatsAppWebExtractionResult {
  success: boolean;
  code?: 'NOT_LOGGED_IN' | 'NO_ACTIVE_CHAT' | 'NO_MESSAGES' | 'SUCCESS';
  error?: string;
  chatTitle?: string;
  conversation?: NormalizedConversation;
  messages: ParsedMessage[];
  totalRawBubbles?: number;
}

/**
 * Computes a simple stable hash from a string to generate stable bubble IDs when data-id is absent.
 */
function stableStringHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

/**
 * Normalizes an array of raw extracted WhatsApp Web bubbles into standard ParsedMessage models
 * and a complete NormalizedConversation.
 */
export function normalizeWhatsAppWebBubbles(
  bubbles: RawWhatsAppWebBubble[],
  chatTitle: string = 'WhatsApp Web Chat'
): NormalizedConversation {
  const messages: ParsedMessage[] = [];
  let counter = 1;

  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    const text = (b.text || '').trim();

    // If completely empty without media or system flag, skip
    if (!text && !b.mediaType && !b.isSystem && !b.isMediaOmitted) {
      continue;
    }

    const sender = b.isSystem
      ? 'System'
      : b.isOutgoing
      ? 'You'
      : b.sender || chatTitle;

    const finalText =
      text ||
      (b.mediaType === 'audio'
        ? '<Voice note omitted>'
        : b.mediaType === 'image'
        ? '<Media omitted>'
        : b.mediaType === 'video'
        ? '<Video omitted>'
        : b.mediaType === 'document'
        ? '<Document omitted>'
        : b.mediaType === 'sticker'
        ? '<Sticker omitted>'
        : b.isDeleted
        ? 'This message was deleted'
        : '<Media omitted>');

    const detectedMedia = b.mediaType || detectMediaType(finalText);

    // Compute stable message ID: prefer explicit data-id, or fallback to hash-backed ID
    const stableId =
      b.id ||
      `wa-dom-${counter}-${stableStringHash(sender + ':' + (b.timestamp || '') + ':' + finalText)}`;

    const { sourceRef, senderPhone } = buildWhatsAppSourceRef(sender, finalText);

    const rawLine = b.timestamp
      ? `[${b.timestamp}] ${sender}: ${finalText}`
      : `${sender}: ${finalText}`;

    messages.push({
      id: stableId,
      sender,
      timestamp: b.timestamp,
      text: finalText,
      raw: b.prePlainText ? `${b.prePlainText} ${finalText}` : rawLine,
      lineIndex: counter - 1,
      sourceRef,
      senderPhone,
      mediaType: detectedMedia,
      isSystem: b.isSystem,
    });

    counter++;
  }

  const participants = Array.from(
    new Set(
      messages
        .filter((m) => !m.isSystem && m.sender !== 'System' && m.sender !== 'You')
        .map((m) => m.sender)
    )
  );

  const firstTs = messages.find((m) => m.timestamp)?.timestamp;
  const lastTs = [...messages].reverse().find((m) => m.timestamp)?.timestamp;

  return {
    title: chatTitle,
    platform: 'whatsapp',
    formatLabel: 'WhatsApp Web Live',
    messages,
    participants,
    dateRange: {
      start: firstTs,
      end: lastTs,
    },
    totalMessages: messages.length,
    metadata: {
      extractedFrom: 'whatsapp_web_dom',
      hasSystemNotices: messages.some((m) => m.isSystem),
      hasMediaOmitted: messages.some((m) => Boolean(m.mediaType)),
    },
  };
}

/**
 * Serializes normalized messages into a standard bracketed WhatsApp export text.
 * Suitable for sending to the Missed. backend POST /api/conversations endpoint.
 */
export function serializeWhatsAppMessagesToText(messages: ParsedMessage[]): string {
  return messages
    .map((m) => {
      let ts = (m.timestamp || '').trim();
      if (!ts) {
        ts = '10/09/2026, 09:14:00 AM';
      } else if (/^\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?$/.test(ts)) {
        // Time-only like "09:14"
        ts = `10/09/2026, ${ts}`;
      } else {
        const timeDateMatch = ts.match(/^(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)[,\s]+(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})/);
        if (timeDateMatch) {
          ts = `${timeDateMatch[2]}, ${timeDateMatch[1]}`;
        }
      }
      const sender = m.sender || 'Unknown';
      return `[${ts}] ${sender}: ${m.text}`;
    })
    .join('\n');
}

/**
 * Extracts conversation data directly from a live DOM element (e.g. document or container).
 * Uses defensive selectors and falls back gracefully across different WhatsApp Web versions.
 */
export function extractWhatsAppWebChatFromDom(
  root: any,
  options?: WhatsAppWebExtractionOptions
): WhatsAppWebExtractionResult {
  if (!root || typeof root.querySelector !== 'function') {
    return {
      success: false,
      code: 'NO_ACTIVE_CHAT',
      error: 'Invalid DOM root provided for WhatsApp Web extraction.',
      messages: [],
    };
  }

  // 1. Check for logged-out / QR code screen
  const isQrScreen = root.querySelector(
    'canvas[aria-label="Scan me!"], [data-ref], [data-testid="qrcode"], ._ak96, div[data-testid="intro-title"]'
  );
  if (isQrScreen && !root.querySelector('header')) {
    return {
      success: false,
      code: 'NOT_LOGGED_IN',
      error: 'WhatsApp Web is not logged in. Please scan the QR code to log in first.',
      messages: [],
    };
  }

  // 2. Locate active conversation header & chat title
  const header = root.querySelector(
    'header, [data-testid="conversation-info-header"], #main header, div[role="region"] header'
  );

  let chatTitle: string | undefined = undefined;
  if (header) {
    const titleEl = header.querySelector(
      'span[title], div[role="button"] span[dir="auto"], span[dir="auto"], ._ak8q'
    );
    chatTitle = titleEl?.getAttribute('title') || titleEl?.textContent?.trim();
  }

  if (!chatTitle) {
    chatTitle = options?.defaultTitle;
  }

  if (!chatTitle) {
    return {
      success: false,
      code: 'NO_ACTIVE_CHAT',
      error: 'No active chat open. Please click on a conversation in WhatsApp Web.',
      messages: [],
    };
  }

  // 3. Extract message bubbles in DOM order
  const rawBubbles: RawWhatsAppWebBubble[] = [];
  const bubbleNodes = root.querySelectorAll(
    '[data-testid="msg-container"], div.message-in, div.message-out, div[data-id], div[role="row"]'
  );

  let domIndex = 0;

  bubbleNodes.forEach((node: any) => {
    // Avoid double processing nested matches
    if (node.closest && node.parentElement?.closest('[data-testid="msg-container"]')) {
      return;
    }

    const dataId =
      node.getAttribute?.('data-id') ||
      node.querySelector?.('[data-id]')?.getAttribute?.('data-id');

    // Strategy A: data-pre-plain-text attribute
    const prePlainEl = node.getAttribute?.('data-pre-plain-text')
      ? node
      : node.querySelector?.('[data-pre-plain-text]');
    const prePlainText = prePlainEl?.getAttribute?.('data-pre-plain-text') || '';

    let extractedSender: string | undefined = undefined;
    let extractedTime: string | undefined = undefined;

    if (prePlainText) {
      const match = prePlainText.match(/^\[([^\]]+)\]\s*([^:]+):\s*$/);
      if (match) {
        extractedTime = match[1].trim();
        extractedSender = match[2].trim();
      }
    }

    // Check outgoing indicator
    const isOutgoing = Boolean(
      node.classList?.contains?.('message-out') ||
        (dataId && dataId.startsWith('true_')) ||
        node.querySelector?.('[data-icon="msg-dblcheck"], [data-icon="msg-check"], [data-icon="msg-time"]')
    );

    // Group chat author label (if not outgoing and sender not yet resolved)
    if (!extractedSender && !isOutgoing) {
      const authorEl = node.querySelector?.(
        '[data-testid="author"], ._ak8q, span[dir="auto"][color], span[role="button"]'
      );
      if (authorEl && authorEl.textContent?.trim()) {
        extractedSender = authorEl.textContent.trim();
      }
    }

    // Timestamp from metadata container if not resolved
    if (!extractedTime) {
      const metaEl = node.querySelector?.(
        '[data-testid="msg-meta"] span, span._ak8i, time, [data-testid="msg-time"]'
      );
      if (metaEl && metaEl.textContent?.trim()) {
        extractedTime = metaEl.textContent.trim();
      }
    }

    // Text content
    const textEl = node.querySelector?.(
      '.selectable-text, span._ao3e, [data-testid="selectable-text"], span[dir="ltr"]'
    );
    let text = textEl?.textContent?.trim() || '';

    // Media states
    let mediaType: ParsedMessage['mediaType'] | undefined = undefined;
    let isMediaOmitted = false;

    if (
      node.querySelector?.(
        '[data-testid="audio-play"], [data-icon="audio-file"], audio, [data-icon="ptt-play"]'
      )
    ) {
      mediaType = 'audio';
      isMediaOmitted = true;
    } else if (
      node.querySelector?.('[data-testid="image-thumb"], img[src*="blob:"], [data-icon="image"]')
    ) {
      mediaType = 'image';
      if (!text) isMediaOmitted = true;
    } else if (node.querySelector?.('[data-testid="video-thumb"], video, [data-icon="video"]')) {
      mediaType = 'video';
      if (!text) isMediaOmitted = true;
    } else if (node.querySelector?.('[data-testid="document-thumb"], [data-icon="document"]')) {
      mediaType = 'document';
      if (!text) isMediaOmitted = true;
    } else if (node.querySelector?.('[data-testid="sticker-thumb"], [data-icon="sticker"]')) {
      mediaType = 'sticker';
      if (!text) isMediaOmitted = true;
    }

    // Deleted messages
    const isDeleted = Boolean(
      node.querySelector?.('[data-icon="recalled"], span.recalled') ||
        text.toLowerCase().includes('this message was deleted')
    );

    // System message check
    const isSystem = Boolean(
      node.querySelector?.('[data-testid="system-message"], .system-message') ||
        node.classList?.contains?.('system-message')
    );

    if (text || mediaType || isDeleted || isSystem) {
      rawBubbles.push({
        id: dataId,
        sender: extractedSender,
        text,
        timestamp: extractedTime,
        prePlainText: prePlainText || undefined,
        isOutgoing,
        mediaType,
        isMediaOmitted,
        isDeleted,
        isSystem,
        domOrder: ++domIndex,
      });
    }
  });

  if (rawBubbles.length === 0) {
    return {
      success: false,
      code: 'NO_MESSAGES',
      error: `No readable messages found in chat "${chatTitle}".`,
      chatTitle,
      messages: [],
      totalRawBubbles: 0,
    };
  }

  const normalized = normalizeWhatsAppWebBubbles(rawBubbles, chatTitle);

  return {
    success: true,
    code: 'SUCCESS',
    chatTitle,
    conversation: normalized,
    messages: normalized.messages,
    totalRawBubbles: rawBubbles.length,
  };
}

/**
 * Extracts conversation data from an HTML snapshot string of WhatsApp Web.
 * Enables fast, robust unit-testing and offline parsing of checked-in HTML fixtures.
 */
export function parseWhatsAppWebHtml(
  html: string,
  options?: WhatsAppWebExtractionOptions
): WhatsAppWebExtractionResult {
  // 1. Check logged-out / QR code
  if (
    /canvas[^>]*aria-label="Scan me!"|data-testid="qrcode"|data-testid="intro-title"/i.test(html) &&
    !/<header/i.test(html)
  ) {
    return {
      success: false,
      code: 'NOT_LOGGED_IN',
      error: 'WhatsApp Web is not logged in. Please scan the QR code to log in first.',
      messages: [],
    };
  }

  // 2. Extract chat title from header
  let chatTitle = options?.defaultTitle;
  const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
  if (headerMatch) {
    const titleMatch =
      headerMatch[0].match(/title="([^"]+)"/i) ||
      headerMatch[0].match(/<span[^>]*dir="auto"[^>]*>([\s\S]*?)<\/span>/i);
    if (titleMatch) {
      chatTitle = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }
  }

  if (!chatTitle) {
    chatTitle = 'WhatsApp Web Chat';
  }

  // 3. Extract message bubbles using regex patterns
  const rawBubbles: RawWhatsAppWebBubble[] = [];
  let domIndex = 0;

  // Regex matching container blocks with data-id or msg-container
  const bubbleRegex =
    /<div[^>]*?(?:data-id="([^"]+)"|data-testid="msg-container"|class="[^"]*?(?:message-in|message-out)[^"]*?")[^>]*?>([\s\S]*?)(?=<div[^>]*?(?:data-id="|data-testid="msg-container"|class="[^"]*?(?:message-in|message-out))|$)/gi;

  let match: RegExpExecArray | null;

  while ((match = bubbleRegex.exec(html)) !== null) {
    const bubbleHtml = match[0];
    const dataId = match[1] || (bubbleHtml.match(/data-id="([^"]+)"/i)?.[1]);

    const isOutgoing =
      /class="[^"]*message-out[^"]*"/i.test(bubbleHtml) ||
      (dataId && dataId.startsWith('true_')) ||
      /data-icon="msg-dblcheck"|data-icon="msg-check"/i.test(bubbleHtml);

    // data-pre-plain-text match
    const prePlainMatch = bubbleHtml.match(/data-pre-plain-text="([^"]+)"/i);
    let extractedSender: string | undefined;
    let extractedTime: string | undefined;

    if (prePlainMatch) {
      const headerMatch = prePlainMatch[1].match(/^\[([^\]]+)\]\s*([^:]+):\s*$/);
      if (headerMatch) {
        extractedTime = headerMatch[1].trim();
        extractedSender = headerMatch[2].trim();
      }
    }

    // Group author
    if (!extractedSender && !isOutgoing) {
      const authorMatch = bubbleHtml.match(
        /<span[^>]*?(?:data-testid="author"|class="[^"]*_ak8q[^"]*")[^>]*?>([\s\S]*?)<\/span>/i
      );
      if (authorMatch) {
        extractedSender = authorMatch[1].replace(/<[^>]+>/g, '').trim();
      }
    }

    // Time
    if (!extractedTime) {
      const timeMatch = bubbleHtml.match(
        /<span[^>]*?(?:data-testid="msg-meta"|class="[^"]*_ak8i[^"]*"|data-testid="msg-time")[^>]*?>([\s\S]*?)<\/span>/i
      );
      if (timeMatch) {
        extractedTime = timeMatch[1].replace(/<[^>]+>/g, '').trim();
      }
    }

    // Text
    const textMatch = bubbleHtml.match(
      /<span[^>]*?(?:selectable-text|_ao3e|dir="ltr")[^>]*?>([\s\S]*?)<\/span>/i
    );
    let text = textMatch
      ? textMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim()
      : '';

    // Media states
    let mediaType: ParsedMessage['mediaType'] | undefined;
    let isMediaOmitted = false;

    if (/data-testid="audio-play"|data-icon="audio-file"|<audio/i.test(bubbleHtml)) {
      mediaType = 'audio';
      isMediaOmitted = true;
    } else if (/data-testid="image-thumb"|data-icon="image"/i.test(bubbleHtml)) {
      mediaType = 'image';
      if (!text) isMediaOmitted = true;
    } else if (/data-testid="video-thumb"|data-icon="video"/i.test(bubbleHtml)) {
      mediaType = 'video';
      if (!text) isMediaOmitted = true;
    } else if (/data-testid="document-thumb"|data-icon="document"/i.test(bubbleHtml)) {
      mediaType = 'document';
      if (!text) isMediaOmitted = true;
    } else if (/data-testid="sticker-thumb"|data-icon="sticker"/i.test(bubbleHtml)) {
      mediaType = 'sticker';
      if (!text) isMediaOmitted = true;
    }

    const isDeleted = /data-icon="recalled"|this message was deleted/i.test(bubbleHtml);
    const isSystem = /data-testid="system-message"|class="[^"]*system-message[^"]*"/i.test(
      bubbleHtml
    );

    if (text || mediaType || isDeleted || isSystem) {
      rawBubbles.push({
        id: dataId,
        sender: extractedSender,
        text,
        timestamp: extractedTime,
        prePlainText: prePlainMatch ? prePlainMatch[1] : undefined,
        isOutgoing,
        mediaType,
        isMediaOmitted,
        isDeleted,
        isSystem,
        domOrder: ++domIndex,
      });
    }
  }

  if (rawBubbles.length === 0) {
    return {
      success: false,
      code: 'NO_MESSAGES',
      error: `No readable messages found in chat HTML "${chatTitle}".`,
      chatTitle,
      messages: [],
      totalRawBubbles: 0,
    };
  }

  const normalized = normalizeWhatsAppWebBubbles(rawBubbles, chatTitle);

  return {
    success: true,
    code: 'SUCCESS',
    chatTitle,
    conversation: normalized,
    messages: normalized.messages,
    totalRawBubbles: rawBubbles.length,
  };
}

/**
 * PlatformAdapter implementation for WhatsApp Web DOM / HTML snapshots.
 */
export class WhatsAppWebDomAdapter implements PlatformAdapter {
  readonly id = 'whatsapp_web_dom';
  readonly platform: PlatformFormat = 'whatsapp';
  readonly displayName = 'WhatsApp Web Live Export';
  readonly supportedExtensions = ['.html', '.htm'];

  detect(raw: string, meta?: ImportMeta): FormatDetectionResult {
    const reasons: string[] = [];
    let score = 0;

    const fileName = meta?.fileName?.toLowerCase() || '';
    if (fileName.includes('whatsapp') && (fileName.endsWith('.html') || fileName.endsWith('.htm'))) {
      score += 0.3;
      reasons.push('File name and extension indicate WhatsApp Web HTML snapshot');
    }

    if (/data-testid="msg-container"/i.test(raw)) {
      score += 0.4;
      reasons.push('Contains WhatsApp Web msg-container test identifiers');
    }

    if (/data-pre-plain-text="/i.test(raw)) {
      score += 0.4;
      reasons.push('Contains WhatsApp Web data-pre-plain-text message timestamps');
    }

    if (/data-id="(?:true|false)_[^"]+@c\.us/i.test(raw)) {
      score += 0.3;
      reasons.push('Contains WhatsApp Web internal message data-id tokens');
    }

    const confidence = Math.min(1.0, Math.max(0.0, score));

    return {
      format: 'whatsapp',
      confidence,
      formatLabel: 'WhatsApp Web Live Export',
      reasons,
    };
  }

  parse(raw: string, meta?: ImportMeta): AdapterParseResult {
    const res = parseWhatsAppWebHtml(raw, { defaultTitle: meta?.fileName?.replace(/\.html?$/i, '') });

    if (!res.success || res.messages.length === 0) {
      return {
        success: false,
        messages: [],
        format: 'whatsapp',
        formatLabel: 'WhatsApp Web Live Export',
        error: res.error || 'Failed to extract WhatsApp Web DOM snapshot.',
      };
    }

    return {
      success: true,
      conversation: res.conversation,
      messages: res.messages,
      format: 'whatsapp',
      formatLabel: 'WhatsApp Web Live Export',
    };
  }
}
