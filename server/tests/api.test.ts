import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_FILE_SIZE_BYTES, SAMPLE_CONVERSATION_RAW } from '@missed/engine';
import { createApp } from '../src/app.ts';
import { InMemoryAuthAdapter, InMemoryDataRepository } from '../src/db/testMemoryAdapter.ts';
import { EnvConfigurationError, parseServerEnv, type ServerEnv } from '../src/lib/env.ts';
import { SlidingWindowRateLimiter } from '../src/middleware/rateLimit.ts';

function createTestHarness(overrides?: Partial<ServerEnv['rateLimit']>) {
  const env: ServerEnv = {
    nodeEnv: 'test',
    port: 0,
    storageMode: 'memory',
    frontendOrigin: 'http://localhost:5173',
    rateLimit: {
      authMax: overrides?.authMax ?? 50,
      authWindowMs: overrides?.authWindowMs ?? 60_000,
      importMax: overrides?.importMax ?? 50,
      importWindowMs: overrides?.importWindowMs ?? 60_000,
    },
  };

  const authAdapter = new InMemoryAuthAdapter();
  const repository = new InMemoryDataRepository();
  const rateLimiter = new SlidingWindowRateLimiter();
  const app = createApp({ env, authAdapter, repository, rateLimiter });

  return { app, authAdapter, repository, rateLimiter };
}

async function registerUser(
  app: ReturnType<typeof createApp>,
  email: string,
  password = 'Password123!'
) {
  const res = await app.request('/api/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(res.status, 201);
  const body = (await res.json()) as {
    user: { id: string; email: string };
    accessToken: string;
  };
  assert.ok(body.accessToken);
  return body;
}

describe('Phase 2 Backend API — Security, Auth, Persistence & Validation', () => {
  it('1. rejects unauthenticated access across all protected endpoints with 401', async () => {
    const { app } = createTestHarness();
    const dummyId = '00000000-0000-4000-8000-000000000001';

    const protectedRequests: Array<{ method: string; path: string; body?: unknown }> = [
      { method: 'GET', path: '/api/auth/me' },
      { method: 'POST', path: '/api/auth/signout' },
      { method: 'DELETE', path: '/api/auth/account', body: { confirm: 'DELETE_MY_ACCOUNT' } },
      { method: 'GET', path: '/api/conversations' },
      { method: 'POST', path: '/api/conversations', body: { content: SAMPLE_CONVERSATION_RAW } },
      { method: 'GET', path: `/api/conversations/${dummyId}` },
      { method: 'DELETE', path: `/api/conversations/${dummyId}` },
      { method: 'PATCH', path: `/api/tasks/${dummyId}`, body: { completed: true } },
      { method: 'GET', path: '/api/settings' },
      { method: 'PUT', path: '/api/settings', body: { aiEnabled: true } },
    ];

    for (const req of protectedRequests) {
      const res = await app.request(req.path, {
        method: req.method,
        headers: req.body ? { 'content-type': 'application/json' } : undefined,
        body: req.body ? JSON.stringify(req.body) : undefined,
      });
      assert.equal(
        res.status,
        401,
        `Expected 401 for unauthenticated ${req.method} ${req.path}, got ${res.status}`
      );
      const payload = (await res.json()) as { error: string; requestId: string };
      assert.equal(payload.error, 'UNAUTHORIZED');
      assert.ok(payload.requestId);
    }
  });

  it('2. rejects malformed, invalid, expired, and signed-out tokens with 401', async () => {
    const { app, authAdapter } = createTestHarness();
    const alice = await registerUser(app, 'alice@example.com');

    // Malformed header (non-Bearer)
    const malformedRes = await app.request('/api/auth/me', {
      headers: { authorization: `Basic ${alice.accessToken}` },
    });
    assert.equal(malformedRes.status, 401);

    // Forged token
    const forgedRes = await app.request('/api/auth/me', {
      headers: { authorization: 'Bearer forged_jwt_token_value' },
    });
    assert.equal(forgedRes.status, 401);

    // Expired token
    const expiredToken = authAdapter.issueExpiredTokenForTesting(alice.user.id);
    const expiredRes = await app.request('/api/auth/me', {
      headers: { authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(expiredRes.status, 401);

    // Sign out revokes active token immediately
    const signOutRes = await app.request('/api/auth/signout', {
      method: 'POST',
      headers: { authorization: `Bearer ${alice.accessToken}` },
    });
    assert.equal(signOutRes.status, 200);

    const afterSignOutRes = await app.request('/api/auth/me', {
      headers: { authorization: `Bearer ${alice.accessToken}` },
    });
    assert.equal(afterSignOutRes.status, 401);
  });

  it('3. allows authenticated user to sign in, inspect profile, and access own resources', async () => {
    const { app } = createTestHarness();
    const created = await registerUser(app, 'builder@example.com', 'CorrectHorseBattery1!');

    const signInRes = await app.request('/api/auth/signin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'builder@example.com',
        password: 'CorrectHorseBattery1!',
      }),
    });
    assert.equal(signInRes.status, 200);
    const signedIn = (await signInRes.json()) as {
      user: { id: string; email: string };
      accessToken: string;
    };
    assert.equal(signedIn.user.id, created.user.id);
    assert.ok(signedIn.accessToken);

    const meRes = await app.request('/api/auth/me', {
      headers: { authorization: `Bearer ${signedIn.accessToken}` },
    });
    assert.equal(meRes.status, 200);
    const meBody = (await meRes.json()) as { user: { id: string; email: string } };
    assert.equal(meBody.user.email, 'builder@example.com');
  });

  it('4. denies cross-user conversation read and hides other users from list endpoints', async () => {
    const { app } = createTestHarness();
    const alice = await registerUser(app, 'alice-isolation@example.com');
    const bob = await registerUser(app, 'bob-isolation@example.com');

    const createRes = await app.request('/api/conversations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Alice Private Launch Thread',
        content: SAMPLE_CONVERSATION_RAW,
      }),
    });
    assert.equal(createRes.status, 201);
    const aliceConv = (await createRes.json()) as { conversation: { id: string } };

    // Bob lists conversations -> must be empty
    const bobListRes = await app.request('/api/conversations', {
      headers: { authorization: `Bearer ${bob.accessToken}` },
    });
    assert.equal(bobListRes.status, 200);
    const bobList = (await bobListRes.json()) as { items: unknown[]; pagination: { total: number } };
    assert.equal(bobList.items.length, 0);
    assert.equal(bobList.pagination.total, 0);

    // Bob attempts to fetch Alice's conversation by ID -> 404 NOT_FOUND
    const bobGetRes = await app.request(`/api/conversations/${aliceConv.conversation.id}`, {
      headers: { authorization: `Bearer ${bob.accessToken}` },
    });
    assert.equal(bobGetRes.status, 404);
    const bobErr = (await bobGetRes.json()) as { error: string };
    assert.equal(bobErr.error, 'NOT_FOUND');
  });

  it('5. denies cross-user conversation deletion and preserves owner data', async () => {
    const { app } = createTestHarness();
    const alice = await registerUser(app, 'alice-del@example.com');
    const bob = await registerUser(app, 'bob-del@example.com');

    const createRes = await app.request('/api/conversations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Alice Protected Conversation',
        content: SAMPLE_CONVERSATION_RAW,
      }),
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as { conversation: { id: string } };

    // Bob attempts to delete Alice's conversation
    const bobDeleteRes = await app.request(`/api/conversations/${created.conversation.id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${bob.accessToken}` },
    });
    assert.equal(bobDeleteRes.status, 404);

    // Verify Alice can still read her conversation
    const aliceGetRes = await app.request(`/api/conversations/${created.conversation.id}`, {
      headers: { authorization: `Bearer ${alice.accessToken}` },
    });
    assert.equal(aliceGetRes.status, 200);
  });

  it('6. denies cross-user task completion updates and allows owner task updates', async () => {
    const { app } = createTestHarness();
    const alice = await registerUser(app, 'alice-task@example.com');
    const bob = await registerUser(app, 'bob-task@example.com');

    const createRes = await app.request('/api/conversations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        content: SAMPLE_CONVERSATION_RAW,
      }),
    });
    assert.equal(createRes.status, 201);
    const bundle = (await createRes.json()) as {
      findings: Array<{ id: string; type: string }>;
      tasks: Array<{ id: string; findingId: string; completed: boolean }>;
    };
    assert.ok(bundle.tasks.length > 0, 'Expected sample conversation to generate actionable tasks');
    const targetFindingId = bundle.tasks[0]!.findingId;

    // Bob attempts to toggle Alice's task
    const bobPatchRes = await app.request(`/api/tasks/${targetFindingId}`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${bob.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(bobPatchRes.status, 404);

    // Alice toggles her own task to completed = true
    const alicePatchRes = await app.request(`/api/tasks/${targetFindingId}`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(alicePatchRes.status, 200);
    const patchedTask = (await alicePatchRes.json()) as {
      task: { findingId: string; completed: boolean; completedAt: string | null };
    };
    assert.equal(patchedTask.task.findingId, targetFindingId);
    assert.equal(patchedTask.task.completed, true);
    assert.ok(patchedTask.task.completedAt);
  });

  it('7. enforces strict Zod request validation and rejects smuggled owner_id / findings fields', async () => {
    const { app } = createTestHarness();
    const alice = await registerUser(app, 'alice-val@example.com');

    // Invalid email and short password on signup
    const badSignup = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '123' }),
    });
    assert.equal(badSignup.status, 400);
    const badSignupBody = (await badSignup.json()) as { error: string; details: unknown[] };
    assert.equal(badSignupBody.error, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(badSignupBody.details));

    // Smuggled owner_id and precomputed findings on POST /api/conversations
    const smuggledRes = await app.request('/api/conversations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        content: SAMPLE_CONVERSATION_RAW,
        owner_id: '00000000-0000-4000-8000-999999999999',
        findings: [{ title: 'Fake injected finding' }],
      }),
    });
    assert.equal(smuggledRes.status, 400);
    const smuggledBody = (await smuggledRes.json()) as { error: string };
    assert.equal(smuggledBody.error, 'VALIDATION_ERROR');

    // Invalid retentionDays in PUT /api/settings
    const badSettingsRes = await app.request('/api/settings', {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ retentionDays: 45 }),
    });
    assert.equal(badSettingsRes.status, 400);
  });

  it('8. rejects oversized conversation imports (>10 MiB) with 413 PAYLOAD_TOO_LARGE', async () => {
    const { app } = createTestHarness();
    const alice = await registerUser(app, 'alice-large@example.com');

    const oversizedContent = 'A'.repeat(MAX_FILE_SIZE_BYTES + 1024);
    const res = await app.request('/api/conversations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Oversized Export',
        content: oversizedContent,
      }),
    });

    assert.equal(res.status, 413);
    const payload = (await res.json()) as { error: string };
    assert.equal(payload.error, 'PAYLOAD_TOO_LARGE');
  });

  it('9. handles malformed TXT/JSON imports safely with 422 INVALID_CONVERSATION_FORMAT', async () => {
    const { app } = createTestHarness();
    const alice = await registerUser(app, 'alice-malformed@example.com');

    const malformedJsonRes = await app.request('/api/conversations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        fileName: 'broken.json',
        format: 'json',
        content: '{ "messages": [ invalid json syntax ',
      }),
    });
    assert.equal(malformedJsonRes.status, 422);
    const errBody = (await malformedJsonRes.json()) as { error: string; message: string };
    assert.equal(errBody.error, 'INVALID_CONVERSATION_FORMAT');
    assert.ok(errBody.message.length > 0);
  });

  it('10. parses TXT & JSON exports via @missed/engine and persists messages, findings, and tasks', async () => {
    const { app } = createTestHarness();
    const alice = await registerUser(app, 'alice-engine@example.com');

    const jsonExport = JSON.stringify([
      {
        id: 'm-1',
        sender: 'Priya',
        timestamp: '10:00 AM',
        text: 'URGENT: Production API gateway latency spiked above 2s!',
      },
      {
        id: 'm-2',
        sender: 'Arjun',
        timestamp: '10:02 AM',
        text: '@Alex please roll back the edge worker deployment by 11:00 AM today.',
      },
      {
        id: 'm-3',
        sender: 'Priya',
        timestamp: '10:05 AM',
        text: 'We decided to freeze new releases until the root cause is verified.',
      },
    ]);

    const res = await app.request('/api/conversations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        fileName: 'incident_review.json',
        content: jsonExport,
      }),
    });

    assert.equal(res.status, 201);
    const data = (await res.json()) as {
      conversation: {
        id: string;
        title: string;
        sourceFormat: string;
        messageCount: number;
        participantCount: number;
      };
      stats: {
        urgentCount: number;
        actionItemCount: number;
        decisionCount: number;
        deadlinesCount: number;
        mentionsCount: number;
      };
      messages: Array<{ id: string; externalId: string; seq: number; sender: string }>;
      findings: Array<{
        id: string;
        type: string;
        sourceMessageId: string | null;
        analyzer: string;
      }>;
      tasks: Array<{ id: string; findingId: string; completed: boolean }>;
    };

    assert.equal(data.conversation.title, 'incident review');
    assert.equal(data.conversation.sourceFormat, 'json_standard');
    assert.equal(data.conversation.messageCount, 3);
    assert.equal(data.conversation.participantCount, 2);
    assert.equal(data.messages.length, 3);
    assert.deepEqual(
      data.messages.map((m) => m.seq),
      [0, 1, 2]
    );
    assert.ok(data.findings.length > 0);
    for (const finding of data.findings) {
      assert.equal(finding.analyzer, 'deterministic');
      assert.ok(
        finding.sourceMessageId &&
          data.messages.some((m) => m.id === finding.sourceMessageId),
        'Every finding must link to a persisted source message UUID'
      );
    }
    assert.ok(data.tasks.length > 0);
  });

  it('11. rolls back partial conversation persistence failures leaving zero orphaned records', async () => {
    const { app, repository } = createTestHarness();
    const alice = await registerUser(app, 'alice-rollback@example.com');

    for (const stage of ['messages', 'findings', 'tasks'] as const) {
      repository.injectFailureOnNextCreate(stage);

      const res = await app.request('/api/conversations', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${alice.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: `Should Rollback (${stage})`,
          content: SAMPLE_CONVERSATION_RAW,
        }),
      });

      assert.equal(res.status, 500);
      const snapshot = repository.getSnapshotForTesting();
      assert.equal(
        snapshot.conversations.length,
        0,
        `Orphaned conversation remained after ${stage} failure`
      );
      assert.equal(
        snapshot.messages.length,
        0,
        `Orphaned messages remained after ${stage} failure`
      );
      assert.equal(
        snapshot.findings.length,
        0,
        `Orphaned findings remained after ${stage} failure`
      );
      assert.equal(
        snapshot.tasks.length,
        0,
        `Orphaned tasks remained after ${stage} failure`
      );
    }
  });

  it('12. scopes user settings read/update to the authenticated user and tracks aiConsentAt', async () => {
    const { app } = createTestHarness();
    const alice = await registerUser(app, 'alice-settings@example.com');
    const bob = await registerUser(app, 'bob-settings@example.com');

    // Initial defaults for Alice
    const initRes = await app.request('/api/settings', {
      headers: { authorization: `Bearer ${alice.accessToken}` },
    });
    assert.equal(initRes.status, 200);
    const initSettings = (await initRes.json()) as {
      ownerId: string;
      aiEnabled: boolean;
      aiConsentAt: string | null;
      retentionDays: number;
    };
    assert.equal(initSettings.ownerId, alice.user.id);
    assert.equal(initSettings.aiEnabled, false);
    assert.equal(initSettings.aiConsentAt, null);
    assert.equal(initSettings.retentionDays, 30);

    // Alice enables AI and updates retentionDays to 90
    const updateRes = await app.request('/api/settings', {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ aiEnabled: true, retentionDays: 90 }),
    });
    assert.equal(updateRes.status, 200);
    const updatedAlice = (await updateRes.json()) as {
      ownerId: string;
      aiEnabled: boolean;
      aiConsentAt: string | null;
      retentionDays: number;
    };
    assert.equal(updatedAlice.aiEnabled, true);
    assert.ok(updatedAlice.aiConsentAt);
    assert.equal(updatedAlice.retentionDays, 90);

    // Bob's settings remain completely isolated at defaults
    const bobRes = await app.request('/api/settings', {
      headers: { authorization: `Bearer ${bob.accessToken}` },
    });
    assert.equal(bobRes.status, 200);
    const bobSettings = (await bobRes.json()) as {
      ownerId: string;
      aiEnabled: boolean;
      aiConsentAt: string | null;
      retentionDays: number;
    };
    assert.equal(bobSettings.ownerId, bob.user.id);
    assert.equal(bobSettings.aiEnabled, false);
    assert.equal(bobSettings.aiConsentAt, null);
    assert.equal(bobSettings.retentionDays, 30);
  });

  it('13. deletes user account and all owned records in dependency-safe order without affecting other users', async () => {
    const { app, authAdapter, repository } = createTestHarness();
    const alice = await registerUser(app, 'alice-delete-acc@example.com');
    const bob = await registerUser(app, 'bob-keep-acc@example.com');

    // Both Alice and Bob create conversations and settings
    await app.request('/api/conversations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ content: SAMPLE_CONVERSATION_RAW }),
    });
    await app.request('/api/settings', {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ retentionDays: 7 }),
    });

    await app.request('/api/conversations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${bob.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ content: SAMPLE_CONVERSATION_RAW }),
    });

    // Delete account for Alice
    const deleteRes = await app.request('/api/auth/account', {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ confirm: 'DELETE_MY_ACCOUNT' }),
    });
    assert.equal(deleteRes.status, 200);
    const deletePayload = (await deleteRes.json()) as { deleted: boolean; userId: string };
    assert.equal(deletePayload.deleted, true);
    assert.equal(deletePayload.userId, alice.user.id);

    // Verify exact child-to-parent deletion order
    assert.deepEqual(repository.getDeletionOrderLogForTesting(), [
      'tasks',
      'findings',
      'messages',
      'conversations',
      'user_settings',
    ]);

    // Verify zero records remain for Alice, while Bob's records remain intact
    const snapshot = repository.getSnapshotForTesting();
    assert.equal(
      snapshot.conversations.filter((c) => c.ownerId === alice.user.id).length,
      0
    );
    assert.equal(
      snapshot.messages.filter((m) => m.ownerId === alice.user.id).length,
      0
    );
    assert.equal(
      snapshot.findings.filter((f) => f.ownerId === alice.user.id).length,
      0
    );
    assert.equal(
      snapshot.tasks.filter((t) => t.ownerId === alice.user.id).length,
      0
    );
    assert.equal(
      snapshot.settings.filter((s) => s.ownerId === alice.user.id).length,
      0
    );
    assert.equal(authAdapter.hasUserForTesting(alice.user.id), false);

    // Bob still has his conversation
    assert.equal(
      snapshot.conversations.filter((c) => c.ownerId === bob.user.id).length,
      1
    );

    // Alice's token is revoked
    const postDeleteMe = await app.request('/api/auth/me', {
      headers: { authorization: `Bearer ${alice.accessToken}` },
    });
    assert.equal(postDeleteMe.status, 401);
  });

  it('14. enforces rate limiting (429) and strict production environment guardrails', async () => {
    const { app } = createTestHarness({ authMax: 2, authWindowMs: 60_000 });

    const r1 = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
      body: JSON.stringify({ email: 'rate1@example.com', password: 'Password123!' }),
    });
    assert.equal(r1.status, 201);

    const r2 = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
      body: JSON.stringify({ email: 'rate2@example.com', password: 'Password123!' }),
    });
    assert.equal(r2.status, 201);

    const r3 = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
      body: JSON.stringify({ email: 'rate3@example.com', password: 'Password123!' }),
    });
    assert.equal(r3.status, 429);
    assert.ok(r3.headers.get('retry-after'));
    const rateErr = (await r3.json()) as { error: string };
    assert.equal(rateErr.error, 'RATE_LIMITED');

    // Production environment guardrails: forbid STORAGE_MODE=memory in production
    assert.throws(
      () =>
        parseServerEnv({
          NODE_ENV: 'production',
          STORAGE_MODE: 'memory',
        }),
      EnvConfigurationError
    );

    // Production environment guardrails: require SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
    assert.throws(
      () =>
        parseServerEnv({
          NODE_ENV: 'production',
          SUPABASE_URL: 'https://example.supabase.co',
        }),
      EnvConfigurationError
    );
  });
});
