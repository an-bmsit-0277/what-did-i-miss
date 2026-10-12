declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chrome: any;
}

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
} from '@missed/engine';
