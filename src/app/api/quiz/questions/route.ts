import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { getQuestionDetail } from "@/lib/quiz/questionBank";

// GET /api/quiz/questions?ids=a,b,c — question text, options, answer and explanation for
// review screens (error tracking, analysis). Only questions the student has ALREADY answered
// are returned, so this cannot be used to fetch answer keys before taking a quiz.

const MAX_IDS = 100;

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const ids = [...new Set((request.nextUrl.searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean))].slice(0, MAX_IDS);
  if (ids.length === 0) return NextResponse.json({ questions: {} });

  try {
    let allowed: Set<string>;
    if (session.isDemo) {
      // Shared showcase account: only public past-year-paper questions (never module answer keys).
      allowed = new Set(ids.filter((id) => id.startsWith("CAT-")));
    } else {
      const res = await query(
        `SELECT DISTINCT r.question_id FROM public.quiz_responses r JOIN public.quiz_attempts a ON a.id = r.attempt_id
         WHERE a.user_id = $1 AND r.question_id = ANY($2::text[])`,
        [session.userId, ids]
      );
      allowed = new Set(res.rows.map((r) => r.question_id));
    }
    const questions: Record<string, ReturnType<typeof getQuestionDetail>> = {};
    for (const id of ids) if (allowed.has(id)) questions[id] = getQuestionDetail(id);
    return NextResponse.json({ questions }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    console.error("[Quiz Questions API Error]", error);
    return NextResponse.json({ error: "Could not load questions" }, { status: 500 });
  }
}
