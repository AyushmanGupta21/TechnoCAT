import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { addDays, todayInAppTz } from "@/lib/time";
import {
  buildChallengeResponse,
  buildDemoChallenge,
  type DailyActivitySnapshot,
} from "@/lib/challenge";

function daysBetween(startYmd: string, endYmd: string): number {
  const [sy, sm, sd] = startYmd.split("-").map(Number);
  const [ey, em, ed] = endYmd.split("-").map(Number);
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  return Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24));
}

function addTimestampDate(set: Set<string>, value: unknown) {
  if (!value) return;
  const dt = new Date(value as string | Date);
  if (!Number.isNaN(dt.getTime())) {
    set.add(todayInAppTz(dt));
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.isDemo) {
      return NextResponse.json(buildDemoChallenge());
    }

    const userId = session.userId;

    // 1. Get or initialize the challenge start date (tables: db/migrations/0002_*).
    const challengeRes = await query(
      `INSERT INTO public.user_challenges (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING challenge_start_date`,
      [userId]
    );

    const startDateStr = todayInAppTz(new Date(challengeRes.rows[0].challenge_start_date));
    const todayStr = todayInAppTz();

    // 2. Compute current 7-day rolling cycle (always 1..7, with Day currentDay === todayStr).
    const diffDays = Math.max(0, daysBetween(startDateStr, todayStr));
    const cycleNumber = Math.floor(diffDays / 7) + 1;
    const cycleStartStr = addDays(startDateStr, (cycleNumber - 1) * 7);
    const cycleEndStr = addDays(cycleStartStr, 6);
    const currentDay = (diffDays % 7) + 1;

    // 3. Query all real user activities within this 7-day cycle window in parallel.
    const [
      pyqRes,
      quizRes,
      analysisRes,
      lessonRes,
      studyRes,
      plannerRes,
      mentorRes,
      communityRes,
    ] = await Promise.all([
      query(
        `SELECT completed_at
         FROM public.pyq_attempts
         WHERE user_id = $1
           AND completed_at >= ($2::date - 1)
           AND completed_at < ($3::date + 2)`,
        [userId, cycleStartStr, cycleEndStr]
      ),
      query(
        `SELECT kind, submitted_at
         FROM public.quiz_attempts
         WHERE user_id = $1
           AND submitted_at >= ($2::date - 1)
           AND submitted_at < ($3::date + 2)`,
        [userId, cycleStartStr, cycleEndStr]
      ),
      query(
        `SELECT viewed_at
         FROM public.analysis_views
         WHERE user_id = $1
           AND viewed_at >= ($2::date - 1)
           AND viewed_at < ($3::date + 2)`,
        [userId, cycleStartStr, cycleEndStr]
      ),
      query(
        `SELECT created_at
         FROM public.points_ledger
         WHERE user_id = $1
           AND reason = 'lesson_completed'
           AND created_at >= ($2::date - 1)
           AND created_at < ($3::date + 2)`,
        [userId, cycleStartStr, cycleEndStr]
      ),
      query(
        `SELECT activity_date::text AS d, SUM(seconds)::int AS seconds
         FROM public.study_activity
         WHERE user_id = $1
           AND activity_date BETWEEN $2::date AND $3::date
         GROUP BY activity_date`,
        [userId, cycleStartStr, cycleEndStr]
      ),
      query(
        `SELECT task_date::text AS d
         FROM public.study_tasks
         WHERE user_id = $1
           AND is_completed = true
           AND task_date BETWEEN $2::date AND $3::date`,
        [userId, cycleStartStr, cycleEndStr]
      ),
      query(
        `SELECT created_at
         FROM public.ai_chat_messages
         WHERE user_id = $1
           AND role = 'user'
           AND created_at >= ($2::date - 1)
           AND created_at < ($3::date + 2)`,
        [userId, cycleStartStr, cycleEndStr]
      ),
      query(
        `SELECT created_at
         FROM public.community_posts
         WHERE author_id = $1::text
           AND created_at >= ($2::date - 1)
           AND created_at < ($3::date + 2)
         UNION ALL
         SELECT created_at
         FROM public.community_comments
         WHERE author_id = $1::text
           AND created_at >= ($2::date - 1)
           AND created_at < ($3::date + 2)`,
        [userId, cycleStartStr, cycleEndStr]
      ),
    ]);

    const activity: DailyActivitySnapshot = {
      pyqDates: new Set<string>(),
      practiceQuizDates: new Set<string>(),
      analysisDates: new Set<string>(),
      lessonDates: new Set<string>(),
      studySecondsByDate: new Map<string, number>(),
      plannerTaskDates: new Set<string>(),
      aiMentorDates: new Set<string>(),
      communityDates: new Set<string>(),
    };

    for (const r of pyqRes.rows) {
      addTimestampDate(activity.pyqDates, r.completed_at);
    }
    for (const r of quizRes.rows) {
      if (r.kind === "pyq") {
        addTimestampDate(activity.pyqDates, r.submitted_at);
      } else {
        addTimestampDate(activity.practiceQuizDates, r.submitted_at);
      }
    }
    for (const r of analysisRes.rows) {
      addTimestampDate(activity.analysisDates, r.viewed_at);
    }
    for (const r of lessonRes.rows) {
      addTimestampDate(activity.lessonDates, r.created_at);
    }
    for (const r of studyRes.rows) {
      if (r.d) {
        activity.studySecondsByDate.set(String(r.d).slice(0, 10), Number(r.seconds) || 0);
      }
    }
    for (const r of plannerRes.rows) {
      if (r.d) {
        activity.plannerTaskDates.add(String(r.d).slice(0, 10));
      }
    }
    for (const r of mentorRes.rows) {
      addTimestampDate(activity.aiMentorDates, r.created_at);
    }
    for (const r of communityRes.rows) {
      addTimestampDate(activity.communityDates, r.created_at);
    }

    return NextResponse.json(
      buildChallengeResponse(
        startDateStr,
        cycleStartStr,
        cycleNumber,
        currentDay,
        activity
      )
    );
  } catch (error: any) {
    console.error("[Challenge API Error]", error);
    return NextResponse.json({ error: "Failed to fetch challenge data" }, { status: 500 });
  }
}
