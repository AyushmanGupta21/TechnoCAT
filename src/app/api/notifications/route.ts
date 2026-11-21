import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { getDemoNotifications, getUserNotifications } from "@/lib/notifications";

// GET  /api/notifications — feed derived from the student's real data (study tasks, quiz attempts,
//      points, announcements) plus the read / dismissed state saved for this account.
// POST /api/notifications { action: "read" | "dismiss", ids: string[] } — saves that state so it
//      follows the student across devices. Demo account gets flagged sample items, nothing stored.

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    if (session.isDemo) {
      return NextResponse.json({ items: getDemoNotifications(), isSample: true, state: { readIds: [], dismissedIds: [] } });
    }
    const [items, stateRes] = await Promise.all([
      getUserNotifications(session.userId),
      query(
        `SELECT notification_id, read_at, dismissed_at FROM public.notification_states
         WHERE user_id = $1 AND COALESCE(dismissed_at, read_at) > NOW() - INTERVAL '30 days'`,
        [session.userId]
      ),
    ]);
    const state = {
      readIds: stateRes.rows.filter((r) => r.read_at).map((r) => r.notification_id),
      dismissedIds: stateRes.rows.filter((r) => r.dismissed_at).map((r) => r.notification_id),
    };
    return NextResponse.json({ items, isSample: false, state }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[Notifications API Error]", error);
    return NextResponse.json({ error: "Could not load notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.isDemo) return NextResponse.json({ success: true, stored: false });

  const body = await request.json().catch(() => ({}));
  const action = body?.action === "dismiss" ? "dismiss" : body?.action === "read" ? "read" : null;
  const ids: string[] = Array.isArray(body?.ids)
    ? [...new Set(body.ids.filter((x: unknown) => typeof x === "string" && x.length > 0 && x.length <= 200))].slice(0, 100) as string[]
    : [];
  if (!action || ids.length === 0) return NextResponse.json({ error: "action and ids are required" }, { status: 400 });

  try {
    const column = action === "read" ? "read_at" : "dismissed_at";
    await query(
      `INSERT INTO public.notification_states (user_id, notification_id, ${column})
       SELECT $1, id, NOW() FROM UNNEST($2::text[]) AS id
       ON CONFLICT (user_id, notification_id) DO UPDATE SET ${column} = COALESCE(public.notification_states.${column}, NOW())`,
      [session.userId, ids]
    );
    return NextResponse.json({ success: true, stored: true });
  } catch (error) {
    console.error("[Notifications API Error]", error);
    return NextResponse.json({ error: "Could not save notification state" }, { status: 500 });
  }
}
