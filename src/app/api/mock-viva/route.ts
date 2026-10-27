import { NextRequest, NextResponse } from "next/server";

interface VivaFeedback {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
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
    const body = await request.json();
    const question: string = (body?.question || "").toString();
    const answer: string = (body?.answer || "").toString();
    const category: string = (body?.category || "the interview round").toString();
    const tips: string[] = Array.isArray(body?.tips) ? body.tips.map((t: unknown) => String(t)) : [];

    if (!answer.trim()) {
      return NextResponse.json({ error: "Please type your answer before requesting feedback." }, { status: 400 });
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
  "modelAnswer": "<3-5 sentence example of a strong answer to this question>"
}

Expert pointers for this question: ${tips.join(" ")}`;

        const userPrompt = `INTERVIEW QUESTION: ${question}\n\nCANDIDATE'S ANSWER: ${answer}`;

        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.4,
            max_tokens: 700,
          }),
          signal: AbortSignal.timeout(9000),
        });

        if (response.ok) {
          const data = await response.json();
          const content: string = data.choices?.[0]?.message?.content?.trim() || "";
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
              return NextResponse.json({ ...feedback, source: "ai" });
            }
          }
        }
      } catch (nvErr) {
        console.warn("[Mock Viva NVIDIA Error, using fallback]", nvErr);
      }
    }

    // Deterministic local fallback
    const fallback = buildFallbackFeedback(question, answer, tips);
    return NextResponse.json({ ...fallback, source: "local" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to evaluate answer.";
    console.error("[Mock Viva API Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
