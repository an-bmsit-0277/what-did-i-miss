export type {
  PlatformFormat,
  ImportMeta,
  FormatDetectionResult,
  NormalizedConversation,
  AdapterParseResult,
  PlatformAdapter,
} from './types.ts';

export { WhatsAppAdapter, buildWhatsAppSourceRef, detectMediaType } from './WhatsAppAdapter.ts';
export {
  WhatsAppWebDomAdapter,
  extractWhatsAppWebChatFromDom,
  parseWhatsAppWebHtml,
  normalizeWhatsAppWebBubbles,
  serializeWhatsAppMessagesToText,
  type RawWhatsAppWebBubble,
  type WhatsAppWebExtractionOptions,
  type WhatsAppWebExtractionResult,
} from './WhatsAppWebDomAdapter.ts';
export { TelegramAdapter, flattenTelegramText } from './TelegramAdapter.ts';
export { FacebookMessengerAdapter, decodeMetaMojibake } from './FacebookMessengerAdapter.ts';
export { SlackJsonAdapter } from './SlackJsonAdapter.ts';
export { StandardChatAdapter } from './StandardChatAdapter.ts';
export {
  AdapterRegistry,
  defaultRegistry,
  getAdapterRegistry,
  detectFormat,
} from './registry.ts';

