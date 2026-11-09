import { z } from 'zod';
import { MAX_FILE_SIZE_BYTES } from '@missed/engine';

// -----------------------------------------------------------------------------
// Common Primitives
// -----------------------------------------------------------------------------
export const UuidSchema = z.string().uuid('Must be a valid UUID.');

export const UuidParamSchema = z.object({
  id: UuidSchema,
});

export const FindingIdParamSchema = z.object({
  findingId: UuidSchema,
});

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// -----------------------------------------------------------------------------
// Authentication Schemas
// -----------------------------------------------------------------------------
export const SignUpRequestSchema = z
  .object({
    email: z.string().trim().email('Please provide a valid email address.').max(254),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .max(128, 'Password cannot exceed 128 characters.'),
  })
  .strict();

export const SignInRequestSchema = z
  .object({
    email: z.string().trim().email('Please provide a valid email address.').max(254),
    password: z.string().min(1, 'Password is required.').max(128),
  })
  .strict();

export const DeleteAccountRequestSchema = z
  .object({
    confirm: z.literal('DELETE_MY_ACCOUNT', {
      errorMap: () => ({
        message: 'Confirmation phrase must be exactly "DELETE_MY_ACCOUNT".',
      }),
    }),
  })
  .strict();

export const AuthenticatedUserResponseSchema = z.object({
  id: UuidSchema,
  email: z.string().email(),
  createdAt: z.string().optional(),
});

export const AuthSessionResponseSchema = z.object({
  user: AuthenticatedUserResponseSchema,
  accessToken: z.string().nullable(),
  expiresAt: z.number().nullable().optional(),
  emailConfirmationRequired: z.boolean().default(false),
});

export const MeResponseSchema = z.object({
  user: AuthenticatedUserResponseSchema,
});

export const SignOutResponseSchema = z.object({
  signedOut: z.literal(true),
});

export const DeleteAccountResponseSchema = z.object({
  deleted: z.literal(true),
  userId: UuidSchema,
});

// -----------------------------------------------------------------------------
// Conversation & Message Schemas
// -----------------------------------------------------------------------------
export const SourceFormatSchema = z.enum([
  'json_standard',
  'json_slack',
  'txt_bracketed',
  'txt_whatsapp',
  'txt_simple',
]);

export const FindingCategorySchema = z.enum([
  'urgent',
  'action_item',
  'decision',
  'deadline',
  'mention',
]);

export const UrgencyLevelSchema = z.enum(['high', 'medium', 'low']);

export const AnalyzerTypeSchema = z.enum(['deterministic', 'ai']);

export const CreateConversationRequestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty.')
      .max(200, 'Title cannot exceed 200 characters.')
      .optional(),
    fileName: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .regex(/^[^/\\]+$/, 'File name must not contain path separators.')
      .optional(),
    format: z.enum(['txt', 'json']).optional(),
    content: z.string().superRefine((val, ctx) => {
      const byteLength = Buffer.byteLength(val, 'utf8');
      if (byteLength === 0 || val.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Conversation content cannot be empty.',
        });
        return;
      }
      if (byteLength > MAX_FILE_SIZE_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Conversation content exceeds the 10 MiB (${MAX_FILE_SIZE_BYTES} bytes) limit.`,
        });
      }
    }),
  })
  .strict();

export const ConversationSummaryResponseSchema = z.object({
  id: UuidSchema,
  title: z.string(),
  sourceFormat: SourceFormatSchema,
  messageCount: z.number().int().nonnegative(),
  participantCount: z.number().int().nonnegative(),
  participants: z.array(z.string()),
  topTopics: z.array(z.string()),
  summaryBullets: z.array(z.string()),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  warning: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ConversationListResponseSchema = z.object({
  items: z.array(ConversationSummaryResponseSchema),
  pagination: z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
});

export const DeleteConversationResponseSchema = z.object({
  deleted: z.literal(true),
  id: UuidSchema,
});

export const PersistedMessageResponseSchema = z.object({
  id: UuidSchema,
  conversationId: UuidSchema,
  externalId: z.string(),
  seq: z.number().int().nonnegative(),
  sender: z.string(),
  text: z.string(),
  timestamp: z.string().nullable(),
  createdAt: z.string(),
});

export const PersistedFindingResponseSchema = z.object({
  id: UuidSchema,
  conversationId: UuidSchema,
  type: FindingCategorySchema,
  title: z.string(),
  snippet: z.string(),
  priority: UrgencyLevelSchema,
  sourceMessageId: UuidSchema.nullable(),
  sourceExternalId: z.string(),
  sender: z.string(),
  timestamp: z.string().nullable(),
  assignee: z.string().nullable(),
  deadline: z.string().nullable(),
  relevanceScore: z.number().int(),
  analyzer: AnalyzerTypeSchema,
  createdAt: z.string(),
});

export const PersistedTaskResponseSchema = z.object({
  id: UuidSchema,
  findingId: UuidSchema,
  conversationId: UuidSchema,
  completed: z.boolean(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ConversationDetailResponseSchema = z.object({
  conversation: ConversationSummaryResponseSchema,
  stats: z.object({
    urgentCount: z.number().int().nonnegative(),
    actionItemCount: z.number().int().nonnegative(),
    decisionCount: z.number().int().nonnegative(),
    deadlinesCount: z.number().int().nonnegative(),
    mentionsCount: z.number().int().nonnegative(),
  }),
  messages: z.array(PersistedMessageResponseSchema),
  findings: z.array(PersistedFindingResponseSchema),
  tasks: z.array(PersistedTaskResponseSchema),
});

// -----------------------------------------------------------------------------
// Task Schemas
// -----------------------------------------------------------------------------
export const UpdateTaskRequestSchema = z
  .object({
    completed: z.boolean(),
  })
  .strict();

export const TaskResponseSchema = z.object({
  task: PersistedTaskResponseSchema,
});

// -----------------------------------------------------------------------------
// User Settings Schemas
// -----------------------------------------------------------------------------
export const RetentionDaysSchema = z.union([
  z.literal(7),
  z.literal(30),
  z.literal(90),
  z.literal(365),
]);

export const UpdateSettingsRequestSchema = z
  .object({
    aiEnabled: z.boolean().optional(),
    retentionDays: RetentionDaysSchema.optional(),
  })
  .strict();

export const UserSettingsResponseSchema = z.object({
  ownerId: UuidSchema,
  aiEnabled: z.boolean(),
  aiConsentAt: z.string().nullable(),
  retentionDays: RetentionDaysSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

