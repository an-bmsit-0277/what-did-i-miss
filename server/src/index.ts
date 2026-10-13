import fs from 'node:fs';
import path from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { parseServerEnv } from './lib/env.ts';

export { createApp } from './app.ts';
export { parseServerEnv, EnvConfigurationError } from './lib/env.ts';
export { InMemoryAuthAdapter, InMemoryDataRepository } from './db/testMemoryAdapter.ts';
export { SupabaseAuthAdapter, SupabaseDataRepository } from './db/supabaseAdapter.ts';

function loadEnvIfAvailable(): void {
  if (typeof (process as any).loadEnvFile !== 'function') return;
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), 'server', '.env'),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      try {
        (process as any).loadEnvFile(envPath);
        break;
      } catch {
        // continue
      }
    }
  }
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return entry.endsWith('index.ts') || entry.endsWith('index.js');
}

if (isDirectExecution()) {
  loadEnvIfAvailable();
  const env = parseServerEnv();
  const app = createApp({ env });

  serve(
    {
      fetch: app.fetch,
      port: env.port,
    },
    (info) => {
      console.info(
        JSON.stringify({
          level: 'info',
          event: 'server_started',
          port: info.port,
          nodeEnv: env.nodeEnv,
          storageMode: env.storageMode,
        })
      );
    }
  );
}
