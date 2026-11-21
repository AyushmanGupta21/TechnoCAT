// Fixed-window rate limiter for sensitive endpoints (login, signup, password change).
//
// NOTE: state lives in process memory, so limits are per server instance. That is enough
// to stop casual brute forcing locally and on a single Node server; on multi-instance /
// serverless deployments it should be backed by a shared store (DB table or Redis).

import type { NextRequest } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var _technocatRateLimit: Map<string, Bucket> | undefined;
}

const buckets: Map<string, Bucket> = (global._technocatRateLimit ??= new Map());

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Consume one attempt for `key`. Returns whether the attempt is allowed and, if not,
 * how many seconds remain until the window resets.
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Clear a key after a successful attempt (e.g. correct password). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
