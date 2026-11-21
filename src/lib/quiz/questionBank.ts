// Server-side answer key for every question the app can serve, so quiz attempts are graded
// on the server (clients cannot submit their own scores).
//
// Question id formats:
//   CAT-2024-Slot1-VARC-Q1        PYQ (data/cat_2024_questions.json)
//   qa0-s1-1, cat-grand-3         module / grand quiz banks (data/moduleQuizData.ts)
//   <tag>-dyn-<seed>-<i>          parameterised filler questions; correct option is always 0
//   lesson:<lessonId>:<index>     per-lecture practice quiz (data/videoPortions.ts)

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

export type QuestionType = "MCQ" | "TITA";
export type Section = "VARC" | "DILR" | "QA";

export interface AnswerKey {
  type: QuestionType;
  correctOption: number | null; // MCQ
  correctTita: string | null; // TITA
  concept: string | null;
  recommendedLessonId: string | null;
  section: Section | null;
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
    };
  }
  return null;
}

/** Answer key for a question id, or null if the id is unknown. */
export function getAnswerKey(questionId: string): AnswerKey | null {
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
