/**
 * Centralized API Client for Missed. Backend (Hono + Supabase)
 *
 * Targets /api/* endpoints with bearer token injection, typed schemas,
 * and normalized ApiError parsing.
 */

import { getApiUrl } from '../config/env.ts';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  createdAt?: string;
}

export interface AuthSessionResponse {
  user: AuthUser;
  accessToken: string | null;
  expiresAt?: number | null;
  emailConfirmationRequired: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  sourceFormat: string;
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

export interface ConversationListResponse {
  items: ConversationSummary[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface PersistedMessage {
  id: string;
  conversationId: string;
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
  type: 'urgent' | 'action_item' | 'decision' | 'deadline' | 'mention';
  title: string;
  snippet: string;
  priority: 'high' | 'medium' | 'low';
  sourceMessageId: string | null;
  sourceExternalId: string;
  sender: string;
  timestamp: string | null;
  assignee: string | null;
  deadline: string | null;
  relevanceScore: number;
  analyzer: 'deterministic' | 'ai';
  createdAt: string;
}

export interface PersistedTask {
  id: string;
  findingId: string;
  conversationId: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetailResponse {
  conversation: ConversationSummary;
  stats: {
    urgentCount: number;
    actionItemCount: number;
    decisionCount: number;
    deadlinesCount: number;
    mentionsCount: number;
  };
  messages: PersistedMessage[];
  findings: PersistedFinding[];
  tasks: PersistedTask[];
}

export interface CreateConversationInput {
  title?: string;
  fileName?: string;
  format?: 'txt' | 'json';
  content: string;
}

/**
 * Low-level HTTP fetch wrapper with JSON serialization & ApiError translation.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const url = getApiUrl(endpoint);
  const headers = new Headers(options.headers || {});

  headers.set('Accept', 'application/json');
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new ApiError(
      'NETWORK_UNAVAILABLE',
      0,
      'Unable to connect to the Missed. server. Please check your connection or backend status.',
      netErr
    );
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse | undefined;
    try {
      errorData = await response.json();
    } catch {
      // Body wasn't JSON
    }

    const code = errorData?.error?.code || `HTTP_${response.status}`;
    const message =
      errorData?.error?.message ||
      response.statusText ||
      `Request failed with status ${response.status}`;

    throw new ApiError(code, response.status, message, errorData?.error?.details);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Typed API Endpoints
// ---------------------------------------------------------------------------

export const api = {
  // Health
  async getHealth(): Promise<{ status: string; storageMode: string; timestamp: string }> {
    return request('/health');
  },

  // Auth
  async signUp(email: string, password: string): Promise<AuthSessionResponse> {
    return request<AuthSessionResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signIn(email: string, password: string): Promise<AuthSessionResponse> {
    return request<AuthSessionResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signOut(token: string): Promise<{ signedOut: boolean }> {
    return request<{ signedOut: boolean }>('/auth/signout', { method: 'POST' }, token);
  },

  async getMe(token: string): Promise<{ user: AuthUser }> {
    return request<{ user: AuthUser }>('/auth/me', { method: 'GET' }, token);
  },

  async deleteAccount(token: string): Promise<{ deleted: boolean; userId: string }> {
    return request<{ deleted: boolean; userId: string }>(
      '/auth/account',
      {
        method: 'DELETE',
        body: JSON.stringify({ confirm: 'DELETE_MY_ACCOUNT' }),
      },
      token
    );
  },

  // Conversations
  async listConversations(
    token: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ConversationListResponse> {
    return request<ConversationListResponse>(
      `/conversations?limit=${limit}&offset=${offset}`,
      { method: 'GET' },
      token
    );
  },

  async getConversation(
    token: string,
    id: string
  ): Promise<ConversationDetailResponse> {
    return request<ConversationDetailResponse>(`/conversations/${id}`, { method: 'GET' }, token);
  },

  async createConversation(
    token: string,
    input: CreateConversationInput
  ): Promise<ConversationDetailResponse> {
    return request<ConversationDetailResponse>(
      '/conversations',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      token
    );
  },

  async deleteConversation(token: string, id: string): Promise<{ deleted: boolean; id: string }> {
    return request<{ deleted: boolean; id: string }>(
      `/conversations/${id}`,
      { method: 'DELETE' },
      token
    );
  },

  // Tasks
  async updateTask(
    token: string,
    findingId: string,
    completed: boolean
  ): Promise<{ task: PersistedTask }> {
    return request<{ task: PersistedTask }>(
      `/tasks/${findingId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      },
      token
    );
  },
};
