// Server-side answer key for every question the app can serve, so quiz attempts are graded
// on the server (clients cannot submit their own scores).
//
// Question id formats:
//   CAT-2024-Slot1-VARC-Q1        PYQ (data/cat_2024_questions.json)
//   qa0-s1-1, cat-grand-3         module / grand quiz banks (data/moduleQuizData.ts)
//   <tag>-dyn-<seed>-<i>          parameterised filler questions; correct option is always 0
//   lesson:<lessonId>:<index>     per-lecture practice quiz (data/videoPortions.ts)
//   gen:<uuid>                    AI-generated practice question (public.generated_questions)

import { MODULE_QUIZZES, GRAND_QUIZ_BANK, type ModuleQuestion } from "@/data/moduleQuizData";
import {
  getPYQQuestions,
  PYQ_YEARS,
  parseMCQCorrectIndex,
  extractTITAAnswer,
  findRecommendedLessonForPYQ,
} from "@/data/pyqData";
import { getLessonKnowledge } from "@/data/videoPortions";
import { getTopicById, TOPICS_DATA } from "@/data/topicsData";
import { query } from "@/lib/db";

export type QuestionType = "MCQ" | "TITA";
export type Section = "VARC" | "DILR" | "QA";

export interface AnswerKey {
  type: QuestionType;
  correctOption: number | null; // MCQ
  correctTita: string | null; // TITA
  concept: string | null;
  recommendedLessonId: string | null;
  section: Section | null;
  explanation?: string | null;
}

let index: Map<string, AnswerKey> | null = null;

export function normalizeSection(section: string | null | undefined): Section | null {
  const s = (section || "").toUpperCase();
  if (s === "QUANT" || s === "QA") return "QA";
  if (s === "VARC" || s === "DILR") return s;
  return null;
}

function fromModuleQuestion(q: ModuleQuestion): AnswerKey {
  const isTita = q.type === "TITA" || q.answer === -1;
  return {
    type: isTita ? "TITA" : "MCQ",
    correctOption: isTita ? null : q.answer,
    correctTita: isTita ? (q.titaAnswer ?? null) : null,
    concept: q.concept || null,
    recommendedLessonId: q.recommendedLessonId || null,
    section: null,
    explanation: q.explanation || null,
  };
}

function buildIndex(): Map<string, AnswerKey> {
  const map = new Map<string, AnswerKey>();

  for (const modules of Object.values(MODULE_QUIZZES)) {
    for (const questions of Object.values(modules)) {
      for (const q of questions) map.set(q.id, fromModuleQuestion(q));
    }
  }
  for (const q of GRAND_QUIZ_BANK) map.set(q.id, fromModuleQuestion(q));

  for (const year of PYQ_YEARS) {
    for (const slot of year.slots) {
      for (const section of year.sections) {
        for (const q of getPYQQuestions(year.year, slot, section)) {
          const isTita = q.type === "TITA";
          const rec = findRecommendedLessonForPYQ(q);
          map.set(q.id, {
            type: isTita ? "TITA" : "MCQ",
            correctOption: isTita ? null : parseMCQCorrectIndex(q.correct_answer, q.options || []),
            correctTita: isTita ? extractTITAAnswer(q.correct_answer) : null,
            concept: rec?.concept || null,
            recommendedLessonId: rec?.lessonId || null,
            section: normalizeSection(q.section),
            explanation: q.explanation || null,
          });
        }
      }
    }
  }
  return map;
}

function lessonPracticeKey(questionId: string): AnswerKey | null {
  // lesson:<lessonId>:<index>
  const parts = questionId.split(":");
  if (parts.length !== 3) return null;
  const [, lessonId, idxRaw] = parts;
  const idx = Number(idxRaw);
  if (!Number.isInteger(idx) || idx < 0) return null;

  for (const topic of TOPICS_DATA) {
    const lessons = [...(topic.lessons || []), ...(topic.modules || []).flatMap((m) => m.lessons || [])];
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) continue;
    const q = getLessonKnowledge(lesson.code, lesson.title, lesson.coverage).quiz[idx];
    if (!q) return null;
    return {
      type: "MCQ",
      correctOption: q.answer,
      correctTita: null,
      concept: lesson.title,
      recommendedLessonId: lesson.id,
      section: normalizeSection(getTopicById(topic.id)?.codePrefix),
      explanation: q.explanation || null,
    };
  }
  return null;
}

/**
 * Answer key for a question id, or null if the id is unknown. Generated questions (gen:…) live
 * in the database: load them first with loadGeneratedQuestions() and pass the map as `extra`.
 */
export function getAnswerKey(questionId: string, extra?: Map<string, AnswerKey>): AnswerKey | null {
  if (extra?.has(questionId)) return extra.get(questionId)!;
  if (!index) index = buildIndex();
  const known = index.get(questionId);
  if (known) return known;
  if (questionId.startsWith("lesson:")) return lessonPracticeKey(questionId);
  if (/-dyn-/.test(questionId)) {
    return { type: "MCQ", correctOption: 0, correctTita: null, concept: null, recommendedLessonId: null, section: null };
  }
  return null;
}

/** TITA answers are compared case-insensitively after trimming (same rule as the UI). */
export function titaMatches(given: string, expected: string): boolean {
  return given.trim().toLowerCase() === expected.trim().toLowerCase();
}

export interface QuestionDetail {
  id: string;
  type: QuestionType;
  text: string;
  context: string | null; // passage / data set for PYQs
  options: string[];
  correctOption: number | null;
  correctTita: string | null;
  explanation: string | null;
  concept: string | null;
  recommendedLessonId: string | null;
}

let detailIndex: Map<string, QuestionDetail> | null = null;

function buildDetailIndex(): Map<string, QuestionDetail> {
  const map = new Map<string, QuestionDetail>();
  const fromModule = (q: ModuleQuestion): QuestionDetail => {
    const key = fromModuleQuestion(q);
    return {
      id: q.id, type: key.type, text: q.q, context: q.context ?? null, options: q.options || [],
      correctOption: key.correctOption, correctTita: key.correctTita, explanation: q.explanation || null,
      concept: q.concept || null, recommendedLessonId: q.recommendedLessonId || null,
    };
  };
  for (const modules of Object.values(MODULE_QUIZZES)) for (const qs of Object.values(modules)) for (const q of qs) map.set(q.id, fromModule(q));
  for (const q of GRAND_QUIZ_BANK) map.set(q.id, fromModule(q));
  for (const year of PYQ_YEARS) {
    for (const slot of year.slots) {
      for (const section of year.sections) {
        for (const q of getPYQQuestions(year.year, slot, section)) {
          const key = getAnswerKey(q.id)!;
          map.set(q.id, {
            id: q.id, type: key.type, text: q.question, context: q.context || null, options: q.options || [],
            correctOption: key.correctOption, correctTita: key.correctTita, explanation: q.explanation || null,
            concept: key.concept, recommendedLessonId: key.recommendedLessonId,
          });
        }
      }
    }
  }
  return map;
}

/** Full question content (text, options, answer, explanation) or null if not reproducible. */
export function getQuestionDetail(questionId: string): QuestionDetail | null {
  if (!detailIndex) detailIndex = buildDetailIndex();
  const known = detailIndex.get(questionId);
  if (known) return known;
  if (questionId.startsWith("lesson:")) {
    const [, lessonId, idxRaw] = questionId.split(":");
    for (const topic of TOPICS_DATA) {
      const lessons = [...(topic.lessons || []), ...(topic.modules || []).flatMap((m) => m.lessons || [])];
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) continue;
      const q = getLessonKnowledge(lesson.code, lesson.title, lesson.coverage).quiz[Number(idxRaw)];
      if (!q) return null;
      return {
        id: questionId, type: "MCQ", text: q.q, context: null, options: q.options, correctOption: q.answer,
        correctTita: null, explanation: q.explanation || null, concept: lesson.title, recommendedLessonId: lesson.id,
      };
    }
  }
  return null; // e.g. parameterised "-dyn-" filler questions
}

// ── AI-generated questions (gen:<uuid>) ─────────────────────────────────────────────

const GEN_PREFIX = "gen:";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isGeneratedId(id: string): boolean {
  return id.startsWith(GEN_PREFIX) && UUID_RE.test(id.slice(GEN_PREFIX.length));
}

/** Loads answer keys + full details for generated question ids from the database. */
export async function loadGeneratedQuestions(ids: string[]): Promise<{ keys: Map<string, AnswerKey>; details: Map<string, QuestionDetail> }> {
  const keys = new Map<string, AnswerKey>();
  const details = new Map<string, QuestionDetail>();
  const uuids = ids.filter(isGeneratedId).map((id) => id.slice(GEN_PREFIX.length));
  if (uuids.length === 0) return { keys, details };

  const res = await query(
    `SELECT id, topic_id, concept, question, options, correct_option, explanation
     FROM public.generated_questions WHERE id = ANY($1::uuid[])`,
    [uuids]
  );
  for (const r of res.rows) {
    const id = GEN_PREFIX + r.id;
    const section = normalizeSection(getTopicById(r.topic_id)?.codePrefix);
    keys.set(id, {
      type: "MCQ", correctOption: r.correct_option, correctTita: null, concept: r.concept,
      recommendedLessonId: null, section, explanation: r.explanation,
    });
    details.set(id, {
      id, type: "MCQ", text: r.question, context: null, options: r.options, correctOption: r.correct_option,
      correctTita: null, explanation: r.explanation, concept: r.concept, recommendedLessonId: null,
    });
  }
  return { keys, details };
}
