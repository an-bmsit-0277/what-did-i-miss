import type {
  FindingCategory,
  UrgencyLevel,
  AnalyzerType,
  ParseResult,
} from '@missed/engine';

export type SourceFormat = NonNullable<ParseResult['formatDetected']>;
export type RetentionDays = 7 | 30 | 90 | 365;

export interface AuthUser {
  id: string;
  email: string;
  createdAt?: string;
}

export interface AuthSessionResult {
  user: AuthUser;
  accessToken: string | null;
  expiresAt?: number | null;
  emailConfirmationRequired: boolean;
}

export interface AuthAdapter {
  signUp(email: string, password: string): Promise<AuthSessionResult>;
  signIn(email: string, password: string): Promise<AuthSessionResult>;
  signOut(accessToken: string): Promise<void>;
  verifyToken(accessToken: string): Promise<AuthUser>;
  deleteAuthUser(userId: string): Promise<void>;
}

export interface PersistedConversation {
  id: string;
  ownerId: string;
  title: string;
  sourceFormat: SourceFormat;
  messageCount: number;
  participantCount: number;
  participants: string[];
  topTopics: string[];
  summaryBullets: string[];
  startTime: string | null;
  endTime: string | null;
  warning: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedMessage {
  id: string;
  conversationId: string;
  ownerId: string;
  externalId: string;
  seq: number;
  sender: string;
  text: string;
  timestamp: string | null;
  createdAt: string;
}

export interface PersistedFinding {
  id: string;
  conversationId: string;
  ownerId: string;
  type: FindingCategory;
  title: string;
  snippet: string;
  priority: UrgencyLevel;
  sourceMessageId: string | null;
  sourceExternalId: string;
  sender: string;
  timestamp: string | null;
  assignee: string | null;
  deadline: string | null;
  relevanceScore: number;
  analyzer: AnalyzerType;
  createdAt: string;
}

export interface PersistedTask {
  id: string;
  findingId: string;
  conversationId: string;
  ownerId: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedUserSettings {
  ownerId: string;
  aiEnabled: boolean;
  aiConsentAt: string | null;
  retentionDays: RetentionDays;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationBundleInput {
  ownerId: string;
  accessToken: string;
  title: string;
  sourceFormat: SourceFormat;
  warning: string | null;
  recap: {
    totalMessages: number;
    participantCount: number;
    participants: string[];
    startTime?: string;
    endTime?: string;
    topTopics: string[];
    summaryBullets: string[];
  };
  messages: Array<{
    externalId: string;
    seq: number;
    sender: string;
    text: string;
    timestamp: string | null;
  }>;
  findings: Array<{
    type: FindingCategory;
    title: string;
    snippet: string;
    priority: UrgencyLevel;
    sourceExternalId: string;
    sender: string;
    timestamp: string | null;
    assignee: string | null;
    deadline: string | null;
    relevanceScore: number;
    analyzer: AnalyzerType;
  }>;
}

export interface ConversationBundleResult {
  conversation: PersistedConversation;
  messages: PersistedMessage[];
  findings: PersistedFinding[];
  tasks: PersistedTask[];
}

export interface DataRepository {
  listConversations(
    ownerId: string,
    accessToken: string,
    limit: number,
    offset: number
  ): Promise<{ items: PersistedConversation[]; total: number }>;

  createConversationBundle(input: CreateConversationBundleInput): Promise<ConversationBundleResult>;

  getConversationBundle(
    ownerId: string,
    accessToken: string,
    conversationId: string
  ): Promise<ConversationBundleResult | null>;

  deleteConversation(
    ownerId: string,
    accessToken: string,
    conversationId: string
  ): Promise<boolean>;

  updateTaskByFindingId(
    ownerId: string,
    accessToken: string,
    findingId: string,
    completed: boolean
  ): Promise<PersistedTask>;

  getUserSettings(ownerId: string, accessToken: string): Promise<PersistedUserSettings>;

  updateUserSettings(
    ownerId: string,
    accessToken: string,
    updates: { aiEnabled?: boolean; retentionDays?: RetentionDays }
  ): Promise<PersistedUserSettings>;

  deleteAllUserData(ownerId: string, accessToken: string): Promise<void>;
}
