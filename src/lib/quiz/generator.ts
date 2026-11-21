// Practice-quiz generator for a topic (POST /api/quiz/generate).
// 1. Ask an LLM (NVIDIA NIM) for CAT-level MCQs, focused on the student's weak concepts.
// 2. Validate every question strictly; store valid ones (with answers) in generated_questions.
// 3. Top up from the authored question bank when the model is unavailable or returns too few.
// The client only ever receives question text + options; grading happens on the server.

import { query } from "@/lib/db";
import { getTopicById } from "@/data/topicsData";
import { MODULE_QUIZZES } from "@/data/moduleQuizData";
import { nimChat, isNimConfigured } from "@/lib/ai/nim";


export interface PracticeQuestion {
  id: string; // gen:<uuid> or an authored bank id
  question: string;
  options: string[];
  concept: string | null;
}

export interface GeneratedQuiz {
  topicId: string;
  focus: string[];
  questions: PracticeQuestion[];
  source: "ai" | "bank" | "mixed";
}

interface Candidate {
  question: string;
  options: string[];
  solution: string; // worked solution, written BEFORE the model picks correct_option
  correct_option: number;
  concept: string;
}

/** Strict validation: 4 distinct non-empty options, one valid answer, real worked solution. */
function validCandidate(c: any): c is Candidate {
  if (!c || typeof c.question !== "string" || c.question.trim().length < 15 || c.question.length > 1200) return false;
  if (!Array.isArray(c.options) || c.options.length !== 4) return false;
  const opts = c.options.map((o: unknown) => (typeof o === "string" ? o.trim() : ""));
  if (opts.some((o: string) => !o || o.length > 300)) return false;
  if (new Set(opts.map((o: string) => o.toLowerCase())).size !== 4) return false;
  if (opts.some((o: string) => /^(all|none) of the above$/i.test(o))) return false;
  if (!Number.isInteger(c.correct_option) || c.correct_option < 0 || c.correct_option > 3) return false;
  if (typeof c.solution !== "string" || c.solution.trim().length < 20) return false;
  return true;
}

function extractJson(text: string): any {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const body = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(body);
  } catch {
    // Models sometimes emit LaTeX backslashes that are invalid JSON escapes; escape and retry.
    try { return JSON.parse(body.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")); } catch { return null; }
  }
}

async function askModel(topicTitle: string, focus: string[], count: number): Promise<{ questions: Candidate[]; model: string } | null> {
  if (!isNimConfigured()) return null;

  const system =
    "You write practice questions for the Indian CAT (MBA entrance) exam. Every question must have exactly one correct answer " +
    "that you have verified step by step. Never use 'all of the above' or 'none of the above'. Reply with JSON only.";
  const user =
    `Write ${count} multiple-choice questions for the CAT topic "${topicTitle}".\n` +
    (focus.length ? `Focus on these concepts the student finds difficult: ${focus.join("; ")}.\n` : "") +
    "Difficulty: actual CAT level (moderate to hard, multi-step). No one-line arithmetic or textbook-definition questions.\n" +
    "Each question has exactly 4 options. Write maths in plain text (e.g. 2^10, sqrt(5), 3/4), never LaTeX.\n" +
    'For EACH question, first write the worked solution in "solution" (at most 4 sentences), then set "correct_option" ' +
    "to the 0-based index of the option that matches your solution.\n" +
    "Return exactly this JSON shape:\n" +
    '{"questions":[{"question":"...","options":["...","...","...","..."],"solution":"...","correct_option":0,"concept":"short concept name"}]}';

  // Thinking off for speed (~5 s). Reliability comes from writing the solution before the
  // answer index plus strict validation; the fallback model is tried if the first one fails.
  const result = await nimChat({
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    temperature: 0.4,
    maxTokens: 3500,
    timeoutMs: 25_000,
  });
  if (!result) return null;
  const parsed = extractJson(result.content);
  const valid = (Array.isArray(parsed?.questions) ? parsed.questions : []).filter(validCandidate);
  if (valid.length > 0) return { questions: valid.slice(0, count), model: result.model };
  console.warn(`[Quiz generator] ${result.model} returned no valid questions`);
  return null;
}

/** Concepts in this topic where the student is below 60% (from recorded answers). */
async function weakConceptsFor(userId: string, topicId: string): Promise<string[]> {
  const res = await query(
    `SELECT r.concept
     FROM public.quiz_responses r JOIN public.quiz_attempts a ON a.id = r.attempt_id
     WHERE a.user_id = $1 AND a.topic_id = $2 AND r.concept IS NOT NULL AND r.is_attempted
     GROUP BY r.concept
     HAVING COUNT(*) >= 2 AND AVG(CASE WHEN r.is_correct THEN 1 ELSE 0 END) < 0.6
     ORDER BY AVG(CASE WHEN r.is_correct THEN 1 ELSE 0 END) ASC
     LIMIT 4`,
    [userId, topicId]
  );
  return res.rows.map((r) => r.concept);
}

/** Authored questions for the topic the student has not answered recently. */
async function bankQuestions(userId: string | null, topicId: string, count: number, focus: string[]): Promise<PracticeQuestion[]> {
  const all = Object.values(MODULE_QUIZZES[topicId] || {}).flat().filter((q) => q.type !== "TITA" && q.answer >= 0);
  let recent = new Set<string>();
  if (userId) {
    const res = await query(
      `SELECT DISTINCT r.question_id FROM public.quiz_responses r JOIN public.quiz_attempts a ON a.id = r.attempt_id
       WHERE a.user_id = $1 AND a.submitted_at > NOW() - INTERVAL '14 days'`,
      [userId]
    );
    recent = new Set(res.rows.map((r) => r.question_id));
  }
  const focusSet = new Set(focus.map((f) => f.toLowerCase()));
  const score = (c: string) => (focusSet.has((c || "").toLowerCase()) ? 0 : 1);
  const pool = all
    .filter((q) => !recent.has(q.id))
    .sort((a, b) => score(a.concept) - score(b.concept) || Math.random() - 0.5);
  const chosen = (pool.length >= count ? pool : [...pool, ...all.filter((q) => recent.has(q.id))]).slice(0, count);
  return chosen.map((q) => ({ id: q.id, question: q.q, options: q.options, concept: q.concept || null }));
}

export async function generatePracticeQuiz(
  userId: string,
  topicId: string,
  count: number,
  opts: { allowAi: boolean; recordForUser: boolean }
): Promise<GeneratedQuiz> {
  const topic = getTopicById(topicId);
  if (!topic) throw new Error("Unknown topic");
  const focus = opts.recordForUser ? await weakConceptsFor(userId, topicId) : [];

  const questions: PracticeQuestion[] = [];
  let usedAi = false;
  if (opts.allowAi) {
    const ai = await askModel(topic.title, focus, count);
    if (ai) {
      const res = await query(
        `INSERT INTO public.generated_questions (topic_id, concept, question, options, correct_option, explanation, source, model, created_for)
         SELECT $1, t.concept, t.question, t.options::jsonb, t.correct_option, t.explanation, 'llm', $2, $3
         FROM UNNEST($4::text[], $5::text[], $6::text[], $7::int[], $8::text[]) AS t(concept, question, options, correct_option, explanation)
         RETURNING id, concept, question, options`,
        [
          topicId, ai.model, opts.recordForUser ? userId : null,
          ai.questions.map((q) => q.concept?.slice(0, 120) || topic.title),
          ai.questions.map((q) => q.question.trim()),
          ai.questions.map((q) => JSON.stringify(q.options.map((o) => o.trim()))),
          ai.questions.map((q) => q.correct_option),
          ai.questions.map((q) => q.solution.trim()),
        ]
      );
      for (const r of res.rows) questions.push({ id: `gen:${r.id}`, question: r.question, options: r.options, concept: r.concept });
      usedAi = questions.length > 0;
    }
  }

  if (questions.length < count) {
    questions.push(...(await bankQuestions(opts.recordForUser ? userId : null, topicId, count - questions.length, focus)));
  }

  const source: GeneratedQuiz["source"] = usedAi ? (questions.some((q) => !q.id.startsWith("gen:")) ? "mixed" : "ai") : "bank";
  return { topicId, focus, questions, source };
}
