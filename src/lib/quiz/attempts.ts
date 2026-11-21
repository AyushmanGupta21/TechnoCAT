// Records quiz attempts (public.quiz_attempts / quiz_responses, migration 0008).
// Scores are always computed here from the server-side answer key; the client only sends
// which option it picked for which question.

import { query, withTransaction } from "@/lib/db";
import { awardPoints } from "@/lib/points";
import { recordStudyTime, type ActivityKind } from "@/lib/activity";
import { getTopicById } from "@/data/topicsData";
import { MODULE_QUIZZES } from "@/data/moduleQuizData";
import {
  getAnswerKey, normalizeSection, titaMatches, loadGeneratedQuestions, type QuestionType, type AnswerKey,
} from "@/lib/quiz/questionBank";

export const QUIZ_KINDS = ["pyq", "module_quiz", "grand_quiz", "lesson_practice", "topic_drill"] as const;
export type QuizKind = (typeof QUIZ_KINDS)[number];

/** Marking schemes (must match what the UI explains to students). */
const SCHEMES = {
  cat: { mcqCorrect: 3, mcqWrong: -1, titaCorrect: 3, titaWrong: 0, passPercent: 50 },
  standard: { mcqCorrect: 1, mcqWrong: 0, titaCorrect: 1, titaWrong: 0, passPercent: 70 },
} as const;
const STRIKE_PENALTY = 1; // marks per integrity strike (tab switch / window blur)
const MAX_DURATION_SECONDS = 4 * 60 * 60;

export interface SubmittedResponse {
  questionId: string;
  selectedOption?: number | null;
  titaAnswer?: string | null;
  timeSpentSeconds?: number | null;
}

export interface SubmitAttemptInput {
  kind: QuizKind;
  topicId?: string | null;
  moduleKey?: string | null;
  lessonId?: string | null;
  sourceRef?: string | null;
  section?: string | null;
  durationSeconds?: number;
  strikes?: number;
  responses: SubmittedResponse[];
}

export class AttemptValidationError extends Error {}

const cleanTitle = (s: string) => s.replace(/&amp;/g, "&").trim();

function schemeFor(kind: QuizKind): keyof typeof SCHEMES {
  return kind === "pyq" ? "cat" : "standard";
}

function validate(input: SubmitAttemptInput) {
  if (!QUIZ_KINDS.includes(input.kind)) throw new AttemptValidationError("Unknown quiz kind.");
  if (!Array.isArray(input.responses) || input.responses.length === 0 || input.responses.length > 250) {
    throw new AttemptValidationError("An attempt must contain between 1 and 250 questions.");
  }
  const ids = new Set<string>();
  for (const r of input.responses) {
    if (!r || typeof r.questionId !== "string" || !r.questionId) throw new AttemptValidationError("Invalid question id.");
    if (ids.has(r.questionId)) throw new AttemptValidationError("Duplicate question in attempt.");
    ids.add(r.questionId);
  }

  if (input.kind === "module_quiz" || input.kind === "grand_quiz" || input.kind === "lesson_practice" || input.kind === "topic_drill") {
    if (!input.topicId || !getTopicById(input.topicId)) throw new AttemptValidationError("Unknown topic.");
  }
  if (input.kind === "module_quiz") {
    const modules = MODULE_QUIZZES[input.topicId!] || {};
    const key = cleanTitle(input.moduleKey || "");
    if (!key || !Object.keys(modules).some((m) => cleanTitle(m) === key)) {
      throw new AttemptValidationError("Unknown module.");
    }
  }
  if (input.kind === "lesson_practice" && !input.lessonId) throw new AttemptValidationError("lessonId is required.");
  if (input.kind === "pyq" && (!normalizeSection(input.section) || !input.sourceRef)) {
    throw new AttemptValidationError("PYQ attempts need a section and sourceRef.");
  }
}

interface GradedResponse {
  position: number;
  questionId: string;
  questionType: QuestionType;
  section: string | null;
  concept: string | null;
  recommendedLessonId: string | null;
  selectedOption: number | null;
  titaAnswer: string | null;
  correctOption: number | null;
  correctTita: string | null;
  isAttempted: boolean;
  isCorrect: boolean;
  marks: number;
  timeSpentSeconds: number | null;
  explanation: string | null;
}

/** Loads answer keys for AI-generated questions in an attempt (they live in the database). */
export async function loadExtraKeys(input: SubmitAttemptInput): Promise<Map<string, AnswerKey>> {
  const ids = Array.isArray(input?.responses) ? input.responses.map((r) => String(r?.questionId ?? "")) : [];
  return (await loadGeneratedQuestions(ids)).keys;
}

/** Grades an attempt against the server answer key (pure; generated keys passed in). */
export function gradeAttempt(input: SubmitAttemptInput, extraKeys?: Map<string, AnswerKey>) {
  validate(input);
  const scheme = SCHEMES[schemeFor(input.kind)];
  const fallbackSection = normalizeSection(input.section);

  const responses: GradedResponse[] = input.responses.map((r, position) => {
    const key = getAnswerKey(r.questionId, extraKeys);
    if (!key) throw new AttemptValidationError(`Unknown question: ${r.questionId}`);

    const selectedOption =
      key.type === "MCQ" && Number.isInteger(r.selectedOption) && (r.selectedOption as number) >= 0
        ? (r.selectedOption as number)
        : null;
    const titaAnswer =
      key.type === "TITA" && typeof r.titaAnswer === "string" && r.titaAnswer.trim() ? r.titaAnswer.trim().slice(0, 100) : null;

    const isAttempted = key.type === "MCQ" ? selectedOption !== null : titaAnswer !== null;
    const isCorrect =
      key.type === "MCQ"
        ? isAttempted && selectedOption === key.correctOption
        : isAttempted && key.correctTita !== null && titaMatches(titaAnswer!, key.correctTita);

    let marks = 0;
    if (isAttempted) {
      if (key.type === "MCQ") marks = isCorrect ? scheme.mcqCorrect : scheme.mcqWrong;
      else marks = isCorrect ? scheme.titaCorrect : scheme.titaWrong;
    }

    const t = Number(r.timeSpentSeconds);
    return {
      position,
      questionId: r.questionId,
      questionType: key.type,
      section: key.section ?? fallbackSection,
      concept: key.concept,
      recommendedLessonId: key.recommendedLessonId,
      selectedOption,
      titaAnswer,
      correctOption: key.correctOption,
      correctTita: key.correctTita,
      isAttempted,
      isCorrect,
      marks,
      timeSpentSeconds: Number.isFinite(t) && t >= 0 ? Math.min(Math.round(t), MAX_DURATION_SECONDS) : null,
      explanation: key.explanation ?? null,
    };
  });

  const maxScore = responses.length * scheme.mcqCorrect;
  const rawScore = responses.reduce((s, r) => s + r.marks, 0);
  const strikes = Math.max(0, Math.min(10, Math.floor(Number(input.strikes) || 0)));
  const penalty = strikes * STRIKE_PENALTY;
  const finalScore = Math.max(0, rawScore - penalty);
  const percentage = maxScore > 0 ? Math.round((finalScore / maxScore) * 10000) / 100 : 0;
  const attempted = responses.filter((r) => r.isAttempted);

  return {
    scoringScheme: schemeFor(input.kind),
    questionCount: responses.length,
    attemptedCount: attempted.length,
    correctCount: attempted.filter((r) => r.isCorrect).length,
    wrongCount: attempted.filter((r) => !r.isCorrect).length,
    rawScore,
    penalty,
    finalScore,
    maxScore,
    percentage,
    passed: input.kind === "lesson_practice" || input.kind === "topic_drill" ? null : percentage >= scheme.passPercent,
    strikes,
    durationSeconds: Math.max(0, Math.min(MAX_DURATION_SECONDS, Math.round(Number(input.durationSeconds) || 0))),
    responses,
  };
}

const ACTIVITY_FOR_KIND: Record<QuizKind, ActivityKind> = {
  pyq: "pyq",
  module_quiz: "quiz",
  grand_quiz: "quiz",
  lesson_practice: "practice",
  topic_drill: "practice",
};

/** Grades and stores an attempt, awards points and logs the study time, atomically. */
export async function recordQuizAttempt(userId: string, input: SubmitAttemptInput) {
  const graded = gradeAttempt(input, await loadExtraKeys(input));
  const moduleKey = input.kind === "module_quiz" ? cleanTitle(input.moduleKey || "") : null;
  const section = normalizeSection(input.section);

  return withTransaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO public.quiz_attempts
         (user_id, kind, topic_id, module_key, lesson_id, source_ref, section, scoring_scheme,
          question_count, attempted_count, correct_count, wrong_count, raw_score, penalty,
          final_score, max_score, percentage, passed, strikes, duration_seconds)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING id, submitted_at`,
      [
        userId, input.kind, input.topicId ?? null, moduleKey, input.lessonId ?? null,
        (input.sourceRef || "").slice(0, 120) || null, section, graded.scoringScheme,
        graded.questionCount, graded.attemptedCount, graded.correctCount, graded.wrongCount,
        graded.rawScore, graded.penalty, graded.finalScore, graded.maxScore, graded.percentage,
        graded.passed, graded.strikes, graded.durationSeconds,
      ]
    );
    const attemptId: string = ins.rows[0].id;

    const R = graded.responses;
    await client.query(
      `INSERT INTO public.quiz_responses
         (attempt_id, position, question_id, question_type, section, concept, recommended_lesson_id,
          selected_option, tita_answer, correct_option, correct_tita, is_attempted, is_correct, marks, time_spent_seconds)
       SELECT $1::uuid, * FROM UNNEST($2::int[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[],
                                $8::int[], $9::text[], $10::int[], $11::text[], $12::boolean[], $13::boolean[],
                                $14::numeric[], $15::int[])`,
      [
        attemptId,
        R.map((r) => r.position), R.map((r) => r.questionId), R.map((r) => r.questionType),
        R.map((r) => r.section), R.map((r) => r.concept), R.map((r) => r.recommendedLessonId),
        R.map((r) => r.selectedOption), R.map((r) => r.titaAnswer), R.map((r) => r.correctOption),
        R.map((r) => r.correctTita), R.map((r) => r.isAttempted), R.map((r) => r.isCorrect),
        R.map((r) => r.marks), R.map((r) => r.timeSpentSeconds),
      ]
    );

    let pointsAwarded = 0;
    if (input.kind === "module_quiz" && graded.passed) {
      pointsAwarded += await awardPoints(userId, "module_quiz_passed", `${input.topicId}::${moduleKey}`, client);
    } else if (input.kind === "grand_quiz" && graded.passed) {
      pointsAwarded += await awardPoints(userId, "grand_quiz_passed", input.topicId!, client);
    } else if (input.kind === "pyq") {
      pointsAwarded += await awardPoints(userId, "pyq_attempt", attemptId, client);
    }

    await recordStudyTime(
      userId,
      {
        kind: ACTIVITY_FOR_KIND[input.kind],
        ref: input.sourceRef || moduleKey || input.lessonId || input.topicId || input.kind,
        topicId: input.topicId ?? null,
        seconds: graded.durationSeconds,
      },
      client
    );

    return { attemptId, submittedAt: ins.rows[0].submitted_at as string, pointsAwarded, ...graded };
  });
}

/** Attempt history (newest first) plus per-module status for a topic. */
export async function getAttemptSummary(userId: string, filter: { topicId?: string; kind?: QuizKind }) {
  const params: unknown[] = [userId];
  let where = "user_id = $1";
  if (filter.topicId) { params.push(filter.topicId); where += ` AND topic_id = $${params.length}`; }
  if (filter.kind) { params.push(filter.kind); where += ` AND kind = $${params.length}`; }

  const attempts = (
    await query(
      `SELECT id, kind, topic_id, module_key, lesson_id, source_ref, section, question_count, attempted_count,
              correct_count, wrong_count, final_score, max_score, percentage, passed, strikes,
              duration_seconds, submitted_at
       FROM public.quiz_attempts WHERE ${where}
       ORDER BY submitted_at DESC LIMIT 200`,
      params
    )
  ).rows;

  // Per module: attempts, passed, and consecutive fails since the last pass.
  const modules: Record<string, { attempts: number; passed: boolean; consecutiveFails: number; bestPercentage: number }> = {};
  for (const a of [...attempts].reverse()) {
    if (a.kind !== "module_quiz" || !a.module_key) continue;
    const m = (modules[a.module_key] ??= { attempts: 0, passed: false, consecutiveFails: 0, bestPercentage: 0 });
    m.attempts += 1;
    m.bestPercentage = Math.max(m.bestPercentage, Number(a.percentage));
    if (a.passed) { m.passed = true; m.consecutiveFails = 0; } else { m.consecutiveFails += 1; }
  }
  const grandQuizPassed = attempts.some((a) => a.kind === "grand_quiz" && a.passed);

  return { attempts, modules, grandQuizPassed };
}
