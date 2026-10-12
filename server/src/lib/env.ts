import { z } from 'zod';

export class EnvConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvConfigurationError';
  }
}

const RawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  STORAGE_MODE: z.enum(['supabase', 'memory']).optional(),
  SUPABASE_URL: z.string().trim().optional(),
  SUPABASE_ANON_KEY: z.string().trim().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().optional(),
  FRONTEND_ORIGIN: z.string().trim().default('http://localhost:5173'),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_IMPORT_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_IMPORT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

export interface ServerEnv {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  storageMode: 'supabase' | 'memory';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  frontendOrigin: string;
  rateLimit: {
    authMax: number;
    authWindowMs: number;
    importMax: number;
    importWindowMs: number;
  };
}

/**
 * Validates server environment variables and enforces strict production safety rules.
 * - Never activates the in-memory adapter in production.
 * - Fails startup with a clear error message if required Supabase credentials are missing
 *   when storageMode is 'supabase' or when NODE_ENV is 'production'.
 * - Never includes secret values in error messages.
 */
export function parseServerEnv(rawEnv: Record<string, string | undefined> = process.env): ServerEnv {
  const parsed = RawEnvSchema.safeParse(rawEnv);
  if (!parsed.success) {
    const invalidKeys = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new EnvConfigurationError(
      `Invalid server environment configuration for keys: ${invalidKeys}`
    );
  }

  const data = parsed.data;

  // Determine storage mode safely
  let storageMode: 'supabase' | 'memory';
  if (data.NODE_ENV === 'production') {
    if (data.STORAGE_MODE === 'memory') {
      throw new EnvConfigurationError(
        'STORAGE_MODE="memory" is forbidden when NODE_ENV="production". Configure real Supabase credentials.'
      );
    }
    storageMode = 'supabase';
  } else if (data.STORAGE_MODE) {
    storageMode = data.STORAGE_MODE;
  } else if (data.SUPABASE_URL && data.SUPABASE_ANON_KEY) {
    storageMode = 'supabase';
  } else if (data.NODE_ENV === 'test') {
    storageMode = 'memory';
  } else {
    throw new EnvConfigurationError(
      'Missing SUPABASE_URL and SUPABASE_ANON_KEY. Configure Supabase credentials in .env or explicitly set STORAGE_MODE="memory" for local offline development.'
    );
  }

  if (storageMode === 'supabase') {
    const missing: string[] = [];
    if (!data.SUPABASE_URL) {
      missing.push('SUPABASE_URL');
    } else {
      try {
        const url = new URL(data.SUPABASE_URL);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') {
          throw new Error('Invalid protocol');
        }
      } catch {
        throw new EnvConfigurationError('SUPABASE_URL must be a valid HTTP/HTTPS URL.');
      }
    }

    if (!data.SUPABASE_ANON_KEY) {
      missing.push('SUPABASE_ANON_KEY');
    }

    if (data.NODE_ENV === 'production' && !data.SUPABASE_SERVICE_ROLE_KEY) {
      missing.push('SUPABASE_SERVICE_ROLE_KEY');
    }

    if (missing.length > 0) {
      throw new EnvConfigurationError(
        `Missing required Supabase environment variables (${missing.join(', ')}) for ${data.NODE_ENV} startup.`
      );
    }
  }

  return {
    nodeEnv: data.NODE_ENV,
    port: data.PORT,
    storageMode,
    supabaseUrl: data.SUPABASE_URL,
    supabaseAnonKey: data.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: data.SUPABASE_SERVICE_ROLE_KEY,
    frontendOrigin: data.FRONTEND_ORIGIN,
    rateLimit: {
      authMax: data.RATE_LIMIT_AUTH_MAX,
      authWindowMs: data.RATE_LIMIT_AUTH_WINDOW_MS,
      importMax: data.RATE_LIMIT_IMPORT_MAX,
      importWindowMs: data.RATE_LIMIT_IMPORT_WINDOW_MS,
    },
  };
}
