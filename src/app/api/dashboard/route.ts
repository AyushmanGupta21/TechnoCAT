import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, addStudyTask, getProfileByEmail } from "@/lib/db";

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = await getDashboardData(userId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Dashboard API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch dashboard data" }, { status: 500 });
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
