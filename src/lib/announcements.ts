// Live classes and notices shown on the dashboard (public.announcements, migration 0009).
// Staff-published notices always appear first; date-keyed daily rotating CAT prep notices
// keep the board fresh with a new message each day in Asia/Kolkata time.

import { query } from "@/lib/db";
import { addDays, todayInAppTz } from "@/lib/time";

export interface LiveClass {
  id: string;
  title: string;
  body: string | null;
  section: string | null;
  host: string | null;
  linkUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  isLive: boolean;
}

export interface Notice {
  id: string;
  title: string;
  body: string | null;
  section: string | null;
  linkUrl: string | null;
  publishedAt: string;
}

export interface Announcements {
  liveClasses: LiveClass[];
  notices: Notice[];
  isSample: boolean;
}

interface DailyNoticeTemplate {
  title: string;
  body: string;
  section: "QA" | "DILR" | "VARC" | "GENERAL";
  linkUrl: string;
}

const DAILY_NOTICE_POOL: DailyNoticeTemplate[] = [
  {
    title: "CAT 2024 Slot 3 PYQ sections are now live",
    body: "Attempt all three official sections under real 40-minute exam timing from Browse → Past Papers.",
    section: "GENERAL",
    linkUrl: "/browse#pyq-section",
  },
  {
    title: "DILR Set Selection: Games & Tournaments focus",
    body: "Review elimination shortcuts and matrix frameworks to pick high-yield DILR sets faster.",
    section: "DILR",
    linkUrl: "/topics/dilr-data-interpretation",
  },
  {
    title: "Arithmetic & Percentages speed drill ready",
    body: "Strengthen your highest-weightage Quant module with concept lectures and module quizzes.",
    section: "QA",
    linkUrl: "/topics/qa-quantitative-ability",
  },
  {
    title: "Reading Comprehension inference practice",
    body: "Sharpen tone, main-idea, and elimination techniques with curated VARC video lessons.",
    section: "VARC",
    linkUrl: "/topics/varc-verbal-ability",
  },
  {
    title: "Check your weekly CAT Readiness & Percentile",
    body: "Inspect your Concepts, Accuracy, Speed, and Consistency breakdown in Intelligence Hub.",
    section: "GENERAL",
    linkUrl: "/intelligence",
  },
  {
    title: "Turn past wrong answers into quick score gains",
    body: "Open Error Tracking to audit your most frequent mistake patterns across PYQs and quizzes.",
    section: "GENERAL",
    linkUrl: "/intelligence/error-tracking",
  },
  {
    title: "Number System & Divisibility revision sprint",
    body: "Revisit remainders, cyclicity, and factorials to avoid negative marking in Quant.",
    section: "QA",
    linkUrl: "/topics/qa-quantitative-ability",
  },
  {
    title: "Compare your target IIM & B-School cutoffs",
    body: "Use the B-School Predictor to map your current mock score against top MBA programs.",
    section: "GENERAL",
    linkUrl: "/intelligence/b-school-predictor",
  },
  {
    title: "Master Venn Diagrams & Arrangement sets",
    body: "Practice multi-constraint seating and set-theory puzzles from the DILR curriculum.",
    section: "DILR",
    linkUrl: "/topics/dilr-data-interpretation",
  },
  {
    title: "Practice GD-PI & WAT delivery in Speak & Assess",
    body: "Record a 60-second answer and get instant AI feedback on pace, clarity, and structure.",
    section: "GENERAL",
    linkUrl: "/mock-viva-prep",
  },
  {
    title: "Para Jumbles & Odd-One-Out accuracy boost",
    body: "Practice TITA verbal questions with zero negative marking to add reliable VARC marks.",
    section: "VARC",
    linkUrl: "/topics/varc-verbal-ability",
  },
  {
    title: "Review your Performance Analysis trends",
    body: "Track your score trajectory, accuracy per section, and time-per-question pacing.",
    section: "GENERAL",
    linkUrl: "/intelligence/ai-analysis",
  },
  {
    title: "Algebra & Quadratic Equations checkpoint",
    body: "Complete the Algebra lessons and pass the module quiz to lock in core Quant concepts.",
    section: "QA",
    linkUrl: "/topics/qa-quantitative-ability",
  },
  {
    title: "Join peer strategy threads in Learning Community",
    body: "Share mock takeaways, ask tough questions, and exchange shortcuts with fellow CAT aspirants.",
    section: "GENERAL",
    linkUrl: "/intelligence/learning-community",
  },
];

function ymdToEpochDay(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function istMorningIso(ymd: string, hourIst = 9): string {
  const [y, m, d] = ymd.split("-").map(Number);
  // IST is UTC+5:30 -> subtract 5h 30m from wall-clock IST to get UTC
  return new Date(Date.UTC(y, m - 1, d, hourIst - 5, -30, 0)).toISOString();
}

/**
 * Generates date-keyed daily rotating notices so a brand-new message appears each day
 * (in Asia/Kolkata time), along with the previous days' recent updates.
 */
export function getDailyRotatingNotices(count = 3): Notice[] {
  const today = todayInAppTz();
  const poolLen = DAILY_NOTICE_POOL.length;
  const result: Notice[] = [];

  for (let offset = 0; offset < count; offset++) {
    const dateStr = addDays(today, -offset);
    const dayNumber = ymdToEpochDay(dateStr);
    const idx = ((dayNumber % poolLen) + poolLen) % poolLen;
    const tpl = DAILY_NOTICE_POOL[idx];
    result.push({
      id: `daily-notice-${dateStr}`,
      title: tpl.title,
      body: tpl.body,
      section: tpl.section,
      linkUrl: tpl.linkUrl,
      publishedAt: istMorningIso(dateStr, 9),
    });
  }

  return result;
}

export async function getActiveAnnouncements(): Promise<Announcements> {
  const res = await query(
    `SELECT id, kind, title, body, section, host, link_url, starts_at, ends_at, publish_at
     FROM public.announcements
     WHERE publish_at <= NOW()
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (kind = 'notice' OR COALESCE(ends_at, starts_at + INTERVAL '2 hours') > NOW())
     ORDER BY CASE WHEN kind = 'live_class' THEN starts_at END ASC NULLS LAST, publish_at DESC
     LIMIT 20`
  );
  const now = Date.now();
  const liveClasses: LiveClass[] = [];
  const staffNotices: Notice[] = [];
  for (const r of res.rows) {
    if (r.kind === "live_class") {
      const start = new Date(r.starts_at).getTime();
      const end = r.ends_at ? new Date(r.ends_at).getTime() : start + 2 * 3600_000;
      liveClasses.push({
        id: r.id, title: r.title, body: r.body, section: r.section, host: r.host, linkUrl: r.link_url,
        startsAt: new Date(r.starts_at).toISOString(), endsAt: r.ends_at ? new Date(r.ends_at).toISOString() : null,
        isLive: now >= start && now < end,
      });
    } else {
      staffNotices.push({
        id: r.id, title: r.title, body: r.body, section: r.section, linkUrl: r.link_url,
        publishedAt: new Date(r.publish_at).toISOString(),
      });
    }
  }

  // Staff-published notices take top priority; daily rotating CAT notices keep the board fresh each day.
  const dailyNotices = getDailyRotatingNotices(3);
  const seenTitles = new Set(staffNotices.map((n) => n.title.toLowerCase()));
  const mergedNotices: Notice[] = [
    ...staffNotices,
    ...dailyNotices.filter((n) => !seenTitles.has(n.title.toLowerCase())),
  ].slice(0, 4);

  return { liveClasses: liveClasses.slice(0, 5), notices: mergedNotices, isSample: false };
}

/** Showcase agenda for the demo account (uses the same daily rotating notices). */
export function getDemoAnnouncements(): Announcements {
  const at = (days: number, hour: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + days);
    d.setUTCHours(hour - 5, 30, 0, 0); // hour in IST
    return d.toISOString();
  };
  return {
    isSample: true,
    liveClasses: [
      { id: "demo-1", title: "DILR: Games & Tournaments set selection", body: "Live problem-solving on 4 recent CAT sets.", section: "DILR", host: "TechnoCAT Faculty", linkUrl: null, startsAt: at(0, 19), endsAt: at(0, 20), isLive: false },
      { id: "demo-2", title: "QA: Permutations & Combinations crash course", body: null, section: "QA", host: "TechnoCAT Faculty", linkUrl: null, startsAt: at(1, 18), endsAt: at(1, 19), isLive: false },
      { id: "demo-3", title: "VARC: Para jumble strategies", body: null, section: "VARC", host: "TechnoCAT Faculty", linkUrl: null, startsAt: at(3, 17), endsAt: at(3, 18), isLive: false },
    ],
    notices: getDailyRotatingNotices(3),
  };
}
