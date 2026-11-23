// Notification feed derived from the student's real data (server-only).
//
// Nothing here is stored: every item is computed on request from study tasks, quiz attempts,
// the points ledger and staff announcements. Each item has a stable id so the client can keep
// read/dismissed state in localStorage. Only the demo account gets sample items (isSample).

import { query } from "@/lib/db";
import { getActiveAnnouncements } from "@/lib/announcements";

export type ServerNotificationType = "task" | "live_class" | "notice" | "quiz" | "mock" | "points" | "system";

export interface ServerNotification {
  id: string;
  type: ServerNotificationType;
  category: "mocks" | "learning";
  title: string;
  desc: string;
  createdAt: string; // ISO timestamp
  actionUrl: string;
  actionLabel: string;
  priority: "urgent" | "normal" | "low";
  isSample?: boolean;
}

// Students are in India; "today" for study tasks follows IST regardless of server timezone.
const TODAY_IST = `(NOW() AT TIME ZONE 'Asia/Kolkata')::date`;

const POINT_REASON_LABELS: Record<string, string> = {
  lesson_completed: "completing a lesson",
  module_quiz_passed: "passing a module quiz",
  grand_quiz_passed: "passing a grand quiz",
  pyq_attempt: "attempting a past-paper section",
};

async function safe<T>(label: string, fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[notifications] ${label} failed:`, err);
    return [];
  }
}

async function taskNotifications(userId: string): Promise<ServerNotification[]> {
  const res = await query<{ overdue: number; oldest: string | null; due_today: number; first_title: string | null; today: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE task_date < ${TODAY_IST})::int AS overdue,
       MIN(task_date) FILTER (WHERE task_date < ${TODAY_IST})::text AS oldest,
       COUNT(*) FILTER (WHERE task_date = ${TODAY_IST})::int AS due_today,
       (ARRAY_AGG(title ORDER BY created_at) FILTER (WHERE task_date = ${TODAY_IST}))[1] AS first_title,
       ${TODAY_IST}::text AS today
     FROM public.study_tasks
     WHERE user_id = $1
       AND COALESCE(is_completed, false) = false
       AND task_date <= ${TODAY_IST}
       AND task_date >= ${TODAY_IST} - 14`,
    [userId]
  );
  const r = res.rows[0];
  if (!r) return [];
  const out: ServerNotification[] = [];
  const createdAt = new Date(`${r.today}T00:00:00+05:30`).toISOString();
  if (r.due_today > 0) {
    out.push({
      id: `task-today-${r.today}`,
      type: "task",
      category: "learning",
      title: `${r.due_today} study task${r.due_today > 1 ? "s" : ""} due today`,
      desc: r.first_title
        ? `Next up: ${r.first_title}${r.due_today > 1 ? ` and ${r.due_today - 1} more` : ""}.`
        : "Open your schedule to see today's plan.",
      createdAt,
      actionUrl: "/dashboard",
      actionLabel: "View Tasks",
      priority: "normal",
    });
  }
  if (r.overdue > 0) {
    out.push({
      id: `task-overdue-${r.today}`,
      type: "task",
      category: "learning",
      title: `${r.overdue} overdue study task${r.overdue > 1 ? "s" : ""}`,
      desc: `Pending since ${r.oldest ?? "earlier this week"}. Catch up to stay on track.`,
      createdAt,
      actionUrl: "/dashboard",
      actionLabel: "Catch Up",
      priority: "urgent",
    });
  }
  return out;
}

async function attemptNotifications(userId: string): Promise<ServerNotification[]> {
  const res = await query<{
    id: string; kind: string; module_key: string | null; source_ref: string | null; topic_id: string | null;
    percentage: string | number; passed: boolean | null; submitted_at: string;
  }>(
    `SELECT id, kind, module_key, source_ref, topic_id, percentage, passed, submitted_at
     FROM public.quiz_attempts
     WHERE user_id = $1 AND submitted_at >= NOW() - INTERVAL '3 days'
     ORDER BY submitted_at DESC
     LIMIT 5`,
    [userId]
  );
  return res.rows.map((r) => {
    const pct = Math.round(Number(r.percentage) || 0);
    const isPyq = r.kind === "pyq";
    const name = isPyq
      ? (r.source_ref || "").replace(/^CAT-(\d{4})-(.+)-(VARC|DILR|QUANT|QA)$/, (_m, y, slot, sec) => `CAT ${y} ${slot} · ${sec === "QUANT" ? "QA" : sec}`) || "Past paper section"
      : r.kind === "grand_quiz"
      ? "Grand quiz"
      : r.kind === "module_quiz"
      ? r.module_key || "Module quiz"
      : r.kind === "lesson_practice"
      ? "Lesson practice"
      : "Topic drill";
    const verdict = r.passed === true ? " — passed" : r.passed === false ? " — not passed yet" : "";
    return {
      id: `attempt-${r.id}`,
      type: isPyq ? "mock" : "quiz",
      category: isPyq ? "mocks" : "learning",
      title: `${isPyq ? "Result" : "Quiz result"}: ${name}`,
      desc: `You scored ${pct}%${verdict}.`,
      createdAt: new Date(r.submitted_at).toISOString(),
      actionUrl: isPyq ? "/analytics" : r.topic_id ? `/topics/${r.topic_id}` : "/analytics",
      actionLabel: isPyq ? "View Analytics" : "Review",
      priority: r.passed === false ? "urgent" : "normal",
    } satisfies ServerNotification;
  });
}

async function pointsNotifications(userId: string): Promise<ServerNotification[]> {
  const res = await query<{ id: string; points: number; reason: string; created_at: string }>(
    `SELECT id::text AS id, points, reason, created_at
     FROM public.points_ledger
     WHERE user_id = $1 AND points > 0 AND reason <> 'legacy_balance'
       AND created_at >= NOW() - INTERVAL '3 days'
     ORDER BY created_at DESC
     LIMIT 5`,
    [userId]
  );
  return res.rows.map((r) => ({
    id: `points-${r.id}`,
    type: "points",
    category: "learning",
    title: `+${r.points} points earned`,
    desc: `Awarded for ${POINT_REASON_LABELS[r.reason] ?? r.reason.replace(/_/g, " ")}.`,
    createdAt: new Date(r.created_at).toISOString(),
    actionUrl: "/analytics",
    actionLabel: "View Standing",
    priority: "low",
  }));
}

async function announcementNotifications(): Promise<ServerNotification[]> {
  const { liveClasses, notices } = await getActiveAnnouncements();
  const out: ServerNotification[] = [];
  const horizon = Date.now() + 2 * 24 * 3600_000;
  for (const c of liveClasses) {
    const start = new Date(c.startsAt).getTime();
    if (!c.isLive && start > horizon) continue;
    const when = new Date(c.startsAt).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
    });
    out.push({
      id: `live-${c.id}`,
      type: "live_class",
      category: "learning",
      title: c.isLive ? `Live now: ${c.title}` : `Upcoming live class: ${c.title}`,
      desc: `${c.isLive ? "Started" : "Starts"} ${when} IST${c.host ? ` with ${c.host}` : ""}.`,
      // Upcoming classes sort near the top; published time isn't tracked for them.
      createdAt: new Date(Math.min(Date.now(), start)).toISOString(),
      actionUrl: c.linkUrl || "/dashboard",
      actionLabel: c.isLive ? "Join" : "View",
      priority: c.isLive ? "urgent" : "normal",
    });
  }
  for (const n of notices) {
    out.push({
      id: `notice-${n.id}`,
      type: "notice",
      category: "learning",
      title: n.title,
      desc: n.body || "New notice from the TechnoCAT team.",
      createdAt: n.publishedAt,
      actionUrl: n.linkUrl || "/dashboard",
      actionLabel: "Open",
      priority: "normal",
    });
  }
  return out;
}

/** Build the notification feed for a real (non-demo) account from its own data. */
export async function getUserNotifications(userId: string): Promise<ServerNotification[]> {
  const groups = await Promise.all([
    safe("tasks", () => taskNotifications(userId)),
    safe("attempts", () => attemptNotifications(userId)),
    safe("points", () => pointsNotifications(userId)),
    safe("announcements", () => announcementNotifications()),
  ]);
  return groups
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30);
}

/** Showcase feed for the demo account only — every item is flagged isSample. */
export function getDemoNotifications(): ServerNotification[] {
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
  const day = new Date().toISOString().slice(0, 10);
  const items: Omit<ServerNotification, "isSample">[] = [
    { id: `demo-task-today-${day}`, type: "task", category: "learning", title: "3 study tasks due today", desc: "Next up: Percentages speed drill and 2 more.", createdAt: ago(15), actionUrl: "/dashboard", actionLabel: "View Tasks", priority: "normal" },
    { id: "demo-live-dilr", type: "live_class", category: "learning", title: "Upcoming live class: DILR Games & Tournaments", desc: "Starts today 7:30 PM IST with TechnoCAT Faculty.", createdAt: ago(60), actionUrl: "/dashboard", actionLabel: "View", priority: "normal" },
    { id: "demo-attempt-pyq", type: "mock", category: "mocks", title: "Result: CAT 2024 Slot 1 · VARC", desc: "You scored 72% — passed.", createdAt: ago(180), actionUrl: "/analytics", actionLabel: "View Analytics", priority: "normal" },
    { id: "demo-points", type: "points", category: "learning", title: "+20 points earned", desc: "Awarded for passing a module quiz.", createdAt: ago(60 * 26), actionUrl: "/analytics", actionLabel: "View Standing", priority: "low" },
  ];
  return items.map((n) => ({ ...n, isSample: true }));
}
