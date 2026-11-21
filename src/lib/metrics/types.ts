// The single metrics contract used by every page (Dashboard, My Analytics, Intelligence Hub…).
// Real accounts: computed by computeStudentMetrics() from recorded activity.
// Demo showcase account: DEMO_METRICS fixture with exactly this shape.
// Values that cannot be computed yet are null (the UI shows an empty state, never a guess).

export type SectionKey = "VARC" | "DILR" | "QA";

export interface SectionMetrics {
  attempted: number; // questions answered in timed tests
  correct: number;
  accuracy: number | null; // %
  pyqAttempts: number;
  bestScore: number | null; // best PYQ section score (CAT marking)
  maxScore: number; // full-section maximum
  latestScore: number | null;
  estimatedPercentile: number | null; // from the latest PYQ attempt of this section
}

export interface TestRecord {
  attemptId: string;
  kind: "pyq" | "module_quiz" | "grand_quiz" | "lesson_practice" | "topic_drill";
  title: string;
  topicId: string | null;
  section: SectionKey | null;
  score: number;
  maxScore: number;
  percentage: number;
  correct: number;
  wrong: number;
  attempted: number;
  questionCount: number;
  accuracy: number | null;
  passed: boolean | null;
  durationSeconds: number;
  secondsPerQuestion: number | null;
  estimatedPercentile: number | null; // PYQ sections only
  submittedAt: string;
}

export interface ConceptStat {
  concept: string;
  lessonId: string | null;
  section: SectionKey | null;
  attempted: number;
  correct: number;
  accuracy: number;
}

export interface MistakeRecord {
  attemptId: string;
  questionId: string;
  kind: TestRecord["kind"];
  section: SectionKey | null;
  concept: string | null;
  lessonId: string | null;
  questionType: "MCQ" | "TITA";
  selectedOption: number | null; // what the student picked (MCQ, 0-based)
  titaAnswer: string | null; // what the student typed (TITA)
  marksLost: number; // 1 for a wrong MCQ in CAT marking (negative mark), else 0
  timeSpentSeconds: number | null;
  submittedAt: string;
}

export interface DailyStudy {
  date: string; // YYYY-MM-DD, app timezone
  learningSeconds: number; // lessons
  practiceSeconds: number; // quizzes, PYQs, lesson practice
}

export interface TopicProgressMetrics {
  topicId: string;
  title: string;
  section: SectionKey | null;
  progressPercent: number;
  lessonsCompleted: number;
  totalLessons: number;
  pointsEarned: number;
  studySeconds: number;
}

export interface StudentMetrics {
  generatedAt: string;
  isDemo: boolean;
  hasActivity: boolean; // any lesson, quiz or study time at all

  readiness: {
    score: number | null; // 0–100, null until there is at least one timed test
    components: {
      concepts: number; // % of the CAT syllabus lessons completed
      accuracy: number | null; // % correct in timed tests
      speed: number | null; // 0–100 pace index vs CAT pace
      consistency: number; // % of the last 14 days with study activity
    };
    weights: { concepts: number; accuracy: number; speed: number; consistency: number };
  };

  accuracy: {
    overall: number | null;
    attempted: number;
    correct: number;
    wrong: number;
    negativeMarksLost: number; // CAT -1 per wrong MCQ in PYQs
  };

  speed: {
    secondsPerQuestion: number | null; // timed tests, attempted questions only
    index: number | null;
    benchmarkSecondsPerQuestion: number;
  };

  consistency: { activeDaysLast14: number; score: number };
  streak: { current: number; best: number; activeToday: boolean };

  studyTime: {
    todaySeconds: number;
    last7DaysSeconds: number;
    totalSeconds: number;
    daily: DailyStudy[]; // last 30 days, oldest first
  };

  courses: {
    enrolled: number;
    inProgress: number;
    completed: number;
    lessonsCompleted: number; // all enrolled courses
    syllabusLessonsCompleted: number; // VARC + DILR + QA courses only
    syllabusLessons: number;
    topics: TopicProgressMetrics[];
  };

  points: { total: number; recent: { points: number; reason: string; ref: string; createdAt: string }[] };

  sections: Record<SectionKey, SectionMetrics>;

  percentile: {
    overallEstimate: number | null; // needs a PYQ attempt in all three sections
    overallScore: number | null; // sum of the latest section scores used
    basis: string;
    disclaimer: string;
  };

  tests: {
    recent: TestRecord[]; // newest first, all kinds
    pyq: TestRecord[]; // newest first
    modulesPassed: number;
    moduleAttempts: number;
    grandQuizzesPassed: number;
  };

  concepts: { weak: ConceptStat[]; strong: ConceptStat[]; all: ConceptStat[] }; // all: ≥3 answers, by accuracy asc
  mistakes: MistakeRecord[]; // newest first, capped

  tasks: { todayTotal: number; todayDone: number; overdue: number; upcomingWeek: number };
}
