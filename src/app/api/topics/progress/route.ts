import { NextRequest, NextResponse } from "next/server";
import { updateLessonCompletion, getUserTopicProgress } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

async function resolveUserId(request: NextRequest): Promise<string | null> {
  return getSession(request)?.userId ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

    const { topicId, lessonId } = await request.json().catch(() => ({}));

    if (typeof topicId !== "string" || typeof lessonId !== "string" || !topicId || !lessonId) {
      return NextResponse.json({ error: "Missing topicId or lessonId" }, { status: 400 });
    }

    const updated = await updateLessonCompletion(userId, topicId, lessonId);
    if (!updated) {
      return NextResponse.json({ error: "Unknown topic or lesson" }, { status: 404 });
    }

    return NextResponse.json({ success: true, progress: updated, pointsAwarded: updated.pointsAwarded });
  } catch (error: any) {
    console.error("[Progress API Error]", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
