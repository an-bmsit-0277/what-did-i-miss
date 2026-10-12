import type { Context } from 'hono';
import { ApiError } from './errors.ts';

export const DEFAULT_JSON_BODY_MAX_BYTES = 64 * 1024; // 64 KiB for auth/settings/tasks
export const MAX_CONVERSATION_REQUEST_BYTES = 11 * 1024 * 1024; // 10 MiB content + JSON envelope

/**
 * Reads and parses a JSON request body while strictly enforcing a maximum byte limit
 * before JSON.parse executes.
 */
export async function readJsonBodyWithLimit(
  c: Context,
  maxBytes: number = DEFAULT_JSON_BODY_MAX_BYTES
): Promise<unknown> {
  const contentLengthHeader = c.req.header('content-length');
  if (contentLengthHeader) {
    const declaredBytes = Number(contentLengthHeader);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      throw new ApiError(
        'PAYLOAD_TOO_LARGE',
        413,
        'Request payload exceeds maximum allowed size.'
      );
    }
  }

  let rawText: string;
  try {
    rawText = await c.req.text();
  } catch {
    throw new ApiError('VALIDATION_ERROR', 400, 'Unable to read request body.');
  }

  const actualBytes = Buffer.byteLength(rawText, 'utf8');
  if (actualBytes > maxBytes) {
    throw new ApiError(
      'PAYLOAD_TOO_LARGE',
      413,
      `Request payload (${actualBytes} bytes) exceeds maximum allowed limit.`
    );
  }

  if (rawText.trim().length === 0) {
    throw new ApiError('VALIDATION_ERROR', 400, 'Request body cannot be empty.');
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    throw new ApiError('VALIDATION_ERROR', 400, 'Request body must be valid JSON.');
  }
}
