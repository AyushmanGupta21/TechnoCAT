import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { nimChat, type ChatMessage } from "@/lib/ai/nim";
import { consumeRateLimit } from "@/lib/auth/rateLimit";
import {
  findLiveVivaType,
  type LiveVivaAssessment,
  type LiveVivaMode,
  type LiveVivaType,
} from "@/lib/viva/liveVivaConfig";

// Live camera + voice viva: "next" generates the interviewer's next question,
// "report" writes the end-of-session assessment. Only answer TEXT and numeric
// behavioural metrics reach this route; audio and video never leave the browser.

export const maxDuration = 30;

type Phase = "opening" | "warmup" | "exploration" | "deep_probe" | "breadth" | "closing";

const PHASE_INSTRUCTIONS: Record<Phase, string> = {
  opening: "Greet the candidate in one short sentence, then ask a warm, simple opening question.",
  warmup: "Ask a foundational question to gauge the baseline. Keep it accessible.",
  exploration: "React to the previous answer: probe deeper into it or move to a closely related point.",
  deep_probe: "Investigate a gap or a strength you noticed. Challenge an assumption or ask for a concrete example.",
  breadth: "Move to an area not yet covered to test breadth.",
  closing: "This is the final question. Ask one last thought-provoking question. Do not say goodbye yet.",
};

const MODE_PERSONA: Record<LiveVivaMode, string> = {
  pi: `You are the chairperson of an IIM / top B-school personal-interview (PI) panel interviewing a CAT aspirant. Your tone is professional, calm and probing, like a real Indian B-school panel. You test self-awareness, clarity of goals, honesty and depth. Ask about their background, choices, examples and motivations; when they make a claim, ask for evidence or a specific example.`,
  academic: `You are a professor on an IIM interview panel running an academic viva on CAT concepts. Ask conceptual questions that can be answered verbally in under a minute without pen and paper: definitions, why a method works, comparing approaches, spotting a trap, quick mental reasoning (e.g. percentages, ratios, averages, probability basics, set logic, arrangements, critical reasoning, reading strategy, grammar logic). When the answer is right, raise the difficulty or ask "why"; when it is wrong or vague, step back to the underlying fundamental. Never reveal the correct answer.`,
  ca: `You are an IIM interview panelist testing a CAT aspirant's awareness of current affairs, the economy and business. Ask for the candidate's informed view, its implications and trade-offs. Your knowledge of very recent events may be outdated, so do not assert specific recent facts, numbers or dates as true; frame questions around well-known themes and ask the candidate to explain what they know.`,
  stress: `You are a stress-interview panelist at a top B-school. You are polite but sceptical: you push back on answers, play devil's advocate and ask the candidate to defend their choices under pressure. Never be rude, personal or abusive.`,
};

const FALLBACK_QUESTIONS: Record<LiveVivaMode, string[]> = {
  pi: [
    "Good morning, and welcome. Please introduce yourself briefly.",
    "Walk us through one decision in your academic or work journey that you would make differently today.",
    "What is one strength your friends would say you underestimate?",
    "Tell us about a time you had to lead without formal authority.",
    "Why do you want an MBA now rather than in three years?",
    "What is a weakness you are actively working on, and what have you changed so far?",
    "How does your graduation subject help you think about business problems?",
    "What would you do if you did not get into any B-school this year?",
    "What is the most difficult feedback you have received, and how did you act on it?",
    "Finally, why should this panel select you over an equally qualified candidate?",
  ],
  academic: [
    "Good morning. Let's start simply: what is the difference between a percentage change and a percentage point change?",
    "If a price rises by 20% and then falls by 20%, is it back where it started? Why?",
    "How would you explain the idea of a weighted average to someone who has never heard of it?",
    "In a reading comprehension passage, how do you tell the author's main point from a supporting detail?",
    "What is the difference between a necessary and a sufficient condition? Give an example.",
    "When would you use permutations rather than combinations?",
    "In a data interpretation set, how do you decide which questions to attempt first?",
    "Why does doubling the speed not halve the total time when part of a journey is fixed?",
    "How would you check whether an argument's conclusion actually follows from its premises?",
    "Last question: which CAT topic do you find hardest, and how are you working on it?",
  ],
  ca: [
    "Good morning. Which recent economic or business development have you followed closely, and why?",
    "What does inflation mean for an ordinary household, and how do central banks try to control it?",
    "Do you think startups or large corporates will create more jobs in India over the next decade? Why?",
    "How is artificial intelligence likely to change entry-level jobs?",
    "What are the trade-offs of a government increasing capital expenditure?",
    "Should India prioritise manufacturing or services for growth? Defend your view.",
    "How do global events, such as conflicts or oil prices, affect Indian businesses?",
    "What is one policy you would change if you were the finance minister for a day?",
    "How should companies balance profit with environmental responsibility?",
    "Finally, which business leader do you admire, and what would you question about their decisions?",
  ],
  stress: [
    "Good morning. Your profile looks quite ordinary. Tell us why we should spend time on it.",
    "That sounds rehearsed. What is the real reason you want an MBA?",
    "Many candidates have better scores than you. What makes you different?",
    "Why should we believe you will not leave your career plan after the first internship?",
    "Name one thing you have done that was genuinely difficult, not just busy.",
    "If your biggest achievement is so impressive, why did it not lead anywhere further?",
    "You seem unsure. Convince us in two sentences.",
    "What would your harshest critic say about you, and are they right?",
    "Why should we not pick someone with more work experience?",
    "Finally, tell us one thing about yourself that is not on your form.",
  ],
};

function clampInt(value: unknown, min: number, max: number): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.max(min, Math.min(max, n)));
}

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanList(value: unknown, maxItems: number, maxLen = 240): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => cleanText(typeof v === "string" ? v : String(v ?? ""), maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function phaseFor(questionNumber: number, total: number): Phase {
  if (questionNumber <= 1) return "opening";
  if (questionNumber >= total) return "closing";
  const r = (questionNumber - 1) / Math.max(1, total - 1);
  if (r < 0.3) return "warmup";
  if (r < 0.6) return "exploration";
  if (r < 0.8) return "deep_probe";
  return "breadth";
}

/** Pull the first JSON object out of a model reply (handles fences / prose). */
function extractJson(content: string): Record<string, unknown> | null {
  const stripped = content.replace(/```(?:json)?/gi, "");
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Tidy a generated question: drop labels/quotes, keep it short. */
function tidyQuestion(raw: string): string {
  let q = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^\s*(interviewer|panelist|panel|question|q\d*)\s*[:\-]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();
  // Keep at most three sentences (a short reaction + the question).
  const sentences = q.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (sentences && sentences.length > 3) q = sentences.slice(0, 3).join(" ").trim();
  if (q.length > 320) q = q.slice(0, 320).replace(/\s+\S*$/, "") + "?";
  return q;
}

function fallbackQuestion(mode: LiveVivaMode, questionNumber: number, asked: string[], topic: string): string {
  const bank = FALLBACK_QUESTIONS[mode];
  const askedLower = new Set(asked.map((a) => a.toLowerCase()));
  if (questionNumber <= 1) {
    const first = bank[0];
    return topic && !/^mixed/i.test(topic) ? `${first} Today we will focus on ${topic}.` : first;
  }
  const rest = bank.slice(1);
  const start = (questionNumber - 1) % rest.length;
  for (let i = 0; i < rest.length; i++) {
    const q = rest[(start + i) % rest.length];
    if (!askedLower.has(q.toLowerCase())) return q;
  }
  return "Could you give us a specific example that supports your last answer?";
}

interface HistoryItem {
  role: "interviewer" | "candidate";
  content: string;
}

function parseHistory(raw: unknown): HistoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-10)
    .map((h) => {
      const r = (h && typeof h === "object" ? h : {}) as Record<string, unknown>;
      const role = r.role === "candidate" ? "candidate" : "interviewer";
      return { role, content: cleanText(r.content, role === "candidate" ? 900 : 400) } as HistoryItem;
    })
    .filter((h) => h.content);
}

async function handleNext(body: Record<string, unknown>) {
  const type: LiveVivaType = findLiveVivaType(body.vivaType);
  const topic = type.topics.includes(String(body.topic)) ? String(body.topic) : type.topics[0];
  const totalQuestions = clampInt(body.totalQuestions, 3, 15) ?? 6;
  const questionNumber = clampInt(body.questionNumber, 1, totalQuestions) ?? 1;
  const history = parseHistory(body.history);
  const latestAnswer = cleanText(body.latestAnswer, 1500);
  const phase = phaseFor(questionNumber, totalQuestions);
  const isEnding = questionNumber >= totalQuestions;
  const asked = history.filter((h) => h.role === "interviewer").map((h) => h.content);

  const systemPrompt = `${MODE_PERSONA[type.mode]}

Viva type: ${type.label}. Focus: ${topic}. This is question ${questionNumber} of ${totalQuestions}.

YOUR JOB: evaluate the candidate through conversation. Do NOT teach, explain, give hints or reveal answers.
Rules:
- Vague or generic answer -> probe: ask for a specific example, number or reason.
- Wrong or weak answer -> step back and check the fundamental behind it.
- Strong answer -> raise the difficulty or ask "why" / "what if".
- Topic exhausted -> transition briefly ("Let's move on.") to a new area within the focus.
- Ask exactly ONE question, 1-2 short sentences. It will be spoken aloud, so use plain words, no lists, no markdown, no emojis.
- Do not start with "Great", "Excellent" or praise. A brief neutral acknowledgement is fine.
- Never repeat a question already asked.

Phase directive: ${PHASE_INSTRUCTIONS[phase]}

Return ONLY the words you would say next. No labels, no quotes, no preamble.`;

  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];
  if (history.length) {
    const transcript = history
      .map((h) => `${h.role === "interviewer" ? "Interviewer" : "Candidate"}: ${h.content}`)
      .join("\n");
    messages.push({ role: "user", content: `Interview so far:\n${transcript}` });
  }
  if (questionNumber <= 1) {
    messages.push({ role: "user", content: "Start the viva: greet the candidate and ask the first question." });
  } else if (latestAnswer && latestAnswer.split(/\s+/).length >= 2) {
    messages.push({
      role: "user",
      content: `The candidate's latest (spoken, auto-transcribed; ignore small transcription errors) answer: "${latestAnswer}"\n\nSay your next question.`,
    });
  } else {
    messages.push({
      role: "user",
      content:
        "The candidate skipped or did not answer the last question. Acknowledge it in a few neutral words and ask a different, slightly easier question.",
    });
  }

  const result = await nimChat({ messages, temperature: 0.7, maxTokens: 180, thinking: false, timeoutMs: 12_000 });
  let question = result ? tidyQuestion(result.content) : "";
  if (question.length < 8 || asked.some((a) => a.toLowerCase() === question.toLowerCase())) {
    question = fallbackQuestion(type.mode, questionNumber, asked, topic);
  }
  return NextResponse.json({ question, phase, isEnding, source: result ? "ai" : "local" });
}

interface ParsedMetrics {
  eyeContactPct: number | null;
  faceInFramePct: number | null;
  framingPct: number | null;
  avgWpm: number | null;
  fillerCount: number;
  questionsAnswered: number;
  questionsAsked: number;
  durationSeconds: number;
}

function parseMetrics(raw: unknown): ParsedMetrics {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pct = (v: unknown) => (v === null || v === undefined ? null : clampInt(v, 0, 100));
  return {
    eyeContactPct: pct(r.eyeContactPct),
    faceInFramePct: pct(r.faceInFramePct),
    framingPct: pct(r.framingPct),
    avgWpm: r.avgWpm === null || r.avgWpm === undefined ? null : clampInt(r.avgWpm, 0, 400),
    fillerCount: clampInt(r.fillerCount, 0, 5000) ?? 0,
    questionsAnswered: clampInt(r.questionsAnswered, 0, 30) ?? 0,
    questionsAsked: clampInt(r.questionsAsked, 0, 30) ?? 0,
    durationSeconds: clampInt(r.durationSeconds, 0, 7200) ?? 0,
  };
}

/** 0-100 delivery score from measured behaviour, or null if nothing was measured. */
function deliveryScore(m: ParsedMetrics, totalWords: number): number | null {
  const parts: { v: number; w: number }[] = [];
  if (m.eyeContactPct !== null) parts.push({ v: m.eyeContactPct, w: 3 });
  if (m.framingPct !== null) parts.push({ v: m.framingPct, w: 2 });
  if (m.avgWpm !== null && m.avgWpm > 0) {
    const w = m.avgWpm;
    const pace = w >= 120 && w <= 160 ? 100 : w < 120 ? Math.max(30, 100 - (120 - w) * 1.5) : Math.max(30, 100 - (w - 160) * 1.5);
    parts.push({ v: pace, w: 2 });
  }
  if (totalWords >= 20) {
    const rate = (m.fillerCount / totalWords) * 100;
    parts.push({ v: Math.max(30, 100 - rate * 10), w: 1 });
  }
  if (!parts.length) return null;
  const total = parts.reduce((s, p) => s + p.w, 0);
  return Math.round(parts.reduce((s, p) => s + p.v * p.w, 0) / total);
}

function fallbackAssessment(
  turns: { question: string; answer: string }[],
  m: ParsedMetrics,
  delivery: number | null,
  type: LiveVivaType,
  topic: string
): LiveVivaAssessment {
  const answered = turns.filter((t) => t.answer.split(/\s+/).filter(Boolean).length >= 3);
  const avgWords = answered.length
    ? answered.reduce((s, t) => s + t.answer.split(/\s+/).filter(Boolean).length, 0) / answered.length
    : 0;
  const answerRate = turns.length ? answered.length / turns.length : 0;
  let content = 35 + answerRate * 30;
  if (avgWords >= 40) content += 12;
  else if (avgWords >= 20) content += 6;
  if (answered.some((t) => /\d|for example|for instance|because/i.test(t.answer))) content += 10;
  content = Math.round(Math.max(20, Math.min(85, content)));
  const overall = delivery === null ? content : Math.round(content * 0.75 + delivery * 0.25);

  const strengths: string[] = [];
  const improvements: string[] = [];
  if (answerRate >= 0.8) strengths.push("You attempted almost every question instead of skipping.");
  else improvements.push("Attempt every question, even briefly; skipping reads as unpreparedness to a panel.");
  if (avgWords >= 40) strengths.push("Your answers had reasonable depth rather than one-liners.");
  else improvements.push("Develop answers to 45-90 seconds: a direct answer, one specific example, and a takeaway.");
  if (m.eyeContactPct !== null) {
    if (m.eyeContactPct >= 70) strengths.push(`You held eye contact with the camera about ${m.eyeContactPct}% of the time.`);
    else improvements.push(`Eye contact was about ${m.eyeContactPct}%; look at the camera lens, not your own preview, while answering.`);
  }
  if (m.framingPct !== null && m.framingPct < 70) {
    improvements.push("Sit centred with your head and shoulders in frame and the camera at eye level.");
  }
  if (m.avgWpm !== null && m.avgWpm > 0) {
    if (m.avgWpm < 110) improvements.push(`Your pace was about ${m.avgWpm} wpm; aim for 120-160 by structuring the answer before you start.`);
    else if (m.avgWpm > 170) improvements.push(`Your pace was about ${m.avgWpm} wpm; slow down and pause between points.`);
    else strengths.push(`Your speaking pace (about ${m.avgWpm} wpm) was comfortable to follow.`);
  }
  if (!strengths.length) strengths.push("You completed a live, on-camera viva, which is the best practice for the real panel.");

  return {
    overallScore: overall,
    contentScore: content,
    deliveryScore: delivery,
    verdict:
      overall >= 75
        ? "A confident session; polish the specifics and you will be panel-ready."
        : overall >= 55
        ? "A fair session with clear room to sharpen depth and delivery."
        : "An early-stage attempt; focus on structure and attempting every question.",
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    topicsToRevise: [topic, ...(type.mode === "academic" ? ["Core CAT fundamentals behind the questions you found hard"] : [])].slice(0, 4),
    nextSteps: [
      "Write a 90-second answer outline for each question you hesitated on, then repeat this viva.",
      "Record yourself once more and watch only your eye line and posture.",
      type.mode === "pi" || type.mode === "stress"
        ? "Prepare two specific stories (achievement and failure) with numbers you can quote."
        : "Revise the concepts above and explain each one aloud in under a minute.",
    ],
    perAnswer: [],
    source: "local",
  };
}

async function handleReport(body: Record<string, unknown>) {
  const type = findLiveVivaType(body.vivaType);
  const topic = type.topics.includes(String(body.topic)) ? String(body.topic) : type.topics[0];
  const metrics = parseMetrics(body.metrics);
  const turns = (Array.isArray(body.transcript) ? body.transcript : [])
    .slice(0, 16)
    .map((t: unknown) => {
      const r = (t && typeof t === "object" ? t : {}) as Record<string, unknown>;
      return { question: cleanText(r.question, 400), answer: cleanText(r.answer, 1500) };
    })
    .filter((t: { question: string }) => t.question);

  const totalWords = turns.reduce((s: number, t: { answer: string }) => s + t.answer.split(/\s+/).filter(Boolean).length, 0);
  const delivery = deliveryScore(metrics, totalWords);
  const fallback = fallbackAssessment(turns, metrics, delivery, type, topic);

  const hasAnswers = turns.some((t: { answer: string }) => t.answer.split(/\s+/).filter(Boolean).length >= 3);
  if (!hasAnswers) {
    return NextResponse.json({
      assessment: {
        ...fallback,
        verdict: "The session was too short to evaluate. Answer at least a couple of questions out loud next time.",
      },
    });
  }

  const transcript = turns
    .map((t: { question: string; answer: string }, i: number) => `Q${i + 1} (Interviewer): ${t.question}\nA${i + 1} (Candidate): ${t.answer || "[no answer / skipped]"}`)
    .join("\n\n");
  const fmt = (v: number | null, unit = "%") => (v === null ? "not measured" : `${v}${unit}`);

  const systemPrompt = `You are an experienced IIM interview panelist writing feedback on a CAT aspirant's live mock viva (${type.label}, focus: ${topic}).
The answers were spoken and auto-transcribed in the browser: ignore missing punctuation and small transcription errors. You did not see or hear the candidate; behavioural numbers below were measured by the browser.

Judge content: relevance, depth, structure, specificity, honesty${type.mode === "academic" ? ", and conceptual accuracy of CAT concepts" : ""}. Reference what the candidate actually said. Be honest and constructive.

Respond with ONLY a JSON object (no markdown) in exactly this shape:
{
  "contentScore": <integer 0-100 for answer quality>,
  "verdict": "<2 sentence honest summary>",
  "strengths": ["<2-4 specific strengths>"],
  "improvements": ["<2-4 specific, actionable fixes; may include delivery based on the numbers>"],
  "topicsToRevise": ["<1-4 topics or concepts>"],
  "nextSteps": ["<2-3 concrete actions>"],
  "perAnswer": [{"q": <question number>, "feedback": "<one sentence>"}]
}`;

  const userPrompt = `TRANSCRIPT:\n${transcript}\n\nBEHAVIOURAL DATA: eye contact with camera ${fmt(metrics.eyeContactPct)}, face in frame ${fmt(
    metrics.faceInFramePct
  )}, good framing/posture ${fmt(metrics.framingPct)}, average pace ${fmt(metrics.avgWpm, " wpm")} (ideal 120-160), filler words ${
    metrics.fillerCount
  }, questions answered ${metrics.questionsAnswered} of ${metrics.questionsAsked}, duration ${Math.round(metrics.durationSeconds / 60)} min.`;

  const result = await nimChat({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    maxTokens: 1400,
    thinking: false,
    timeoutMs: 20_000,
  });

  const parsed = result ? extractJson(result.content) : null;
  if (parsed) {
    const strengths = cleanList(parsed.strengths, 4);
    const improvements = cleanList(parsed.improvements, 4);
    if (strengths.length || improvements.length) {
      const content = clampInt(parsed.contentScore ?? parsed.overallScore, 0, 100) ?? fallback.contentScore;
      const perAnswer = (Array.isArray(parsed.perAnswer) ? parsed.perAnswer : [])
        .slice(0, turns.length)
        .map((p: unknown, i: number) => {
          const r = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
          const idx = (clampInt(r.q, 1, turns.length) ?? i + 1) - 1;
          return { question: turns[idx]?.question ?? "", feedback: cleanText(r.feedback, 300) };
        })
        .filter((p: { question: string; feedback: string }) => p.question && p.feedback);
      const assessment: LiveVivaAssessment = {
        overallScore: delivery === null ? content : Math.round(content * 0.75 + delivery * 0.25),
        contentScore: content,
        deliveryScore: delivery,
        verdict: cleanText(parsed.verdict, 500) || fallback.verdict,
        strengths: strengths.length ? strengths : fallback.strengths,
        improvements: improvements.length ? improvements : fallback.improvements,
        topicsToRevise: cleanList(parsed.topicsToRevise, 4, 120).length ? cleanList(parsed.topicsToRevise, 4, 120) : fallback.topicsToRevise,
        nextSteps: cleanList(parsed.nextSteps, 3).length ? cleanList(parsed.nextSteps, 3) : fallback.nextSteps,
        perAnswer,
        source: "ai",
      };
      return NextResponse.json({ assessment });
    }
  }
  return NextResponse.json({ assessment: fallback });
}

export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Please sign in to start a live viva." }, { status: 401 });
    }
    const limit = await consumeRateLimit(`mock-viva-live:${session.userId}`, 120, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many viva requests. Please wait a few minutes." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    let body: Record<string, unknown>;
    try {
      const raw = await request.json();
      body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (body.action === "next") return await handleNext(body);
    if (body.action === "report") return await handleReport(body);
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error: unknown) {
    console.error("[Mock Viva Live API Error]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
