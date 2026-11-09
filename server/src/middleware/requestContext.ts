import { randomUUID } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import type { AuthAdapter, AuthUser, DataRepository } from '../db/types.ts';

export interface AppVariables {
  requestId: string;
  authUser: AuthUser;
  accessToken: string;
  authAdapter: AuthAdapter;
  repository: DataRepository;
}

export interface AppEnv {
  Variables: AppVariables;
}

const SAFE_REQUEST_ID_PATTERN = /^[a-zA-Z0-9._-]{1,128}$/;

export function requestContextMiddleware(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const incomingId = c.req.header('x-request-id')?.trim();
    const requestId =
      incomingId && SAFE_REQUEST_ID_PATTERN.test(incomingId) ? incomingId : randomUUID();

    c.set('requestId', requestId);
    c.header('X-Request-Id', requestId);

    // Defensive HTTP security headers for API responses
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    c.header('Cache-Control', 'no-store');

    await next();
  };
}
