import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, addStudyTask, toggleStudyTask } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

// Zero-state for unauthenticated or new real users — NO fake demo values
const EMPTY_DASHBOARD = {
  isDemo: false,
  enrolledTopics: [],
  metrics: {
    inProgressCourses: 0,
    completedCourses: 0,
    watchingTime: "0h 0 min",
    watchingTimeMinutes: 0,
    pointsEarned: 0,
  },
  readiness: {
    readiness: 0,
    concepts: 0,
    accuracy: 0,
    speed: 0,
    consistency: 0,
    hasActivity: false,
  },
  detailed: {
    inProgressTopics: [],
    completedTopics: [],
    watchingHistory: [],
    pointsHistory: [],
  },
  weeklyStats: [
    { day: "Sun", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Mon", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Tue", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Wed", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Thu", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Fri", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
    { day: "Sat", learning: 0, challenge: 0, rawLearning: 0, rawChallenge: 0 },
  ],
  summary: {
    totalHoursWeek: 0,
    avgHoursDay: 0,
    courseHoursWeek: 0,
    challengeHoursWeek: 0,
  },
  tasks: [],
};

function resolveUserId(request: NextRequest): string | null {
  return getSession(request)?.userId ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = resolveUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB timeout")), 7000)
    );

    const data = await Promise.race([getDashboardData(userId), timeoutPromise]);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Dashboard API Error]", error?.message);
    // Keep the response shape so the UI can still render, but flag it as a failure
    // instead of silently presenting a database outage as a brand-new account.
    return NextResponse.json(
      { ...EMPTY_DASHBOARD, error: "Dashboard data is temporarily unavailable." },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = resolveUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { title, taskDate, category, code, duration, subtitle } = await request.json();

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }
    if (title.length > 200) {
      return NextResponse.json({ error: "Task title is too long" }, { status: 400 });
    }
    if (taskDate !== undefined && taskDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(taskDate))) {
      return NextResponse.json({ error: "taskDate must be YYYY-MM-DD" }, { status: 400 });
    }

    const newTask = await addStudyTask(
      userId,
      title,
      taskDate || new Date().toISOString().split("T")[0],
      category || "QA",
      code || "STUDY",
      "Flexible",
      duration || "45 min",
      subtitle || "Personal Target Task"
    );

    return NextResponse.json({ task: newTask });
  } catch (error: any) {
    console.error("[Dashboard Task Error]", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { taskId, isCompleted } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const updated = await toggleStudyTask(userId, String(taskId), Boolean(isCompleted));
    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    console.error("[Dashboard PATCH Task Error]", error);
    return NextResponse.json({ error: "Failed to toggle task" }, { status: 500 });
  }
}
