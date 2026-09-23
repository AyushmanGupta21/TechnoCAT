import { NextRequest, NextResponse } from "next/server";
import { query, getProfileByEmail, getPYQAttempts } from "@/lib/db";

async function resolveUserId(request: NextRequest): Promise<string | null> {
  let userId = request.cookies.get("technocat_user_id")?.value;
  if (!userId) {
    const defaultUser = await getProfileByEmail("student@technocat.edu");
    if (defaultUser) {
      userId = defaultUser.id;
    }
  }
  return userId || null;
}

export interface ErrorRecord {
  id: string;
  source: string;
  section: "QA" | "DILR" | "VARC";
  topic: string;
  subtopic: string;
  errorType: "Calculation Error" | "Concept Gap" | "Time Pressure" | "Trap/Misread" | "Guesswork";
  timeSpentSec: number;
  expectedTimeSec: number;
  questionText: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  selectedOption: string;
  correctOption: string;
  isNegativeMarked: boolean;
  aiDiagnostic: string;
  recoveryAction: string;
  recommendedLessonHref: string;
  date: string;
}

const DEFAULT_ERRORS: ErrorRecord[] = [
  {
    id: "err-1",
    source: "CAT 2024 Slot 1",
    section: "QA",
    topic: "Arithmetic",
    subtopic: "Percentages & Successive Change",
    errorType: "Calculation Error",
    timeSpentSec: 195,
    expectedTimeSec: 120,
    questionText: "A trader sells two articles at Rs. 198 each. On one he gains 10% and on the other he loses 10%. Find his overall gain or loss percentage in the transaction.",
    options: [
      { label: "A", text: "1% gain", isCorrect: false },
      { label: "B", text: "1% loss", isCorrect: true },
      { label: "C", text: "No profit no loss", isCorrect: false },
      { label: "D", text: "2% loss", isCorrect: false }
    ],
    selectedOption: "C",
    correctOption: "B",
    isNegativeMarked: true,
    aiDiagnostic: "You intuitively assumed +10% and -10% cancel out to 'No profit no loss', forgetting that the base cost prices for the two articles are different ($CP_1 = 180$, $CP_2 = 220$).",
    recoveryAction: "For identical selling prices with $\\pm x\\%$ variation, always apply standard rule: Loss $\\% = \\frac{x^2}{100}\\% = 1\\%$ loss.",
    recommendedLessonHref: "/topics/qa-quantitative-ability",
    date: "Sep 22, 2026"
  },
  {
    id: "err-2",
    source: "Full CAT Mock 2",
    section: "QA",
    topic: "Algebra",
    subtopic: "Quadratic & Polynomial Equations",
    errorType: "Time Pressure",
    timeSpentSec: 260,
    expectedTimeSec: 130,
    questionText: "If the roots of the equation $x^2 - px + 8 = 0$ differ by 2, find the sum of all possible values of $p$.",
    options: [
      { label: "A", text: "0", isCorrect: true },
      { label: "B", text: "12", isCorrect: false },
      { label: "C", text: "-12", isCorrect: false },
      { label: "D", text: "6", isCorrect: false }
    ],
    selectedOption: "B",
    correctOption: "A",
    isNegativeMarked: true,
    aiDiagnostic: "Under clock panic at minute 37, you solved $(\\alpha - \\beta)^2 = p^2 - 32 = 4 \\implies p^2 = 36 \\implies p = 6$. You missed the negative root $p = -6$, so the sum is $6 + (-6) = 0$.",
    recoveryAction: "Always write $\\pm$ when square-rooting ($p^2 = 36 \\implies p = \\pm 6$). This avoided losing 4 marks (-1 penalty instead of +3).",
    recommendedLessonHref: "/topics/qa-quantitative-ability",
    date: "Sep 21, 2026"
  },
  {
    id: "err-3",
    source: "CAT 2024 Slot 2",
    section: "DILR",
    topic: "Logical Reasoning",
    subtopic: "Arrangements & Grid Matrices",
    errorType: "Trap/Misread",
    timeSpentSec: 420,
    expectedTimeSec: 240,
    questionText: "Five professors P, Q, R, S, T live on five different floors (1 to 5). R lives on an even floor immediately below S. Q does not live on the ground floor. Who lives on floor 3?",
    options: [
      { label: "A", text: "P", isCorrect: false },
      { label: "B", text: "Q", isCorrect: false },
      { label: "C", text: "T", isCorrect: true },
      { label: "D", text: "Cannot be determined", isCorrect: false }
    ],
    selectedOption: "D",
    correctOption: "C",
    isNegativeMarked: true,
    aiDiagnostic: "You missed the constraint 'immediately below'. You marked 'Cannot be determined' after spending 7 minutes because you did not test the only valid parity placement for R=2 and S=3.",
    recoveryAction: "In DILR puzzles, circle parity clues (even/odd) first. They instantly cut total permutations from 120 down to 2 cases.",
    recommendedLessonHref: "/topics/dilr-data-interpretation",
    date: "Sep 20, 2026"
  },
  {
    id: "err-4",
    source: "CAT 2024 Slot 1",
    section: "VARC",
    topic: "Reading Comprehension",
    subtopic: "Philosophy & Science Passages",
    errorType: "Concept Gap",
    timeSpentSec: 155,
    expectedTimeSec: 100,
    questionText: "Which of the following, if true, would most WEAKEN the author's argument regarding techno-determinism in ancient maritime trade?",
    options: [
      { label: "A", text: "Evidence that ancient shipbuilders prioritized religious ceremonies over hull hydrodynamics.", isCorrect: true },
      { label: "B", text: "Discovery of identical magnetic compass designs across distant ports.", isCorrect: false },
      { label: "C", text: "Records indicating high trade tariffs enforced by imperial dynasties.", isCorrect: false },
      { label: "D", text: "Historical texts demonstrating rapid technological diffusion.", isCorrect: false }
    ],
    selectedOption: "D",
    correctOption: "A",
    isNegativeMarked: true,
    aiDiagnostic: "You picked an option that strengthened the diffusion theory instead of weakening techno-determinism. Option A proves cultural/religious beliefs dictated outcomes rather than technology.",
    recoveryAction: "In 'WEAKEN' questions, isolate the author's primary causal link: [X caused Y]. Look for evidence that a completely different non-technological variable was in control.",
    recommendedLessonHref: "/topics/varc-verbal-ability",
    date: "Sep 19, 2026"
  },
  {
    id: "err-5",
    source: "Sectional Mock 4",
    section: "QA",
    topic: "Geometry",
    subtopic: "Circles & Tangents",
    errorType: "Concept Gap",
    timeSpentSec: 210,
    expectedTimeSec: 120,
    questionText: "Two circles of radii 9 cm and 4 cm touch each other externally. What is the length of their direct common tangent?",
    options: [
      { label: "A", text: "10 cm", isCorrect: false },
      { label: "B", text: "12 cm", isCorrect: true },
      { label: "C", text: "13 cm", isCorrect: false },
      { label: "D", text: "6.5 cm", isCorrect: false }
    ],
    selectedOption: "C",
    correctOption: "B",
    isNegativeMarked: true,
    aiDiagnostic: "You confused the distance between centers ($R_1 + R_2 = 13$) with the length of the direct tangent ($2\\sqrt{R_1 R_2} = 2\\sqrt{36} = 12$).",
    recoveryAction: "For externally touching circles: Direct Common Tangent length is always $2\\sqrt{r_1 r_2}$. Memorize this 10-second shortcut formula.",
    recommendedLessonHref: "/topics/qa-quantitative-ability",
    date: "Sep 18, 2026"
  },
  {
    id: "err-6",
    source: "CAT 2024 Slot 3",
    section: "VARC",
    topic: "Verbal Ability",
    subtopic: "Para Jumbles & Sentence Insertion",
    errorType: "Guesswork",
    timeSpentSec: 90,
    expectedTimeSec: 90,
    questionText: "Identify the mandatory opening sentence and chronological pronoun sequence in the 4-sentence paragraph on artificial neural networks.",
    options: [
      { label: "A", text: "Sentence 3-1-4-2", isCorrect: false },
      { label: "B", text: "Sentence 2-4-1-3", isCorrect: true },
      { label: "C", text: "Sentence 2-1-4-3", isCorrect: false },
      { label: "D", text: "Sentence 4-2-1-3", isCorrect: false }
    ],
    selectedOption: "A",
    correctOption: "B",
    isNegativeMarked: false, // TITA or zero penalty
    aiDiagnostic: "You hurried into option A based on sentence 3 without checking if the pronoun 'These networks' in sentence 3 required an antecedent defined in sentence 2.",
    recoveryAction: "Never start a sequence with sentences containing demonstrative pronouns ('These', 'Such', 'This') unless no independent definition sentence exists.",
    recommendedLessonHref: "/topics/varc-verbal-ability",
    date: "Sep 17, 2026"
  }
];

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    
    // Check if user has real PYQ attempts
    let pyqAttempts: any[] = [];
    if (userId) {
      pyqAttempts = await getPYQAttempts(userId);
    }

    // Merge real attempts if present or use standard calibrated mistake set
    const errors: ErrorRecord[] = [...DEFAULT_ERRORS];

    // If user has real attempts with answers recorded, parse them
    if (pyqAttempts && pyqAttempts.length > 0) {
      pyqAttempts.forEach((att: any, attIdx: number) => {
        let answersObj: any = {};
        try {
          answersObj = typeof att.answers === "string" ? JSON.parse(att.answers) : (att.answers || {});
        } catch (e) {
          answersObj = {};
        }

        Object.keys(answersObj).forEach((qKey: string, qIdx: number) => {
          const item = answersObj[qKey];
          if (item && item.selected && item.selected !== item.correct) {
            errors.unshift({
              id: `user-err-${att.id}-${qIdx}`,
              source: `CAT ${att.year || 2024} Slot ${att.slot || 1}`,
              section: (att.section || "QA").toUpperCase() as any,
              topic: item.topic || "Quantitative Aptitude",
              subtopic: item.subtopic || "Concept Application",
              errorType: (item.timeSpent && item.timeSpent > 180) ? "Time Pressure" : "Calculation Error",
              timeSpentSec: item.timeSpent || 160,
              expectedTimeSec: 120,
              questionText: item.questionText || `Question ${qKey} from ${att.section} section`,
              options: [
                { label: "A", text: "Option A", isCorrect: item.correct === "A" },
                { label: "B", text: "Option B", isCorrect: item.correct === "B" },
                { label: "C", text: "Option C", isCorrect: item.correct === "C" },
                { label: "D", text: "Option D", isCorrect: item.correct === "D" },
              ],
              selectedOption: item.selected,
              correctOption: item.correct || "B",
              isNegativeMarked: true,
              aiDiagnostic: `Incurred negative marks in ${item.topic || att.section}. Review the underlying formulation to avoid recurring trap options.`,
              recoveryAction: `Revisit core concepts in ${item.topic || att.section} and practice 5 consecutive targeted drills.`,
              recommendedLessonHref: att.section?.toLowerCase().includes("dilr") ? "/topics/dilr-data-interpretation" : att.section?.toLowerCase().includes("varc") ? "/topics/varc-verbal-ability" : "/topics/qa-quantitative-ability",
              date: new Date(att.completed_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            });
          }
        });
      });
    }

    const totalErrors = errors.length;
    const negativeMarksLost = errors.filter(e => e.isNegativeMarked).length;
    const sillyCount = errors.filter(e => e.errorType === "Calculation Error" || e.errorType === "Trap/Misread").length;
    const sillyErrorRate = totalErrors > 0 ? Math.round((sillyCount / totalErrors) * 100) : 0;

    // Distribution by Category
    const categoryCounts: Record<string, number> = {
      "Calculation Error": 0,
      "Concept Gap": 0,
      "Time Pressure": 0,
      "Trap/Misread": 0,
      "Guesswork": 0
    };
    errors.forEach(e => {
      if (categoryCounts[e.errorType] !== undefined) {
        categoryCounts[e.errorType] += 1;
      }
    });

    const categoryColors: Record<string, string> = {
      "Calculation Error": "#F59E0B",
      "Concept Gap": "#EF4444",
      "Time Pressure": "#8B5CF6",
      "Trap/Misread": "#0EA5E9",
      "Guesswork": "#64748B"
    };

    const mistakeCategories = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      count: categoryCounts[cat],
      percent: totalErrors > 0 ? Math.round((categoryCounts[cat] / totalErrors) * 100) : 0,
      color: categoryColors[cat] || "#2563EB"
    }));

    // Subject breakdown
    const subjectBreakdown = {
      QA: errors.filter(e => e.section === "QA").length,
      DILR: errors.filter(e => e.section === "DILR").length,
      VARC: errors.filter(e => e.section === "VARC").length,
    };

    return NextResponse.json({
      success: true,
      totalErrors,
      negativeMarksLost,
      sillyErrorRate,
      mistakeCategories,
      subjectBreakdown,
      errors
    });
  } catch (error: any) {
    console.error("[Error Tracking API GET]", error);
    return NextResponse.json({ error: error.message || "Failed to load error tracking data" }, { status: 500 });
  }
}
