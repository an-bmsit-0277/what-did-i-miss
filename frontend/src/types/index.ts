declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chrome: any;
}

export interface ParsedMessage {
  id: string;
  sender: string;
  timestamp?: string;
  text: string;
  raw: string;
  lineIndex: number;
}

export type FindingCategory = 'urgent' | 'action_item' | 'decision' | 'deadline' | 'mention';

export type UrgencyLevel = 'high' | 'medium' | 'low';

export type ActiveTab = 'overview' | 'tasks' | 'important';

export interface FindingItem {
  id: string;
  sourceMessageId: string;
  category: FindingCategory;
  urgency: UrgencyLevel;
  title: string;
  snippet: string;
  sender: string;
  timestamp?: string;
  assignee?: string;
  dueDate?: string;
  relevanceScore: number;
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
  formatDetected?: 'json_standard' | 'json_slack' | 'txt_bracketed' | 'txt_whatsapp' | 'txt_simple';
  error?: string;
  warning?: string;
}
