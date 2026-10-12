import { Hono } from 'hono';
import { readJsonBodyWithLimit } from '../lib/requestBody.ts';
import { requireAuth } from '../middleware/auth.ts';
import type { AppEnv } from '../middleware/requestContext.ts';
import {
  FindingIdParamSchema,
  TaskResponseSchema,
  UpdateTaskRequestSchema,
} from '../schemas/apiSchemas.ts';

export function createTaskRoutes(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();

  router.use('*', requireAuth());

  router.patch('/:findingId', async (c) => {
    const params = FindingIdParamSchema.parse({
      findingId: c.req.param('findingId'),
    });
    const rawBody = await readJsonBodyWithLimit(c);
    const body = UpdateTaskRequestSchema.parse(rawBody);

    const authUser = c.get('authUser');
    const accessToken = c.get('accessToken');
    const repository = c.get('repository');

    const task = await repository.updateTaskByFindingId(
      authUser.id,
      accessToken,
      params.findingId,
      body.completed
    );

    const payload = TaskResponseSchema.parse({ task });
    return c.json(payload, 200);
  });

  return router;
}
