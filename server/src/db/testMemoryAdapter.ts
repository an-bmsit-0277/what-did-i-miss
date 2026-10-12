import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { ApiError } from '../lib/errors.ts';
import type {
  AuthAdapter,
  AuthSessionResult,
  AuthUser,
  ConversationBundleResult,
  CreateConversationBundleInput,
  DataRepository,
  PersistedConversation,
  PersistedFinding,
  PersistedMessage,
  PersistedTask,
  PersistedUserSettings,
  RetentionDays,
} from './types.ts';

interface StoredUserRecord {
  id: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
}

interface StoredSessionRecord {
  token: string;
  userId: string;
  expiresAtMs: number;
  revoked: boolean;
}

export type SimulatedFailureStage = 'messages' | 'findings' | 'tasks' | null;

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actualBuf = Buffer.from(hashPassword(password, salt), 'hex');
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(actualBuf, expectedBuf);
}

/**
 * Isolated in-memory AuthAdapter & DataRepository for automated tests and explicit
 * non-production local development (`STORAGE_MODE=memory`).
 *
 * Enforces the exact same authorization invariants, token verification, atomic rollback,
 * and ordered deletion semantics as the Supabase PostgreSQL + RLS adapter.
 */
export class InMemoryAuthAdapter implements AuthAdapter {
  private readonly usersById = new Map<string, StoredUserRecord>();
  private readonly userIdByEmail = new Map<string, string>();
  private readonly sessionsByToken = new Map<string, StoredSessionRecord>();
  private readonly sessionTtlSeconds: number;

  constructor(options?: { sessionTtlSeconds?: number }) {
    this.sessionTtlSeconds = options?.sessionTtlSeconds ?? 3600;
  }

  async signUp(email: string, password: string): Promise<AuthSessionResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.userIdByEmail.has(normalizedEmail)) {
      throw new ApiError('CONFLICT', 409, 'An account with this email already exists.');
    }

    const userId = randomUUID();
    const salt = randomUUID();
    const createdAt = new Date().toISOString();
    const record: StoredUserRecord = {
      id: userId,
      email: normalizedEmail,
      passwordSalt: salt,
      passwordHash: hashPassword(password, salt),
      createdAt,
    };

    this.usersById.set(userId, record);
    this.userIdByEmail.set(normalizedEmail, userId);

    const session = this.createSession(userId, this.sessionTtlSeconds);
    return {
      user: {
        id: record.id,
        email: record.email,
        createdAt: record.createdAt,
      },
      accessToken: session.token,
      expiresAt: Math.floor(session.expiresAtMs / 1000),
      emailConfirmationRequired: false,
    };
  }

  async signIn(email: string, password: string): Promise<AuthSessionResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const userId = this.userIdByEmail.get(normalizedEmail);
    if (!userId) {
      throw new ApiError('UNAUTHORIZED', 401, 'Invalid email or password.');
    }

    const record = this.usersById.get(userId);
    if (!record || !verifyPassword(password, record.passwordSalt, record.passwordHash)) {
      throw new ApiError('UNAUTHORIZED', 401, 'Invalid email or password.');
    }

    const session = this.createSession(userId, this.sessionTtlSeconds);
    return {
      user: {
        id: record.id,
        email: record.email,
        createdAt: record.createdAt,
      },
      accessToken: session.token,
      expiresAt: Math.floor(session.expiresAtMs / 1000),
      emailConfirmationRequired: false,
    };
  }

  async signOut(accessToken: string): Promise<void> {
    const session = this.sessionsByToken.get(accessToken);
    if (session) {
      session.revoked = true;
    }
  }

  async verifyToken(accessToken: string): Promise<AuthUser> {
    if (!accessToken || typeof accessToken !== 'string') {
      throw new ApiError('UNAUTHORIZED', 401, 'Invalid or expired authentication token.');
    }

    const session = this.sessionsByToken.get(accessToken);
    if (!session || session.revoked || Date.now() >= session.expiresAtMs) {
      throw new ApiError('UNAUTHORIZED', 401, 'Invalid or expired authentication token.');
    }

    const user = this.usersById.get(session.userId);
    if (!user) {
      throw new ApiError('UNAUTHORIZED', 401, 'Invalid or expired authentication token.');
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async deleteAuthUser(userId: string): Promise<void> {
    const user = this.usersById.get(userId);
    if (!user) {
      throw new ApiError('NOT_FOUND', 404, 'User account not found.');
    }

    this.usersById.delete(userId);
    this.userIdByEmail.delete(user.email);

    for (const session of this.sessionsByToken.values()) {
      if (session.userId === userId) {
        session.revoked = true;
      }
    }
  }

  issueExpiredTokenForTesting(userId: string): string {
    const session = this.createSession(userId, -60);
    return session.token;
  }

  hasUserForTesting(userId: string): boolean {
    return this.usersById.has(userId);
  }

  private createSession(userId: string, ttlSeconds: number): StoredSessionRecord {
    const token = `test_jwt_${randomUUID().replace(/-/g, '')}`;
    const session: StoredSessionRecord = {
      token,
      userId,
      expiresAtMs: Date.now() + ttlSeconds * 1000,
      revoked: false,
    };
    this.sessionsByToken.set(token, session);
    return session;
  }
}

export class InMemoryDataRepository implements DataRepository {
  private readonly conversations = new Map<string, PersistedConversation>();
  private readonly messages = new Map<string, PersistedMessage>();
  private readonly findings = new Map<string, PersistedFinding>();
  private readonly tasks = new Map<string, PersistedTask>();
  private readonly settings = new Map<string, PersistedUserSettings>();
  private nextSimulatedFailureStage: SimulatedFailureStage = null;
  private readonly deletionOrderLog: string[] = [];

  injectFailureOnNextCreate(stage: SimulatedFailureStage): void {
    this.nextSimulatedFailureStage = stage;
  }

  getDeletionOrderLogForTesting(): string[] {
    return [...this.deletionOrderLog];
  }

  getSnapshotForTesting(): {
    conversations: PersistedConversation[];
    messages: PersistedMessage[];
    findings: PersistedFinding[];
    tasks: PersistedTask[];
    settings: PersistedUserSettings[];
  } {
    return {
      conversations: [...this.conversations.values()],
      messages: [...this.messages.values()],
      findings: [...this.findings.values()],
      tasks: [...this.tasks.values()],
      settings: [...this.settings.values()],
    };
  }

  async listConversations(
    ownerId: string,
    _accessToken: string,
    limit: number,
    offset: number
  ): Promise<{ items: PersistedConversation[]; total: number }> {
    const owned = [...this.conversations.values()]
      .filter((c) => c.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      items: owned.slice(offset, offset + limit),
      total: owned.length,
    };
  }

  async createConversationBundle(
    input: CreateConversationBundleInput
  ): Promise<ConversationBundleResult> {
    const failureStage = this.nextSimulatedFailureStage;
    this.nextSimulatedFailureStage = null;

    const now = new Date().toISOString();
    const conversationId = randomUUID();
    const createdMessageIds: string[] = [];
    const createdFindingIds: string[] = [];
    const createdTaskIds: string[] = [];

    const conversation: PersistedConversation = {
      id: conversationId,
      ownerId: input.ownerId,
      title: input.title,
      sourceFormat: input.sourceFormat,
      messageCount: input.recap.totalMessages,
      participantCount: input.recap.participantCount,
      participants: [...input.recap.participants],
      topTopics: [...input.recap.topTopics],
      summaryBullets: [...input.recap.summaryBullets],
      startTime: input.recap.startTime ?? null,
      endTime: input.recap.endTime ?? null,
      warning: input.warning,
      createdAt: now,
      updatedAt: now,
    };

    this.conversations.set(conversationId, conversation);

    try {
      if (failureStage === 'messages') {
        throw new Error('Simulated message persistence failure');
      }

      const persistedMessages: PersistedMessage[] = [];
      const externalIdToMessageId = new Map<string, string>();

      for (const msg of input.messages) {
        const msgId = randomUUID();
        const persisted: PersistedMessage = {
          id: msgId,
          conversationId,
          ownerId: input.ownerId,
          externalId: msg.externalId,
          seq: msg.seq,
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp,
          createdAt: now,
        };
        this.messages.set(msgId, persisted);
        createdMessageIds.push(msgId);
        persistedMessages.push(persisted);
        externalIdToMessageId.set(msg.externalId, msgId);
      }

      if (failureStage === 'findings') {
        throw new Error('Simulated finding persistence failure');
      }

      const persistedFindings: PersistedFinding[] = [];
      for (const f of input.findings) {
        const findingId = randomUUID();
        const persisted: PersistedFinding = {
          id: findingId,
          conversationId,
          ownerId: input.ownerId,
          type: f.type,
          title: f.title,
          snippet: f.snippet,
          priority: f.priority,
          sourceMessageId: externalIdToMessageId.get(f.sourceExternalId) ?? null,
          sourceExternalId: f.sourceExternalId,
          sender: f.sender,
          timestamp: f.timestamp,
          assignee: f.assignee,
          deadline: f.deadline,
          relevanceScore: f.relevanceScore,
          analyzer: f.analyzer,
          createdAt: now,
        };
        this.findings.set(findingId, persisted);
        createdFindingIds.push(findingId);
        persistedFindings.push(persisted);
      }

      if (failureStage === 'tasks') {
        throw new Error('Simulated task persistence failure');
      }

      const persistedTasks: PersistedTask[] = [];
      for (const finding of persistedFindings) {
        if (finding.type === 'action_item' || finding.type === 'deadline') {
          const taskId = randomUUID();
          const task: PersistedTask = {
            id: taskId,
            findingId: finding.id,
            conversationId,
            ownerId: input.ownerId,
            completed: false,
            completedAt: null,
            createdAt: now,
            updatedAt: now,
          };
          this.tasks.set(taskId, task);
          createdTaskIds.push(taskId);
          persistedTasks.push(task);
        }
      }

      return {
        conversation,
        messages: persistedMessages.sort((a, b) => a.seq - b.seq),
        findings: persistedFindings,
        tasks: persistedTasks,
      };
    } catch {
      // Atomic rollback of all records inserted during this operation
      for (const taskId of createdTaskIds) {
        this.tasks.delete(taskId);
      }
      for (const findingId of createdFindingIds) {
        this.findings.delete(findingId);
      }
      for (const msgId of createdMessageIds) {
        this.messages.delete(msgId);
      }
      this.conversations.delete(conversationId);

      throw new ApiError(
        'INTERNAL_ERROR',
        500,
        'Failed to persist conversation atomically. Partial state was rolled back.'
      );
    }
  }

  async getConversationBundle(
    ownerId: string,
    _accessToken: string,
    conversationId: string
  ): Promise<ConversationBundleResult | null> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || conversation.ownerId !== ownerId) {
      return null;
    }

    const messages = [...this.messages.values()]
      .filter((m) => m.conversationId === conversationId && m.ownerId === ownerId)
      .sort((a, b) => a.seq - b.seq);

    const findings = [...this.findings.values()]
      .filter((f) => f.conversationId === conversationId && f.ownerId === ownerId)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    const tasks = [...this.tasks.values()]
      .filter((t) => t.conversationId === conversationId && t.ownerId === ownerId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return {
      conversation,
      messages,
      findings,
      tasks,
    };
  }

  async deleteConversation(
    ownerId: string,
    _accessToken: string,
    conversationId: string
  ): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || conversation.ownerId !== ownerId) {
      return false;
    }

    for (const [taskId, task] of this.tasks.entries()) {
      if (task.conversationId === conversationId && task.ownerId === ownerId) {
        this.tasks.delete(taskId);
      }
    }

    for (const [findingId, finding] of this.findings.entries()) {
      if (finding.conversationId === conversationId && finding.ownerId === ownerId) {
        this.findings.delete(findingId);
      }
    }

    for (const [messageId, message] of this.messages.entries()) {
      if (message.conversationId === conversationId && message.ownerId === ownerId) {
        this.messages.delete(messageId);
      }
    }

    this.conversations.delete(conversationId);
    return true;
  }

  async updateTaskByFindingId(
    ownerId: string,
    _accessToken: string,
    findingId: string,
    completed: boolean
  ): Promise<PersistedTask> {
    const now = new Date().toISOString();
    const completedAt = completed ? now : null;

    const existingTask = [...this.tasks.values()].find(
      (t) => t.findingId === findingId && t.ownerId === ownerId
    );

    if (existingTask) {
      const updated: PersistedTask = {
        ...existingTask,
        completed,
        completedAt,
        updatedAt: now,
      };
      this.tasks.set(updated.id, updated);
      return updated;
    }

    const finding = this.findings.get(findingId);
    if (!finding || finding.ownerId !== ownerId) {
      throw new ApiError('NOT_FOUND', 404, 'Task or finding not found.');
    }

    const created: PersistedTask = {
      id: randomUUID(),
      findingId: finding.id,
      conversationId: finding.conversationId,
      ownerId,
      completed,
      completedAt,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(created.id, created);
    return created;
  }

  async getUserSettings(ownerId: string, _accessToken: string): Promise<PersistedUserSettings> {
    const existing = this.settings.get(ownerId);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const initialized: PersistedUserSettings = {
      ownerId,
      aiEnabled: false,
      aiConsentAt: null,
      retentionDays: 30,
      createdAt: now,
      updatedAt: now,
    };
    this.settings.set(ownerId, initialized);
    return initialized;
  }

  async updateUserSettings(
    ownerId: string,
    accessToken: string,
    updates: { aiEnabled?: boolean; retentionDays?: RetentionDays }
  ): Promise<PersistedUserSettings> {
    const current = await this.getUserSettings(ownerId, accessToken);
    const now = new Date().toISOString();

    const nextAiEnabled = updates.aiEnabled ?? current.aiEnabled;
    const nextRetentionDays = updates.retentionDays ?? current.retentionDays;
    let nextAiConsentAt = current.aiConsentAt;

    if (updates.aiEnabled !== undefined) {
      nextAiConsentAt = updates.aiEnabled ? (current.aiConsentAt ?? now) : null;
    }

    const updated: PersistedUserSettings = {
      ...current,
      aiEnabled: nextAiEnabled,
      aiConsentAt: nextAiConsentAt,
      retentionDays: nextRetentionDays,
      updatedAt: now,
    };
    this.settings.set(ownerId, updated);
    return updated;
  }

  async deleteAllUserData(ownerId: string, _accessToken: string): Promise<void> {
    this.deletionOrderLog.length = 0;

    // 1. tasks
    this.deletionOrderLog.push('tasks');
    for (const [id, task] of this.tasks.entries()) {
      if (task.ownerId === ownerId) {
        this.tasks.delete(id);
      }
    }

    // 2. findings
    this.deletionOrderLog.push('findings');
    for (const [id, finding] of this.findings.entries()) {
      if (finding.ownerId === ownerId) {
        this.findings.delete(id);
      }
    }

    // 3. messages
    this.deletionOrderLog.push('messages');
    for (const [id, message] of this.messages.entries()) {
      if (message.ownerId === ownerId) {
        this.messages.delete(id);
      }
    }

    // 4. conversations
    this.deletionOrderLog.push('conversations');
    for (const [id, conversation] of this.conversations.entries()) {
      if (conversation.ownerId === ownerId) {
        this.conversations.delete(id);
      }
    }

    // 5. user_settings
    this.deletionOrderLog.push('user_settings');
    this.settings.delete(ownerId);
  }
}
