import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.userId;

    // Table: db/migrations/0002_intelligence_and_community_tables.sql
    await query(`INSERT INTO public.analysis_views (user_id) VALUES ($1)`, [userId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Record Analysis View API Error]", error);
    return NextResponse.json({ error: "Failed to record analysis view" }, { status: 500 });
  }
}
