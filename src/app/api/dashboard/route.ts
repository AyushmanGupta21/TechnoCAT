import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, addStudyTask, toggleStudyTask, getProfileById, getProfileByEmail } from "@/lib/db";

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

async function resolveUserId(request: NextRequest): Promise<string | null> {
  // Primary: httpOnly session cookie set at login
  const cookieUserId = request.cookies.get("technocat_user_id")?.value;
  if (cookieUserId && cookieUserId.trim().length > 0) {
    return cookieUserId.trim();
  }

  // Secondary: Authorization header (Bearer <userId>) for API clients
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token.length > 0) {
      try {
        const profile = await getProfileById(token);
        if (profile?.id) return profile.id;
      } catch {
        // ignore lookup failure
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);

    if (!userId) {
      return NextResponse.json(EMPTY_DASHBOARD);
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB timeout")), 7000)
    );

    const data = await Promise.race([getDashboardData(userId), timeoutPromise]);
    return NextResponse.json(data);
  } catch (error: any) {
    console.warn("[Dashboard API Error]", error?.message);
    return NextResponse.json(EMPTY_DASHBOARD);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { title, taskDate, category, code, duration, subtitle } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
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
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    let userId = await resolveUserId(request);
    if (!userId) {
      const demoUser = await getProfileByEmail("student@technocat.edu");
      if (demoUser?.id) userId = demoUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { taskId, isCompleted } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const updated = await toggleStudyTask(userId, taskId, Boolean(isCompleted));

    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    console.error("[Dashboard PATCH Task Error]", error);
    return NextResponse.json({ error: error.message || "Failed to toggle task" }, { status: 500 });
  }
}
