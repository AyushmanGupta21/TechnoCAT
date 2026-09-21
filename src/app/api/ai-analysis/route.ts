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

    // Provide robust placeholder data that aligns precisely with the new UI requirements.
    const data = {
      overview: {
        latestMockTitle: latestAttempt.mock_title,
        latestScore: latestAttempt.score,
        latestAccuracy: latestAttempt.accuracy_percent,
        timeUsedMin: Math.round(latestAttempt.time_used_seconds / 60),
        mocksAnalyzed: totalMocks,
        status: "Improving", // e.g. "Improving", "Stable", "Needs Attention"
        consistency: 72,
        speed: 61,
        bestSection: "VARC",
        weakestSection: "QA",
        streak: 3
      },
      diagnosis: {
        pattern: "You are performing well in Accuracy, but your solving speed is reducing your overall score.",
        well: "Maintaining >75% accuracy in Reading Comprehension.",
        holdingBack: "Spending 3m+ on difficult QA algebra questions.",
        improveFastest: "Target DILR set selection to avoid 10-minute traps."
      },
      dna: {
        accuracy: { value: 78, interpretation: "Strong — maintain current level", insight: "You rarely make careless errors when you know the concept." },
        speed: { value: 61, interpretation: "Main improvement opportunity", insight: "You average 2m 10s per question, leaving 4-5 questions unattempted." },
        consistency: { value: 72, interpretation: "Moderately stable", insight: "Your VARC scores vary depending on the passage genre." },
        conceptStrength: { value: 85, interpretation: "Excellent foundation", insight: "You correctly answer 90% of arithmetic and geometry questions." },
        questionSelection: { value: 55, interpretation: "Critical weakness", insight: "You often pick the hardest DILR set first, draining time." }
      },
      sections: {
        VARC: { score: 32, accuracy: 85, attemptRate: 15, avgTimeSec: 130, trend: "STRONG" },
        DILR: { score: 20, accuracy: 75, attemptRate: 12, avgTimeSec: 210, trend: "IMPROVING" },
        QA: { score: 24, accuracy: 82, attemptRate: 21, avgTimeSec: 160, trend: "NEEDS ATTENTION" }
      },
      trend: history.reverse().map((h: any, i: number) => ({
        mockId: h.id,
        name: `Mock ${i + 1}`,
        mockName: h.mock_title,
        score: h.score,
        accuracy: h.accuracy_percent,
        speed: Math.round((h.attempted_questions / (h.time_used_seconds / 60)) * 10),
        date: new Date(h.completed_at || Date.now()).toLocaleDateString()
      })),
      mistakesMap: [
        { category: "Time Pressure", percent: 28, insight: "Most errors occur when solving questions under 90 seconds." },
        { category: "Concept Gap", percent: 22, insight: "Missing foundational knowledge in Permutations & Combinations." },
        { category: "Wrong Selection", percent: 18, insight: "Attempting questions with historical <30% success rate." },
        { category: "Calculation Error", percent: 17, insight: "Silly arithmetic errors in the final steps of QA." },
        { category: "Careless Mistake", percent: 15, insight: "Misreading 'except' or 'not' in VARC questions." }
      ],
      opportunities: [
        { marks: 8, label: "Potential improvement from reducing calculation errors in QA." },
        { marks: 6, label: "Potential improvement from better DILR set selection." },
        { marks: 4, label: "Potential improvement from improving RC reading speed." }
      ],
      topics: {
        VARC: [
          { name: "Reading Comprehension", status: "Strong", accuracy: 85, attempts: 12, avgTime: "1m 45s" },
          { name: "Para Jumbles", status: "Needs Practice", accuracy: 40, attempts: 4, avgTime: "2m 10s" }
        ],
        DILR: [
          { name: "Arrangements", status: "Good", accuracy: 75, attempts: 6, avgTime: "6m 20s" },
          { name: "Games & Tournaments", status: "Critical", accuracy: 25, attempts: 4, avgTime: "8m 15s" }
        ],
        QA: [
          { name: "Arithmetic", status: "Strong", accuracy: 90, attempts: 8, avgTime: "1m 30s" },
          { name: "Algebra", status: "Critical", accuracy: 30, attempts: 5, avgTime: "3m 40s" }
        ]
      },
      actionPlan: [
        { step: "FIX", title: "Algebra & Set Selection", desc: "Your biggest weakness detected by AI is time wasted on difficult Algebra and picking trap DILR sets.", goal: "Reduce average QA time by 15s per question." },
        { step: "PRACTICE", title: "Targeted Mini-Mocks", desc: "Practice specific 15-minute sectional tests focusing exclusively on Games & Tournaments.", goal: "Achieve >60% accuracy in targeted practice." },
        { step: "RETEST", title: "Full CAT Mock #6", desc: "Take a full mock to measure improvement in question selection under pressure.", goal: "Skip at least 3 'trap' questions." }
      ]
    };

    return NextResponse.json({ hasData: true, data });

  } catch (error) {
    console.error("Error in AI Analysis:", error);
    return NextResponse.json(
      { hasData: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
