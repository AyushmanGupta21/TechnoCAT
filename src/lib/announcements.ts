// Live classes and notices shown on the dashboard (public.announcements, migration 0009).
// Published by staff with scripts/announcements.mjs — never hardcoded in the UI.

import { query } from "@/lib/db";

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
  const notices: Notice[] = [];
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
      notices.push({
        id: r.id, title: r.title, body: r.body, section: r.section, linkUrl: r.link_url,
        publishedAt: new Date(r.publish_at).toISOString(),
      });
    }
  }
  return { liveClasses: liveClasses.slice(0, 5), notices: notices.slice(0, 5), isSample: false };
}

/** Showcase agenda for the demo account (clearly marked as sample data). */
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
    notices: [
      { id: "demo-n1", title: "CAT 2024 Slot 3 PYQ sections are now available", body: "Attempt all three official sections under real exam timing from Browse → Past Papers.", section: "GENERAL", linkUrl: "/browse#pyq-section", publishedAt: at(-1, 10) },
      { id: "demo-n2", title: "Weekly doubt-clearing session moved to Saturday", body: "Join the faculty Q&A and peer discussion thread for Quant & DILR doubts this Saturday at 6:00 PM IST.", section: "DILR", linkUrl: "/intelligence/learning-community", publishedAt: at(-2, 9) },
    ],
  };
}
