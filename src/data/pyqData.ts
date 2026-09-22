// TechnoCAT PYQ Dataset & Engine
// Official CAT Previous Year Question Papers (2017-2024)
import { TOPICS_DATA } from "./topicsData";
import cat2024Raw from "./cat_2024_questions.json";

export interface PYQQuestion {
  id: string;
  year: number;
  slot: string;
  section: string;
  question_number: number;
  type: "MCQ" | "TITA";
  context: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  video_url: string;
  source_url: string;
}

export interface PYQSectionInfo {
  year: number;
  slot: string;
  section: "VARC" | "DILR" | "QUANT";
  sectionTitle: string;
  mcqCount: number;
  titaCount: number;
  totalCount: number;
  durationMinutes: number; // 40 minutes per CAT official regulations
}

export interface PYQYearInfo {
  year: number;
  label: string;
  available: boolean;
  tagline: string;
  badge: string;
  slots: string[];
  sections: Array<"VARC" | "DILR" | "QUANT">;
  totalQuestions: number;
}

export interface PYQWeakAreaItem {
  lessonId: string;
  lessonTitle: string;
  topicId: string;
  topicTitle: string;
  concept: string;
  completed: boolean;
  reason: string;
}

export interface PYQAttemptRecord {
  id?: string;
  userId?: string;
  year: number;
  slot: string;
  section: string;
  attemptNum: number;
  score: number;
  total: number;
  percentage: number;
  mcqCorrect: number;
  mcqWrong: number;
  titaCorrect: number;
  titaWrong: number;
  unattempted: number;
  strikes: number;
  timeTakenSeconds: number;
  answers: Record<number, number | string>;
  isLocked: boolean;
  weakAreas: PYQWeakAreaItem[];
  completedAt?: string;
}

// Available PYQ Years
export const PYQ_YEARS: PYQYearInfo[] = [
  {
    year: 2024,
    label: "CAT 2024",
    available: true,
    tagline: "Latest Official CAT Paper • 3 Slots • 204 Questions",
    badge: "Official 2024 Paper",
    slots: ["Slot 1", "Slot 2", "Slot 3"],
    sections: ["VARC", "DILR", "QUANT"],
    totalQuestions: 204,
  },
  {
    year: 2023,
    label: "CAT 2023",
    available: false,
    tagline: "Archived Paper • Coming Soon",
    badge: "Coming Soon",
    slots: ["Slot 1", "Slot 2", "Slot 3"],
    sections: ["VARC", "DILR", "QUANT"],
    totalQuestions: 198,
  },
  {
    year: 2022,
    label: "CAT 2022",
    available: false,
    tagline: "Archived Paper • Coming Soon",
    badge: "Coming Soon",
    slots: ["Slot 1", "Slot 2", "Slot 3"],
    sections: ["VARC", "DILR", "QUANT"],
    totalQuestions: 198,
  },
  {
    year: 2021,
    label: "CAT 2021",
    available: false,
    tagline: "Archived Paper • Coming Soon",
    badge: "Coming Soon",
    slots: ["Slot 1", "Slot 2", "Slot 3"],
    sections: ["VARC", "DILR", "QUANT"],
    totalQuestions: 198,
  },
];

export const SECTION_METADATA: Record<string, { title: string; topicId: string; icon: string; color: string }> = {
  VARC: {
    title: "Verbal Ability & Reading Comprehension",
    topicId: "varc-verbal-ability",
    icon: "book",
    color: "#8B5CF6",
  },
  DILR: {
    title: "Data Interpretation & Logical Reasoning",
    topicId: "dilr-data-interpretation",
    icon: "chart",
    color: "#F59E0B",
  },
  QUANT: {
    title: "Quantitative Ability",
    topicId: "qa-quantitative-ability",
    icon: "math",
    color: "#2563EB",
  },
};

// Raw dataset typed
const ALL_2024_QUESTIONS: PYQQuestion[] = cat2024Raw as PYQQuestion[];

// Load questions for specific Year, Slot, Section
export function getPYQQuestions(year: number, slot: string, section: string): PYQQuestion[] {
  if (year === 2024) {
    return ALL_2024_QUESTIONS.filter(
      (q) => q.slot.toLowerCase() === slot.toLowerCase() && q.section.toUpperCase() === section.toUpperCase()
    ).sort((a, b) => a.question_number - b.question_number);
  }
  return [];
}

// Get section info counts
export function getPYQSectionInfo(year: number, slot: string, section: "VARC" | "DILR" | "QUANT"): PYQSectionInfo {
  const questions = getPYQQuestions(year, slot, section);
  const mcqCount = questions.filter((q) => q.type === "MCQ").length;
  const titaCount = questions.filter((q) => q.type === "TITA").length;
  return {
    year,
    slot,
    section,
    sectionTitle: SECTION_METADATA[section]?.title || section,
    mcqCount,
    titaCount,
    totalCount: questions.length,
    durationMinutes: 40, // 40 mins CAT official timing
  };
}

// Helper: Extract correct option index (0..3) for MCQ
export function parseMCQCorrectIndex(correctAnswer: string, options: string[]): number {
  if (!correctAnswer) return 0;
  const choiceMatch = correctAnswer.match(/Choice\s+([A-E])/i);
  if (choiceMatch) {
    const letter = choiceMatch[1].toUpperCase();
    return letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, E=4
  }
  const numMatch = correctAnswer.match(/^\s*([1-5])\s*$/);
  if (numMatch) {
    return parseInt(numMatch[1], 10) - 1;
  }
  // Try finding matching option text
  if (options && options.length > 0) {
    const cleanAns = correctAnswer.replace(/Choice\s+[A-E]\s*/i, "").trim().toLowerCase();
    const idx = options.findIndex((opt) => opt.toLowerCase().includes(cleanAns) || cleanAns.includes(opt.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return 0;
}

// Helper: Extract clean TITA answer string
export function extractTITAAnswer(correctAnswer: string): string {
  if (!correctAnswer) return "";
  return correctAnswer.trim().replace(/^Choice\s+[A-E]\s*/i, "").trim();
}

// ── RAG Semantic Concept & Lesson Mapper ──
// Maps a question/explanation to the exact lesson in TechnoCAT syllabus
export function findRecommendedLessonForPYQ(q: PYQQuestion): {
  lessonId: string;
  lessonTitle: string;
  topicId: string;
  topicTitle: string;
  concept: string;
} {
  const text = `${q.context || ""} ${q.question || ""} ${q.explanation || ""}`.toLowerCase();
  const section = q.section.toUpperCase();

  if (section === "VARC") {
    const topic = TOPICS_DATA.find((t) => t.id === "varc-verbal-ability")!;
    if (text.includes("odd sentence") || text.includes("odd one out") || text.includes("odd sentence out")) {
      return { lessonId: "varc-4-3", lessonTitle: "Odd Sentence Out", topicId: topic.id, topicTitle: topic.title, concept: "Odd Sentence Out" };
    }
    if (text.includes("missing in the paragraph") || text.includes("sentence placement") || text.includes("placed in the passage")) {
      return { lessonId: "varc-4-4", lessonTitle: "Sentence Placement", topicId: topic.id, topicTitle: topic.title, concept: "Sentence Placement" };
    }
    if (text.includes("jumbled") || text.includes("para jumble") || text.includes("ordering the sentences")) {
      return { lessonId: "varc-4-2", lessonTitle: "Para Jumbles", topicId: topic.id, topicTitle: topic.title, concept: "Para Jumbles" };
    }
    if (text.includes("summary") || text.includes("summarises") || text.includes("summarizes")) {
      return { lessonId: "varc-4-1", lessonTitle: "Para Summary", topicId: topic.id, topicTitle: topic.title, concept: "Para Summary" };
    }
    if (text.includes("inference") || text.includes("can be inferred") || text.includes("implies")) {
      return { lessonId: "varc-2-1", lessonTitle: "Inference Questions", topicId: topic.id, topicTitle: topic.title, concept: "RC Inference Questions" };
    }
    if (text.includes("primary purpose") || text.includes("main idea") || text.includes("central theme")) {
      return { lessonId: "varc-1-4", lessonTitle: "Main Idea", topicId: topic.id, topicTitle: topic.title, concept: "RC Main Idea & Theme" };
    }
    if (text.includes("author's tone") || text.includes("tone") || text.includes("attitude")) {
      return { lessonId: "varc-2-3", lessonTitle: "Tone", topicId: topic.id, topicTitle: topic.title, concept: "Author's Tone & Perspective" };
    }
    if (text.includes("strengthen") || text.includes("weaken") || text.includes("undermine")) {
      return { lessonId: "varc-2-4", lessonTitle: "Strengthen/Weaken", topicId: topic.id, topicTitle: topic.title, concept: "Critical Reasoning: Strengthen & Weaken" };
    }
    if (text.includes("assumption")) {
      return { lessonId: "varc-2-5", lessonTitle: "Assumption", topicId: topic.id, topicTitle: topic.title, concept: "Critical Reasoning: Assumptions" };
    }
    return { lessonId: "varc-3-1", lessonTitle: "Option Elimination in CAT RC", topicId: topic.id, topicTitle: topic.title, concept: "Option Elimination in CAT RC" };
  }

  if (section === "DILR") {
    const topic = TOPICS_DATA.find((t) => t.id === "dilr-data-interpretation")!;
    if (text.includes("tournament") || text.includes("matches") || text.includes("teams") || text.includes("game") || text.includes("round")) {
      return { lessonId: "dilr-3-6", lessonTitle: "Games & Tournaments", topicId: topic.id, topicTitle: topic.title, concept: "Games & Tournaments" };
    }
    if (text.includes("route") || text.includes("network") || text.includes("cities") || text.includes("flight") || text.includes("toll")) {
      return { lessonId: "dilr-3-7", lessonTitle: "Routes & Networks", topicId: topic.id, topicTitle: topic.title, concept: "Routes & Networks" };
    }
    if (text.includes("circular") || text.includes("circle") || text.includes("round table")) {
      return { lessonId: "dilr-2-2", lessonTitle: "Circular Arrangement", topicId: topic.id, topicTitle: topic.title, concept: "Circular Arrangement" };
    }
    if (text.includes("linear") || text.includes("row") || text.includes("line")) {
      return { lessonId: "dilr-2-1", lessonTitle: "Linear Arrangement", topicId: topic.id, topicTitle: topic.title, concept: "Linear Arrangement" };
    }
    if (text.includes("matrix") || text.includes("grid") || text.includes("bloggers") || text.includes("stars") || text.includes("distribution")) {
      return { lessonId: "dilr-2-3", lessonTitle: "Matrix/Two-dimensional Arrangement", topicId: topic.id, topicTitle: topic.title, concept: "Matrix & Grid Logic" };
    }
    if (text.includes("venn") || text.includes("set of")) {
      return { lessonId: "dilr-3-3", lessonTitle: "Venn Diagram", topicId: topic.id, topicTitle: topic.title, concept: "Venn Diagram & Set Theory" };
    }
    if (text.includes("maxim") || text.includes("minim")) {
      return { lessonId: "dilr-3-9", lessonTitle: "Maximisation–Minimisation", topicId: topic.id, topicTitle: topic.title, concept: "Maximisation & Minimisation" };
    }
    if (text.includes("schedule") || text.includes("scheduling") || text.includes("time slot")) {
      return { lessonId: "dilr-2-4", lessonTitle: "Scheduling", topicId: topic.id, topicTitle: topic.title, concept: "Time Scheduling Logic" };
    }
    if (text.includes("table") || text.includes("tabular")) {
      return { lessonId: "dilr-1-1", lessonTitle: "Tables", topicId: topic.id, topicTitle: topic.title, concept: "Data Interpretation: Tables" };
    }
    return { lessonId: "dilr-1-5", lessonTitle: "Caselets", topicId: topic.id, topicTitle: topic.title, concept: "DILR Caselet Analysis" };
  }

  // QUANT
  const topic = TOPICS_DATA.find((t) => t.id === "qa-quantitative-ability")!;
  if (text.includes("speed") || text.includes("distance") || text.includes("train") || text.includes("car") || text.includes("km/h") || text.includes("upstream")) {
    return { lessonId: "qa-4-1", lessonTitle: "Speed, Time & Distance", topicId: topic.id, topicTitle: topic.title, concept: "Time, Speed & Distance" };
  }
  if (text.includes("work") || text.includes("efficiency") || text.includes("pipes") || text.includes("cistern") || text.includes("alone can complete")) {
    return { lessonId: "qa-3-3", lessonTitle: "Time & Work", topicId: topic.id, topicTitle: topic.title, concept: "Time & Work Mechanics" };
  }
  if (text.includes("interest") || text.includes("compound") || text.includes("simple interest")) {
    return { lessonId: "qa-3-1", lessonTitle: "Simple Interest", topicId: topic.id, topicTitle: topic.title, concept: "Commercial Math: Interest" };
  }
  if (text.includes("profit") || text.includes("loss") || text.includes("discount") || text.includes("marked price") || text.includes("cost price")) {
    return { lessonId: "qa-1-3", lessonTitle: "Profit & Loss", topicId: topic.id, topicTitle: topic.title, concept: "Profit, Loss & Discount" };
  }
  if (text.includes("ratio") || text.includes("proportion")) {
    return { lessonId: "qa-2-1", lessonTitle: "Ratio", topicId: topic.id, topicTitle: topic.title, concept: "Ratio & Proportion" };
  }
  if (text.includes("mixture") || text.includes("alligation") || text.includes("solution")) {
    return { lessonId: "qa-2-4", lessonTitle: "Mixtures", topicId: topic.id, topicTitle: topic.title, concept: "Mixtures & Alligations" };
  }
  if (text.includes("triangle") || text.includes("circle") || text.includes("radius") || text.includes("area") || text.includes("polygon") || text.includes("geometry") || text.includes("cylinder")) {
    return { lessonId: "qa-7-1", lessonTitle: "Lines & Angles", topicId: topic.id, topicTitle: topic.title, concept: "Geometry & Mensuration" };
  }
  if (text.includes("logarithm") || text.includes("log") || text.includes("quadratic") || text.includes("polynomial") || text.includes("roots") || text.includes("function") || text.includes("algebra") || text.includes("sequence") || text.includes("series") || text.includes("progression")) {
    return { lessonId: "qa-6-1", lessonTitle: "Algebraic Expressions & Identities", topicId: topic.id, topicTitle: topic.title, concept: "Algebra, Functions & Progressions" };
  }
  if (text.includes("prime") || text.includes("divisor") || text.includes("remainder") || text.includes("integer") || text.includes("digits") || text.includes("lcm") || text.includes("hcf")) {
    return { lessonId: "qa-5-1", lessonTitle: "Classification of Numbers", topicId: topic.id, topicTitle: topic.title, concept: "Number Systems & Divisibility" };
  }
  if (text.includes("permutation") || text.includes("combination") || text.includes("probability")) {
    return { lessonId: "qa-8-1", lessonTitle: "Fundamental Principle of Counting", topicId: topic.id, topicTitle: topic.title, concept: "Modern Math: P&C and Probability" };
  }

  return { lessonId: "qa-1-1", lessonTitle: "Percentages", topicId: topic.id, topicTitle: topic.title, concept: "Quantitative Foundations & Percentages" };
}

// Generate Weak Area Checklist from Missed Questions
export function generateWeakAreaChecklist(missedQuestions: PYQQuestion[]): PYQWeakAreaItem[] {
  const map = new Map<string, PYQWeakAreaItem>();
  missedQuestions.forEach((q) => {
    const rec = findRecommendedLessonForPYQ(q);
    if (!map.has(rec.lessonId)) {
      map.set(rec.lessonId, {
        lessonId: rec.lessonId,
        lessonTitle: rec.lessonTitle,
        topicId: rec.topicId,
        topicTitle: rec.topicTitle,
        concept: rec.concept,
        completed: false,
        reason: `Missed in ${q.section} (${q.type}): "${q.question.slice(0, 70)}..."`,
      });
    }
  });
  return Array.from(map.values());
}
