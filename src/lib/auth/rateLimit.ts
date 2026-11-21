// Fixed-window rate limiter backed by Postgres (table: public.rate_limits, migration 0007),
// so limits are shared across every server / serverless instance.
//
// Each call atomically increments the counter for `key` (or starts a new window when the
// previous one expired) in a single statement, so concurrent requests cannot race.

import type { NextRequest } from "next/server";
import { query } from "@/lib/db";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Consume one attempt for `key`. Returns whether the attempt is allowed and, if not,
 * how many seconds remain until the window resets.
 *
 * Fails open (allows the request) if the database is unreachable: the request itself will
 * then fail on its own DB access, and an outage should not lock every user out.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  try {
    const res = await query<{ count: number; retry_after: number }>(
      `INSERT INTO public.rate_limits AS r (key, count, reset_at)
       VALUES ($1, 1, NOW() + make_interval(secs => $2))
       ON CONFLICT (key) DO UPDATE SET
         count    = CASE WHEN r.reset_at <= NOW() THEN 1 ELSE r.count + 1 END,
         reset_at = CASE WHEN r.reset_at <= NOW() THEN NOW() + make_interval(secs => $2) ELSE r.reset_at END
       RETURNING count, GREATEST(0, CEIL(EXTRACT(EPOCH FROM (reset_at - NOW()))))::int AS retry_after`,
      [key, windowMs / 1000]
    );

    // Opportunistic cleanup of expired windows (~1% of calls).
    if (Math.random() < 0.01) {
      query(`DELETE FROM public.rate_limits WHERE reset_at < NOW() - INTERVAL '1 hour'`).catch(() => {});
    }

    const { count, retry_after } = res.rows[0];
    return count > limit
      ? { allowed: false, retryAfterSeconds: Math.max(1, retry_after) }
      : { allowed: true, retryAfterSeconds: 0 };
  } catch (err) {
    console.error("[RateLimit] counter unavailable, allowing request:", (err as Error)?.message);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/** Clear a key after a successful attempt (e.g. correct password). */
export async function resetRateLimit(key: string): Promise<void> {
  await query(`DELETE FROM public.rate_limits WHERE key = $1`, [key]).catch(() => {});
}
