import type { ParsedMessage, ParseResult } from '../types';

// Regex patterns
// 1. Bracketed format: [2026-10-09 09:15:22] Maya Lin: Good morning team.
const BRACKETED_REGEX = /^\[([^\]]+)\]\s*([^:]+):\s*(.*)$/;

// 2. WhatsApp format: 10/09/26, 09:15 AM - Maya Lin: Good morning team.
const WHATSAPP_REGEX = /^(\d{1,4}[-/.][\d\w]+[-/.]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s*[-–—]\s*([^:]+):\s*(.*)$/;

// 3. Simple Colon format: Maya Lin: Good morning team.
const SIMPLE_COLON_REGEX = /^([A-Za-z0-9_][A-Za-z0-9_\s.()'-]{0,35}):\s+(.*)$/;

export function parseTxtContent(rawContent: string): ParseResult {
  const trimmed = rawContent.trim();
  if (!trimmed) {
    return {
      success: false,
      messages: [],
      error: 'The provided text file is empty.',
    };
  }

  const lines = rawContent.split(/\r?\n/);
  const messages: ParsedMessage[] = [];
  let formatDetected: ParseResult['formatDetected'] = undefined;
  let currentMessage: ParsedMessage | null = null;
  let msgCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineTrimmed = line.trim();

    // Check bracketed match
    const bracketMatch = line.match(BRACKETED_REGEX);
    if (bracketMatch) {
      if (currentMessage) {
        messages.push(currentMessage);
      }
      if (!formatDetected) formatDetected = 'txt_bracketed';

      currentMessage = {
        id: `txt-${msgCounter++}`,
        timestamp: bracketMatch[1].trim(),
        sender: bracketMatch[2].trim(),
        text: bracketMatch[3].trim(),
        raw: line,
        lineIndex: i,
      };
      continue;
    }

    // Check WhatsApp match
    const waMatch = line.match(WHATSAPP_REGEX);
    if (waMatch) {
      if (currentMessage) {
        messages.push(currentMessage);
      }
      if (!formatDetected) formatDetected = 'txt_whatsapp';

      currentMessage = {
        id: `txt-${msgCounter++}`,
        timestamp: waMatch[1].trim(),
        sender: waMatch[2].trim(),
        text: waMatch[3].trim(),
        raw: line,
        lineIndex: i,
      };
      continue;
    }

    // Check Simple colon match (only if line contains text after colon)
    const colonMatch = line.match(SIMPLE_COLON_REGEX);
    // Ignore URLs like "http: //" or standard punctuation false positives
    if (colonMatch && !colonMatch[1].toLowerCase().startsWith('http') && colonMatch[2].trim().length > 0) {
      if (currentMessage) {
        messages.push(currentMessage);
      }
      if (!formatDetected) formatDetected = 'txt_simple';

      currentMessage = {
        id: `txt-${msgCounter++}`,
        sender: colonMatch[1].trim(),
        text: colonMatch[2].trim(),
        raw: line,
        lineIndex: i,
      };
      continue;
    }

    // Multi-line continuation: append non-empty line to current message
    if (currentMessage && lineTrimmed) {
      currentMessage.text += `\n${lineTrimmed}`;
      currentMessage.raw += `\n${line}`;
    } else if (!currentMessage && lineTrimmed) {
      // First line didn't match a sender pattern; create fallback message
      currentMessage = {
        id: `txt-${msgCounter++}`,
        sender: 'Unknown Speaker',
        text: lineTrimmed,
        raw: line,
        lineIndex: i,
      };
    }
  }

  // Flush last message
  if (currentMessage && currentMessage.text.trim()) {
    messages.push(currentMessage);
  }

  if (messages.length === 0) {
    return {
      success: false,
      messages: [],
      error: 'Could not extract any valid conversation messages from the text file.',
    };
  }

  const missingTimestamps = messages.filter((m) => !m.timestamp).length;
  let warning: string | undefined;
  if (missingTimestamps > 0) {
    warning = `${missingTimestamps} message(s) did not have timestamps; ordered chronologically by line.`;
  }

  return {
    success: true,
    messages,
    formatDetected: formatDetected || 'txt_simple',
    warning,
  };
}

