export type Timeframe = "7d" | "30d" | "all";

export interface MetricCalculationDetail {
  id: string;
  name: string;
  icon: string;
  category: "hero" | "habit" | "diagnostic";
  currentValue: Record<Timeframe, string>;
  benchmark: string;
  statusText: string;
  statusType: "success" | "warning" | "info" | "danger";
  formulaTitle: string;
  formulaLatex: string;
  formulaExplanation: string;
  stepByStepCalc: Record<Timeframe, string>;
  rawDataTable: Record<Timeframe, Array<{ label: string; attempted: number; correct: number; incorrect: number; timeMinutes: number; score: number }>>;
  aiAdvice: string[];
  actionLabel?: string;
  targetTopicId?: string;
  targetTopicTitle?: string;
}

export interface TopicMasteryItem {
  id: string;
  name: string;
  section: "QA" | "DILR" | "VARC";
  level: "Strong" | "Moderate" | "Needs Attention";
  accuracy: number;
  attempted: number;
  avgTimePerQ: string;
  lastPracticed: string;
}

export interface MockTestHistoryItem {
  id: string;
  name: string;
  date: string;
  rawScore: number;
  maxScore: number;
  percentile: number;
  accuracy: number;
  timeTaken: string;
  status: "Completed" | "Analyzed";
}

export interface AchievementBadge {
  id: string;
  title: string;
  desc: string;
  date: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progressPercent: number;
}

export const METRIC_DETAILS: Record<string, MetricCalculationDetail> = {
  percentile: {
    id: "percentile",
    name: "Projected CAT 2026 Percentile",
    icon: "🎯",
    category: "hero",
    currentValue: {
      "7d": "96.8 %ile",
      "30d": "96.4 %ile",
      "all": "95.2 %ile",
    },
    benchmark: "Target: 99.0+ %ile for IIM Ahmedabad / Bangalore / Calcutta",
    statusText: "Top 4% Aspirant Tier (On Track)",
    statusType: "success",
    formulaTitle: "IIM Normalization & Gaussian Z-Score Model",
    formulaLatex: "Percentile = Φ((Raw Score - Mean_CAT) / σ_CAT) × 100",
    formulaExplanation:
      "Calculated by calibrating your recent mock raw scores against the 5-year official CAT score vs percentile normalization tables across 3 exam slots.",
    stepByStepCalc: {
      "7d": "Raw Score: 88 marks across 66 questions → Slot-adjusted scaled score: 92.4 → Estimated CAT percentile: 96.8 %ile",
      "30d": "Average Scaled Score: 86.5 marks across 4 proctored mocks → Benchmarked against 280,000 CAT test takers → 96.4 %ile",
      "all": "Historical Average Scaled Score: 82.0 marks across all diagnostic tests → 95.2 %ile cumulative baseline",
    },
    rawDataTable: {
      "7d": [
        { label: "Quantitative Ability (QA)", attempted: 18, correct: 15, incorrect: 3, timeMinutes: 40, score: 42 },
        { label: "Data Interpretation & LR", attempted: 12, correct: 9, incorrect: 3, timeMinutes: 40, score: 24 },
        { label: "Verbal & Reading Comp", attempted: 16, correct: 12, incorrect: 4, timeMinutes: 40, score: 32 },
      ],
      "30d": [
        { label: "Quantitative Ability (QA)", attempted: 68, correct: 55, incorrect: 13, timeMinutes: 160, score: 152 },
        { label: "Data Interpretation & LR", attempted: 46, correct: 34, incorrect: 12, timeMinutes: 160, score: 90 },
        { label: "Verbal & Reading Comp", attempted: 58, correct: 45, incorrect: 13, timeMinutes: 160, score: 122 },
      ],
      "all": [
        { label: "Quantitative Ability (QA)", attempted: 142, correct: 110, incorrect: 32, timeMinutes: 380, score: 298 },
        { label: "Data Interpretation & LR", attempted: 98, correct: 69, incorrect: 29, timeMinutes: 360, score: 178 },
        { label: "Verbal & Reading Comp", attempted: 120, correct: 90, incorrect: 30, timeMinutes: 340, score: 240 },
      ],
    },
    aiAdvice: [
      "To break from 96.4%ile into 99.2%ile, you only need +12 net marks (4 more net correct questions in QA/DILR).",
      "Focus on avoiding negative markings on low-confidence geometry questions to instantly gain +4 raw marks.",
      "Maintain a 100% attempt rate on TITA (Type-In-The-Answer) questions because they carry 0 negative penalties!",
    ],
    actionLabel: "Drill Weak Areas for 99+ %ile",
    targetTopicId: "qa-quantitative-ability",
    targetTopicTitle: "Topic A: Quantitative Ability (QA)",
  },

  accuracy: {
    id: "accuracy",
    name: "Overall Question Accuracy Rate",
    icon: "📈",
    category: "hero",
    currentValue: {
      "7d": "84.2%",
      "30d": "81.4%",
      "all": "78.9%",
    },
    benchmark: "Ideal CAT benchmark: 80% - 85% with high question selection rigor",
    statusText: "High Precision (Well calibrated)",
    statusType: "success",
    formulaTitle: "Effective Attempt Precision Formula",
    formulaLatex: "Accuracy Rate (%) = (Total Correct Answers / Total Attempted Questions) × 100",
    formulaExplanation:
      "Measures the percentage of attempted MCQs and TITA questions that resulted in positive marks. High accuracy prevents marks from leaking to negative deductions.",
    stepByStepCalc: {
      "7d": "Correct: 38 | Attempted: 45 → (38 / 45) × 100 = 84.44% accuracy",
      "30d": "Correct: 134 | Attempted: 172 → (134 / 172) × 100 = 77.91% ~ 81.4% (weighted by sectional difficulty)",
      "all": "Correct: 269 | Attempted: 360 → (269 / 360) × 100 = 74.72% ~ 78.9% cumulative",
    },
    rawDataTable: {
      "7d": [
        { label: "Arithmetic & Percentages", attempted: 14, correct: 13, incorrect: 1, timeMinutes: 24, score: 38 },
        { label: "Geometry & Triangles", attempted: 11, correct: 8, incorrect: 3, timeMinutes: 28, score: 21 },
        { label: "DILR Arrangements", attempted: 10, correct: 8, incorrect: 2, timeMinutes: 35, score: 22 },
        { label: "RC Philosophy / Science", attempted: 10, correct: 9, incorrect: 1, timeMinutes: 20, score: 26 },
      ],
      "30d": [
        { label: "Arithmetic & Speed Maths", attempted: 45, correct: 40, incorrect: 5, timeMinutes: 72, score: 115 },
        { label: "Algebra & Functions", attempted: 38, correct: 29, incorrect: 9, timeMinutes: 80, score: 78 },
        { label: "Geometry & Mensuration", attempted: 32, correct: 22, incorrect: 10, timeMinutes: 78, score: 56 },
        { label: "DILR Tables & Caselets", attempted: 35, correct: 26, incorrect: 9, timeMinutes: 110, score: 69 },
        { label: "VARC Reading Comprehension", attempted: 42, correct: 35, incorrect: 7, timeMinutes: 84, score: 98 },
      ],
      "all": [
        { label: "Quantitative Ability Total", attempted: 155, correct: 122, incorrect: 33, timeMinutes: 320, score: 333 },
        { label: "DILR Total", attempted: 98, correct: 74, incorrect: 24, timeMinutes: 290, score: 198 },
        { label: "VARC Total", attempted: 107, correct: 86, incorrect: 21, timeMinutes: 240, score: 237 },
      ],
    },
    aiAdvice: [
      "Arithmetic accuracy is at an exceptional 92%—keep this as your primary score accelerator.",
      "Geometry accuracy dips to 68%. Whenever you see multi-circle or 3D coordinate geometry, mark for review instead of solving on sight.",
      "Aim for 85%+ accuracy in VARC by eliminating choices using author tone and scope verification.",
    ],
    actionLabel: "Practice Geometry Diagnostic",
    targetTopicId: "qa-quantitative-ability",
    targetTopicTitle: "Topic A: Quantitative Ability (QA)",
  },

  speed: {
    id: "speed",
    name: "Speed Index (Pacing per Question)",
    icon: "⚡",
    category: "hero",
    currentValue: {
      "7d": "1m 42s",
      "30d": "1m 48s",
      "all": "2m 04s",
    },
    benchmark: "Optimal CAT Pace: 1m 45s - 1m 55s (allows 2 review cycles)",
    statusText: "+14s faster than peer average",
    statusType: "info",
    formulaTitle: "Question Pacing & Throughput Metric",
    formulaLatex: "Speed Index = Total Active Test Time (seconds) / Total Attempted Questions",
    formulaExplanation:
      "Reflects your decision-making agility and question scanning rate. CAT is a 2-hour sprint (40 mins/section); lingering beyond 2m 30s on a question drastically damages sectional clearance.",
    stepByStepCalc: {
      "7d": "Active Test Duration: 4,590 seconds / 45 attempted questions = 102 seconds (1m 42s/question)",
      "30d": "Active Test Duration: 18,576 seconds / 172 attempted questions = 108 seconds (1m 48s/question)",
      "all": "Active Test Duration: 44,640 seconds / 360 attempted questions = 124 seconds (2m 04s/question)",
    },
    rawDataTable: {
      "7d": [
        { label: "QA Arithmetic Questions", attempted: 14, correct: 13, incorrect: 1, timeMinutes: 19, score: 38 },
        { label: "QA Algebra Questions", attempted: 10, correct: 8, incorrect: 2, timeMinutes: 18, score: 22 },
        { label: "DILR Set 1 (Matrix Arrangement)", attempted: 4, correct: 4, incorrect: 0, timeMinutes: 11, score: 12 },
        { label: "VARC Passages (2 Passages, 8Q)", attempted: 8, correct: 7, incorrect: 1, timeMinutes: 15, score: 20 },
      ],
      "30d": [
        { label: "QA Speed (Arithmetic & Numbers)", attempted: 55, correct: 48, incorrect: 7, timeMinutes: 82, score: 137 },
        { label: "QA Deep Solve (Geometry & PnC)", attempted: 40, correct: 28, incorrect: 12, timeMinutes: 92, score: 72 },
        { label: "DILR Set Selection & Solve", attempted: 46, correct: 35, incorrect: 11, timeMinutes: 145, score: 94 },
        { label: "VARC Passage Reading & Answering", attempted: 52, correct: 44, incorrect: 8, timeMinutes: 88, score: 124 },
      ],
      "all": [
        { label: "Phase 1: Foundation Building", attempted: 120, correct: 85, incorrect: 35, timeMinutes: 290, score: 220 },
        { label: "Phase 2: Timed Sectionals", attempted: 140, correct: 112, incorrect: 28, timeMinutes: 260, score: 308 },
        { label: "Phase 3: Proctored Mocks", attempted: 100, correct: 82, incorrect: 18, timeMinutes: 180, score: 228 },
      ],
    },
    aiAdvice: [
      "Your VARC reading speed is 280 words/min—optimal for digesting 500-word CAT passages in under 2 minutes.",
      "In DILR, invest the first 4 minutes exclusively scanning all 4 sets to pick the easiest 2 sets to guarantee 100% accuracy.",
      "If a Quant question requires more than 3 distinct equations, abandon it immediately and return during Round 2.",
    ],
    actionLabel: "Analyze DILR Strategy",
    targetTopicId: "dilr-data-interpretation",
    targetTopicTitle: "Topic B: Data Interpretation & Logical Reasoning",
  },

  negativeMarking: {
    id: "negativeMarking",
    name: "Marks Lost to Negative Marking",
    icon: "⚠️",
    category: "hero",
    currentValue: {
      "7d": "-7 Marks",
      "30d": "-26 Marks",
      "all": "-68 Marks",
    },
    benchmark: "Target: Keep negative deductions below -10 marks per full mock",
    statusText: "+8.2%ile Potential Score Recoverable",
    statusType: "danger",
    formulaTitle: "CAT MCQ Penalty Impact Model",
    formulaLatex: "Marks Deducted = Incorrect Multiple-Choice Questions × (-1 mark)",
    formulaExplanation:
      "In CAT, every wrong MCQ costs -1 mark in penalty plus the +3 marks you failed to earn (a net opportunity cost of 4 marks per error!). TITA questions have zero negative markings.",
    stepByStepCalc: {
      "7d": "7 wrong MCQs × (-1) = -7 marks lost. If skipped: Net Score +7 marks → Percentile rises from 96.8 to 97.9 %ile.",
      "30d": "26 wrong MCQs × (-1) = -26 marks lost across 4 tests. Average loss of -6.5 marks/test.",
      "all": "68 cumulative wrong MCQs = -68 marks forfeited to wild guessing.",
    },
    rawDataTable: {
      "7d": [
        { label: "QA Geometry (Over-guessing)", attempted: 4, correct: 1, incorrect: 3, timeMinutes: 9, score: 0 },
        { label: "DILR Binary Logic (Incomplete case)", attempted: 4, correct: 2, incorrect: 2, timeMinutes: 14, score: 4 },
        { label: "VARC Inference (Close options trap)", attempted: 4, correct: 2, incorrect: 2, timeMinutes: 8, score: 4 },
      ],
      "30d": [
        { label: "QA Algebra & Higher Math MCQs", attempted: 18, correct: 9, incorrect: 9, timeMinutes: 38, score: 18 },
        { label: "QA Geometry & Mensuration MCQs", attempted: 14, correct: 7, incorrect: 7, timeMinutes: 34, score: 14 },
        { label: "DILR Games & Tournaments MCQs", attempted: 10, correct: 4, incorrect: 6, timeMinutes: 32, score: 6 },
        { label: "VARC Reading Comprehension MCQs", attempted: 16, correct: 12, incorrect: 4, timeMinutes: 32, score: 32 },
      ],
      "all": [
        { label: "Quantitative Ability Negatives", attempted: 55, correct: 27, incorrect: 28, timeMinutes: 110, score: 53 },
        { label: "DILR Negatives", attempted: 38, correct: 18, incorrect: 20, timeMinutes: 120, score: 34 },
        { label: "VARC Negatives", attempted: 36, correct: 16, incorrect: 20, timeMinutes: 72, score: 28 },
      ],
    },
    aiAdvice: [
      "Rule of Thumb: If you cannot eliminate at least 2 incorrect options, never guess on CAT MCQs.",
      "Use 'Flag for Review' rather than selecting a hunch option right before the sectional timer runs out.",
      "Always attempt every TITA question before submitting—there is literally zero penalty for incorrect TITA answers.",
    ],
    actionLabel: "Take Precision Diagnostic Test",
    targetTopicId: "qa-quantitative-ability",
    targetTopicTitle: "Topic A: Quantitative Ability (QA)",
  },

  dailyConsistency: {
    id: "dailyConsistency",
    name: "Daily Study Consistency",
    icon: "⏱️",
    category: "habit",
    currentValue: {
      "7d": "52m / 60m goal",
      "30d": "48m / 60m goal",
      "all": "45m / 60m goal",
    },
    benchmark: "Recommended: 60 - 90 minutes daily focused revision",
    statusText: "86% of Daily Target Met",
    statusType: "success",
    formulaTitle: "Habit Adherence Score",
    formulaLatex: "Consistency Ratio = (Actual Daily Study Minutes / Target 60 Minutes) × 100",
    formulaExplanation:
      "Calculated from daily logged video runtime, practice challenge timer, and diagnostic quizzes completed within each 24-hour cycle.",
    stepByStepCalc: {
      "7d": "Total week study: 364 mins across 7 days = 52.0 mins/day (86.7% of target)",
      "30d": "Total month study: 1,440 mins across 30 days = 48.0 mins/day (80.0% of target)",
      "all": "All-time logged active study time: 2,700 mins across 60 days active = 45.0 mins/day",
    },
    rawDataTable: {
      "7d": [
        { label: "Monday", attempted: 12, correct: 10, incorrect: 2, timeMinutes: 58, score: 28 },
        { label: "Tuesday", attempted: 15, correct: 13, incorrect: 2, timeMinutes: 65, score: 37 },
        { label: "Wednesday", attempted: 8, correct: 7, incorrect: 1, timeMinutes: 45, score: 20 },
        { label: "Thursday", attempted: 14, correct: 11, incorrect: 3, timeMinutes: 62, score: 30 },
        { label: "Friday", attempted: 10, correct: 8, incorrect: 2, timeMinutes: 50, score: 22 },
        { label: "Saturday", attempted: 6, correct: 5, incorrect: 1, timeMinutes: 38, score: 14 },
        { label: "Sunday", attempted: 9, correct: 8, incorrect: 1, timeMinutes: 46, score: 23 },
      ],
      "30d": [
        { label: "Week 1 (Aug 11 - Aug 17)", attempted: 65, correct: 52, incorrect: 13, timeMinutes: 320, score: 143 },
        { label: "Week 2 (Aug 18 - Aug 24)", attempted: 72, correct: 58, incorrect: 14, timeMinutes: 380, score: 160 },
        { label: "Week 3 (Aug 25 - Aug 31)", attempted: 80, correct: 66, incorrect: 14, timeMinutes: 420, score: 184 },
        { label: "Week 4 (Sep 01 - Sep 07)", attempted: 68, correct: 55, incorrect: 13, timeMinutes: 364, score: 152 },
      ],
      "all": [
        { label: "Video Learning Time", attempted: 0, correct: 0, incorrect: 0, timeMinutes: 1420, score: 0 },
        { label: "Practice Quiz Time", attempted: 220, correct: 178, incorrect: 42, timeMinutes: 860, score: 492 },
        { label: "Full Mock Test Duration", attempted: 140, correct: 112, incorrect: 28, timeMinutes: 420, score: 308 },
      ],
    },
    aiAdvice: [
      "You study best between 8:00 PM and 10:30 PM (highest quiz accuracy occurs during evening slots).",
      "Saturday has your lowest study volume (38 mins). Consider scheduling an easy 30-min VARC editorial read on Saturdays.",
    ],
  },

  weeklyVolume: {
    id: "weeklyVolume",
    name: "Weekly Study Volume",
    icon: "📅",
    category: "habit",
    currentValue: {
      "7d": "14.8 Hours",
      "30d": "12.6 Hours/wk avg",
      "all": "11.2 Hours/wk avg",
    },
    benchmark: "Target: 12.0 Hours per week for comprehensive CAT coverage",
    statusText: "123% of Weekly Goal Achieved",
    statusType: "success",
    formulaTitle: "Weekly Cumulative Effort",
    formulaLatex: "Weekly Hours = (Sum of All Daily Minutes in 7-Day Window) / 60",
    formulaExplanation:
      "Measures total cognitive investment across video lectures, notes review, sectional drills, and Sunday full-length mocks.",
    stepByStepCalc: {
      "7d": "888 minutes logged over past 7 days / 60 = 14.8 hours (exceeding 12.0h goal by +2.8h)",
      "30d": "3,024 minutes over past 4 weeks / 4 / 60 = 12.6 hours per week",
      "all": "6,720 minutes total active time / 10 active weeks = 11.2 hours per week average",
    },
    rawDataTable: {
      "7d": [
        { label: "Lecture Modules", attempted: 0, correct: 0, incorrect: 0, timeMinutes: 380, score: 0 },
        { label: "Sectional Practice", attempted: 45, correct: 38, incorrect: 7, timeMinutes: 240, score: 107 },
        { label: "Full Mock Simulation", attempted: 66, correct: 52, incorrect: 14, timeMinutes: 120, score: 142 },
        { label: "AI Flashcards & Revision", attempted: 30, correct: 27, incorrect: 3, timeMinutes: 148, score: 78 },
      ],
      "30d": [
        { label: "Quantitative Ability Work", attempted: 85, correct: 70, incorrect: 15, timeMinutes: 1240, score: 195 },
        { label: "DILR Logic Puzzles", attempted: 55, correct: 42, incorrect: 13, timeMinutes: 980, score: 113 },
        { label: "VARC Reading & Vocab", attempted: 65, correct: 54, incorrect: 11, timeMinutes: 804, score: 151 },
      ],
      "all": [
        { label: "Total Quant Prep", attempted: 180, correct: 145, incorrect: 35, timeMinutes: 2800, score: 400 },
        { label: "Total DILR Prep", attempted: 120, correct: 92, incorrect: 28, timeMinutes: 2100, score: 248 },
        { label: "Total VARC Prep", attempted: 140, correct: 115, incorrect: 25, timeMinutes: 1820, score: 320 },
      ],
    },
    aiAdvice: [
      "Outstanding commitment! You are pacing 2.8 hours ahead of standard CAT working professionals.",
      "Ensure you allocate at least 25% of your weekly volume to Mock Error Log analysis—reviewing mistakes yields 3x higher retention than passive watching.",
    ],
  },

  deepFocus: {
    id: "deepFocus",
    name: "Deep Focus Session",
    icon: "🧠",
    category: "habit",
    currentValue: {
      "7d": "2h 15m",
      "30d": "2h 15m",
      "all": "2h 45m",
    },
    benchmark: "CAT Exam Duration is 2 Hours continuous without breaks",
    statusText: "Ready for 120-Minute Exam Stamina",
    statusType: "info",
    formulaTitle: "Continuous Cognitive Endurance Index",
    formulaLatex: "Deep Focus = Max(Continuous uninterrupted active session without >2 min pause)",
    formulaExplanation:
      "Tracks your ability to maintain intense mental concentration without switching tabs, pausing videos, or abandoning tests. Vital for surviving CAT's rigorous 120-minute cognitive pressure.",
    stepByStepCalc: {
      "7d": "Longest single continuous session: 135 minutes (Full Mock Test + Immediate Error Review on Sunday)",
      "30d": "Longest single continuous session: 135 minutes recorded during Proctored Mock 3",
      "all": "Personal Best: 165 minutes during QA Marathon on August 14th",
    },
    rawDataTable: {
      "7d": [
        { label: "Sunday Mock Session", attempted: 66, correct: 53, incorrect: 13, timeMinutes: 135, score: 146 },
        { label: "Tuesday QA Algebra Deep Dive", attempted: 20, correct: 17, incorrect: 3, timeMinutes: 65, score: 48 },
        { label: "Thursday DILR Set Solving", attempted: 16, correct: 13, incorrect: 3, timeMinutes: 62, score: 36 },
      ],
      "30d": [
        { label: "Proctored Mock 1", attempted: 66, correct: 48, incorrect: 18, timeMinutes: 120, score: 126 },
        { label: "Proctored Mock 2", attempted: 66, correct: 50, incorrect: 16, timeMinutes: 120, score: 134 },
        { label: "Proctored Mock 3 + Review", attempted: 66, correct: 54, incorrect: 12, timeMinutes: 135, score: 150 },
      ],
      "all": [
        { label: "QA Marathon", attempted: 45, correct: 38, incorrect: 7, timeMinutes: 165, score: 107 },
        { label: "DILR Master Workshop", attempted: 30, correct: 24, incorrect: 6, timeMinutes: 150, score: 66 },
        { label: "All Mocks Combined", attempted: 264, correct: 208, incorrect: 56, timeMinutes: 495, score: 568 },
      ],
    },
    aiAdvice: [
      "Your mental stamina easily clears the 2-hour CAT threshold. Great job maintaining focus throughout Section 3 (QA) when mental fatigue usually peaks.",
      "Stay hydrated during test sessions to combat cognitive slowdown in the final 20 minutes.",
    ],
  },

  streak: {
    id: "streak",
    name: "Active Study Streak",
    icon: "🔥",
    category: "habit",
    currentValue: {
      "7d": "7 Consecutive Days",
      "30d": "18 Days Active",
      "all": "34 Days Total",
    },
    benchmark: "7-Day Milestone Unlocked (Streak Shield Active)",
    statusText: "Flame Multiplier Active",
    statusType: "success",
    formulaTitle: "Daily Habit Continuity Tracker",
    formulaLatex: "Streak Count = Continuous consecutive days with >= 20 mins logged study activity",
    formulaExplanation:
      "A daily streak requires at least 20 minutes of verified learning, video watching, or quiz solving before midnight IST.",
    stepByStepCalc: {
      "7d": "Completed targets every single day from Sep 4 to Sep 10 (7 days in a row)!",
      "30d": "Active on 18 out of past 30 days (60% monthly frequency)",
      "all": "34 total active days recorded since enrolling in TechnoCAT",
    },
    rawDataTable: {
      "7d": [
        { label: "Day 1 (Sep 4)", attempted: 10, correct: 9, incorrect: 1, timeMinutes: 45, score: 26 },
        { label: "Day 2 (Sep 5)", attempted: 8, correct: 7, incorrect: 1, timeMinutes: 38, score: 20 },
        { label: "Day 3 (Sep 6)", attempted: 12, correct: 10, incorrect: 2, timeMinutes: 52, score: 28 },
        { label: "Day 4 (Sep 7)", attempted: 15, correct: 13, incorrect: 2, timeMinutes: 65, score: 37 },
        { label: "Day 5 (Sep 8)", attempted: 10, correct: 8, incorrect: 2, timeMinutes: 50, score: 22 },
        { label: "Day 6 (Sep 9)", attempted: 14, correct: 12, incorrect: 2, timeMinutes: 58, score: 34 },
        { label: "Day 7 (Sep 10)", attempted: 11, correct: 9, incorrect: 2, timeMinutes: 56, score: 25 },
      ],
      "30d": [
        { label: "Active Days in Week 1", attempted: 35, correct: 28, incorrect: 7, timeMinutes: 210, score: 77 },
        { label: "Active Days in Week 2", attempted: 42, correct: 34, incorrect: 8, timeMinutes: 280, score: 94 },
        { label: "Active Days in Week 3", attempted: 40, correct: 32, incorrect: 8, timeMinutes: 260, score: 88 },
        { label: "Active Days in Week 4", attempted: 55, correct: 46, incorrect: 9, timeMinutes: 338, score: 129 },
      ],
      "all": [
        { label: "All Consecutive Streaks", attempted: 172, correct: 140, incorrect: 32, timeMinutes: 1088, score: 388 },
      ],
    },
    aiAdvice: [
      "Consistent daily revision beats weekend cramming by 4.2x in long-term memory retrieval.",
      "Complete at least one 10-minute diagnostic quiz tomorrow to keep the flame burning and reach the 14-Day Streak badge!",
    ],
  },
};

export const TOPIC_MASTERY_LIST: TopicMasteryItem[] = [
  {
    id: "qa-percentages",
    name: "Percentages, Profit & Loss",
    section: "QA",
    level: "Strong",
    accuracy: 94,
    attempted: 35,
    avgTimePerQ: "1m 18s",
    lastPracticed: "Yesterday",
  },
  {
    id: "qa-algebra",
    name: "Linear & Quadratic Equations",
    section: "QA",
    level: "Strong",
    accuracy: 88,
    attempted: 28,
    avgTimePerQ: "1m 35s",
    lastPracticed: "2 days ago",
  },
  {
    id: "dilr-arrangements",
    name: "Linear & Circular Arrangements",
    section: "DILR",
    level: "Strong",
    accuracy: 85,
    attempted: 24,
    avgTimePerQ: "2m 10s",
    lastPracticed: "3 days ago",
  },
  {
    id: "varc-rc",
    name: "Reading Comprehension (Inference)",
    section: "VARC",
    level: "Moderate",
    accuracy: 78,
    attempted: 42,
    avgTimePerQ: "1m 45s",
    lastPracticed: "Today",
  },
  {
    id: "qa-geometry",
    name: "Circles, Triangles & Polygons",
    section: "QA",
    level: "Needs Attention",
    accuracy: 64,
    attempted: 30,
    avgTimePerQ: "2m 24s",
    lastPracticed: "Yesterday",
  },
  {
    id: "dilr-games",
    name: "Games & Tournaments / Matrices",
    section: "DILR",
    level: "Needs Attention",
    accuracy: 58,
    attempted: 18,
    avgTimePerQ: "3m 05s",
    lastPracticed: "4 days ago",
  },
  {
    id: "varc-para-jumbles",
    name: "Para Jumbles & Odd Sentence Out",
    section: "VARC",
    level: "Moderate",
    accuracy: 72,
    attempted: 22,
    avgTimePerQ: "1m 50s",
    lastPracticed: "3 days ago",
  },
  {
    id: "qa-modern-math",
    name: "Permutations, Combinations & Prob",
    section: "QA",
    level: "Needs Attention",
    accuracy: 52,
    attempted: 25,
    avgTimePerQ: "2m 45s",
    lastPracticed: "5 days ago",
  },
];

export const MOCK_TEST_HISTORY: MockTestHistoryItem[] = [
  {
    id: "mock-1",
    name: "TechnoCAT National Diagnostic Mock 1",
    date: "Aug 16, 2026",
    rawScore: 68,
    maxScore: 198,
    percentile: 91.2,
    accuracy: 74,
    timeTaken: "120 mins",
    status: "Completed",
  },
  {
    id: "mock-2",
    name: "TechnoCAT Full Proctored Mock 2",
    date: "Aug 23, 2026",
    rawScore: 78,
    maxScore: 198,
    percentile: 93.8,
    accuracy: 78,
    timeTaken: "120 mins",
    status: "Completed",
  },
  {
    id: "mock-3",
    name: "TechnoCAT Full Proctored Mock 3",
    date: "Aug 30, 2026",
    rawScore: 84,
    maxScore: 198,
    percentile: 95.4,
    accuracy: 81,
    timeTaken: "120 mins",
    status: "Completed",
  },
  {
    id: "mock-4",
    name: "TechnoCAT Full Proctored Mock 4 (CAT Pattern)",
    date: "Sep 06, 2026",
    rawScore: 92,
    maxScore: 198,
    percentile: 96.8,
    accuracy: 84,
    timeTaken: "120 mins",
    status: "Completed",
  },
  {
    id: "mock-5",
    name: "TechnoCAT All-India Mock 5 (Slot 1 Sim)",
    date: "Upcoming (Sep 13)",
    rawScore: 0,
    maxScore: 198,
    percentile: 0,
    accuracy: 0,
    timeTaken: "120 mins",
    status: "Analyzed",
  },
];

export const ACHIEVEMENTS_LIST: AchievementBadge[] = [
  {
    id: "first-blood",
    title: "First Blood",
    desc: "Completed your first module in Quantitative Ability",
    date: "May 10, 2026",
    icon: "🏆",
    color: "#fef3c7",
    unlocked: true,
    progressPercent: 100,
  },
  {
    id: "perfect-score",
    title: "Perfect Score",
    desc: "Scored 100% in a 10-question sectional diagnostic",
    date: "May 15, 2026",
    icon: "⭐",
    color: "#dbeafe",
    unlocked: true,
    progressPercent: 100,
  },
  {
    id: "7-day-streak",
    title: "7-Day Streak",
    desc: "Studied for 7 consecutive days without missing a single date",
    date: "Sep 10, 2026",
    icon: "🔥",
    color: "#fee2e2",
    unlocked: true,
    progressPercent: 100,
  },
  {
    id: "quant-master",
    title: "Quant Master",
    desc: "Completed over 50% of the Quantitative Ability syllabus",
    date: "May 28, 2026",
    icon: "📈",
    color: "#dcfce7",
    unlocked: true,
    progressPercent: 100,
  },
  {
    id: "speed-demon",
    title: "Speed Demon",
    desc: "Solved 10 Arithmetic questions with an average time under 90 seconds",
    date: "Sep 02, 2026",
    icon: "⚡",
    color: "#e0e7ff",
    unlocked: true,
    progressPercent: 100,
  },
  {
    id: "dilr-decoder",
    title: "DILR Decoder",
    desc: "Cracked 15 consecutive 4-question DILR arrangements with zero errors",
    date: "In Progress",
    icon: "🧩",
    color: "#f3e8ff",
    unlocked: false,
    progressPercent: 75,
  },
];

export const WEEKLY_ACTIVITY_DATA = [
  { day: "Mon", learning: 1.4, challenges: 0.8, total: 2.2 },
  { day: "Tue", learning: 1.8, challenges: 1.2, total: 3.0 },
  { day: "Wed", learning: 1.0, challenges: 0.6, total: 1.6 },
  { day: "Thu", learning: 2.0, challenges: 1.5, total: 3.5 },
  { day: "Fri", learning: 1.6, challenges: 1.0, total: 2.6 },
  { day: "Sat", learning: 0.8, challenges: 0.5, total: 1.3 },
  { day: "Sun", learning: 2.2, challenges: 2.0, total: 4.2 },
];

export const KNOWLEDGE_DISTRIBUTION_DATA = [
  { name: "Quantitative Ability", value: 42, color: "#2563EB", hours: "14.2h" },
  { name: "DILR", value: 33, color: "#8B5CF6", hours: "11.1h" },
  { name: "VARC", value: 25, color: "#10B981", hours: "8.4h" },
];

export const DIFFICULTY_BREAKDOWN_DATA = [
  { section: "QA", easy: 94, medium: 82, hard: 54 },
  { section: "DILR", easy: 88, medium: 76, hard: 48 },
  { section: "VARC", easy: 91, medium: 80, hard: 62 },
];
