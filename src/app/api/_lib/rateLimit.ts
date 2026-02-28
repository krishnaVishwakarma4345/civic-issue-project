// Simple in-memory rate limiter for API routes
// In production at scale, replace with Redis (Upstash)

interface RateLimitEntry {
  count:    number;
  resetAt:  number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs:  number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export const rateLimit = (
  identifier: string,
  options: RateLimitOptions = { windowMs: 60_000, maxRequests: 30 }
): { allowed: boolean; remaining: number; resetAt: number } => {
  const now    = Date.now();
  const entry  = store.get(identifier);

  // No entry or window expired — reset
  if (!entry || now > entry.resetAt) {
    const resetAt = now + options.windowMs;
    store.set(identifier, { count: 1, resetAt });
    return {
      allowed:   true,
      remaining: options.maxRequests - 1,
      resetAt,
    };
  }

  // Within window
  if (entry.count >= options.maxRequests) {
    return {
      allowed:   false,
      remaining: 0,
      resetAt:   entry.resetAt,
    };
  }

  entry.count += 1;
  store.set(identifier, entry);

  return {
    allowed:   true,
    remaining: options.maxRequests - entry.count,
    resetAt:   entry.resetAt,
  };
};

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key);
    });
  }, 5 * 60_000);
}