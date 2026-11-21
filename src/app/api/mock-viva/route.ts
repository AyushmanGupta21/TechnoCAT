import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { nimChat } from "@/lib/ai/nim";
import { consumeRateLimit } from "@/lib/auth/rateLimit";

export const maxDuration = 30; // AI answers can take longer than the default function limit

interface VivaFeedback {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

interface SpeechInput {
  durationSeconds: number;
  wordCount: number;
  wordsPerMinute: number;
  fillerCount: number;
  longPauses: number | null;
}

interface DeliveryFeedback {
  wordsPerMinute: number;
  fillerCount: number;
  paceVerdict: string;
  notes: string[];
}

function clampInt(value: unknown, min: number, max: number): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.max(min, Math.min(max, n)));
}

/** Validate + clamp client-computed speech metrics. Returns null if unusable. */
function parseSpeech(raw: unknown): SpeechInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const durationSeconds = clampInt(r.durationSeconds, 0, 1800);
  const words = clampInt(r.wordCount, 0, 5000);
  if (durationSeconds === null || words === null || durationSeconds < 1 || words < 1) return null;
  // Recompute pace server-side so it is consistent with duration + word count.
  const wordsPerMinute = clampInt((words / durationSeconds) * 60, 0, 400) ?? 0;
  const fillerCount = clampInt(r.fillerCount, 0, words) ?? 0;
  const longPauses = r.longPauses === undefined ? null : clampInt(r.longPauses, 0, 500);
  return { durationSeconds, wordCount: words, wordsPerMinute, fillerCount, longPauses };
}

/** Deterministic pace verdict (ideal interview pace ~120-160 wpm). */
function paceVerdict(s: SpeechInput): string {
  if (s.durationSeconds < 10 || s.wordCount < 15) return "Too short to judge pace";
  const wpm = s.wordsPerMinute;
  if (wpm < 100) return "Too slow";
  if (wpm < 120) return "Slightly slow";
  if (wpm <= 160) return "Ideal pace";
  if (wpm <= 180) return "Slightly fast";
  return "Too fast";
}

/** Rule-based delivery notes used when the model gives none (or is unavailable). */
function buildDeliveryNotes(s: SpeechInput): string[] {
  const notes: string[] = [];
  const verdict = paceVerdict(s);
  if (verdict === "Too slow" || verdict === "Slightly slow") {
    notes.push(`You spoke at about ${s.wordsPerMinute} words per minute — aim for 120-160 so the panel stays engaged; trim long hesitations.`);
  } else if (verdict === "Too fast" || verdict === "Slightly fast") {
    notes.push(`You spoke at about ${s.wordsPerMinute} words per minute — slow down towards 120-160 and pause briefly between key points.`);
  } else if (verdict === "Ideal pace") {
    notes.push(`Your pace of about ${s.wordsPerMinute} words per minute is in the comfortable 120-160 range.`);
  } else {
    notes.push("The answer was too short to judge pace reliably — try a fuller 45-90 second response.");
  }
  const fillerRate = (s.fillerCount / s.wordCount) * 100;
  if (s.fillerCount === 0) {
    notes.push("No filler words were detected in the transcript — nice and clean.");
  } else if (fillerRate >= 5) {
    notes.push(`${s.fillerCount} filler words (um, like, basically, you know, so…) were detected — replace them with a short silent pause.`);
  } else {
    notes.push(`${s.fillerCount} filler word${s.fillerCount === 1 ? " was" : "s were"} detected — a few are natural, but fewer sounds more assured.`);
  }
  if (s.longPauses !== null && s.longPauses >= 3) {
    notes.push(`There were ${s.longPauses} long pauses (3s+) — a moment to think is fine, but structure your answer up front to keep it flowing.`);
  }
  return notes.slice(0, 4);
}

function buildDelivery(s: SpeechInput, modelNotes?: unknown): DeliveryFeedback {
  const notes = Array.isArray(modelNotes)
    ? modelNotes.map((n) => String(n).trim()).filter(Boolean).slice(0, 4)
    : [];
  return {
    wordsPerMinute: s.wordsPerMinute,
    fillerCount: s.fillerCount,
    paceVerdict: paceVerdict(s),
    notes: notes.length ? notes : buildDeliveryNotes(s),
  };
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Local heuristic evaluation used when the NVIDIA API key is missing or the
 * call fails. It never throws and always returns usable, encouraging feedback.
 */
function buildFallbackFeedback(
  question: string,
  answer: string,
  tips: string[]
): VivaFeedback {
  const words = wordCount(answer);
  const lower = answer.toLowerCase();

  const strengths: string[] = [];
  const improvements: string[] = [];

  // Length / depth
  if (words >= 60 && words <= 180) {
    strengths.push("Your answer length is well-judged — detailed but not rambling.");
  } else if (words < 30) {
    improvements.push("Expand your answer with a concrete example or reasoning; it feels too brief for an interview.");
  } else if (words < 60) {
    improvements.push("Add one supporting example or detail to make the answer more convincing.");
  } else {
    improvements.push("Tighten your answer — panels value crisp responses, aim for roughly 60-150 words.");
  }

  // Structure signals
  if (/(firstly|secondly|finally|for example|for instance|because|therefore|as a result)/.test(lower)) {
    strengths.push("Good use of structuring and linking words — your reasoning is easy to follow.");
  } else {
    improvements.push("Structure the answer with a clear opening, a supporting example, and a takeaway.");
  }

  // Specificity signals (numbers, named examples)
  if (/\d/.test(answer) || /(example|instance|project|team|company|experience)/.test(lower)) {
    strengths.push("You backed your points with specifics rather than staying abstract.");
  } else {
    improvements.push("Ground your answer in a specific example, figure, or personal experience.");
  }

  // Confidence / filler
  if (/(i think maybe|not sure|i guess|probably)/.test(lower)) {
    improvements.push("Avoid hedging phrases like 'I guess' or 'not sure' — speak with measured confidence.");
  } else {
    strengths.push("You sound confident and committed to your answer.");
  }

  if (strengths.length === 0) {
    strengths.push("You attempted the question directly, which is the right instinct in a viva.");
  }

  // Score: start at 55, reward length band + structure + specificity + confidence
  let score = 55;
  if (words >= 40) score += 10;
  if (words >= 60 && words <= 180) score += 8;
  if (/(firstly|secondly|finally|for example|for instance|because|therefore)/.test(lower)) score += 10;
  if (/\d/.test(answer) || /(example|instance|project|team|company|experience)/.test(lower)) score += 10;
  if (!/(i think maybe|not sure|i guess|probably)/.test(lower)) score += 7;
  score = Math.max(35, Math.min(95, score));

  const verdict =
    score >= 80
      ? "Strong interview-ready answer."
      : score >= 65
      ? "Solid answer with a few areas to sharpen."
      : "A reasonable start — refine it using the pointers below.";

  const modelAnswer = `A strong response would: open with a direct one-line answer to "${question.replace(/\.$/, "")}", then support it with one concrete example or reason, and close with a short takeaway. Keep in mind: ${tips.join(" ")}`;

  return { score, verdict, strengths: strengths.slice(0, 4), improvements: improvements.slice(0, 4), modelAnswer };
}

export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Please sign in to get feedback." }, { status: 401 });
    }
    const limit = await consumeRateLimit(`mock-viva:${session.userId}`, 30, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many feedback requests. Please wait a few minutes." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const question: string = (body?.question || "").toString();
    const answer: string = (body?.answer || "").toString();
    const category: string = (body?.category || "the interview round").toString();
    const tips: string[] = Array.isArray(body?.tips) ? body.tips.map((t: unknown) => String(t)) : [];
    const inputMode: "speech" | "typed" = body?.inputMode === "speech" ? "speech" : "typed";
    const speech = inputMode === "speech" ? parseSpeech(body?.speech) : null;

    if (!answer.trim()) {
      return NextResponse.json({ error: "Please type or record your answer before requesting feedback." }, { status: 400 });
    }

    // Try NVIDIA NIM for a real AI evaluation, mirroring the chat route pattern.
    if (process.env.NVIDIA_API_KEY) {
      try {
        const systemPrompt = `You are an experienced IIM admissions interview panelist evaluating a candidate's mock personal-interview (viva) answer for the "${category}" round.

Evaluate the candidate's answer to the interview question. Be fair, specific and constructive.

Respond with ONLY a valid JSON object (no markdown, no code fences) in exactly this shape:
{
  "score": <integer 0-100>,
  "verdict": "<one short sentence overall judgement>",
  "strengths": ["<2-4 concrete things done well>"],
  "improvements": ["<2-4 concrete, actionable fixes>"],
  "modelAnswer": "<3-5 sentence example of a strong answer to this question>"${
    speech
      ? `,
  "deliveryNotes": ["<1-3 short, specific notes on spoken delivery based ONLY on the metrics given>"]`
      : ""
  }
}
${
  speech
    ? `
The answer was SPOKEN aloud and transcribed by the candidate's browser (the candidate may have corrected mis-heard words). Ignore minor transcription errors and missing punctuation when judging content. Delivery metrics measured from the recording are provided; ideal interview pace is roughly 120-160 words per minute, and fewer filler words is better. Do not claim to have heard tone, accent or voice quality — you only have the transcript and these numbers.
`
    : ""
}
Expert pointers for this question: ${tips.join(" ")}`;

        const deliveryPrompt = speech
          ? `\n\nDELIVERY METRICS (measured): duration ${speech.durationSeconds}s, ${speech.wordCount} words, ${speech.wordsPerMinute} words/minute (pace verdict: ${paceVerdict(speech)}), ${speech.fillerCount} filler words (um/uh/like/basically/actually/you know/so)${
              speech.longPauses !== null ? `, ${speech.longPauses} pauses of 3s or more` : ""
            }.`
          : "";
        const userPrompt = `INTERVIEW QUESTION: ${question}\n\nCANDIDATE'S ${speech ? "SPOKEN (TRANSCRIBED) " : ""}ANSWER: ${answer}${deliveryPrompt}`;

        const result = await nimChat({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4,
          maxTokens: 900,
        });

        if (result) {
          const content: string = result.content;
          // Extract JSON even if the model wrapped it in prose or fences.
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            const feedback: VivaFeedback = {
              score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
              verdict: String(parsed.verdict || "Evaluation complete."),
              strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 4) : [],
              improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String).slice(0, 4) : [],
              modelAnswer: String(parsed.modelAnswer || ""),
            };
            if (feedback.strengths.length || feedback.improvements.length) {
              return NextResponse.json({
                ...feedback,
                ...(speech ? { delivery: buildDelivery(speech, parsed.deliveryNotes) } : {}),
                inputMode,
                source: "ai",
              });
            }
          }
        }
      } catch (nvErr) {
        console.warn("[Mock Viva NVIDIA Error, using fallback]", nvErr);
      }
    }

    // Deterministic local fallback
    const fallback = buildFallbackFeedback(question, answer, tips);
    return NextResponse.json({
      ...fallback,
      ...(speech ? { delivery: buildDelivery(speech) } : {}),
      inputMode,
      source: "local",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to evaluate answer.";
    console.error("[Mock Viva API Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
