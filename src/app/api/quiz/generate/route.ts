import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/auth/rateLimit";
import { getTopicById } from "@/data/topicsData";
import { generatePracticeQuiz } from "@/lib/quiz/generator";

// POST /api/quiz/generate { topicId, count? } — practice quiz for a topic (AI + question bank).
// Answers are submitted to POST /api/quiz/attempts with kind "topic_drill" and graded there.

export const maxDuration = 60; // LLM generation can take a while

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const topicId = typeof body?.topicId === "string" ? body.topicId : "";
  const count = [5, 10].includes(Number(body?.count)) ? Number(body.count) : 5;
  if (!getTopicById(topicId)) return NextResponse.json({ error: "Unknown topic" }, { status: 400 });

  // AI generation costs money: limit per student. Beyond the limit the bank is used instead.
  const limit = await consumeRateLimit(`quiz-generate:${session.userId}`, 8, 60 * 60 * 1000);

  try {
    const quiz = await generatePracticeQuiz(session.userId, topicId, count, {
      allowAi: limit.allowed && !session.isDemo, // demo showcase uses the authored bank
      recordForUser: !session.isDemo,
    });
    if (quiz.questions.length === 0) {
      return NextResponse.json({ error: "No practice questions are available for this topic yet." }, { status: 404 });
    }
    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[Quiz Generate API Error]", error);
    return NextResponse.json({ error: "Could not create a practice quiz" }, { status: 500 });
  }
}
