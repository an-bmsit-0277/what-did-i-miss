import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SupabaseAuthAdapter, SupabaseDataRepository } from './db/supabaseAdapter.ts';
import { InMemoryAuthAdapter, InMemoryDataRepository } from './db/testMemoryAdapter.ts';
import type { AuthAdapter, DataRepository } from './db/types.ts';
import { parseServerEnv, type ServerEnv } from './lib/env.ts';
import { ApiError, handleApiError } from './lib/errors.ts';
import { SlidingWindowRateLimiter } from './middleware/rateLimit.ts';
import { requestContextMiddleware, type AppEnv } from './middleware/requestContext.ts';
import { createAuthRoutes } from './routes/authRoutes.ts';
import { createConversationRoutes } from './routes/conversationRoutes.ts';
import { createSettingsRoutes } from './routes/settingsRoutes.ts';
import { createTaskRoutes } from './routes/taskRoutes.ts';

export interface CreateAppOptions {
  env?: ServerEnv;
  authAdapter?: AuthAdapter;
  repository?: DataRepository;
  rateLimiter?: SlidingWindowRateLimiter;
}

export function createAdaptersFromEnv(env: ServerEnv): {
  authAdapter: AuthAdapter;
  repository: DataRepository;
} {
  if (env.storageMode === 'memory') {
    return {
      authAdapter: new InMemoryAuthAdapter(),
      repository: new InMemoryDataRepository(),
    };
  }

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_ANON_KEY are required when STORAGE_MODE=supabase.'
    );
  }

  const config = {
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
    supabaseServiceRoleKey: env.supabaseServiceRoleKey,
  };

  return {
    authAdapter: new SupabaseAuthAdapter(config),
    repository: new SupabaseDataRepository(config),
  };
}

export function createApp(options: CreateAppOptions = {}): Hono<AppEnv> {
  const env = options.env ?? parseServerEnv();
  const defaultAdapters =
    options.authAdapter && options.repository
      ? { authAdapter: options.authAdapter, repository: options.repository }
      : createAdaptersFromEnv(env);

  const authAdapter = options.authAdapter ?? defaultAdapters.authAdapter;
  const repository = options.repository ?? defaultAdapters.repository;
  const rateLimiter = options.rateLimiter ?? new SlidingWindowRateLimiter();
  const allowedOrigins = env.frontendOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const app = new Hono<AppEnv>();

  app.use('*', requestContextMiddleware());

  app.use(
    '/api/*',
    cors({
      origin: (origin) => {
        if (!origin) return allowedOrigins[0] ?? 'http://localhost:5173';
        return allowedOrigins.includes(origin) ? origin : null;
      },
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposeHeaders: [
        'X-Request-Id',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Retry-After',
      ],
      maxAge: 600,
      credentials: true,
    })
  );

  app.use('*', async (c, next) => {
    c.set('authAdapter', authAdapter);
    c.set('repository', repository);
    await next();
  });

  app.get('/api/health', (c) => {
    return c.json(
      {
        status: 'ok',
        storageMode: env.storageMode,
        timestamp: new Date().toISOString(),
      },
      200
    );
  });

  app.route(
    '/api/auth',
    createAuthRoutes({
      limiter: rateLimiter,
      windowMs: env.rateLimit.authWindowMs,
      maxRequests: env.rateLimit.authMax,
    })
  );

  app.route(
    '/api/conversations',
    createConversationRoutes({
      limiter: rateLimiter,
      windowMs: env.rateLimit.importWindowMs,
      maxRequests: env.rateLimit.importMax,
    })
  );

  app.route('/api/tasks', createTaskRoutes());
  app.route('/api/settings', createSettingsRoutes());

  app.notFound((c) => {
    return handleApiError(
      new ApiError('NOT_FOUND', 404, `Route ${c.req.method} ${c.req.path} not found.`),
      c
    );
  });

  app.onError((err, c) => {
    return handleApiError(err, c);
  });

  return app;
}
