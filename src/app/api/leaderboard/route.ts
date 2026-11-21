import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getLeaderboard, getDemoLeaderboard, type LeaderboardPeriod } from "@/lib/leaderboard";

// GET /api/leaderboard?period=week|all — real points ranking (privacy: "First L.", opt-out).

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const period: LeaderboardPeriod = request.nextUrl.searchParams.get("period") === "all" ? "all" : "week";
  try {
    const board = session.isDemo ? getDemoLeaderboard(period) : await getLeaderboard(session.userId, period);
    return NextResponse.json(board, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    console.error("[Leaderboard API Error]", error);
    return NextResponse.json({ error: "Could not load the leaderboard" }, { status: 500 });
  }
}
