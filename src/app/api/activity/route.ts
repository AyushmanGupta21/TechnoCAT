import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/auth/rateLimit";
import { recordStudyTime } from "@/lib/activity";
import { getTopicLessonIds } from "@/lib/db";

// Study-time heartbeat. While a student is actively watching a lesson (tab visible, video
// playing) the client reports elapsed seconds every ~30 s. Each heartbeat is capped, and
// heartbeats are rate-limited, so a client cannot claim more time than really elapsed.

const MAX_SECONDS_PER_HEARTBEAT = 35;

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  // The demo account is a shared showcase; its study time is not recorded.
  if (session.isDemo) return NextResponse.json({ success: true, recordedSeconds: 0 });

  // ~1 heartbeat per 30 s: at most 3 per 90 s (<= 105 s recorded per 90 s of wall time).
  const limit = await consumeRateLimit(`heartbeat:${session.userId}`, 3, 90 * 1000);
  if (!limit.allowed) return NextResponse.json({ success: true, recordedSeconds: 0, throttled: true });

  const body = await request.json().catch(() => ({}));
  const { topicId, lessonId } = body ?? {};
  const seconds = Math.min(MAX_SECONDS_PER_HEARTBEAT, Math.max(0, Math.floor(Number(body?.seconds) || 0)));

  if (typeof topicId !== "string" || typeof lessonId !== "string" || !getTopicLessonIds(topicId).has(lessonId)) {
    return NextResponse.json({ error: "Unknown topic or lesson" }, { status: 400 });
  }

  try {
    const recordedSeconds = await recordStudyTime(session.userId, { kind: "lesson", ref: lessonId, topicId, seconds });
    return NextResponse.json({ success: true, recordedSeconds });
  } catch (error) {
    console.error("[Activity API Error]", error);
    return NextResponse.json({ error: "Failed to record study time" }, { status: 500 });
  }
}
