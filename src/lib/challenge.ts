// 7-Day CAT Challenge plan, types, auto-verification rules, and demo showcase builder.
//
// Each day has a distinct focus and mix of tasks, with high-leverage CAT habits (timed PYQs,
// performance review, lessons, quizzes, focused study, AI mentor, study planner) repeating
// across the week. Every task is auto-verified from real persisted user activity on that day
// in the app timezone (Asia/Kolkata).

import { addDays, todayInAppTz } from "@/lib/time";

export type ChallengeTaskIcon =
  | "mock"
  | "analysis"
  | "lesson"
  | "quiz"
  | "study"
  | "planner"
  | "mentor"
  | "mistakes"
  | "community";

export type ChallengeTaskRule =
  | "lesson_completed"
  | "planner_task"
  | "ai_mentor"
  | "practice_quiz"
  | "study_15m"
  | "study_20m"
  | "analysis_review"
  | "pyq_mock"
  | "community_engage";

export type ChallengeTaskStatus = "completed" | "missed" | "pending" | "upcoming";
export type ChallengeDayStatus = "completed" | "incomplete" | "today" | "upcoming";

export interface ChallengeTaskTemplate {
  id: string;
  rule: ChallengeTaskRule;
  name: string;
  description: string;
  duration: string;
  tag: string;
  icon: ChallengeTaskIcon;
  href: string;
  action?: "open-mentor";
}

export interface ChallengeDayTemplate {
  day: number;
  title: string;
  desc: string;
  quote: string;
  tasks: ChallengeTaskTemplate[];
}

export interface ChallengeTask {
  id: string;
  rule: ChallengeTaskRule;
  name: string;
  description: string;
  duration: string;
  tag: string;
  icon: ChallengeTaskIcon;
  href: string;
  action?: "open-mentor";
  done: boolean;
  status: ChallengeTaskStatus;
}

export interface ChallengeDay {
  day: number;
  date: string;
  status: ChallengeDayStatus;
  title: string;
  desc: string;
  quote: string;
  tasks: ChallengeTask[];
  progress: {
    tasksDone: number;
    tasksTotal: number;
  };
}

export interface ChallengeData {
  startDate: string;
  cycleStartDate: string;
  cycleNumber: number;
  currentDay: number;
  completedDays: number;
  totalDays: number;
  days: ChallengeDay[];
}

export interface DailyActivitySnapshot {
  pyqDates: Set<string>;
  practiceQuizDates: Set<string>;
  analysisDates: Set<string>;
  lessonDates: Set<string>;
  studySecondsByDate: Map<string, number>;
  plannerTaskDates: Set<string>;
  aiMentorDates: Set<string>;
  communityDates: Set<string>;
}

export const CHALLENGE_DAYS_PLAN: ChallengeDayTemplate[] = [
  {
    day: 1,
    title: "Foundation & Concept Sprint",
    desc: "Kick off your 7-day sprint by finishing a syllabus lesson, checking off a planner goal, and clarifying a strategy doubt.",
    quote: "Strong fundamentals turn difficult CAT questions into effortless marks.",
    tasks: [
      {
        id: "d1-lesson",
        rule: "lesson_completed",
        name: "Complete 1 Concept Lesson",
        description: "Watch and complete any lecture in Quantitative Ability, DILR, or VARC.",
        duration: "~ 25 mins",
        tag: "Concept",
        icon: "lesson",
        href: "/topics",
      },
      {
        id: "d1-planner",
        rule: "planner_task",
        name: "Complete 1 Study Planner Task",
        description: "Check off at least one scheduled study task for today on your Dashboard.",
        duration: "~ 15 mins",
        tag: "Planner",
        icon: "planner",
        href: "/dashboard",
      },
      {
        id: "d1-mentor",
        rule: "ai_mentor",
        name: "Ask AI Mentor a Strategy Doubt",
        description: "Chat with the AI Mentor or Video AI Tutor to sharpen your study plan.",
        duration: "~ 5 mins",
        tag: "AI Mentor",
        icon: "mentor",
        href: "/intelligence",
        action: "open-mentor",
      },
    ],
  },
  {
    day: 2,
    title: "Quiz Drill & Study Focus",
    desc: "Test your recall with a module quiz, log focused study minutes, and inspect your accuracy metrics.",
    quote: "Active recall beats passive reading every single time.",
    tasks: [
      {
        id: "d2-quiz",
        rule: "practice_quiz",
        name: "Attempt 1 Module or Practice Quiz",
        description: "Submit any module quiz, lesson practice, or topic drill inside My Topics.",
        duration: "~ 15 mins",
        tag: "Quiz Drill",
        icon: "quiz",
        href: "/topics",
      },
      {
        id: "d2-study",
        rule: "study_15m",
        name: "Log 15+ Mins of Focused Study",
        description: "Accumulate at least 15 minutes of active learning or practice today.",
        duration: "15+ mins",
        tag: "Deep Focus",
        icon: "study",
        href: "/topics",
      },
      {
        id: "d2-analysis",
        rule: "analysis_review",
        name: "Review Performance Analysis",
        description: "Open your Performance Analysis dashboard to track accuracy and pacing.",
        duration: "~ 10 mins",
        tag: "Analysis",
        icon: "analysis",
        href: "/intelligence/ai-analysis",
      },
    ],
  },
  {
    day: 3,
    title: "Timed PYQ Mock & Diagnosis",
    desc: "Simulate real CAT exam pressure with a timed previous-year section and diagnose your performance right after.",
    quote: "Mocks don't just measure your percentile — they build it.",
    tasks: [
      {
        id: "d3-pyq",
        rule: "pyq_mock",
        name: "Take 1 Timed CAT PYQ Section",
        description: "Attempt and submit any official CAT PYQ section (VARC, DILR, or QA) under timed conditions.",
        duration: "~ 40 mins",
        tag: "Timed Mock",
        icon: "mock",
        href: "/browse#pyq-section",
      },
      {
        id: "d3-analysis",
        rule: "analysis_review",
        name: "Analyze Mock Performance",
        description: "Review your score breakdown, accuracy, and weak areas in Performance Analysis.",
        duration: "~ 10-15 mins",
        tag: "Analysis",
        icon: "analysis",
        href: "/intelligence/ai-analysis",
      },
    ],
  },
  {
    day: 4,
    title: "Mistake Audit & Revision",
    desc: "Turn yesterday's errors into strengths by auditing your mistake log and reinforcing weak concepts.",
    quote: "Every mistake you fix today is a question you'll nail on exam day.",
    tasks: [
      {
        id: "d4-mistakes",
        rule: "analysis_review",
        name: "Audit Mistakes & Weak Areas",
        description: "Inspect your Error Tracking log to understand why wrong answers happened.",
        duration: "~ 15 mins",
        tag: "Error Review",
        icon: "mistakes",
        href: "/intelligence/error-tracking",
      },
      {
        id: "d4-lesson",
        rule: "lesson_completed",
        name: "Complete 1 Concept Lesson",
        description: "Revisit or complete a video lesson targeting a concept you want to strengthen.",
        duration: "~ 25 mins",
        tag: "Concept",
        icon: "lesson",
        href: "/topics",
      },
      {
        id: "d4-study",
        rule: "study_15m",
        name: "Log 15+ Mins of Focused Study",
        description: "Stay consistent with at least 15 minutes of tracked study time today.",
        duration: "15+ mins",
        tag: "Deep Focus",
        icon: "study",
        href: "/topics",
      },
    ],
  },
  {
    day: 5,
    title: "Speed & Accuracy Sprint",
    desc: "Push your solving speed with a timed PYQ section, follow up with a targeted quiz, and clear a planner task.",
    quote: "Speed comes from clarity; accuracy comes from discipline.",
    tasks: [
      {
        id: "d5-pyq",
        rule: "pyq_mock",
        name: "Take 1 Timed CAT PYQ Section",
        description: "Complete a timed CAT previous-year section to test speed under pressure.",
        duration: "~ 40 mins",
        tag: "Timed Mock",
        icon: "mock",
        href: "/browse#pyq-section",
      },
      {
        id: "d5-quiz",
        rule: "practice_quiz",
        name: "Attempt 1 Module or Practice Quiz",
        description: "Take a quick module quiz or topic drill to sharpen problem-solving precision.",
        duration: "~ 15 mins",
        tag: "Quiz Drill",
        icon: "quiz",
        href: "/topics",
      },
      {
        id: "d5-planner",
        rule: "planner_task",
        name: "Complete 1 Study Planner Task",
        description: "Finish and check off one of today's planned tasks on your Dashboard.",
        duration: "~ 15 mins",
        tag: "Planner",
        icon: "planner",
        href: "/dashboard",
      },
    ],
  },
  {
    day: 6,
    title: "Deep Work & Peer Strategy",
    desc: "Put in a longer focused study block, exchange insights with fellow CAT aspirants, and review strategy with your AI Mentor.",
    quote: "Consistency compounds — small daily focus builds unstoppable momentum.",
    tasks: [
      {
        id: "d6-study",
        rule: "study_20m",
        name: "Log 20+ Mins of Focused Study",
        description: "Build exam stamina with at least 20 minutes of active study or practice.",
        duration: "20+ mins",
        tag: "Deep Focus",
        icon: "study",
        href: "/topics",
      },
      {
        id: "d6-community",
        rule: "community_engage",
        name: "Engage in Learning Community",
        description: "Share a strategy tip, ask a question, or reply to a peer in the Learning Community.",
        duration: "~ 10 mins",
        tag: "Community",
        icon: "community",
        href: "/intelligence/learning-community",
      },
      {
        id: "d6-mentor",
        rule: "ai_mentor",
        name: "Consult AI Mentor on Weak Areas",
        description: "Ask the AI Mentor how to optimize your section strategy for Day 7.",
        duration: "~ 5 mins",
        tag: "AI Mentor",
        icon: "mentor",
        href: "/intelligence",
        action: "open-mentor",
      },
    ],
  },
  {
    day: 7,
    title: "Weekly Mock & Reflection",
    desc: "Cap off the 7-day cycle with a timed CAT PYQ section, full weekly performance review, and one new concept lesson.",
    quote: "Track your progress, learn from your mistakes, and come back stronger.",
    tasks: [
      {
        id: "d7-pyq",
        rule: "pyq_mock",
        name: "Take 1 Timed CAT PYQ Section",
        description: "Put this week's prep to the test with a timed official CAT PYQ section.",
        duration: "~ 40 mins",
        tag: "Timed Mock",
        icon: "mock",
        href: "/browse#pyq-section",
      },
      {
        id: "d7-analysis",
        rule: "analysis_review",
        name: "Analyze Weekly Performance",
        description: "Review your weekly accuracy trend, pace, and readiness score.",
        duration: "~ 15 mins",
        tag: "Analysis",
        icon: "analysis",
        href: "/intelligence/ai-analysis",
      },
      {
        id: "d7-lesson",
        rule: "lesson_completed",
        name: "Complete 1 Concept Lesson",
        description: "Finish one more syllabus lesson to carry momentum into next week.",
        duration: "~ 25 mins",
        tag: "Concept",
        icon: "lesson",
        href: "/topics",
      },
    ],
  },
];

export function isRuleCompletedOnDate(
  rule: ChallengeTaskRule,
  dateStr: string,
  activity: DailyActivitySnapshot
): boolean {
  switch (rule) {
    case "lesson_completed":
      return activity.lessonDates.has(dateStr);
    case "planner_task":
      return activity.plannerTaskDates.has(dateStr);
    case "ai_mentor":
      return activity.aiMentorDates.has(dateStr);
    case "practice_quiz":
      return activity.practiceQuizDates.has(dateStr);
    case "study_15m":
      return (activity.studySecondsByDate.get(dateStr) ?? 0) >= 15 * 60;
    case "study_20m":
      return (activity.studySecondsByDate.get(dateStr) ?? 0) >= 20 * 60;
    case "analysis_review":
      return activity.analysisDates.has(dateStr);
    case "pyq_mock":
      return activity.pyqDates.has(dateStr);
    case "community_engage":
      return activity.communityDates.has(dateStr);
  }
}

export function buildChallengeResponse(
  startDateStr: string,
  cycleStartStr: string,
  cycleNumber: number,
  currentDay: number,
  activity: DailyActivitySnapshot
): ChallengeData {
  let completedDays = 0;

  const days: ChallengeDay[] = CHALLENGE_DAYS_PLAN.map((plan) => {
    const targetDateStr = addDays(cycleStartStr, plan.day - 1);
    const isFuture = plan.day > currentDay;
    const isPast = plan.day < currentDay;

    const evaluatedTasks: ChallengeTask[] = plan.tasks.map((t) => {
      const done = isFuture ? false : isRuleCompletedOnDate(t.rule, targetDateStr, activity);
      let status: ChallengeTaskStatus;
      if (isFuture) {
        status = "upcoming";
      } else if (done) {
        status = "completed";
      } else if (isPast) {
        status = "missed";
      } else {
        status = "pending";
      }
      return {
        ...t,
        done,
        status,
      };
    });

    const tasksDone = evaluatedTasks.filter((t) => t.done).length;
    const allDone = tasksDone === evaluatedTasks.length;

    let dayStatus: ChallengeDayStatus = "upcoming";
    if (isPast) {
      dayStatus = allDone ? "completed" : "incomplete";
    } else if (plan.day === currentDay) {
      dayStatus = allDone ? "completed" : "today";
    }

    if (allDone && !isFuture) {
      completedDays++;
    }

    return {
      day: plan.day,
      date: targetDateStr,
      status: dayStatus,
      title: plan.title,
      desc: plan.desc,
      quote: plan.quote,
      tasks: evaluatedTasks,
      progress: {
        tasksDone,
        tasksTotal: evaluatedTasks.length,
      },
    };
  });

  return {
    startDate: startDateStr,
    cycleStartDate: cycleStartStr,
    cycleNumber,
    currentDay,
    completedDays,
    totalDays: 7,
    days,
  };
}

/** Realistic 7-day challenge showcase for the demo account (student@technocat.edu). */
export function buildDemoChallenge(): ChallengeData {
  const today = todayInAppTz();
  const currentDay = 5;
  const cycleStartStr = addDays(today, -(currentDay - 1));

  const d1 = addDays(cycleStartStr, 0);
  const d2 = addDays(cycleStartStr, 1);
  const d3 = addDays(cycleStartStr, 2);
  const d4 = addDays(cycleStartStr, 3);
  const d5 = addDays(cycleStartStr, 4); // today

  // Day 1: all 3 done (completed)
  // Day 2: all 3 done (completed)
  // Day 3: PYQ done, Analysis missed (incomplete — shows check + cross!)
  // Day 4: all 3 done (completed)
  // Day 5 (Today): PYQ done, Quiz + Planner still pending (1/3 — shows auto-check + cross!)
  // Day 6 & 7: upcoming
  const activity: DailyActivitySnapshot = {
    lessonDates: new Set([d1, d4]),
    plannerTaskDates: new Set([d1]),
    aiMentorDates: new Set([d1]),
    practiceQuizDates: new Set([d2]),
    studySecondsByDate: new Map([
      [d1, 2400],
      [d2, 3000],
      [d3, 2500],
      [d4, 2100],
      [d5, 1800],
    ]),
    analysisDates: new Set([d2, d4]),
    pyqDates: new Set([d3, d5]),
    communityDates: new Set(),
  };

  return buildChallengeResponse(cycleStartStr, cycleStartStr, 1, currentDay, activity);
}
