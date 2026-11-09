import { Hono } from 'hono';
import { readJsonBodyWithLimit } from '../lib/requestBody.ts';
import { requireAuth } from '../middleware/auth.ts';
import type { AppEnv } from '../middleware/requestContext.ts';
import {
  UpdateSettingsRequestSchema,
  UserSettingsResponseSchema,
} from '../schemas/apiSchemas.ts';

export function createSettingsRoutes(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();

  router.use('*', requireAuth());

  router.get('/', async (c) => {
    const authUser = c.get('authUser');
    const accessToken = c.get('accessToken');
    const repository = c.get('repository');

    const settings = await repository.getUserSettings(authUser.id, accessToken);
    const payload = UserSettingsResponseSchema.parse(settings);
    return c.json(payload, 200);
  });

  router.put('/', async (c) => {
    const rawBody = await readJsonBodyWithLimit(c);
    const body = UpdateSettingsRequestSchema.parse(rawBody);

    const authUser = c.get('authUser');
    const accessToken = c.get('accessToken');
    const repository = c.get('repository');

    const settings = await repository.updateUserSettings(
      authUser.id,
      accessToken,
      body
    );

    const payload = UserSettingsResponseSchema.parse(settings);
    return c.json(payload, 200);
  });

  return router;
}
