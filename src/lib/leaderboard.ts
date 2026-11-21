// Points leaderboard built from public.points_ledger. Students appear as "First L." unless
// they opted out (profiles.leaderboard_opt_out); the demo showcase account is never ranked.

import { query } from "@/lib/db";
import { DEMO_EMAIL } from "@/lib/demo";
import { resolveStudentName, sanitizeAvatarUrl } from "@/lib/nameUtils";

export type LeaderboardPeriod = "week" | "all";

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  points: number;
  isCurrentUser: boolean;
}

export interface Leaderboard {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null; // the requesting student, even if outside the top N
  participants: number;
  optedOut: boolean;
  isSample: boolean; // true only for the demo showcase
}

/** "Priya Sharma" -> "Priya S." (privacy-preserving public name). */
export function publicName(fullName: string | null | undefined, email: string): string {
  const parts = resolveStudentName(fullName, email).trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

export async function getLeaderboard(userId: string, period: LeaderboardPeriod, limit = 10): Promise<Leaderboard> {
  // "week" = points earned in the last 7 days (carried-over legacy balances excluded).
  const windowFilter =
    period === "week" ? `AND l.created_at >= NOW() - INTERVAL '7 days' AND l.reason <> 'legacy_balance'` : "";

  const res = await query(
    `WITH totals AS (
       SELECT p.id, p.full_name, p.email, p.avatar_url, SUM(l.points)::int AS points
       FROM public.points_ledger l
       JOIN public.profiles p ON p.id = l.user_id
       WHERE NOT p.leaderboard_opt_out AND lower(p.email) <> $1 ${windowFilter}
       GROUP BY p.id
       HAVING SUM(l.points) > 0
     ), ranked AS (
       SELECT *, RANK() OVER (ORDER BY points DESC) AS rank, COUNT(*) OVER () AS participants FROM totals
     )
     SELECT * FROM ranked WHERE rank <= $2 OR id = $3 ORDER BY rank, full_name`,
    [DEMO_EMAIL, limit, userId]
  );

  const optOut = await query(`SELECT leaderboard_opt_out FROM public.profiles WHERE id = $1`, [userId]);
  const toEntry = (r: any): LeaderboardEntry => ({
    rank: Number(r.rank),
    displayName: publicName(r.full_name, r.email),
    avatarUrl: sanitizeAvatarUrl(r.avatar_url),
    points: r.points,
    isCurrentUser: r.id === userId,
  });

  const rows = res.rows;
  return {
    period,
    entries: rows.filter((r) => Number(r.rank) <= limit).map(toEntry),
    me: rows.find((r) => r.id === userId) ? toEntry(rows.find((r) => r.id === userId)) : null,
    participants: Number(rows[0]?.participants ?? 0),
    optedOut: Boolean(optOut.rows[0]?.leaderboard_opt_out),
    isSample: false,
  };
}

/** Showcase leaderboard for the demo account (clearly marked as sample data). */
export function getDemoLeaderboard(period: LeaderboardPeriod): Leaderboard {
  const base = period === "week"
    ? [["Ananya R.", 640], ["Rohit M.", 585], ["Student", 520], ["Kavya S.", 470], ["Arjun P.", 415]]
    : [["Rohit M.", 2480], ["Ananya R.", 2210], ["Kavya S.", 1990], ["Student", 1860], ["Arjun P.", 1640]];
  const entries = base.map(([name, points], i) => ({
    rank: i + 1, displayName: String(name), avatarUrl: null, points: Number(points), isCurrentUser: name === "Student",
  }));
  return { period, entries, me: entries.find((e) => e.isCurrentUser) ?? null, participants: 248, optedOut: false, isSample: true };
}
