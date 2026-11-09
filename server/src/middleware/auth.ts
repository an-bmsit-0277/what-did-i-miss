import type { MiddlewareHandler } from 'hono';
import { ApiError } from '../lib/errors.ts';
import type { AppEnv } from './requestContext.ts';

/**
 * Extracts a strict Bearer token from the Authorization header.
 * Rejects missing headers, non-Bearer schemes, empty tokens, or tokens with whitespace.
 */
export function extractBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader) {
    throw new ApiError('UNAUTHORIZED', 401, 'Missing Authorization header.');
  }

  const trimmed = authorizationHeader.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer' || !parts[1]) {
    throw new ApiError(
      'UNAUTHORIZED',
      401,
      'Malformed Authorization header. Expected "Bearer <token>".'
    );
  }

  return parts[1];
}

/**
 * Middleware that verifies the Bearer token server-side via the configured AuthAdapter.
 * Never trusts client-provided user_id / owner_id fields from body, query, or headers.
 */
export function requireAuth(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const authHeader = c.req.header('authorization');
    const token = extractBearerToken(authHeader);
    const authAdapter = c.get('authAdapter');

    const user = await authAdapter.verifyToken(token);
    c.set('authUser', user);
    c.set('accessToken', token);

    await next();
  };
}
