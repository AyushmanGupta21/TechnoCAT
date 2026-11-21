import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/auth/rateLimit";
import {
  gradeAttempt,
  loadExtraKeys,
  recordQuizAttempt,
  getAttemptSummary,
  AttemptValidationError,
  QUIZ_KINDS,
  type QuizKind,
} from "@/lib/quiz/attempts";

// POST: submit a quiz attempt (graded on the server). GET: attempt history / module status.

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const limit = await consumeRateLimit(`quiz-submit:${session.userId}`, 60, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    // The demo account is a shared showcase: grade the attempt but never store it.
    if (session.isDemo) {
      const graded = gradeAttempt(body, await loadExtraKeys(body));
      return NextResponse.json({ success: true, recorded: false, attempt: { attemptId: null, pointsAwarded: 0, ...graded } });
    }
    const result = await recordQuizAttempt(session.userId, body);
    return NextResponse.json({ success: true, attempt: result });
  } catch (error) {
    if (error instanceof AttemptValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[Quiz Attempt API Error]", error);
    return NextResponse.json({ error: "Failed to save your attempt" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const topicId = request.nextUrl.searchParams.get("topicId") || undefined;
  const kindParam = request.nextUrl.searchParams.get("kind");
  const kind = kindParam && (QUIZ_KINDS as readonly string[]).includes(kindParam) ? (kindParam as QuizKind) : undefined;

  try {
    return NextResponse.json({ success: true, ...(await getAttemptSummary(session.userId, { topicId, kind })) });
  } catch (error) {
    console.error("[Quiz Attempt API Error]", error);
    return NextResponse.json({ error: "Failed to load attempts" }, { status: 500 });
  }
}
