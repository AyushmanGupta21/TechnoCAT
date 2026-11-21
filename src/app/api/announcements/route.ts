import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getActiveAnnouncements, getDemoAnnouncements } from "@/lib/announcements";

// GET /api/announcements — upcoming live classes and current notices published by staff.

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const data = session.isDemo ? getDemoAnnouncements() : await getActiveAnnouncements();
    return NextResponse.json(data, { headers: { "Cache-Control": "private, max-age=120" } });
  } catch (error) {
    console.error("[Announcements API Error]", error);
    return NextResponse.json({ error: "Could not load announcements" }, { status: 500 });
  }
}
