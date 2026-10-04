import { NextRequest, NextResponse } from "next/server";
import { updateLessonCompletion, getUserTopicProgress } from "@/lib/db";

async function resolveUserId(request: NextRequest): Promise<string | null> {
  const userId = request.cookies.get("technocat_user_id")?.value;
  return userId || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ success: true, progress: [], isDemo: false });
    }

    const rows = await getUserTopicProgress(userId);
    return NextResponse.json({
      success: true,
      progress: rows,
      isDemo: false,
    });
  } catch (error: any) {
    console.error("[Progress API GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch progress" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId, lessonId, totalLessons } = await request.json();

    if (!topicId || !lessonId) {
      return NextResponse.json({ error: "Missing topicId or lessonId" }, { status: 400 });
    }

    const updated = await updateLessonCompletion(
      userId,
      topicId,
      lessonId,
      totalLessons || 25
    );

    return NextResponse.json({ success: true, progress: updated });
  } catch (error: any) {
    console.error("[Progress API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to update progress" }, { status: 500 });
  }
}
