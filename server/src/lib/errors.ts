import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INVALID_CONVERSATION_FORMAT'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'AUTH_ERROR'
  | 'ACCOUNT_DELETION_PARTIAL'
  | 'INTERNAL_ERROR';

export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: ContentfulStatusCode;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    statusCode: ContentfulStatusCode,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface ErrorResponsePayload {
  error: ErrorCode;
  message: string;
  requestId: string;
  details?: unknown;
}

export function formatZodIssues(err: ZodError) {
  return err.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

export function handleApiError(err: unknown, c: Context): Response {
  const requestId = (c.get('requestId') as string | undefined) || 'unknown';

  if (err instanceof ApiError) {
    const body: ErrorResponsePayload = {
      error: err.code,
      message: err.message,
      requestId,
      ...(err.details !== undefined ? { details: err.details } : {}),
    };
    return c.json(body, err.statusCode);
  }

  if (err instanceof ZodError) {
    const body: ErrorResponsePayload = {
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      requestId,
      details: formatZodIssues(err),
    };
    return c.json(body, 400);
  }

  if (err instanceof SyntaxError) {
    const body: ErrorResponsePayload = {
      error: 'VALIDATION_ERROR',
      message: 'Malformed JSON request body.',
      requestId,
    };
    return c.json(body, 400);
  }

  // Never leak raw database errors, tokens, or stack traces to the client
  const body: ErrorResponsePayload = {
    error: 'INTERNAL_ERROR',
    message: 'An unexpected server error occurred.',
    requestId,
  };
  return c.json(body, 500);
}
