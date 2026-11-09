import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.ts';
import type { AppEnv } from '../middleware/requestContext.ts';
import type { SlidingWindowRateLimiter } from '../middleware/rateLimit.ts';
import { rateLimitMiddleware } from '../middleware/rateLimit.ts';
import { readJsonBodyWithLimit } from '../lib/requestBody.ts';
import {
  AuthSessionResponseSchema,
  DeleteAccountRequestSchema,
  DeleteAccountResponseSchema,
  MeResponseSchema,
  SignInRequestSchema,
  SignOutResponseSchema,
  SignUpRequestSchema,
} from '../schemas/apiSchemas.ts';

export interface AuthRoutesOptions {
  limiter: SlidingWindowRateLimiter;
  windowMs: number;
  maxRequests: number;
}

export function createAuthRoutes(options: AuthRoutesOptions): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  const authRateLimit = rateLimitMiddleware(options.limiter, {
    bucket: 'auth',
    windowMs: options.windowMs,
    maxRequests: options.maxRequests,
  });

  router.post('/signup', authRateLimit, async (c) => {
    const rawBody = await readJsonBodyWithLimit(c);
    const body = SignUpRequestSchema.parse(rawBody);
    const authAdapter = c.get('authAdapter');

    const result = await authAdapter.signUp(body.email, body.password);
    const payload = AuthSessionResponseSchema.parse(result);
    return c.json(payload, 201);
  });

  router.post('/signin', authRateLimit, async (c) => {
    const rawBody = await readJsonBodyWithLimit(c);
    const body = SignInRequestSchema.parse(rawBody);
    const authAdapter = c.get('authAdapter');

    const result = await authAdapter.signIn(body.email, body.password);
    const payload = AuthSessionResponseSchema.parse(result);
    return c.json(payload, 200);
  });

  router.post('/signout', requireAuth(), async (c) => {
    const accessToken = c.get('accessToken');
    const authAdapter = c.get('authAdapter');

    await authAdapter.signOut(accessToken);
    const payload = SignOutResponseSchema.parse({ signedOut: true });
    return c.json(payload, 200);
  });

  router.get('/me', requireAuth(), async (c) => {
    const authUser = c.get('authUser');
    const payload = MeResponseSchema.parse({ user: authUser });
    return c.json(payload, 200);
  });

  router.delete('/account', requireAuth(), async (c) => {
    const rawBody = await readJsonBodyWithLimit(c);
    DeleteAccountRequestSchema.parse(rawBody);

    const authUser = c.get('authUser');
    const accessToken = c.get('accessToken');
    const repository = c.get('repository');
    const authAdapter = c.get('authAdapter');

    // Ordered deletion: tasks -> findings -> messages -> conversations -> user_settings -> auth user
    await repository.deleteAllUserData(authUser.id, accessToken);
    await authAdapter.deleteAuthUser(authUser.id);
    await authAdapter.signOut(accessToken);

    const payload = DeleteAccountResponseSchema.parse({
      deleted: true,
      userId: authUser.id,
    });
    return c.json(payload, 200);
  });

  return router;
}
