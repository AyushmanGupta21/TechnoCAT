import { NextRequest, NextResponse } from "next/server";
import { getLessonKnowledge } from "@/data/videoPortions";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const {
      topic = "Quantitative Ability",
      lessonCode,
      courseName = "CAT Preparation",
      contextText = "",
      numQuestions = 5,
    } = await req.json();

    const fallbackKnowledge = getLessonKnowledge(lessonCode, topic, contextText);

    // If NVIDIA API key is available, attempt dynamic generation
    if (NVIDIA_API_KEY) {
      try {
        const systemPrompt = `You are an expert CAT exam quiz generator for "${courseName}".
Generate a dynamic multiple-choice quiz about: "${topic}".

STRICT INSTRUCTIONS:
1. Generate exactly ${Math.min(10, Math.max(3, numQuestions))} questions.
2. Questions must be derived from the context material and CAT exam syllabus.
3. Each question MUST have exactly 4 options (A, B, C, D).
4. Only ONE option should be correct.
5. Provide educational explanations for why options are correct or incorrect.

OUTPUT FORMAT:
Output ONLY valid JSON matching this exact structure with NO markdown formatting:
[
  {
    "question": "The question text here?",
    "options": [
      { "id": "A", "text": "Option A" },
      { "id": "B", "text": "Option B" },
      { "id": "C", "text": "Option C" },
      { "id": "D", "text": "Option D" }
    ],
    "correct_answers": ["A"],
    "explanations": {
      "A": "Explanation why A is correct.",
      "B": "Explanation why B is incorrect.",
      "C": "Explanation why C is incorrect.",
      "D": "Explanation why D is incorrect."
    }
  }
]`;

        const response = await fetch(NVIDIA_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${NVIDIA_API_KEY}`,
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Context Material:\n${contextText || topic}` },
            ],
            temperature: 0.6,
            max_tokens: 3000,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          const data = await response.json();
          let rawOutput = data.choices?.[0]?.message?.content?.trim() || "[]";
          rawOutput = rawOutput.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();

          const questions = JSON.parse(rawOutput);
          if (Array.isArray(questions) && questions.length > 0) {
            return NextResponse.json({ questions, source: "nvidia" });
          }
        }
      } catch (nvidiaErr) {
        console.warn("[GenerateQuiz NVIDIA fallback]", nvidiaErr);
      }
    }

    // Grounded CAT database fallback
    const technoQuestions = fallbackKnowledge.quiz.map((q) => ({
      question: q.q,
      options: q.options.map((opt, i) => ({
        id: ["A", "B", "C", "D"][i] || `${i + 1}`,
        text: opt,
      })),
      correct_answers: [["A", "B", "C", "D"][q.answer] || "A"],
      explanations: {
        [["A", "B", "C", "D"][q.answer] || "A"]: q.explanation,
      },
    }));

    return NextResponse.json({
      questions: technoQuestions,
      source: "curated_grounded",
    });
  } catch (error: any) {
    console.error("[GenerateQuiz Error]", error);
    return NextResponse.json({ error: error.message || "Failed to generate quiz" }, { status: 500 });
  }
}
