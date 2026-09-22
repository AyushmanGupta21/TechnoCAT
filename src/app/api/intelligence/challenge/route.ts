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

    // 1. Get user profile to find creation date (Challenge Start Date)
    const profileRes = await query(
      `SELECT created_at FROM public.profiles WHERE id = $1 LIMIT 1`,
      [userId]
    );

    // If user not found, default to today
    const startDate = profileRes.rows.length > 0 
      ? new Date(profileRes.rows[0].created_at) 
      : new Date();
    
    // Normalize to midnight UTC for pure day calculations
    startDate.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // 2. Calculate current day (1-indexed)
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = Math.min(7, diffDays + 1); // Cap at 7 for a 7-day challenge

    // 3. Get user activity to determine completed days
    // An active day is one where they have a study_session OR a pyq_attempt
    const sessionsRes = await query(
      `SELECT DATE(study_date) as activity_date 
       FROM public.study_sessions 
       WHERE user_id = $1 AND (CAST(learning_hours AS float) > 0 OR CAST(challenge_hours AS float) > 0)`,
      [userId]
    );
    
    const pyqRes = await query(
      `SELECT DATE(completed_at) as activity_date 
       FROM public.pyq_attempts 
       WHERE user_id = $1`,
      [userId]
    );

    const tasksRes = await query(
      `SELECT DATE(task_date) as activity_date 
       FROM public.study_tasks 
       WHERE user_id = $1 AND is_completed = true`,
      [userId]
    );

    // Collect all unique activity dates in YYYY-MM-DD format
    const activeDates = new Set<string>();
    
    const addDates = (rows: any[]) => {
      rows.forEach(row => {
        if (row.activity_date) {
          const d = new Date(row.activity_date);
          activeDates.add(d.toISOString().split('T')[0]);
        }
      });
    };

    addDates(sessionsRes.rows);
    addDates(pyqRes.rows);
    addDates(tasksRes.rows);

    // 4. Build the 7-day journey array
    const days = [];
    let completedCount = 0;
    
    // Objectives pool to make it dynamic based on day
    const objectives = [
      {
        title: "Assess Weaknesses",
        desc: "Explore your weak topics + complete a short practice session.",
        tasks: [
          { name: "Complete 1 practice session", done: activeDates.size > 0 },
          { name: "Review 1 weak topic", done: false }
        ]
      },
      {
        title: "Targeted Practice",
        desc: "Practice questions from one weak topic.",
        tasks: [
          { name: "Solve 10 questions in weak topic", done: false },
          { name: "Review answers", done: false }
        ]
      },
      {
        title: "Sectional Focus",
        desc: "Complete a focused sectional quiz.",
        tasks: [
          { name: "Take 1 Sectional Quiz", done: false }
        ]
      },
      {
        title: "Mistake Analysis",
        desc: "Review previous mistakes and retry weak questions.",
        tasks: [
          { name: "Review 5 incorrect questions", done: false },
          { name: "Watch 1 concept video", done: false }
        ]
      },
      {
        title: "DILR Mastery",
        desc: "Practice identifying high-scoring DILR sets.",
        tasks: [
          { name: "Attempt 2 DILR sets", done: false },
          { name: "Analyze set selection", done: false }
        ]
      },
      {
        title: "Speed Building",
        desc: "Focus on quick calculation techniques.",
        tasks: [
          { name: "Complete timed QA practice", done: false }
        ]
      },
      {
        title: "Weekly Review",
        desc: "Complete a full mock or weekly progress review.",
        tasks: [
          { name: "Take 1 Full Mock Test", done: false },
          { name: "Analyze Mock performance", done: false }
        ]
      }
    ];

    for (let i = 1; i <= 7; i++) {
      // The date for Day i
      const targetDate = new Date(startDate);
      targetDate.setUTCDate(startDate.getUTCDate() + (i - 1));
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      let status = "upcoming";
      let isCompleted = false;
      
      if (activeDates.has(targetDateStr)) {
        isCompleted = true;
      }
      
      if (i < currentDay) {
        status = isCompleted ? "completed" : "incomplete";
      } else if (i === currentDay) {
        status = isCompleted ? "completed" : "today";
      } else {
        status = "upcoming";
      }

      if (isCompleted) {
        completedCount++;
      }
      
      // Calculate daily progress based on tasks
      // For a completed day, all tasks are done. For today, maybe partial.
      const dayObjective = objectives[i - 1];
      const tasks = dayObjective.tasks.map(t => ({
        name: t.name,
        done: isCompleted ? true : (status === "today" ? Math.random() > 0.5 : false) // Mocking partial today progress for now since we don't have granular task tracking per day yet
      }));
      
      const tasksDone = tasks.filter(t => t.done).length;

      days.push({
        day: i,
        date: targetDateStr,
        status: status,
        title: dayObjective.title,
        desc: dayObjective.desc,
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
