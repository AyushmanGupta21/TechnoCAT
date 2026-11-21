// Computes StudentMetrics for a real account from recorded data only:
// quiz_attempts / quiz_responses, study_activity, points_ledger, topic_progress, study_tasks.
// Every metric is defined once, here. Pages must not re-derive these numbers.

import { query, getTopicLessonIds } from "@/lib/db";
import { getTopicById } from "@/data/topicsData";
import { todayInAppTz, addDays } from "@/lib/time";
import { estimatePercentile, PERCENTILE_DISCLAIMER, SECTION_MAX_MARKS } from "@/lib/metrics/percentile";
import type {
  StudentMetrics, SectionKey, SectionMetrics, TestRecord, ConceptStat, MistakeRecord, DailyStudy, TopicProgressMetrics,
} from "@/lib/metrics/types";

/** The three CAT sections' courses make up the syllabus used for "concepts" coverage. */
export const SYLLABUS_TOPICS: Record<SectionKey, string> = {
  QA: "qa-quantitative-ability",
  DILR: "dilr-data-interpretation",
  VARC: "varc-verbal-ability",
};

const TIMED_KINDS = new Set(["pyq", "module_quiz", "grand_quiz"]);
const READINESS_WEIGHTS = { concepts: 0.3, accuracy: 0.3, speed: 0.2, consistency: 0.2 };
const CAT_SECONDS_PER_QUESTION = 109; // 120 minutes for 66 questions
const SPEED_BEST = 90; // seconds/question that scores 100 on the pace index
const SPEED_WORST = 240; // seconds/question that scores 0
const MIN_ACTIVE_SECONDS = 120; // a day counts as "active" with at least 2 minutes of study
const MIN_ANSWERS_FOR_ACCURACY = 5;
const MIN_ANSWERS_FOR_CONCEPT = 3;
const WEAK_BELOW = 60;
const STRONG_FROM = 80;

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

function sectionOf(topicId: string | null | undefined): SectionKey | null {
  const id = (topicId || "").toLowerCase();
  if (id.startsWith("qa")) return "QA";
  if (id.startsWith("dilr")) return "DILR";
  if (id.startsWith("varc")) return "VARC";
  return null;
}

function testTitle(a: any): string {
  if (a.kind === "pyq") {
    const m = /^CAT-(\d{4})-(.+)-(VARC|DILR|QUANT|QA)$/.exec(a.source_ref || "");
    return m ? `CAT ${m[1]} ${m[2]} · ${m[3] === "QUANT" ? "QA" : m[3]}` : `CAT PYQ · ${a.section ?? ""}`.trim();
  }
  if (a.kind === "module_quiz") return a.module_key || "Module quiz";
  if (a.kind === "grand_quiz") return `Grand Quiz · ${getTopicById(a.topic_id)?.shortTitle ?? a.topic_id}`;
  const lesson = getTopicById(a.topic_id)?.lessons.find((l) => l.id === a.lesson_id);
  return `Practice · ${lesson?.title ?? a.lesson_id}`;
}

export async function computeStudentMetrics(userId: string): Promise<StudentMetrics> {
  const today = todayInAppTz();

  const [topicRes, attemptRes, conceptRes, mistakeRes, negRes, activityRes, ledgerRes, taskRes] =
    await Promise.all([
      query(`SELECT topic_id, progress_percent, completed_lessons FROM public.topic_progress WHERE user_id = $1`, [userId]),
      query(
        `SELECT id, kind, topic_id, module_key, lesson_id, source_ref, section, question_count, attempted_count,
                correct_count, wrong_count, final_score::float AS final_score, max_score::float AS max_score,
                percentage::float AS percentage, passed, duration_seconds, submitted_at
         FROM public.quiz_attempts WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 500`,
        [userId]
      ),
      query(
        `SELECT r.concept, r.recommended_lesson_id, COALESCE(r.section, a.section) AS section,
                COUNT(*) FILTER (WHERE r.is_attempted)::int AS attempted,
                COUNT(*) FILTER (WHERE r.is_correct)::int AS correct
         FROM public.quiz_responses r JOIN public.quiz_attempts a ON a.id = r.attempt_id
         WHERE a.user_id = $1 AND r.concept IS NOT NULL
         GROUP BY r.concept, r.recommended_lesson_id, COALESCE(r.section, a.section)`,
        [userId]
      ),
      query(
        `SELECT a.id AS attempt_id, r.question_id, a.kind, COALESCE(r.section, a.section) AS section, r.concept,
                r.recommended_lesson_id, r.question_type, r.marks::float AS marks, r.time_spent_seconds, a.submitted_at
         FROM public.quiz_responses r JOIN public.quiz_attempts a ON a.id = r.attempt_id
         WHERE a.user_id = $1 AND r.is_attempted AND NOT r.is_correct
         ORDER BY a.submitted_at DESC, r.position LIMIT 150`,
        [userId]
      ),
      query(
        `SELECT COUNT(*)::int AS n FROM public.quiz_responses r JOIN public.quiz_attempts a ON a.id = r.attempt_id
         WHERE a.user_id = $1 AND a.kind = 'pyq' AND r.question_type = 'MCQ' AND r.is_attempted AND NOT r.is_correct`,
        [userId]
      ),
      query(
        `SELECT activity_date::text AS d, kind, topic_id, SUM(seconds)::int AS seconds
         FROM public.study_activity WHERE user_id = $1 GROUP BY activity_date, kind, topic_id`,
        [userId]
      ),
      query(
        `SELECT points, reason, ref, created_at FROM public.points_ledger WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      ),
      query(
        `SELECT task_date::text AS d, is_completed FROM public.study_tasks WHERE user_id = $1 AND task_date <= $2::date + 7`,
        [userId, today]
      ),
    ]);

  // ── Courses & syllabus coverage ─────────────────────────────────────────────
  const studyByTopic: Record<string, number> = {};
  for (const a of activityRes.rows) if (a.topic_id) studyByTopic[a.topic_id] = (studyByTopic[a.topic_id] || 0) + a.seconds;

  const pointsByTopic: Record<string, number> = {};
  // Lesson / module / grand awards can be attributed to a topic; others (PYQ, legacy) cannot.
  const ledgerAll = ledgerRes.rows;

  const topics: TopicProgressMetrics[] = topicRes.rows.map((r) => {
    const lessonIds = getTopicLessonIds(r.topic_id);
    const completed: string[] = Array.isArray(r.completed_lessons) ? r.completed_lessons : [];
    for (const p of ledgerAll) {
      if ((p.reason === "lesson_completed" && lessonIds.has(p.ref)) ||
          (p.reason === "module_quiz_passed" && String(p.ref).startsWith(`${r.topic_id}::`)) ||
          (p.reason === "grand_quiz_passed" && p.ref === r.topic_id)) {
        pointsByTopic[r.topic_id] = (pointsByTopic[r.topic_id] || 0) + p.points;
      }
    }
    return {
      topicId: r.topic_id,
      title: getTopicById(r.topic_id)?.title ?? r.topic_id,
      section: sectionOf(r.topic_id),
      progressPercent: Number(r.progress_percent) || 0,
      lessonsCompleted: completed.filter((id) => lessonIds.has(id)).length,
      totalLessons: lessonIds.size,
      pointsEarned: pointsByTopic[r.topic_id] || 0,
      studySeconds: studyByTopic[r.topic_id] || 0,
    };
  });

  let syllabusLessons = 0;
  let syllabusCompleted = 0;
  for (const topicId of Object.values(SYLLABUS_TOPICS)) {
    const ids = getTopicLessonIds(topicId);
    syllabusLessons += ids.size;
    const row = topicRes.rows.find((r) => r.topic_id === topicId);
    const done: string[] = Array.isArray(row?.completed_lessons) ? row.completed_lessons : [];
    syllabusCompleted += done.filter((id) => ids.has(id)).length;
  }
  const concepts = syllabusLessons > 0 ? Math.round((syllabusCompleted / syllabusLessons) * 100) : 0;

  // ── Tests ───────────────────────────────────────────────────────────────────
  const tests: TestRecord[] = attemptRes.rows.map((a) => {
    const section = (a.section as SectionKey | null) ?? sectionOf(a.topic_id);
    const isFullPyqSection = a.kind === "pyq" && section && a.max_score === SECTION_MAX_MARKS[section];
    return {
      attemptId: a.id,
      kind: a.kind,
      title: testTitle(a),
      topicId: a.topic_id,
      section,
      score: a.final_score,
      maxScore: a.max_score,
      percentage: a.percentage,
      correct: a.correct_count,
      wrong: a.wrong_count,
      attempted: a.attempted_count,
      questionCount: a.question_count,
      accuracy: pct(a.correct_count, a.attempted_count),
      passed: a.passed,
      durationSeconds: a.duration_seconds,
      secondsPerQuestion: a.attempted_count > 0 && a.duration_seconds > 0 ? Math.round(a.duration_seconds / a.attempted_count) : null,
      estimatedPercentile: isFullPyqSection ? estimatePercentile(section!, a.final_score) : null,
      submittedAt: new Date(a.submitted_at).toISOString(),
    };
  });
  const timed = tests.filter((t) => TIMED_KINDS.has(t.kind));
  const pyq = tests.filter((t) => t.kind === "pyq");

  // ── Accuracy & speed (timed tests only; lesson practice is untimed learning) ─
  const attempted = timed.reduce((s, t) => s + t.attempted, 0);
  const correct = timed.reduce((s, t) => s + t.correct, 0);
  const accuracy = attempted >= MIN_ANSWERS_FOR_ACCURACY ? pct(correct, attempted) : null;

  const timedWithTime = timed.filter((t) => t.attempted > 0 && t.durationSeconds > 0);
  const totalTime = timedWithTime.reduce((s, t) => s + t.durationSeconds, 0);
  const totalAnswered = timedWithTime.reduce((s, t) => s + t.attempted, 0);
  const secondsPerQuestion = totalAnswered > 0 ? Math.round(totalTime / totalAnswered) : null;
  const speedIndex =
    secondsPerQuestion === null
      ? null
      : Math.max(0, Math.min(100, Math.round(((SPEED_WORST - secondsPerQuestion) / (SPEED_WORST - SPEED_BEST)) * 100)));

  // ── Study time, consistency, streak ─────────────────────────────────────────
  const byDay: Record<string, DailyStudy> = {};
  let totalSeconds = 0;
  for (const a of activityRes.rows) {
    const day = (byDay[a.d] ??= { date: a.d, learningSeconds: 0, practiceSeconds: 0 });
    if (a.kind === "lesson") day.learningSeconds += a.seconds;
    else day.practiceSeconds += a.seconds;
    totalSeconds += a.seconds;
  }
  const daySeconds = (d: string) => (byDay[d] ? byDay[d].learningSeconds + byDay[d].practiceSeconds : 0);
  const isActive = (d: string) => daySeconds(d) >= MIN_ACTIVE_SECONDS;

  const daily: DailyStudy[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDays(today, -i);
    daily.push(byDay[d] ?? { date: d, learningSeconds: 0, practiceSeconds: 0 });
  }
  const last7DaysSeconds = daily.slice(-7).reduce((s, d) => s + d.learningSeconds + d.practiceSeconds, 0);

  let activeDaysLast14 = 0;
  for (let i = 0; i < 14; i++) if (isActive(addDays(today, -i))) activeDaysLast14++;
  const consistencyScore = Math.round((activeDaysLast14 / 14) * 100);

  // Current streak counts back from today, or from yesterday if today has no activity yet.
  const activeToday = isActive(today);
  let current = 0;
  for (let d = activeToday ? today : addDays(today, -1); isActive(d); d = addDays(d, -1)) current++;
  let best = 0;
  let run = 0;
  const activeDates = Object.keys(byDay).filter(isActive).sort();
  for (let i = 0; i < activeDates.length; i++) {
    run = i > 0 && addDays(activeDates[i - 1], 1) === activeDates[i] ? run + 1 : 1;
    best = Math.max(best, run);
  }

  // ── Sections & estimated percentile ─────────────────────────────────────────
  const sectionAnswers: Record<SectionKey, { attempted: number; correct: number }> = {
    VARC: { attempted: 0, correct: 0 }, DILR: { attempted: 0, correct: 0 }, QA: { attempted: 0, correct: 0 },
  };
  for (const t of timed) {
    if (!t.section) continue;
    sectionAnswers[t.section].attempted += t.attempted;
    sectionAnswers[t.section].correct += t.correct;
  }
  const sections = {} as Record<SectionKey, SectionMetrics>;
  for (const s of ["VARC", "DILR", "QA"] as SectionKey[]) {
    const sp = pyq.filter((t) => t.section === s && t.estimatedPercentile !== null);
    sections[s] = {
      attempted: sectionAnswers[s].attempted,
      correct: sectionAnswers[s].correct,
      accuracy: pct(sectionAnswers[s].correct, sectionAnswers[s].attempted),
      pyqAttempts: pyq.filter((t) => t.section === s).length,
      bestScore: sp.length ? Math.max(...sp.map((t) => t.score)) : null,
      maxScore: SECTION_MAX_MARKS[s],
      latestScore: sp[0]?.score ?? null,
      estimatedPercentile: sp[0]?.estimatedPercentile ?? null,
    };
  }
  const haveAllSections = (["VARC", "DILR", "QA"] as SectionKey[]).every((s) => sections[s].latestScore !== null);
  const overallScore = haveAllSections
    ? sections.VARC.latestScore! + sections.DILR.latestScore! + sections.QA.latestScore!
    : null;

  // ── Concepts & mistakes ─────────────────────────────────────────────────────
  const conceptStats: ConceptStat[] = conceptRes.rows
    .filter((c) => c.attempted >= MIN_ANSWERS_FOR_CONCEPT)
    .map((c) => ({
      concept: c.concept,
      lessonId: c.recommended_lesson_id,
      section: (c.section as SectionKey | null) ?? sectionOf(c.recommended_lesson_id),
      attempted: c.attempted,
      correct: c.correct,
      accuracy: Math.round((c.correct / c.attempted) * 1000) / 10,
    }));
  const weak = conceptStats.filter((c) => c.accuracy < WEAK_BELOW).sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted).slice(0, 8);
  const strong = conceptStats.filter((c) => c.accuracy >= STRONG_FROM).sort((a, b) => b.accuracy - a.accuracy || b.attempted - a.attempted).slice(0, 8);

  const mistakes: MistakeRecord[] = mistakeRes.rows.map((m) => ({
    attemptId: m.attempt_id,
    questionId: m.question_id,
    kind: m.kind,
    section: (m.section as SectionKey | null) ?? null,
    concept: m.concept,
    lessonId: m.recommended_lesson_id,
    questionType: m.question_type,
    marksLost: m.marks < 0 ? -m.marks : 0,
    timeSpentSeconds: m.time_spent_seconds,
    submittedAt: new Date(m.submitted_at).toISOString(),
  }));

  // ── Readiness ───────────────────────────────────────────────────────────────
  // Weighted blend of syllabus coverage, accuracy, pace and consistency. Shown only once the
  // student has taken at least one timed test, because coverage alone is not readiness.
  let readinessScore: number | null = null;
  if (accuracy !== null) {
    const parts: [number, number][] = [
      [concepts, READINESS_WEIGHTS.concepts],
      [accuracy, READINESS_WEIGHTS.accuracy],
      [consistencyScore, READINESS_WEIGHTS.consistency],
    ];
    if (speedIndex !== null) parts.push([speedIndex, READINESS_WEIGHTS.speed]);
    const weightSum = parts.reduce((s, [, w]) => s + w, 0);
    readinessScore = Math.round(parts.reduce((s, [v, w]) => s + v * w, 0) / weightSum);
  }

  // ── Tasks ───────────────────────────────────────────────────────────────────
  const weekEnd = addDays(today, 7);
  const tasksToday = taskRes.rows.filter((t) => t.d === today);

  return {
    generatedAt: new Date().toISOString(),
    isDemo: false,
    hasActivity: totalSeconds > 0 || tests.length > 0 || syllabusCompleted > 0 || topics.some((t) => t.lessonsCompleted > 0),
    readiness: {
      score: readinessScore,
      components: { concepts, accuracy, speed: speedIndex, consistency: consistencyScore },
      weights: READINESS_WEIGHTS,
    },
    accuracy: {
      overall: accuracy,
      attempted,
      correct,
      wrong: attempted - correct,
      negativeMarksLost: negRes.rows[0]?.n ?? 0,
    },
    speed: { secondsPerQuestion, index: speedIndex, benchmarkSecondsPerQuestion: CAT_SECONDS_PER_QUESTION },
    consistency: { activeDaysLast14, score: consistencyScore },
    streak: { current, best, activeToday },
    studyTime: { todaySeconds: daySeconds(today), last7DaysSeconds, totalSeconds, daily },
    courses: {
      enrolled: topics.length,
      inProgress: topics.filter((t) => t.progressPercent < 100).length,
      completed: topics.filter((t) => t.progressPercent >= 100).length,
      lessonsCompleted: topics.reduce((s, t) => s + t.lessonsCompleted, 0),
      syllabusLessons,
      topics,
    },
    points: {
      total: ledgerAll.reduce((s, p) => s + p.points, 0),
      recent: ledgerAll.slice(0, 10).map((p) => ({ points: p.points, reason: p.reason, ref: p.ref, createdAt: new Date(p.created_at).toISOString() })),
    },
    sections,
    percentile: {
      overallEstimate: overallScore !== null ? estimatePercentile("OVERALL", overallScore) : null,
      overallScore,
      basis: haveAllSections
        ? "Sum of your latest full-section PYQ scores (VARC + DILR + QA)."
        : "Attempt a full PYQ section in each of VARC, DILR and QA to get an overall estimate.",
      disclaimer: PERCENTILE_DISCLAIMER,
    },
    tests: {
      recent: tests.slice(0, 50),
      pyq,
      modulesPassed: new Set(tests.filter((t) => t.kind === "module_quiz" && t.passed).map((t) => t.title)).size,
      moduleAttempts: tests.filter((t) => t.kind === "module_quiz").length,
      grandQuizzesPassed: new Set(tests.filter((t) => t.kind === "grand_quiz" && t.passed).map((t) => t.topicId)).size,
    },
    concepts: { weak, strong },
    mistakes,
    tasks: {
      todayTotal: tasksToday.length,
      todayDone: tasksToday.filter((t) => t.is_completed).length,
      overdue: taskRes.rows.filter((t) => t.d < today && !t.is_completed).length,
      upcomingWeek: taskRes.rows.filter((t) => t.d > today && t.d <= weekEnd).length,
    },
  };
}

