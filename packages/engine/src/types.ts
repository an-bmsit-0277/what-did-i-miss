export interface ParsedMessage {
  id: string;
  sender: string;
  timestamp?: string;
  text: string;
  raw: string;
  lineIndex: number;
  /** Stable source reference or deep-link (e.g. wa.me/<phone>?text=... or ref:tg:123 or ref:fb:1705312800) */
  sourceRef?: string;
  /** Quoted or replied-to message ID */
  replyToMessageId?: string;
  /** Quoted or replied-to text snippet */
  replyToSnippet?: string;
  /** Media type omitted or present in conversation */
  mediaType?: 'image' | 'video' | 'audio' | 'sticker' | 'document' | 'voice' | 'contact' | 'location' | 'other';
  /** Normalized sender phone number if sender is an MSISDN */
  senderPhone?: string;
  /** True if message is a system notification (e.g. encryption notice, group creation) */
  isSystem?: boolean;
}

export type FindingCategory = 'urgent' | 'action_item' | 'decision' | 'deadline' | 'mention';

export type UrgencyLevel = 'high' | 'medium' | 'low';

export type AnalyzerType = 'deterministic' | 'ai';

export type ActiveTab = 'overview' | 'tasks' | 'important';

export interface FindingItem {
  id: string;
  sourceMessageId: string;
  /** Stable source reference for deep linking directly to external platform or local trace */
  sourceRef?: string;
  category: FindingCategory;
  urgency: UrgencyLevel;
  title: string;
  snippet: string;
  sender: string;
  timestamp?: string;
  assignee?: string;
  dueDate?: string;
  relevanceScore: number;
  analyzer?: AnalyzerType;
}

export interface RecapStats {
  totalMessages: number;
  participantCount: number;
  participants: string[];
  startTime?: string;
  endTime?: string;
  topTopics: string[];
  summaryBullets: string[];
}

export interface ConversationAnalysis {
  recap: RecapStats;
  findings: FindingItem[];
  stats: {
    urgentCount: number;
    actionItemCount: number;
    decisionCount: number;
    deadlinesCount: number;
    mentionsCount: number;
  };
}

export interface ParseResult {
  success: boolean;
  messages: ParsedMessage[];
  formatDetected?:
    | 'json_standard'
    | 'json_slack'
    | 'txt_bracketed'
    | 'txt_whatsapp'
    | 'txt_simple'
    | 'whatsapp'
    | 'telegram'
    | 'facebook_messenger'
    | 'slack'
    | 'standard_json'
    | 'standard_txt';
  error?: string;
  warning?: string;
}

