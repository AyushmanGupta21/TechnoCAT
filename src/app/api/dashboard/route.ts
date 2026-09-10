import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, addStudyTask, getProfileByEmail } from "@/lib/db";

const FALLBACK_DASHBOARD = {
  metrics: {
    inProgressCourses: 3,
    completedCourses: 2,
    watchingTime: "18h 45 min",
    watchingTimeMinutes: 1125,
    pointsEarned: 840,
  },
  detailed: {
    inProgressTopics: [],
    completedTopics: [],
    watchingHistory: [],
    pointsHistory: []
  },
  weeklyStats: [
    { day: "Sun", learning: 50, challenge: 40 },
    { day: "Mon", learning: 75, challenge: 60 },
    { day: "Tue", learning: 50, challenge: 42 },
    { day: "Wed", learning: 60, challenge: 50 },
    { day: "Thu", learning: 60, challenge: 52 },
    { day: "Fri", learning: 38, challenge: 32 },
    { day: "Sat", learning: 28, challenge: 22 },
  ],
  summary: {
    totalHoursWeek: 37,
    avgHoursDay: 5.2,
    courseHoursWeek: 18,
    challengeHoursWeek: 20,
  },
  tasks: [],
};

export async function GET(request: NextRequest) {
  try {
    let userId = request.cookies.get("technocat_user_id")?.value;

    if (!userId) {
      // Fallback to default demo user
      const defaultUser = await getProfileByEmail("student@technocat.edu");
      if (defaultUser) {
        userId = defaultUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json(FALLBACK_DASHBOARD);
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB timeout")), 3500)
    );

    const data = await Promise.race([getDashboardData(userId), timeoutPromise]);
    return NextResponse.json(data);
  } catch (error: any) {
    console.warn("[Dashboard API Fallback]", error?.message);
    return NextResponse.json(FALLBACK_DASHBOARD);
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId = request.cookies.get("technocat_user_id")?.value;

    if (!userId) {
      const defaultUser = await getProfileByEmail("student@technocat.edu");
      if (defaultUser) {
        userId = defaultUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { title, taskDate } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const newTask = await addStudyTask(
      userId,
      title,
      taskDate || new Date().toISOString().split("T")[0]
    );

    return NextResponse.json({ task: newTask });
  } catch (error: any) {
    console.error("[Dashboard Task Error]", error);
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}
