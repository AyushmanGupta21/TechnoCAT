// Points / XP: every award is a row in public.points_ledger (migration 0008).
// (user, reason, ref) is unique, so awarding the same achievement twice is a no-op.

import { query, type Queryable } from "@/lib/db";

/** The only place point values are defined. UI copy should read from here. */
export const POINT_RULES = {
  lesson_completed: 10, // per lesson, once
  module_quiz_passed: 50, // per module, once
  grand_quiz_passed: 100, // per topic, once
  pyq_attempt: 20, // per submitted PYQ section attempt
} as const;

export type PointReason = keyof typeof POINT_RULES;

/** Award points once for (reason, ref). Returns the points credited (0 if already awarded). */
export async function awardPoints(
  userId: string,
  reason: PointReason,
  ref: string,
  db: Queryable = { query }
): Promise<number> {
  const points = POINT_RULES[reason];
  const res = await db.query(
    `INSERT INTO public.points_ledger (user_id, points, reason, ref)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, reason, ref) DO NOTHING
     RETURNING points`,
    [userId, points, reason, ref]
  );
  return res.rows.length ? points : 0;
}

export async function getPointsTotal(userId: string): Promise<number> {
  const res = await query<{ total: number }>(
    `SELECT COALESCE(SUM(points), 0)::int AS total FROM public.points_ledger WHERE user_id = $1`,
    [userId]
  );
  return res.rows[0]?.total ?? 0;
}
