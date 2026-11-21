import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDemoNotifications, getUserNotifications } from "@/lib/notifications";

// GET /api/notifications — notification feed derived from the signed-in student's real data
// (study tasks, quiz attempts, points, announcements). Demo account gets flagged sample items.

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const items = session.isDemo ? getDemoNotifications() : await getUserNotifications(session.userId);
    return NextResponse.json(
      { items, isSample: session.isDemo },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[Notifications API Error]", error);
    return NextResponse.json({ error: "Could not load notifications" }, { status: 500 });
  }
}
