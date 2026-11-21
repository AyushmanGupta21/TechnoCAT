// Server-authoritative PYQ section locking.
//
// Rule: a section (VARC / DILR / QUANT) locks once the student has made 3 attempts in it since
// it was last unlocked, AND those attempts produced at least one weak-area lesson to revise.
// It unlocks automatically when every checklist lesson is completed (topic_progress), which
// records an unlock and starts a fresh 3-attempt cycle. An empty checklist never locks.

import { query } from "@/lib/db";
import type { PYQWeakAreaItem } from "@/data/pyqData";

export const PYQ_SECTIONS = ["VARC", "DILR", "QUANT"] as const;
export type PyqSection = (typeof PYQ_SECTIONS)[number];
export const ATTEMPTS_PER_CYCLE = 3;

export interface SectionLockState {
  attemptsCount: number; // all-time attempts in this section
  cycleAttempts: number; // attempts since the last unlock
  attemptsLeft: number; // before the section locks
  isLocked: boolean;
  weakAreas: (PYQWeakAreaItem & { completed: boolean })[];
  bestScore: number;
  bestPercentage: number;
}

function mergeChecklist(attempts: any[]): PYQWeakAreaItem[] {
  const map = new Map<string, PYQWeakAreaItem>();
  for (const a of attempts) {
    for (const item of Array.isArray(a.weak_areas) ? a.weak_areas : []) {
      if (item?.lessonId && !map.has(item.lessonId)) map.set(item.lessonId, item);
    }
  }
  return [...map.values()];
}

/**
 * Computes lock state for every section and records any unlock that has become due
 * (checklist completed, or nothing to revise). Safe to call on every request.
 */
export async function getSectionLockStates(userId: string): Promise<Record<PyqSection, SectionLockState>> {
  const [attemptsRes, unlocksRes, progressRes] = await Promise.all([
    query(
      `SELECT id, UPPER(section) AS section, score, percentage, weak_areas, completed_at
       FROM public.pyq_attempts WHERE user_id = $1 ORDER BY completed_at ASC`,
      [userId]
    ),
    query(
      `SELECT section, MAX(unlocked_at) AS last_unlock FROM public.pyq_unlocks WHERE user_id = $1 GROUP BY section`,
      [userId]
    ),
    query(`SELECT completed_lessons FROM public.topic_progress WHERE user_id = $1`, [userId]),
  ]);

  const completedLessons = new Set<string>();
  for (const r of progressRes.rows) for (const id of r.completed_lessons || []) completedLessons.add(id);
  const lastUnlock: Record<string, Date> = {};
  for (const r of unlocksRes.rows) lastUnlock[r.section] = new Date(r.last_unlock);

  const states = {} as Record<PyqSection, SectionLockState>;
  for (const section of PYQ_SECTIONS) {
    const all = attemptsRes.rows.filter((a) => a.section === section);
    const since = lastUnlock[section];
    const cycle = since ? all.filter((a) => new Date(a.completed_at) > since) : all;
    const best = all.reduce((b, a) => (Number(a.score) > b.score ? { score: Number(a.score), pct: parseFloat(a.percentage) || 0 } : b), { score: 0, pct: 0 });

    let isLocked = false;
    let weakAreas: SectionLockState["weakAreas"] = [];
    if (cycle.length >= ATTEMPTS_PER_CYCLE) {
      weakAreas = mergeChecklist(cycle).map((w) => ({ ...w, completed: completedLessons.has(w.lessonId) }));
      const outstanding = weakAreas.filter((w) => !w.completed).length;
      if (weakAreas.length === 0 || outstanding === 0) {
        // Nothing (left) to revise: start a new cycle.
        await query(`INSERT INTO public.pyq_unlocks (user_id, section, reason) VALUES ($1, $2, $3)`, [
          userId, section, weakAreas.length === 0 ? "no_checklist" : "checklist_completed",
        ]);
        await query(`UPDATE public.pyq_attempts SET is_locked = FALSE WHERE user_id = $1 AND UPPER(section) = $2 AND is_locked`, [userId, section]);
        weakAreas = [];
      } else {
        isLocked = true;
      }
    }

    const cycleAttempts = isLocked ? cycle.length : cycle.length >= ATTEMPTS_PER_CYCLE ? 0 : cycle.length;
    states[section] = {
      attemptsCount: all.length,
      cycleAttempts,
      attemptsLeft: isLocked ? 0 : ATTEMPTS_PER_CYCLE - cycleAttempts,
      isLocked,
      weakAreas,
      bestScore: best.score,
      bestPercentage: best.pct,
    };
  }
  return states;
}
