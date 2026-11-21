// Real study time (public.study_activity, migration 0008). Seconds accumulate per
// student, day (app timezone), activity kind and reference (lesson id / quiz source).

import { query, type Queryable } from "@/lib/db";
import { todayInAppTz } from "@/lib/time";

export type ActivityKind = "lesson" | "quiz" | "pyq" | "practice";

/** Hard cap per student per day, to keep a stuck tab from inflating stats. */
export const MAX_SECONDS_PER_DAY = 16 * 60 * 60;

export async function recordStudyTime(
  userId: string,
  entry: { kind: ActivityKind; ref?: string; topicId?: string | null; seconds: number },
  db: Queryable = { query }
): Promise<number> {
  const seconds = Math.max(0, Math.floor(entry.seconds));
  if (seconds === 0) return 0;
  const date = todayInAppTz();

  // Respect the daily cap across all activity kinds.
  const used = await db.query(
    `SELECT COALESCE(SUM(seconds), 0)::int AS used FROM public.study_activity WHERE user_id = $1 AND activity_date = $2`,
    [userId, date]
  );
  const allowed = Math.min(seconds, Math.max(0, MAX_SECONDS_PER_DAY - (used.rows[0]?.used ?? 0)));
  if (allowed === 0) return 0;

  await db.query(
    `INSERT INTO public.study_activity (user_id, activity_date, kind, ref, topic_id, seconds)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, activity_date, kind, ref)
     DO UPDATE SET seconds = public.study_activity.seconds + EXCLUDED.seconds, updated_at = NOW()`,
    [userId, date, entry.kind, (entry.ref || "").slice(0, 200), entry.topicId ?? null, allowed]
  );
  return allowed;
}
