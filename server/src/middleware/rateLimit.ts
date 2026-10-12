import type { MiddlewareHandler } from 'hono';
import { ApiError } from '../lib/errors.ts';
import type { AppEnv } from './requestContext.ts';

export interface RateLimitOptions {
  bucket: string;
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private readonly store = new Map<string, RateLimitEntry>();

  check(
    key: string,
    windowMs: number,
    maxRequests: number,
    nowMs = Date.now()
  ): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetSeconds: number;
    retryAfterSeconds: number;
  } {
    const cutoff = nowMs - windowMs;
    const existing = this.store.get(key);
    const activeTimestamps = existing
      ? existing.timestamps.filter((ts) => ts > cutoff)
      : [];

    if (activeTimestamps.length >= maxRequests) {
      this.store.set(key, { timestamps: activeTimestamps });
      const oldestActive = activeTimestamps[0] ?? nowMs;
      const retryAfterMs = Math.max(1000, oldestActive + windowMs - nowMs);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        resetSeconds: retryAfterSeconds,
        retryAfterSeconds,
      };
    }

    activeTimestamps.push(nowMs);
    this.store.set(key, { timestamps: activeTimestamps });

    if (this.store.size > 5000) {
      this.prune(cutoff);
    }

    const oldestActive = activeTimestamps[0] ?? nowMs;
    const resetSeconds = Math.max(1, Math.ceil((oldestActive + windowMs - nowMs) / 1000));
    return {
      allowed: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - activeTimestamps.length),
      resetSeconds,
      retryAfterSeconds: 0,
    };
  }

  private prune(cutoff: number): void {
    for (const [k, entry] of this.store.entries()) {
      const filtered = entry.timestamps.filter((ts) => ts > cutoff);
      if (filtered.length === 0) {
        this.store.delete(k);
      } else {
        entry.timestamps = filtered;
      }
    }
  }
}

export function rateLimitMiddleware(
  limiter: SlidingWindowRateLimiter,
  options: RateLimitOptions
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const authUser = c.get('authUser') as { id?: string } | undefined;
    const forwardedFor = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    const realIp = c.req.header('x-real-ip')?.trim();
    const actorKey = authUser?.id ?? forwardedFor ?? realIp ?? 'anonymous-client';
    const compositeKey = `${options.bucket}:${actorKey}`;

    const result = limiter.check(compositeKey, options.windowMs, options.maxRequests);

    c.header('X-RateLimit-Limit', String(result.limit));
    c.header('X-RateLimit-Remaining', String(result.remaining));
    c.header('X-RateLimit-Reset', String(result.resetSeconds));

    if (!result.allowed) {
      c.header('Retry-After', String(result.retryAfterSeconds));
      throw new ApiError(
        'RATE_LIMITED',
        429,
        'Too many requests. Please wait before retrying.',
        { retryAfterSeconds: result.retryAfterSeconds }
      );
    }

    await next();
  };
}
