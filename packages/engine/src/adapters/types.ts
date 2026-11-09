import type { ParsedMessage } from '../types.ts';

export type PlatformFormat =
  | 'whatsapp'
  | 'telegram'
  | 'facebook_messenger'
  | 'slack'
  | 'standard_json'
  | 'standard_txt'
  | 'unknown';

export interface ImportMeta {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  senderPhoneFallback?: string;
}

export interface FormatDetectionResult {
  format: PlatformFormat;
  confidence: number; // 0.0 to 1.0 (1.0 = absolute certainty)
  formatLabel: string;
  reasons: string[];
}

export interface NormalizedConversation {
  title?: string;
  platform: PlatformFormat;
  formatLabel: string;
  messages: ParsedMessage[];
  participants: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  totalMessages: number;
  metadata?: Record<string, unknown>;
}

export interface AdapterParseResult {
  success: boolean;
  conversation?: NormalizedConversation;
  messages: ParsedMessage[];
  format: PlatformFormat;
  formatLabel: string;
  error?: string;
  warning?: string;
}

export interface PlatformAdapter {
  readonly id: string;
  readonly platform: PlatformFormat;
  readonly displayName: string;
  readonly supportedExtensions: string[];

  detect(raw: string, meta?: ImportMeta): FormatDetectionResult;
  parse(raw: string, meta?: ImportMeta): AdapterParseResult;
}

