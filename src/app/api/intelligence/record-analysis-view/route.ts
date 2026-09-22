import { NextRequest, NextResponse } from "next/server";
import { getProfileByEmail, query } from "@/lib/db";

const FALLBACK_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(request: NextRequest) {
  try {
    let userId = request.cookies.get("technocat_user_id")?.value;

    if (!userId) {
      const defaultUser = await getProfileByEmail("student@technocat.edu");
      userId = defaultUser?.id || FALLBACK_USER_ID;
    }

    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS public.analysis_views (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `, []);

    // Record the view
    await query(`INSERT INTO public.analysis_views (user_id) VALUES ($1)`, [userId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Record Analysis View API Error]", error);
    return NextResponse.json({ error: "Failed to record analysis view" }, { status: 500 });
  }
}
