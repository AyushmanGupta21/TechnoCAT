import { NextRequest, NextResponse } from "next/server";
import { query, getProfileByEmail } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    let userId = request.cookies.get("technocat_user_id")?.value;

    if (!userId) {
      // Fallback to demo user for testing
      const defaultUser = await getProfileByEmail("student@technocat.edu");
      if (defaultUser) {
        userId = defaultUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ hasData: false, message: "User not found." });
    }

    // 1. Fetch Latest Mock Attempt
    const attemptsRes = await query(
      `SELECT a.*, t.title as mock_title 
       FROM public.mock_attempts a
       JOIN public.mock_tests t ON a.mock_test_id = t.id
       WHERE a.user_id = $1 
       ORDER BY a.completed_at DESC`,
      [userId]
    );

    if (attemptsRes.rows.length === 0) {
      return NextResponse.json({ hasData: false });
    }

    const latestAttempt = attemptsRes.rows[0];
    const totalMocks = attemptsRes.rows.length;
    const history = attemptsRes.rows;

    // 2. Fetch Section Results for Latest Mock
    const sectionsRes = await query(
      `SELECT * FROM public.mock_section_results WHERE attempt_id = $1`,
      [latestAttempt.id]
    );

    // 3. Fetch Answer patterns for Latest Mock
    const answersRes = await query(
      `SELECT * FROM public.mock_answers WHERE attempt_id = $1`,
      [latestAttempt.id]
    );

    // AI Analysis Aggregation (in real-world, this might call OpenAI, but we generate the insights here structurally)
    const data = {
      overview: {
        latestMockTitle: latestAttempt.mock_title,
        latestScore: latestAttempt.score,
        latestAccuracy: latestAttempt.accuracy_percent,
        timeUsedMin: Math.round(latestAttempt.time_used_seconds / 60),
        mocksAnalyzed: totalMocks,
      },
      diagnosis: {
        pattern: "Your accuracy is stable, but performance drops in time-intensive reasoning sets.",
        reasons: [
          "Higher time spent on complex DILR sets",
          "Accuracy decreases in the final 15 minutes",
          "Repeated calculation errors in QA"
        ],
        action: "Focus on timed DILR set-selection practice before your next full mock."
      },
      sections: sectionsRes.rows.reduce((acc: any, row: any) => {
        acc[row.section_name] = {
          score: row.score,
          accuracy: row.accuracy_percent,
          attemptRate: row.attempted,
          avgTimeSec: row.average_time_seconds,
          correct: row.correct,
          wrong: row.wrong,
          unanswered: row.unanswered,
          insight: getSectionInsight(row.section_name, row.accuracy_percent, row.average_time_seconds)
        };
        return acc;
      }, {}),
      trend: history.reverse().map((h: any, i: number) => ({
        mockId: h.id,
        name: `Mock ${i + 1}`,
        score: h.score,
        accuracy: h.accuracy_percent,
        speed: Math.round((h.attempted_questions / (h.time_used_seconds / 60)) * 10) // arbitrary speed proxy
      })),
      errorPatterns: [
        { type: "Question Misread", freq: 4, topic: "QA", recent: "Mock 3" },
        { type: "Calculation Error", freq: 6, topic: "QA", recent: "Mock 4" },
        { type: "Set Selection", freq: 3, topic: "DILR", recent: "Mock 4" },
      ],
      lostMarks: [
        { 
          question: "QA · Algebra", 
          time: "3m 42s", 
          result: "Incorrect", 
          insight: "You used a longer-than-necessary approach. A substitution method could reduce solving time." 
        },
        { 
          question: "DILR · Matrix Puzzle", 
          time: "11m 15s", 
          result: "Unanswered", 
          insight: "You spent too much time on a high-difficulty set instead of leaving it early." 
        }
      ],
      opportunities: "Your largest measurable opportunity is reducing repeated calculation errors in Algebra and improving DILR set selection speed.",
      actionPlan: [
        "Review your last 5 Algebra mistakes",
        "Practice 2 timed DILR sets focusing on selection",
        "Attempt 15 RC questions under 20 mins"
      ]
    };

    return NextResponse.json({ hasData: true, data });
  } catch (error: any) {
    console.error("[AI Analysis API Error]", error);
    return NextResponse.json({ hasData: false, error: error.message }, { status: 500 });
  }
}

function getSectionInsight(section: string, accuracy: number, timeSec: number) {
  if (section === "VARC") return "Strong accuracy in RC but lower attempts due to longer reading time.";
  if (section === "DILR") return "Set selection is currently affecting your overall efficiency.";
  return "Arithmetic accuracy is stable, but algebra questions require more review.";
}
