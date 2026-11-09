import { Hono } from 'hono';
import {
  MAX_FILE_SIZE_BYTES,
  analyzeConversation,
  parseConversation,
  parseJsonContent,
  parseTxtContent,
  type ParseResult,
} from '@missed/engine';
import type { PersistedFinding } from '../db/types.ts';
import { ApiError } from '../lib/errors.ts';
import {
  MAX_CONVERSATION_REQUEST_BYTES,
  readJsonBodyWithLimit,
} from '../lib/requestBody.ts';
import { requireAuth } from '../middleware/auth.ts';
import type { AppEnv } from '../middleware/requestContext.ts';
import {
  rateLimitMiddleware,
  type SlidingWindowRateLimiter,
} from '../middleware/rateLimit.ts';
import {
  ConversationDetailResponseSchema,
  ConversationListResponseSchema,
  CreateConversationRequestSchema,
  DeleteConversationResponseSchema,
  PaginationQuerySchema,
  UuidParamSchema,
} from '../schemas/apiSchemas.ts';

export interface ConversationRoutesOptions {
  limiter: SlidingWindowRateLimiter;
  windowMs: number;
  maxRequests: number;
}

function deriveDefaultTitle(fileName: string | undefined, participants: string[]): string {
  if (fileName) {
    const cleaned = fileName
      .replace(/\.(txt|json)$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();
    if (cleaned.length > 0) {
      return cleaned.slice(0, 160);
    }
  }

  if (participants.length > 0) {
    const preview = participants.slice(0, 3).join(', ');
    const suffix = participants.length > 3 ? ` +${participants.length - 3}` : '';
    return `Chat: ${preview}${suffix}`.slice(0, 160);
  }

  return 'Imported Conversation';
}

function computeFindingStats(findings: PersistedFinding[]) {
  return {
    urgentCount: findings.filter((f) => f.type === 'urgent').length,
    actionItemCount: findings.filter((f) => f.type === 'action_item').length,
    decisionCount: findings.filter((f) => f.type === 'decision').length,
    deadlinesCount: findings.filter((f) => f.type === 'deadline').length,
    mentionsCount: findings.filter((f) => f.type === 'mention').length,
  };
}

export function createConversationRoutes(options: ConversationRoutesOptions): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  const importRateLimit = rateLimitMiddleware(options.limiter, {
    bucket: 'conversation-import',
    windowMs: options.windowMs,
    maxRequests: options.maxRequests,
  });

  router.use('*', requireAuth());

  router.get('/', async (c) => {
    const query = PaginationQuerySchema.parse({
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
    });

    const authUser = c.get('authUser');
    const accessToken = c.get('accessToken');
    const repository = c.get('repository');

    const { items, total } = await repository.listConversations(
      authUser.id,
      accessToken,
      query.limit,
      query.offset
    );

    const payload = ConversationListResponseSchema.parse({
      items,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total,
      },
    });

    return c.json(payload, 200);
  });

  router.post('/', importRateLimit, async (c) => {
    const rawBody = await readJsonBodyWithLimit(c, MAX_CONVERSATION_REQUEST_BYTES);

    if (
      rawBody &&
      typeof rawBody === 'object' &&
      'content' in rawBody &&
      typeof (rawBody as { content?: unknown }).content === 'string'
    ) {
      const contentBytes = Buffer.byteLength(
        (rawBody as { content: string }).content,
        'utf8'
      );
      if (contentBytes > MAX_FILE_SIZE_BYTES) {
        throw new ApiError(
          'PAYLOAD_TOO_LARGE',
          413,
          `Conversation export (${contentBytes} bytes) exceeds the 10 MiB limit (${MAX_FILE_SIZE_BYTES} bytes).`
        );
      }
    }

    const body = CreateConversationRequestSchema.parse(rawBody);

    let parseResult: ParseResult;
    if (body.format === 'txt') {
      parseResult = parseTxtContent(body.content);
    } else if (body.format === 'json') {
      parseResult = parseJsonContent(body.content);
    } else {
      parseResult = parseConversation(body.content, body.fileName);
    }

    if (!parseResult.success || parseResult.error || parseResult.messages.length === 0) {
      throw new ApiError(
        'INVALID_CONVERSATION_FORMAT',
        422,
        parseResult.error ?? 'No readable messages found in the provided conversation export.'
      );
    }

    const analysis = analyzeConversation(parseResult.messages);

    const authUser = c.get('authUser');
    const accessToken = c.get('accessToken');
    const repository = c.get('repository');

    const title =
      body.title ?? deriveDefaultTitle(body.fileName, analysis.recap.participants);
    const sourceFormat = parseResult.formatDetected ?? 'txt_simple';

    const bundle = await repository.createConversationBundle({
      ownerId: authUser.id,
      accessToken,
      title,
      sourceFormat,
      warning: parseResult.warning ?? null,
      recap: {
        totalMessages: analysis.recap.totalMessages,
        participantCount: analysis.recap.participantCount,
        participants: analysis.recap.participants,
        startTime: analysis.recap.startTime,
        endTime: analysis.recap.endTime,
        topTopics: analysis.recap.topTopics,
        summaryBullets: analysis.recap.summaryBullets,
      },
      messages: parseResult.messages.map((msg, index) => ({
        externalId: msg.id,
        seq: index,
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp ?? null,
      })),
      findings: analysis.findings.map((item) => ({
        type: item.category,
        title: item.title,
        snippet: item.snippet,
        priority: item.urgency,
        sourceExternalId: item.sourceMessageId,
        sender: item.sender,
        timestamp: item.timestamp ?? null,
        assignee: item.assignee ?? null,
        deadline: item.dueDate ?? null,
        relevanceScore: item.relevanceScore,
        analyzer: item.analyzer ?? 'deterministic',
      })),
    });

    const payload = ConversationDetailResponseSchema.parse({
      ...bundle,
      stats: computeFindingStats(bundle.findings),
    });
    return c.json(payload, 201);
  });

  router.get('/:id', async (c) => {
    const params = UuidParamSchema.parse({ id: c.req.param('id') });
    const authUser = c.get('authUser');
    const accessToken = c.get('accessToken');
    const repository = c.get('repository');

    const bundle = await repository.getConversationBundle(
      authUser.id,
      accessToken,
      params.id
    );

    if (!bundle) {
      throw new ApiError('NOT_FOUND', 404, 'Conversation not found.');
    }

    const payload = ConversationDetailResponseSchema.parse({
      ...bundle,
      stats: computeFindingStats(bundle.findings),
    });
    return c.json(payload, 200);
  });

  router.delete('/:id', async (c) => {
    const params = UuidParamSchema.parse({ id: c.req.param('id') });
    const authUser = c.get('authUser');
    const accessToken = c.get('accessToken');
    const repository = c.get('repository');

    const deleted = await repository.deleteConversation(
      authUser.id,
      accessToken,
      params.id
    );

    if (!deleted) {
      throw new ApiError('NOT_FOUND', 404, 'Conversation not found.');
    }

    const payload = DeleteConversationResponseSchema.parse({
      deleted: true,
      id: params.id,
    });

    return c.json(payload, 200);
  });

  return router;
}
