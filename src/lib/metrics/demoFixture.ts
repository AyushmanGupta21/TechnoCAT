// Showcase metrics for the demo account (student@technocat.edu): a believable, internally
// consistent student ~3 months into preparation. Same StudentMetrics shape as real accounts,
// so every page renders demo and real data through identical code. Dates are relative to
// "today" so the showcase never looks stale. Never shown to real accounts.

import { getTopicLessonIds } from "@/lib/db";
import { getTopicById } from "@/data/topicsData";
import { todayInAppTz, addDays } from "@/lib/time";
import { estimatePercentile, PERCENTILE_DISCLAIMER, SECTION_MAX_MARKS } from "@/lib/metrics/percentile";
import type { StudentMetrics, TestRecord, DailyStudy, SectionKey } from "@/lib/metrics/types";
import { SYLLABUS_TOPICS } from "@/lib/metrics/compute";

const WEIGHTS = { concepts: 0.3, accuracy: 0.3, speed: 0.2, consistency: 0.2 };

function isoDaysAgo(days: number, hour = 18): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour - 5, 30, 0, 0); // ~hour IST
  return d.toISOString();
}

function pyqRecord(daysAgo: number, slot: string, section: SectionKey, score: number, correct: number, wrong: number, durationMin: number): TestRecord {
  const questionCount = section === "VARC" ? 24 : 22;
  const attempted = correct + wrong;
  return {
    attemptId: `demo-pyq-${section}-${daysAgo}`,
    kind: "pyq",
    title: `CAT 2024 ${slot} · ${section}`,
    topicId: SYLLABUS_TOPICS[section],
    section,
    score,
    maxScore: SECTION_MAX_MARKS[section],
    percentage: Math.round((score / SECTION_MAX_MARKS[section]) * 1000) / 10,
    correct,
    wrong,
    attempted,
    questionCount,
    accuracy: Math.round((correct / attempted) * 1000) / 10,
    passed: score / SECTION_MAX_MARKS[section] >= 0.5,
    durationSeconds: durationMin * 60,
    secondsPerQuestion: Math.round((durationMin * 60) / attempted),
    estimatedPercentile: estimatePercentile(section, score),
    submittedAt: isoDaysAgo(daysAgo),
  };
}

function moduleRecord(daysAgo: number, title: string, topicId: string, correct: number, durationMin: number): TestRecord {
  return {
    attemptId: `demo-mod-${daysAgo}-${correct}`,
    kind: "module_quiz",
    title,
    topicId,
    section: (getTopicById(topicId)?.codePrefix as SectionKey) ?? null,
    score: correct,
    maxScore: 10,
    percentage: correct * 10,
    correct,
    wrong: 10 - correct,
    attempted: 10,
    questionCount: 10,
    accuracy: correct * 10,
    passed: correct >= 7,
    durationSeconds: durationMin * 60,
    secondsPerQuestion: durationMin * 6,
    estimatedPercentile: null,
    submittedAt: isoDaysAgo(daysAgo, 20),
  };
}

export function buildDemoMetrics(): StudentMetrics {
  const today = todayInAppTz();

  // 30 days of study with a realistic weekly rhythm and two rest days.
  const learningPattern = [95, 110, 80, 125, 70, 140, 60];
  const practicePattern = [45, 60, 50, 70, 40, 85, 30];
  const daily: DailyStudy[] = [];
  for (let i = 29; i >= 0; i--) {
    const rest = i === 17 || i === 10;
    const k = i % 7;
    daily.push({
      date: addDays(today, -i),
      learningSeconds: rest ? 0 : learningPattern[k] * 60,
      practiceSeconds: rest ? 0 : practicePattern[k] * 60,
    });
  }
  const sum = (d: DailyStudy[]) => d.reduce((s, x) => s + x.learningSeconds + x.practiceSeconds, 0);

  const progress: Record<string, number> = { [SYLLABUS_TOPICS.QA]: 62, [SYLLABUS_TOPICS.DILR]: 48, [SYLLABUS_TOPICS.VARC]: 71 };
  const topics = Object.entries(progress).map(([topicId, p]) => {
    const total = getTopicLessonIds(topicId).size;
    const completed = Math.round((p / 100) * total);
    return {
      topicId,
      title: getTopicById(topicId)?.title ?? topicId,
      section: (getTopicById(topicId)?.codePrefix as SectionKey) ?? null,
      progressPercent: p,
      lessonsCompleted: completed,
      totalLessons: total,
      pointsEarned: completed * 10 + 150,
      studySeconds: completed * 38 * 60,
    };
  });
  const syllabusLessons = topics.reduce((s, t) => s + t.totalLessons, 0);
  const lessonsCompleted = topics.reduce((s, t) => s + t.lessonsCompleted, 0);
  const concepts = Math.round((lessonsCompleted / syllabusLessons) * 100);

  const pyq = [
    pyqRecord(2, "Slot 2", "QA", 28, 11, 5, 38),
    pyqRecord(3, "Slot 2", "DILR", 24, 9, 3, 40),
    pyqRecord(4, "Slot 2", "VARC", 36, 14, 6, 37),
    pyqRecord(11, "Slot 1", "QA", 22, 9, 5, 40),
    pyqRecord(12, "Slot 1", "DILR", 18, 7, 3, 40),
    pyqRecord(13, "Slot 1", "VARC", 31, 12, 5, 39),
  ];
  const modules = [
    moduleRecord(1, "QA-3: Ratio, Proportion & Variation", SYLLABUS_TOPICS.QA, 8, 9),
    moduleRecord(5, "DILR-2: Arrangements & Seating", SYLLABUS_TOPICS.DILR, 6, 11),
    moduleRecord(6, "DILR-2: Arrangements & Seating", SYLLABUS_TOPICS.DILR, 8, 10),
    moduleRecord(8, "VARC-2: Reading Comprehension", SYLLABUS_TOPICS.VARC, 9, 8),
  ];
  const recent = [...pyq, ...modules].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const accuracyOverall = 74.5;
  const speedSpq = 118;
  const speedIndex = Math.round(((240 - speedSpq) / 150) * 100);
  const consistency = Math.round((12 / 14) * 100);
  const readiness = Math.round(
    concepts * WEIGHTS.concepts + accuracyOverall * WEIGHTS.accuracy + speedIndex * WEIGHTS.speed + consistency * WEIGHTS.consistency
  );

  const latest = { VARC: 36, DILR: 24, QA: 28 };
  const overallScore = latest.VARC + latest.DILR + latest.QA;

  return {
    generatedAt: new Date().toISOString(),
    isDemo: true,
    hasActivity: true,
    readiness: {
      score: readiness,
      components: { concepts, accuracy: accuracyOverall, speed: speedIndex, consistency },
      weights: WEIGHTS,
    },
    accuracy: { overall: accuracyOverall, attempted: 412, correct: 307, wrong: 105, negativeMarksLost: 38 },
    speed: { secondsPerQuestion: speedSpq, index: speedIndex, benchmarkSecondsPerQuestion: 109 },
    consistency: { activeDaysLast14: 12, score: consistency },
    streak: { current: 9, best: 21, activeToday: true },
    studyTime: { todaySeconds: daily[29].learningSeconds + daily[29].practiceSeconds, last7DaysSeconds: sum(daily.slice(-7)), totalSeconds: sum(daily) * 3, daily },
    courses: { enrolled: 3, inProgress: 3, completed: 0, lessonsCompleted, syllabusLessons, topics },
    points: {
      total: 1860,
      recent: [
        { points: 50, reason: "module_quiz_passed", ref: `${SYLLABUS_TOPICS.QA}::QA-3: Ratio, Proportion & Variation`, createdAt: isoDaysAgo(1, 20) },
        { points: 20, reason: "pyq_attempt", ref: "demo-pyq-QA-2", createdAt: isoDaysAgo(2) },
        { points: 10, reason: "lesson_completed", ref: "qa-3-4", createdAt: isoDaysAgo(2, 11) },
      ],
    },
    sections: {
      VARC: { attempted: 132, correct: 104, accuracy: 78.8, pyqAttempts: 2, bestScore: 36, maxScore: 72, latestScore: 36, estimatedPercentile: estimatePercentile("VARC", 36) },
      DILR: { attempted: 118, correct: 80, accuracy: 67.8, pyqAttempts: 2, bestScore: 24, maxScore: 66, latestScore: 24, estimatedPercentile: estimatePercentile("DILR", 24) },
      QA: { attempted: 162, correct: 123, accuracy: 75.9, pyqAttempts: 2, bestScore: 28, maxScore: 66, latestScore: 28, estimatedPercentile: estimatePercentile("QA", 28) },
    },
    percentile: {
      overallEstimate: estimatePercentile("OVERALL", overallScore),
      overallScore,
      basis: "Sum of your latest full-section PYQ scores (VARC + DILR + QA).",
      disclaimer: PERCENTILE_DISCLAIMER,
    },
    tests: { recent, pyq, modulesPassed: 3, moduleAttempts: 4, grandQuizzesPassed: 0 },
    concepts: {
      weak: [
        { concept: "Games & Tournaments", lessonId: "dilr-4-2", section: "DILR", attempted: 13, correct: 5, accuracy: 38.5 },
        { concept: "Para Jumbles", lessonId: "varc-4-1", section: "VARC", attempted: 11, correct: 5, accuracy: 45.5 },
        { concept: "Permutations & Combinations", lessonId: "qa-8-1", section: "QA", attempted: 9, correct: 5, accuracy: 55.6 },
      ],
      strong: [
        { concept: "Percentages", lessonId: "qa-1-1", section: "QA", attempted: 24, correct: 22, accuracy: 91.7 },
        { concept: "Reading Comprehension", lessonId: "varc-2-1", section: "VARC", attempted: 41, correct: 35, accuracy: 85.4 },
        { concept: "Linear Arrangements", lessonId: "dilr-2-1", section: "DILR", attempted: 17, correct: 14, accuracy: 82.4 },
      ],
    },
    mistakes: [
      { attemptId: "demo-pyq-DILR-3", questionId: "CAT-2024-Slot2-DILR-Q14", kind: "pyq", section: "DILR", concept: "Games & Tournaments", lessonId: "dilr-4-2", questionType: "MCQ", marksLost: 1, timeSpentSeconds: 312, submittedAt: isoDaysAgo(3) },
      { attemptId: "demo-pyq-VARC-4", questionId: "CAT-2024-Slot2-VARC-Q22", kind: "pyq", section: "VARC", concept: "Para Jumbles", lessonId: "varc-4-1", questionType: "TITA", marksLost: 0, timeSpentSeconds: 145, submittedAt: isoDaysAgo(4) },
      { attemptId: "demo-pyq-QA-2", questionId: "CAT-2024-Slot2-QUANT-Q9", kind: "pyq", section: "QA", concept: "Permutations & Combinations", lessonId: "qa-8-1", questionType: "MCQ", marksLost: 1, timeSpentSeconds: 228, submittedAt: isoDaysAgo(2) },
    ],
    tasks: { todayTotal: 3, todayDone: 1, overdue: 2, upcomingWeek: 11 },
  };
}
