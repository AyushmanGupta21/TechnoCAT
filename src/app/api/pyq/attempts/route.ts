import { NextRequest, NextResponse } from "next/server";
import { savePYQAttempt, getPYQAttempts } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getPYQQuestions, generateWeakAreaChecklist } from "@/data/pyqData";
import { gradeAttempt } from "@/lib/quiz/attempts";
import { getSectionLockStates, PYQ_SECTIONS, ATTEMPTS_PER_CYCLE, type PyqSection } from "@/lib/pyq/locks";

// PYQ section attempts. Locking is enforced HERE (not in the browser) — see src/lib/pyq/locks.ts.

/** Shape the existing UI expects; attemptsCount = attempts used in the current 3-attempt cycle. */
function toSectionStats(states: Awaited<ReturnType<typeof getSectionLockStates>>) {
  const out: Record<string, unknown> = {};
  for (const s of PYQ_SECTIONS) {
    const st = states[s];
    out[s] = {
      attemptsCount: st.cycleAttempts,
      totalAttempts: st.attemptsCount,
      attemptsLeft: st.attemptsLeft,
      maxAttempts: ATTEMPTS_PER_CYCLE,
      isLocked: st.isLocked,
      weakAreas: st.weakAreas,
      bestScore: st.bestScore,
      bestPercentage: st.bestPercentage,
    };
  }
  return out;
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || undefined;
    const yearStr = searchParams.get("year");
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    const [attempts, states] = await Promise.all([
      getPYQAttempts(session.userId, section, year),
      getSectionLockStates(session.userId),
    ]);
    return NextResponse.json({ success: true, attempts, sectionStats: toSectionStats(states) });
  } catch (error) {
    console.error("[PYQ Attempts GET Error]", error);
    return NextResponse.json({ error: "Failed to fetch PYQ attempts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const year = Number(body?.year);
    const slot = typeof body?.slot === "string" ? body.slot : "";
    const section = String(body?.section || "").toUpperCase() as PyqSection;
    if (!year || !slot || !PYQ_SECTIONS.includes(section)) {
      return NextResponse.json({ error: "Missing or invalid year, slot or section" }, { status: 400 });
    }

    const questions = getPYQQuestions(year, slot, section);
    if (questions.length === 0) return NextResponse.json({ error: "Unknown paper" }, { status: 400 });

    const before = await getSectionLockStates(session.userId);
    if (before[section].isLocked) {
      return NextResponse.json(
        { error: `${section} is locked. Complete the weak-area lessons to unlock it.`, sectionStats: toSectionStats(before) },
        { status: 423 }
      );
    }

    // Grade on the server from the answer key (answers are keyed by question position).
    const answers: Record<string, unknown> = body?.answers && typeof body.answers === "object" ? body.answers : {};
    const graded = gradeAttempt({
      kind: "pyq",
      section,
      sourceRef: `CAT-${year}-${slot}-${section}`,
      durationSeconds: Number(body?.timeTakenSeconds) || 0,
      strikes: Number(body?.strikes) || 0,
      responses: questions.map((q, i) => {
        const v = answers[i];
        return q.type === "TITA"
          ? { questionId: q.id, titaAnswer: typeof v === "string" || typeof v === "number" ? String(v) : null }
          : { questionId: q.id, selectedOption: typeof v === "number" ? v : null };
      }),
    });

    const missed = questions.filter((_q, i) => !graded.responses[i].isCorrect);
    const weakAreas = generateWeakAreaChecklist(missed);
    const r = graded.responses;
    const count = (type: "MCQ" | "TITA", correct: boolean) =>
      r.filter((x) => x.questionType === type && x.isAttempted && x.isCorrect === correct).length;

    const saved = await savePYQAttempt({
      userId: session.userId,
      year,
      slot,
      section,
      attemptNum: before[section].cycleAttempts + 1,
      score: graded.finalScore,
      total: graded.maxScore,
      percentage: graded.percentage,
      mcqCorrect: count("MCQ", true),
      mcqWrong: count("MCQ", false),
      titaCorrect: count("TITA", true),
      titaWrong: count("TITA", false),
      unattempted: r.filter((x) => !x.isAttempted).length,
      strikes: graded.strikes,
      timeTakenSeconds: graded.durationSeconds,
      answers,
      analysis: {}, // full analysis lives in quiz_attempts / quiz_responses
      isLocked: false,
      weakAreas,
    });

    const after = await getSectionLockStates(session.userId);
    return NextResponse.json({
      success: true,
      attempt: saved,
      score: graded.finalScore,
      total: graded.maxScore,
      percentage: graded.percentage,
      isLocked: after[section].isLocked,
      sectionStats: toSectionStats(after),
    });
  } catch (error) {
    console.error("[PYQ Attempts POST Error]", error);
    return NextResponse.json({ error: "Failed to save PYQ attempt" }, { status: 500 });
  }
}

// PATCH: re-evaluate locks (e.g. after finishing checklist lessons). Clients cannot force-unlock.
export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ success: true, sectionStats: toSectionStats(await getSectionLockStates(session.userId)) });
  } catch (error) {
    console.error("[PYQ Attempts PATCH Error]", error);
    return NextResponse.json({ error: "Failed to update PYQ status" }, { status: 500 });
  }
}
