import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topicId, topicTitle } = await req.json();

    // Simulate RAG / LLM Generation Delay (1.5 - 3 seconds)
    const delay = Math.floor(Math.random() * 1500) + 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Fallback topic if null
    const title = topicTitle || "General CAT Prep";

    // Mock Questions (80% Course Material / 20% Outside Context)
    const questions = [
      {
        id: "q1",
        question: `Based on the course material for ${title}, which of the following is true?`,
        options: [
          "It focuses heavily on rote memorization.",
          "It emphasizes logical deduction and speed.",
          "It is irrelevant to actual CAT exams.",
          "It is purely theoretical."
        ],
        correctIndex: 1,
        explanation: "Our RAG system extracted this from Module 1: The core focus of this section is improving your logical deduction speed for the CAT."
      },
      {
        id: "q2",
        question: `(PYQ 2021) In the context of ${title}, how do you approach a high-difficulty question?`,
        options: [
          "Spend at least 10 minutes trying to solve it.",
          "Skip it and return if time permits.",
          "Guess randomly immediately.",
          "Mark option C as it's most statistically common."
        ],
        correctIndex: 1,
        explanation: "This is a Previous Year Question (PYQ) strategy. Time management dictates you should skip high-friction questions and secure easy marks first."
      },
      {
        id: "q3",
        question: `If a student studies ${title} for 2 hours daily, what is the expected percentile increase according to our RAG data?`,
        options: [
          "No significant change",
          "About 5-10 percentile points",
          "Guaranteed 99 percentile",
          "Negative impact due to burnout"
        ],
        correctIndex: 1,
        explanation: "Based on the course analytics embedded in our database, consistent 2-hour daily practice yields an average 5-10 point boost."
      }
    ];

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate quiz" }, { status: 500 });
  }
}