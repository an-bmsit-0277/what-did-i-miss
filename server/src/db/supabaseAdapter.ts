import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
  SourceFormat,
} from './types.ts';
import type { AnalyzerType, FindingCategory, UrgencyLevel } from '@missed/engine';

export interface SupabaseAdapterConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
}

interface ConversationRow {
  id: string;
  owner_id: string;
  title: string;
  source_format: SourceFormat;
  message_count: number;
  participant_count: number;
  participants: unknown;
  top_topics: unknown;
  summary_bullets: unknown;
  start_time: string | null;
  end_time: string | null;
  warning: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  owner_id: string;
  external_id: string;
  seq: number;
  sender: string;
  text: string;
  timestamp: string | null;
  created_at: string;
}

interface FindingRow {
  id: string;
  conversation_id: string;
  owner_id: string;
  type: FindingCategory;
  title: string;
  snippet: string;
  priority: UrgencyLevel;
  source_message_id: string | null;
  source_external_id: string;
  sender: string;
  timestamp: string | null;
  assignee: string | null;
  deadline: string | null;
  relevance_score: number;
  analyzer: AnalyzerType;
  created_at: string;
}

interface TaskRow {
  id: string;
  finding_id: string;
  conversation_id: string;
  owner_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UserSettingsRow {
  owner_id: string;
  ai_enabled: boolean;
  ai_consent_at: string | null;
  retention_days: RetentionDays;
  created_at: string;
  updated_at: string;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function mapConversationRow(row: ConversationRow): PersistedConversation {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    sourceFormat: row.source_format,
    messageCount: row.message_count,
    participantCount: row.participant_count,
    participants: toStringArray(row.participants),
    topTopics: toStringArray(row.top_topics),
    summaryBullets: toStringArray(row.summary_bullets),
    startTime: row.start_time,
    endTime: row.end_time,
    warning: row.warning,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessageRow(row: MessageRow): PersistedMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    ownerId: row.owner_id,
    externalId: row.external_id,
    seq: row.seq,
    sender: row.sender,
    text: row.text,
    timestamp: row.timestamp,
    createdAt: row.created_at,
  };
}

function mapFindingRow(row: FindingRow): PersistedFinding {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    ownerId: row.owner_id,
    type: row.type,
    title: row.title,
    snippet: row.snippet,
    priority: row.priority,
    sourceMessageId: row.source_message_id,
    sourceExternalId: row.source_external_id,
    sender: row.sender,
    timestamp: row.timestamp,
    assignee: row.assignee,
    deadline: row.deadline,
    relevanceScore: row.relevance_score,
    analyzer: row.analyzer,
    createdAt: row.created_at,
  };
}

function mapTaskRow(row: TaskRow): PersistedTask {
  return {
    id: row.id,
    findingId: row.finding_id,
    conversationId: row.conversation_id,
    ownerId: row.owner_id,
    completed: row.completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSettingsRow(row: UserSettingsRow): PersistedUserSettings {
  return {
    ownerId: row.owner_id,
    aiEnabled: row.ai_enabled,
    aiConsentAt: row.ai_consent_at,
    retentionDays: row.retention_days,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseAuthAdapter implements AuthAdapter {
  private readonly config: SupabaseAdapterConfig;
  private readonly revokedTokens = new Set<string>();

  constructor(config: SupabaseAdapterConfig) {
    this.config = config;
  }

  private createAnonClient(accessToken?: string): SupabaseClient {
    return createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: accessToken
        ? {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        : undefined,
    });
  }

  async signUp(email: string, password: string): Promise<AuthSessionResult> {
    const client = this.createAnonClient();
    const { data, error } = await client.auth.signUp({ email, password });

    if (error || !data.user || !data.user.email) {
      const isConflict = error?.message?.toLowerCase().includes('already') ?? false;
      throw new ApiError(
        isConflict ? 'CONFLICT' : 'AUTH_ERROR',
        isConflict ? 409 : 400,
        error?.message ?? 'Unable to complete sign up.'
      );
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at,
      },
      accessToken: data.session?.access_token ?? null,
      expiresAt: data.session?.expires_at ?? null,
      emailConfirmationRequired: !data.session,
    };
  }

  async signIn(email: string, password: string): Promise<AuthSessionResult> {
    const client = this.createAnonClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.user.email || !data.session) {
      throw new ApiError('UNAUTHORIZED', 401, 'Invalid email or password.');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at,
      },
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at ?? null,
      emailConfirmationRequired: false,
    };
  }

  async signOut(accessToken: string): Promise<void> {
    this.revokedTokens.add(accessToken);
    const client = this.createAnonClient(accessToken);
    await client.auth.signOut();
  }

  async verifyToken(accessToken: string): Promise<AuthUser> {
    if (!accessToken || this.revokedTokens.has(accessToken)) {
      throw new ApiError('UNAUTHORIZED', 401, 'Invalid or expired authentication token.');
    }

    const client = this.createAnonClient();
    const { data, error } = await client.auth.getUser(accessToken);

    if (error || !data.user || !data.user.email) {
      throw new ApiError('UNAUTHORIZED', 401, 'Invalid or expired authentication token.');
    }

    return {
      id: data.user.id,
      email: data.user.email,
      createdAt: data.user.created_at,
    };
  }

  async deleteAuthUser(userId: string): Promise<void> {
    if (!this.config.supabaseServiceRoleKey) {
      throw new ApiError(
        'AUTH_ERROR',
        503,
        'Account deletion requires SUPABASE_SERVICE_ROLE_KEY configuration on the server.'
      );
    }

    const adminClient = createClient(
      this.config.supabaseUrl,
      this.config.supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      throw new ApiError(
        'ACCOUNT_DELETION_PARTIAL',
        500,
        'Failed to delete user authentication record.'
      );
    }
  }
}

export class SupabaseDataRepository implements DataRepository {
  private readonly config: SupabaseAdapterConfig;

  constructor(config: SupabaseAdapterConfig) {
    this.config = config;
  }

  /**
   * Creates a per-request Supabase client scoped with the caller's JWT so
   * PostgreSQL Row-Level Security (auth.uid() = owner_id) is always active.
   */
  private createRlsClient(accessToken: string): SupabaseClient {
    return createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  async listConversations(
    ownerId: string,
    accessToken: string,
    limit: number,
    offset: number
  ): Promise<{ items: PersistedConversation[]; total: number }> {
    const client = this.createRlsClient(accessToken);
    const { data, error, count } = await client
      .from('conversations')
      .select('*', { count: 'exact' })
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ApiError('INTERNAL_ERROR', 500, 'Failed to list conversations.');
    }

    const rows = (data ?? []) as ConversationRow[];
    return {
      items: rows.map(mapConversationRow),
      total: count ?? rows.length,
    };
  }

  async createConversationBundle(
    input: CreateConversationBundleInput
  ): Promise<ConversationBundleResult> {
    const client = this.createRlsClient(input.accessToken);

    const { data: convData, error: convError } = await client
      .from('conversations')
      .insert({
        owner_id: input.ownerId,
        title: input.title,
        source_format: input.sourceFormat,
        message_count: input.recap.totalMessages,
        participant_count: input.recap.participantCount,
        participants: input.recap.participants,
        top_topics: input.recap.topTopics,
        summary_bullets: input.recap.summaryBullets,
        start_time: input.recap.startTime ?? null,
        end_time: input.recap.endTime ?? null,
        warning: input.warning,
      })
      .select('*')
      .single();

    if (convError || !convData) {
      throw new ApiError('INTERNAL_ERROR', 500, 'Failed to create conversation record.');
    }

    const conversation = mapConversationRow(convData as ConversationRow);

    try {
      const insertedMessages: PersistedMessage[] = [];
      const externalIdToMessageId = new Map<string, string>();

      const batchSize = 500;
      for (let i = 0; i < input.messages.length; i += batchSize) {
        const batch = input.messages.slice(i, i + batchSize).map((msg) => ({
          conversation_id: conversation.id,
          owner_id: input.ownerId,
          external_id: msg.externalId,
          seq: msg.seq,
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp,
        }));

        const { data: msgRows, error: msgError } = await client
          .from('messages')
          .insert(batch)
          .select('*');

        if (msgError || !msgRows) {
          throw new Error(msgError?.message ?? 'Failed to insert messages batch.');
        }

        for (const row of msgRows as MessageRow[]) {
          const mapped = mapMessageRow(row);
          insertedMessages.push(mapped);
          externalIdToMessageId.set(mapped.externalId, mapped.id);
        }
      }

      const insertedFindings: PersistedFinding[] = [];
      if (input.findings.length > 0) {
        const findingPayloads = input.findings.map((f) => ({
          conversation_id: conversation.id,
          owner_id: input.ownerId,
          type: f.type,
          title: f.title,
          snippet: f.snippet,
          priority: f.priority,
          source_message_id: externalIdToMessageId.get(f.sourceExternalId) ?? null,
          source_external_id: f.sourceExternalId,
          sender: f.sender,
          timestamp: f.timestamp,
          assignee: f.assignee,
          deadline: f.deadline,
          relevance_score: f.relevanceScore,
          analyzer: f.analyzer,
        }));

        const { data: findingRows, error: findingError } = await client
          .from('findings')
          .insert(findingPayloads)
          .select('*');

        if (findingError || !findingRows) {
          throw new Error(findingError?.message ?? 'Failed to insert findings.');
        }

        for (const row of findingRows as FindingRow[]) {
          insertedFindings.push(mapFindingRow(row));
        }
      }

      const actionableFindings = insertedFindings.filter(
        (f) => f.type === 'action_item' || f.type === 'deadline'
      );

      const insertedTasks: PersistedTask[] = [];
      if (actionableFindings.length > 0) {
        const taskPayloads = actionableFindings.map((f) => ({
          finding_id: f.id,
          conversation_id: conversation.id,
          owner_id: input.ownerId,
          completed: false,
          completed_at: null,
        }));

        const { data: taskRows, error: taskError } = await client
          .from('tasks')
          .insert(taskPayloads)
          .select('*');

        if (taskError || !taskRows) {
          throw new Error(taskError?.message ?? 'Failed to insert tasks.');
        }

        for (const row of taskRows as TaskRow[]) {
          insertedTasks.push(mapTaskRow(row));
        }
      }

      return {
        conversation,
        messages: insertedMessages.sort((a, b) => a.seq - b.seq),
        findings: insertedFindings,
        tasks: insertedTasks,
      };
    } catch {
      // Atomic cleanup: remove the parent conversation row (cascades to messages, findings, tasks)
      await client
        .from('conversations')
        .delete()
        .eq('id', conversation.id)
        .eq('owner_id', input.ownerId);

      throw new ApiError(
        'INTERNAL_ERROR',
        500,
        'Failed to persist conversation atomically. Partial state was rolled back.'
      );
    }
  }

  async getConversationBundle(
    ownerId: string,
    accessToken: string,
    conversationId: string
  ): Promise<ConversationBundleResult | null> {
    const client = this.createRlsClient(accessToken);

    const { data: convData, error: convError } = await client
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (convError) {
      throw new ApiError('INTERNAL_ERROR', 500, 'Failed to load conversation.');
    }

    if (!convData) {
      return null;
    }

    const [messagesRes, findingsRes, tasksRes] = await Promise.all([
      client
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('owner_id', ownerId)
        .order('seq', { ascending: true }),
      client
        .from('findings')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('owner_id', ownerId)
        .order('relevance_score', { ascending: false }),
      client
        .from('tasks')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: true }),
    ]);

    if (messagesRes.error || findingsRes.error || tasksRes.error) {
      throw new ApiError('INTERNAL_ERROR', 500, 'Failed to load conversation records.');
    }

    return {
      conversation: mapConversationRow(convData as ConversationRow),
      messages: ((messagesRes.data ?? []) as MessageRow[]).map(mapMessageRow),
      findings: ((findingsRes.data ?? []) as FindingRow[]).map(mapFindingRow),
      tasks: ((tasksRes.data ?? []) as TaskRow[]).map(mapTaskRow),
    };
  }

  async deleteConversation(
    ownerId: string,
    accessToken: string,
    conversationId: string
  ): Promise<boolean> {
    const client = this.createRlsClient(accessToken);
    const { data, error } = await client
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('owner_id', ownerId)
      .select('id');

    if (error) {
      throw new ApiError('INTERNAL_ERROR', 500, 'Failed to delete conversation.');
    }

    return Array.isArray(data) && data.length > 0;
  }

  async updateTaskByFindingId(
    ownerId: string,
    accessToken: string,
    findingId: string,
    completed: boolean
  ): Promise<PersistedTask> {
    const client = this.createRlsClient(accessToken);
    const now = new Date().toISOString();
    const completedAt = completed ? now : null;

    const { data: existingTask, error: existingTaskError } = await client
      .from('tasks')
      .select('*')
      .eq('finding_id', findingId)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (existingTaskError) {
      throw new ApiError('INTERNAL_ERROR', 500, 'Failed to look up task.');
    }

    if (existingTask) {
      const { data: updated, error: updateError } = await client
        .from('tasks')
        .update({
          completed,
          completed_at: completedAt,
          updated_at: now,
        })
        .eq('id', (existingTask as TaskRow).id)
        .eq('owner_id', ownerId)
        .select('*')
        .single();

      if (updateError || !updated) {
        throw new ApiError('INTERNAL_ERROR', 500, 'Failed to update task status.');
      }

      return mapTaskRow(updated as TaskRow);
    }

    const { data: findingData, error: findingError } = await client
      .from('findings')
      .select('id, conversation_id, owner_id')
      .eq('id', findingId)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (findingError) {
      throw new ApiError('INTERNAL_ERROR', 500, 'Failed to verify finding ownership.');
    }

    if (!findingData) {
      throw new ApiError('NOT_FOUND', 404, 'Task or finding not found.');
    }

    const { data: createdTask, error: createTaskError } = await client
      .from('tasks')
      .insert({
        finding_id: findingId,
        conversation_id: (findingData as { conversation_id: string }).conversation_id,
        owner_id: ownerId,
        completed,
        completed_at: completedAt,
      })
      .select('*')
      .single();

    if (createTaskError || !createdTask) {
      throw new ApiError('INTERNAL_ERROR', 500, 'Failed to create task record.');
    }

    return mapTaskRow(createdTask as TaskRow);
  }

  async getUserSettings(ownerId: string, accessToken: string): Promise<PersistedUserSettings> {
    const client = this.createRlsClient(accessToken);

    const { data, error } = await client
      .from('user_settings')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) {
      throw new ApiError('INTERNAL_ERROR', 500, 'Failed to load user settings.');
    }

    if (data) {
      return mapSettingsRow(data as UserSettingsRow);
    }

    const { data: inserted, error: insertError } = await client
      .from('user_settings')
      .upsert(
        {
          owner_id: ownerId,
          ai_enabled: false,
          ai_consent_at: null,
          retention_days: 30,
        },
        { onConflict: 'owner_id' }
      )
      .select('*')
      .single();

    if (insertError || !inserted) {
      throw new ApiError('INTERNAL_ERROR', 500, 'Failed to initialize user settings.');
    }

    return mapSettingsRow(inserted as UserSettingsRow);
  }

  async updateUserSettings(
    ownerId: string,
    accessToken: string,
    updates: { aiEnabled?: boolean; retentionDays?: RetentionDays }
  ): Promise<PersistedUserSettings> {
    const current = await this.getUserSettings(ownerId, accessToken);
    const client = this.createRlsClient(accessToken);
    const now = new Date().toISOString();

    const nextAiEnabled = updates.aiEnabled ?? current.aiEnabled;
    const nextRetentionDays = updates.retentionDays ?? current.retentionDays;
    let nextAiConsentAt = current.aiConsentAt;

    if (updates.aiEnabled !== undefined) {
      nextAiConsentAt = updates.aiEnabled ? (current.aiConsentAt ?? now) : null;
    }

    const { data, error } = await client
      .from('user_settings')
      .upsert(
        {
          owner_id: ownerId,
          ai_enabled: nextAiEnabled,
          ai_consent_at: nextAiConsentAt,
          retention_days: nextRetentionDays,
          updated_at: now,
        },
        { onConflict: 'owner_id' }
      )
      .select('*')
      .single();

    if (error || !data) {
      throw new ApiError('INTERNAL_ERROR', 500, 'Failed to update user settings.');
    }

    return mapSettingsRow(data as UserSettingsRow);
  }

  async deleteAllUserData(ownerId: string, accessToken: string): Promise<void> {
    const client = this.createRlsClient(accessToken);

    const tablesInDeletionOrder = [
      'tasks',
      'findings',
      'messages',
      'conversations',
      'user_settings',
    ] as const;

    for (const table of tablesInDeletionOrder) {
      const { error } = await client.from(table).delete().eq('owner_id', ownerId);
      if (error) {
        throw new ApiError(
          'ACCOUNT_DELETION_PARTIAL',
          500,
          `Failed to delete user records from ${table}.`
        );
      }
    }
  }
}
