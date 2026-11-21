// Client helper: sends a finished quiz to the server (POST /api/quiz/attempts), where it is
// graded against the server answer key and stored with every response.

export type QuizAttemptKind = "pyq" | "module_quiz" | "grand_quiz" | "lesson_practice";

export interface QuizAttemptContext {
  kind: QuizAttemptKind;
  topicId?: string;
  moduleKey?: string;
  lessonId?: string;
  sourceRef?: string;
  section?: string;
}

export interface ServedQuestion {
  id: string;
  type?: "MCQ" | "TITA";
  answer?: number; // -1 for TITA in module/PYQ banks
}

/** Turns position-keyed answers into id-keyed responses for every served question. */
export function buildResponses(questions: ServedQuestion[], answers: Record<number, number | string>) {
  return questions.map((q, idx) => {
    const value = answers[idx];
    const isTita = q.type === "TITA" || q.answer === -1;
    return isTita
      ? { questionId: q.id, titaAnswer: typeof value === "string" ? value : value != null ? String(value) : null }
      : { questionId: q.id, selectedOption: typeof value === "number" ? value : null };
  });
}

export async function submitQuizAttempt(
  context: QuizAttemptContext,
  questions: ServedQuestion[],
  answers: Record<number, number | string>,
  meta: { durationSeconds: number; strikes?: number }
): Promise<{ attemptId: string; percentage: number; passed: boolean | null; pointsAwarded: number } | null> {
  try {
    const res = await fetch("/api/quiz/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...context,
        durationSeconds: Math.max(0, Math.round(meta.durationSeconds)),
        strikes: meta.strikes ?? 0,
        responses: buildResponses(questions, answers),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[Quiz attempt not saved]", data?.error || res.status);
      return null;
    }
    return data.attempt;
  } catch (err) {
    console.error("[Quiz attempt not saved]", err);
    return null;
  }
}
