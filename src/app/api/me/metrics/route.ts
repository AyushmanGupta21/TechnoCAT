import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { computeStudentMetrics } from "@/lib/metrics/compute";
import { buildDemoMetrics } from "@/lib/metrics/demoFixture";

// GET /api/me/metrics — the single source of every number shown on Dashboard, My Analytics
// and the Intelligence Hub. Real accounts: computed from recorded activity. Demo showcase
// account: the fixture in src/lib/metrics/demoFixture.ts (same shape).

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const metrics = session.isDemo ? buildDemoMetrics() : await computeStudentMetrics(session.userId);
    return NextResponse.json(metrics, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[Metrics API Error]", error);
    return NextResponse.json({ error: "Could not load your metrics" }, { status: 500 });
  }
}
