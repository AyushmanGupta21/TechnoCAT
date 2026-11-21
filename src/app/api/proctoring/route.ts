import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/auth/rateLimit";
import { query } from "@/lib/db";

// POST: log a webcam-proctoring event for the signed-in user's exam session.
// Only event labels are stored; no video or images are ever sent to the server.

const KINDS = ["pyq", "module_quiz", "grand_quiz"] as const;
const EVENTS = [
  "no_face",
  "multiple_faces",
  "phone",
  "looking_away",
  "camera_off",
  "proctoring_declined",
] as const;
const ATTEMPT_KEY_RE = /^[A-Za-z0-9-]{8,64}$/;

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const limit = await consumeRateLimit(`proctoring:${session.userId}`, 120, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many proctoring events." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { attemptKey, kind, event } = body as { attemptKey?: unknown; kind?: unknown; event?: unknown };
  if (typeof attemptKey !== "string" || !ATTEMPT_KEY_RE.test(attemptKey)) {
    return NextResponse.json({ error: "Invalid attemptKey" }, { status: 400 });
  }
  if (typeof kind !== "string" || !(KINDS as readonly string[]).includes(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (typeof event !== "string" || !(EVENTS as readonly string[]).includes(event)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  // The demo account is a shared showcase: accept but never store.
  if (session.isDemo) return NextResponse.json({ success: true, recorded: false });

  try {
    await query(
      `INSERT INTO public.proctoring_events (user_id, attempt_key, kind, event) VALUES ($1, $2, $3, $4)`,
      [session.userId, attemptKey, kind, event]
    );
    return NextResponse.json({ success: true, recorded: true });
  } catch (err) {
    console.error("[Proctoring] failed to record event:", (err as Error)?.message);
    return NextResponse.json({ error: "Could not record event" }, { status: 500 });
  }
}
