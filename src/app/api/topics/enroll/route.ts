import { NextRequest, NextResponse } from "next/server";
import { enrollUserInTopic } from "@/lib/db";

async function resolveUserId(request: NextRequest): Promise<string | null> {
  return request.cookies.get("technocat_user_id")?.value || null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to enroll." }, { status: 401 });
    }

    const body = await request.json();
    const { topicId } = body;

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required." }, { status: 400 });
    }

    const record = await enrollUserInTopic(userId, topicId);

    return NextResponse.json({
      success: true,
      enrolled: true,
      topicId,
      record,
    });
  } catch (error: any) {
    console.error("[Topic Enroll API Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to enroll in topic." },
      { status: 500 }
    );
  }
}
