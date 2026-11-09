import type {
  PlatformAdapter,
  PlatformFormat,
  ImportMeta,
  FormatDetectionResult,
  AdapterParseResult,
} from './types.ts';
import { WhatsAppAdapter } from './WhatsAppAdapter.ts';
import { TelegramAdapter } from './TelegramAdapter.ts';
import { FacebookMessengerAdapter } from './FacebookMessengerAdapter.ts';
import { SlackJsonAdapter } from './SlackJsonAdapter.ts';
import { StandardChatAdapter } from './StandardChatAdapter.ts';
import { WhatsAppWebDomAdapter } from './WhatsAppWebDomAdapter.ts';

export class AdapterRegistry {
  private adapters: PlatformAdapter[] = [];

  constructor() {
    // Default registration order (specific adapters before fallback)
    this.register(new WhatsAppAdapter());
    this.register(new WhatsAppWebDomAdapter());
    this.register(new TelegramAdapter());
    this.register(new FacebookMessengerAdapter());
    this.register(new SlackJsonAdapter());
    this.register(new StandardChatAdapter());
  }

  register(adapter: PlatformAdapter): void {
    // Prevent duplicate registrations
    const idx = this.adapters.findIndex((a) => a.id === adapter.id);
    if (idx >= 0) {
      this.adapters[idx] = adapter;
    } else {
      this.adapters.push(adapter);
    }
  }

  getAdapter(format: PlatformFormat): PlatformAdapter | undefined {
    return this.adapters.find((a) => a.platform === format);
  }

  getAdapterById(id: string): PlatformAdapter | undefined {
    return this.adapters.find((a) => a.id === id);
  }

  getAllAdapters(): PlatformAdapter[] {
    return [...this.adapters];
  }

  detect(raw: string, meta?: ImportMeta): FormatDetectionResult {
    let bestResult: FormatDetectionResult = {
      format: 'unknown',
      confidence: 0,
      formatLabel: 'Unrecognized Format',
      reasons: ['No platform adapter matched the input file.'],
    };

    for (const adapter of this.adapters) {
      const result = adapter.detect(raw, meta);
      if (result.confidence > bestResult.confidence) {
        bestResult = result;
      }
    }

    return bestResult;
  }

  parse(raw: string, meta?: ImportMeta, forceFormat?: PlatformFormat): AdapterParseResult {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {
        success: false,
        messages: [],
        format: 'unknown',
        formatLabel: 'Unknown',
        error: 'The uploaded file is empty.',
      };
    }

    if (forceFormat) {
      const adapter = this.getAdapter(forceFormat);
      if (adapter) {
        return adapter.parse(raw, meta);
      }
    }

    // Step 1: Detect format
    const detection = this.detect(raw, meta);

    // Step 2: If we have a confident match (confidence >= 0.35)
    if (detection.confidence >= 0.35) {
      const matchedAdapter =
        this.adapters.find((a) => a.detect(raw, meta).confidence === detection.confidence) ||
        this.getAdapter(detection.format);
      if (matchedAdapter) {
        const result = matchedAdapter.parse(raw, meta);
        if (result.success) {
          return result;
        }
        // If the identified adapter failed with a specific error, return that error
        return {
          ...result,
          error: result.error || `Failed to parse detected ${detection.formatLabel}. Please check file structure.`,
        };
      }
    }

    // Step 3: Fallback attempt with StandardChatAdapter
    const standardAdapter = this.adapters.find((a) => a instanceof StandardChatAdapter) || new StandardChatAdapter();
    const fallbackResult = standardAdapter.parse(raw, meta);
    if (fallbackResult.success) {
      return fallbackResult;
    }

    // Step 4: Explicit, human-readable error describing what was detected and why parsing failed
    const detectedLabel = detection.confidence > 0 ? `${detection.formatLabel} (confidence ${(detection.confidence * 100).toFixed(0)}%)` : 'Unknown';
    const reasonText = detection.reasons.length > 0 ? ` (${detection.reasons.join(', ')})` : '';

    return {
      success: false,
      messages: [],
      format: detection.format,
      formatLabel: detection.formatLabel,
      error: `Unsupported or corrupted format: Detected ${detectedLabel}${reasonText}. Unable to extract conversation messages. Please ensure you uploaded a valid WhatsApp (.txt), Telegram Desktop (.json), Facebook Messenger (.json/.html), or Slack (.json) export.`,
    };
  }
}

export const defaultRegistry = new AdapterRegistry();

export function getAdapterRegistry(): AdapterRegistry {
  return defaultRegistry;
}

export function detectFormat(raw: string, meta?: ImportMeta): FormatDetectionResult {
  return defaultRegistry.detect(raw, meta);
}

