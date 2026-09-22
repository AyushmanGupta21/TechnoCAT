import { NextRequest, NextResponse } from "next/server";
import { getProfileByEmail, getProfileById, query } from "@/lib/db";

const FALLBACK_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: NextRequest) {
  try {
    let userId = request.cookies.get("technocat_user_id")?.value;

    if (!userId) {
      const defaultUser = await getProfileByEmail("student@technocat.edu");
      userId = defaultUser?.id || FALLBACK_USER_ID;
    }

    // Ensure analysis_views table exists for tracking task 2
    await query(`
      CREATE TABLE IF NOT EXISTS public.analysis_views (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `, []);

    // 1. Get user profile to find creation date (Challenge Start Date)
    const profileRes = await query(
      `SELECT created_at FROM public.profiles WHERE id = $1 LIMIT 1`,
      [userId]
    );

    const startDate = profileRes.rows.length > 0 
      ? new Date(profileRes.rows[0].created_at) 
      : new Date();
    
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
