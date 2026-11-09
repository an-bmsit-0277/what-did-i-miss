export type {
  ParsedMessage,
  FindingCategory,
  UrgencyLevel,
  AnalyzerType,
  ActiveTab,
  FindingItem,
  RecapStats,
  ConversationAnalysis,
  ParseResult,
} from './types.ts';

export type {
  PlatformFormat,
  ImportMeta,
  FormatDetectionResult,
  NormalizedConversation,
  AdapterParseResult,
  PlatformAdapter,
  RawWhatsAppWebBubble,
  WhatsAppWebExtractionOptions,
  WhatsAppWebExtractionResult,
} from './adapters/index.ts';

export {
  parseConversation,
  parseJsonContent,
  parseTxtContent,
  MAX_FILE_SIZE_BYTES,
} from './parsers/index.ts';

export {
  WhatsAppAdapter,
  WhatsAppWebDomAdapter,
  extractWhatsAppWebChatFromDom,
  parseWhatsAppWebHtml,
  normalizeWhatsAppWebBubbles,
  serializeWhatsAppMessagesToText,
  buildWhatsAppSourceRef,
  detectMediaType,
  TelegramAdapter,
  FacebookMessengerAdapter,
  SlackJsonAdapter,
  StandardChatAdapter,
  AdapterRegistry,
  defaultRegistry,
  getAdapterRegistry,
  detectFormat,
  decodeMetaMojibake,
  flattenTelegramText,
} from './adapters/index.ts';

export { analyzeConversation } from './heuristics/analyzer.ts';

export {
  detectUrgency,
  detectDecision,
  detectDeadline,
  detectActionItem,
  detectMention,
} from './heuristics/detectors.ts';

export { generateRecap } from './heuristics/recapGenerator.ts';

export {
  SAMPLE_CONVERSATION_RAW,
  SAMPLE_MESSAGES,
} from './sampleConversation.ts';


