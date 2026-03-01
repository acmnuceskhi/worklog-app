/**
 * In-memory rate limiter for API route protection.
 *
 * Provides sliding-window rate limiting using a simple Map cache.
 * For distributed/multi-instance production use, replace with
 * Upstash Redis (`@upstash/ratelimit`) — see SECURITY_HARDENING_PLAN.md §2.
 */

interface RateLimitOptions {
  /** Time window in milliseconds */
  interval: number;
  /** Max unique tokens to track (prevents memory leaks) */
  uniqueTokenPerInterval: number;
}

interface RateLimitRecord {
  count: number;
  lastReset: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

function createRateLimiter(options: RateLimitOptions) {
  const tokenCache = new Map<string, RateLimitRecord>();

  // Periodically clean up expired entries to prevent memory leaks
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    // Only clean up every interval period
    if (now - lastCleanup < options.interval) return;
    lastCleanup = now;

    for (const [key, record] of tokenCache) {
      if (now - record.lastReset > options.interval) {
        tokenCache.delete(key);
      }
    }

    // Evict oldest entries if cache exceeds max size
    if (tokenCache.size > options.uniqueTokenPerInterval) {
      const excess = tokenCache.size - options.uniqueTokenPerInterval;
      const keys = tokenCache.keys();
      for (let i = 0; i < excess; i++) {
        const key = keys.next().value;
        if (key) tokenCache.delete(key);
      }
    }
  }

  return {
    check(limit: number, token: string): RateLimitResult {
      cleanup();

      const now = Date.now();
      const record = tokenCache.get(token);

      // Start a new window
      if (!record || now - record.lastReset > options.interval) {
        tokenCache.set(token, { count: 1, lastReset: now });
        return { success: true, remaining: limit - 1 };
      }

      // Window still active — check limit
      if (record.count >= limit) {
        return { success: false, remaining: 0 };
      }

      record.count++;
      return { success: true, remaining: limit - record.count };
    },
  };
}

// ── Pre-configured limiters ──────────────────────────────────────────────────

/** General API mutations: 30 requests per minute */
export const apiLimiter = createRateLimiter({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

/** Auth endpoints: 5 attempts per 15 minutes */
export const authLimiter = createRateLimiter({
  interval: 15 * 60 * 1000,
  uniqueTokenPerInterval: 200,
});

/** File uploads: 10 per minute */
export const uploadLimiter = createRateLimiter({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 200,
});

/** Email invitations: 10 per minute */
export const inviteLimiter = createRateLimiter({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 200,
});

export type RateLimiter = ReturnType<typeof createRateLimiter>;
