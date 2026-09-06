import { NextRequest, NextResponse } from "next/server";
import { updateLessonCompletion, getProfileByEmail } from "@/lib/db";

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
