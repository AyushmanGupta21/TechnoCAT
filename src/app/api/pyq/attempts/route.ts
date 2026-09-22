import { NextRequest, NextResponse } from "next/server";
import { query, getProfileByEmail, savePYQAttempt, getPYQAttempts, unlockPYQSubject } from "@/lib/db";

async function resolveUserId(request: NextRequest): Promise<string | null> {
  let userId = request.cookies.get("technocat_user_id")?.value;
  if (!userId) {
    const defaultUser = await getProfileByEmail("student@technocat.edu");
    if (defaultUser) {
      userId = defaultUser.id;
    }
  }
  return userId || null;
}

// GET: Fetch all attempt history and subject lockout status
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || undefined;
    const yearStr = searchParams.get("year");
    const year = yearStr ? parseInt(yearStr, 10) : undefined;

    // Fetch attempts from DB
    const attempts = await getPYQAttempts(userId, section, year);

    // Grouping by section to compute lock status and attempts count
    const sectionStats: Record<
      string,
      {
        attemptsCount: number;
        isLocked: boolean;
        weakAreas: any[];
        bestScore: number;
        bestPercentage: number;
      }
    > = {
      VARC: { attemptsCount: 0, isLocked: false, weakAreas: [], bestScore: 0, bestPercentage: 0 },
      DILR: { attemptsCount: 0, isLocked: false, weakAreas: [], bestScore: 0, bestPercentage: 0 },
      QUANT: { attemptsCount: 0, isLocked: false, weakAreas: [], bestScore: 0, bestPercentage: 0 },
    };

    // Also fetch completed lessons from topic_progress to auto-mark weak areas
    const topicProgRes = await query(
      `SELECT topic_id, completed_lessons FROM public.topic_progress WHERE user_id = $1`,
      [userId]
    );
    const completedLessonIds = new Set<string>();
    topicProgRes.rows.forEach((row: any) => {
      if (Array.isArray(row.completed_lessons)) {
        row.completed_lessons.forEach((lid: string) => completedLessonIds.add(lid));
      }
    });

    attempts.forEach((att: any) => {
      const sec = att.section?.toUpperCase();
      if (sectionStats[sec]) {
        sectionStats[sec].attemptsCount += 1;
        if (att.score > sectionStats[sec].bestScore) {
          sectionStats[sec].bestScore = att.score;
          sectionStats[sec].bestPercentage = parseFloat(att.percentage) || 0;
        }
        if (att.is_locked) {
          sectionStats[sec].isLocked = true;
          if (Array.isArray(att.weak_areas) && att.weak_areas.length > 0) {
            sectionStats[sec].weakAreas = att.weak_areas;
          }
        }
      }
    });

    // Cross-check weak areas against completed lessons
    Object.keys(sectionStats).forEach((sec) => {
      const stat = sectionStats[sec];
      if (stat.weakAreas && stat.weakAreas.length > 0) {
        let allCompleted = true;
        stat.weakAreas = stat.weakAreas.map((item: any) => {
          const isDone = completedLessonIds.has(item.lessonId) || item.completed;
          if (!isDone) allCompleted = false;
          return { ...item, completed: isDone };
        });

        // Auto unlock if all weak areas are completed!
        if (allCompleted && stat.isLocked) {
          stat.isLocked = false;
          // Async update in DB
          unlockPYQSubject(userId, sec).catch(console.error);
        }
      }
    });

    return NextResponse.json({
      success: true,
      attempts,
      sectionStats,
    });
  } catch (error: any) {
    console.error("[PYQ Attempts GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch PYQ attempts" }, { status: 500 });
  }
}

// POST: Save a new attempt and enforce subject-level locking
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      year,
      slot,
      section,
      attemptNum,
      score,
      total,
      percentage,
      mcqCorrect,
      mcqWrong,
      titaCorrect,
      titaWrong,
      unattempted,
      strikes,
      timeTakenSeconds,
      answers,
      analysis,
      weakAreas,
    } = body;

    if (!year || !slot || !section) {
      return NextResponse.json({ error: "Missing required fields (year, slot, section)" }, { status: 400 });
    }

    const sec = section.toUpperCase();

    // Query existing attempts for this subject across ALL slots and years
    const existing = await query(
      `SELECT count(*) as count FROM public.pyq_attempts WHERE user_id = $1 AND UPPER(section) = $2`,
      [userId, sec]
    );
    const prevAttemptsCount = parseInt(existing.rows[0]?.count || "0", 10);
    const newTotalAttempts = prevAttemptsCount + 1;

    // Subject-level locking rule: 3 total attempts locks this subject across all slots
    const shouldLock = newTotalAttempts >= 3;

    const saved = await savePYQAttempt({
      userId,
      year,
      slot,
      section: sec,
      attemptNum: newTotalAttempts,
      score: score || 0,
      total: total || 68,
      percentage: percentage || 0,
      mcqCorrect: mcqCorrect || 0,
      mcqWrong: mcqWrong || 0,
      titaCorrect: titaCorrect || 0,
      titaWrong: titaWrong || 0,
      unattempted: unattempted || 0,
      strikes: strikes || 0,
      timeTakenSeconds: timeTakenSeconds || 0,
      answers: answers || {},
      analysis: analysis || {},
      isLocked: shouldLock,
      weakAreas: weakAreas || [],
    });

    return NextResponse.json({
      success: true,
      attempt: saved,
      totalSubjectAttempts: newTotalAttempts,
      isLocked: shouldLock,
    });
  } catch (error: any) {
    console.error("[PYQ Attempts POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to save PYQ attempt" }, { status: 500 });
  }
}

// PATCH: Manual unlock or update checklist
export async function PATCH(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { section, action } = await request.json();
    if (!section) {
      return NextResponse.json({ error: "Missing section parameter" }, { status: 400 });
    }

    const sec = section.toUpperCase();

    if (action === "unlock") {
      await unlockPYQSubject(userId, sec);
      return NextResponse.json({ success: true, message: `Unlocked section ${sec}` });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PYQ Attempts PATCH Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update PYQ" }, { status: 500 });
  }
}
