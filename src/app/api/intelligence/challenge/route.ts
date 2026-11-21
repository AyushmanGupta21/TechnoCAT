import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.userId;

    // 1. Get or initialize the challenge start date (tables: db/migrations/0002_*).
    //    Single round trip and race-safe: concurrent first requests cannot double-insert.
    const challengeRes = await query(
      `INSERT INTO public.user_challenges (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING challenge_start_date`,
      [userId]
    );

    const startDate = new Date(challengeRes.rows[0].challenge_start_date);
    startDate.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // 2. Calculate current day (1-indexed)
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = Math.min(7, diffDays + 1);

    // 3. Get user activity (Mocks and Analysis Views)
    const pyqRes = await query(
      `SELECT DATE(completed_at) as activity_date 
       FROM public.pyq_attempts 
       WHERE user_id = $1`,
      [userId]
    );

    const analysisRes = await query(
      `SELECT DATE(viewed_at) as activity_date 
       FROM public.analysis_views 
       WHERE user_id = $1`,
      [userId]
    );

    const mockDates = new Set<string>();
    pyqRes.rows.forEach(r => {
      if (r.activity_date) mockDates.add(new Date(r.activity_date).toISOString().split('T')[0]);
    });

    const analysisDates = new Set<string>();
    analysisRes.rows.forEach(r => {
      if (r.activity_date) analysisDates.add(new Date(r.activity_date).toISOString().split('T')[0]);
    });

    const days = [];
    let completedCount = 0;

    for (let i = 1; i <= 7; i++) {
      const targetDate = new Date(startDate);
      targetDate.setUTCDate(startDate.getUTCDate() + (i - 1));
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      const hasMock = mockDates.has(targetDateStr);
      const hasAnalysis = analysisDates.has(targetDateStr);
      
      // A day is only complete if BOTH tasks are done
      const isCompleted = hasMock && hasAnalysis;
      
      let status = "upcoming";
      if (i < currentDay) {
        status = isCompleted ? "completed" : "incomplete";
      } else if (i === currentDay) {
        status = isCompleted ? "completed" : "today";
      }

      if (isCompleted) {
        completedCount++;
      }
      
      const tasks = [
        { name: "Take 1 Full Mock Test", done: hasMock },
        { name: "Analyze Mock Performance", done: hasAnalysis }
      ];
      
      const tasksDone = tasks.filter(t => t.done).length;

      days.push({
        day: i,
        date: targetDateStr,
        status: status,
        title: "Daily Mock & Review",
        desc: "Complete a full mock and review your performance to build consistency.",
        tasks: tasks,
        progress: {
          tasksDone,
          tasksTotal: tasks.length
        }
      });
    }

    return NextResponse.json({
      startDate: startDate.toISOString(),
      currentDay: currentDay,
      completedDays: completedCount,
      totalDays: 7,
      days: days
    });

  } catch (error: any) {
    console.error("[Challenge API Error]", error);
    return NextResponse.json({ error: "Failed to fetch challenge data" }, { status: 500 });
  }
}
