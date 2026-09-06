import { NextRequest, NextResponse } from "next/server";
import { query, getProfileByEmail } from "@/lib/db";
import { getTopicById } from "@/data/topicsData";
import { getLessonKnowledge, QuizQuestion } from "@/data/videoPortions";

export async function POST(request: NextRequest) {
  try {
    let userId = request.cookies.get("technocat_user_id")?.value;
    if (!userId) {
      const defaultUser = await getProfileByEmail("student@technocat.edu");
      if (defaultUser) userId = defaultUser.id;
    }

    const {
      question,
      topicId,
      lessonCode,
      lessonTitle,
      lessonCoverage,
      conversationHistory = [],
    } = await request.json();

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Please provide a question." }, { status: 400 });
    }

    const topic = getTopicById(topicId);
    const knowledge = getLessonKnowledge(lessonCode, lessonTitle, lessonCoverage);
    const qLower = question.toLowerCase();

    // Save user question in DB
    if (userId) {
      try {
        await query(
          `INSERT INTO public.ai_chat_messages (user_id, topic_id, lesson_id, role, message)
           VALUES ($1, $2, $3, 'user', $4)`,
          [userId, topicId || "general", lessonCode || "general", question]
        );
      } catch (dbErr) {
        console.warn("[Save Chat Error]", dbErr);
      }
    }

    let aiResponse = "";
    let quizData: { title: string; questions: QuizQuestion[] } | null = null;

    const isQuizRequest =
      qLower.includes("quiz") ||
      qLower.includes("mcq") ||
      qLower.includes("test me") ||
      qLower.includes("practice question") ||
      qLower.includes("quiz on this video");

    const isTimestampRequest =
      qLower.includes("portion") ||
      qLower.includes("timestamp") ||
      qLower.includes("time") ||
      qLower.includes("where is") ||
      qLower.includes("when does") ||
      qLower.includes("which part") ||
      qLower.includes("chapter") ||
      qLower.includes("breakdown") ||
      qLower.includes("covered at which point") ||
      qLower.includes("what topics are covered");

    if (isQuizRequest) {
      // ── QUIZ GENERATION MODE (Interactive QuizBlock) ──
      quizData = {
        title: `Interactive Quiz: ${lessonCode ? `${lessonCode} - ` : ""}${lessonTitle}`,
        questions: knowledge.quiz
      };

      aiResponse = `### 🎯 Interactive Video Quiz Ready!
I have prepared an interactive multiple-choice quiz with **${knowledge.quiz.length} high-yield CAT questions** grounded directly in this lecture (*${lessonTitle}*). 

Select your answers below to test your understanding, verify explanations, and earn study points:`;
    } else if (isTimestampRequest) {
      // ── VIDEO PORTION & TIMESTAMP RAG MODE ──
      const matchedChapter = knowledge.chapters.find(c =>
        qLower.includes(c.title.toLowerCase()) ||
        c.keyConcepts.some(k => qLower.includes(k.toLowerCase()))
      );

      if (matchedChapter) {
        aiResponse = `### ⏱️ Video Portion Found: **${matchedChapter.title}**

This concept is covered in **[⏱ ${matchedChapter.displayTime}]** of this lecture.

- **Topic:** ${matchedChapter.title}
- **Lecture Portion:** ${matchedChapter.displayTime} (begins at ${Math.floor(matchedChapter.startTime / 60)}m ${matchedChapter.startTime % 60}s)
- **Summary:** ${matchedChapter.summary}
- **Key Concepts Covered:** ${matchedChapter.keyConcepts.join(" • ")}

👉 *Click the timestamp badge [⏱ ${Math.floor(matchedChapter.startTime / 60)}:${(matchedChapter.startTime % 60).toString().padStart(2, "0")}] to jump the video directly to this portion!*`;
      } else {
        const chapterList = knowledge.chapters.map((ch, idx) =>
          `${idx + 1}. **[⏱ ${ch.displayTime}]**: **${ch.title}**\n   - *Summary:* ${ch.summary}\n   - *Key Focus:* ${ch.keyConcepts.join(" • ")}`
        ).join("\n\n");

        aiResponse = `### ⏱️ Video Portions & Chapter Breakdown
Here is the exact timestamp mapping for **${lessonCode ? `${lessonCode} - ` : ""}${lessonTitle}**:

${chapterList}

💡 *You can click on any timestamp in the video controls or ask me: "Explain what is taught at 18:45" to get an instant breakdown!*`;
      }
    } else {
      // ── CONCEPTUAL Q&A / RAG MODE ──
      let nvidiaSucceeded = false;

      // Attempt NVIDIA NIM API call if key is present
      if (process.env.NVIDIA_API_KEY) {
        try {
          const chaptersContext = knowledge.chapters
            .map(c => `[Timestamp ${c.displayTime}]: ${c.title} - ${c.summary} (Concepts: ${c.keyConcepts.join(", ")})`)
            .join("\n");

          const systemPrompt = `You are TechnoCAT's expert AI CAT Exam Academic Tutor.
You are assisting a student watching the video lecture: "${lessonCode || "CAT"} - ${lessonTitle}".
Topics covered in this lecture: ${lessonCoverage || "Foundational concepts, formulas, and shortcuts"}.

VIDEO TIMESTAMPS & PORTIONS:
${chaptersContext}

INSTRUCTIONS:
1. Answer the student's question accurately and thoroughly for the CAT exam.
2. Structure your answer with clear headings, bullet points, and derivations.
3. Explicitly reference which portion/timestamp of the lecture (e.g. "[⏱ 14:20 - 28:00]") explains this concept so the student can re-watch that portion.
4. Keep the tone encouraging, academic, and focused on CAT shortcuts.`;

          const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`
            },
            body: JSON.stringify({
              model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: question.trim() }
              ],
              temperature: 0.5,
              max_tokens: 800
            }),
            signal: AbortSignal.timeout(9000),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content?.trim();
            if (content) {
              aiResponse = content;
              nvidiaSucceeded = true;
            }
          }
        } catch (nvidiaErr) {
          console.warn("[NVIDIA RAG Call Error, falling back to local engine]", nvidiaErr);
        }
      }

      // Fallback to grounded CAT knowledge engine if NVIDIA not called or failed
      if (!nvidiaSucceeded) {
        // Find the best matching chapter using keyword overlap
        let bestChapter = knowledge.chapters[0];
        let maxMatches = -1;

        const qTokens = qLower.split(/\W+/).filter((w: string) => w.length > 2);
        for (const ch of knowledge.chapters) {
          let matches = 0;
          const chText = `${ch.title} ${ch.summary} ${ch.keyConcepts.join(" ")}`.toLowerCase();
          for (const token of qTokens) {
            if (chText.includes(token)) matches++;
          }
          if (matches > maxMatches) {
            maxMatches = matches;
            bestChapter = ch;
          }
        }

        const startSec = bestChapter.startTime;
        const startMin = Math.floor(startSec / 60);
        const startSecRem = startSec % 60;
        const timeBadge = `[⏱ ${startMin}:${startSecRem.toString().padStart(2, "0")}]`;

        aiResponse = `### 💡 AI Tutor: ${bestChapter.title}

Regarding your query **"${question}"**:

1. **Where This Is Taught in the Video:**
   This concept is explained in detail during the **[⏱ ${bestChapter.displayTime}]** portion of this lecture.
   👉 *Click ${timeBadge} to jump right to this explanation.*

2. **Core Lecture Summary:**
   ${bestChapter.summary}

3. **Key Mathematical Principles & Shortcuts:**
${bestChapter.keyConcepts.map(c => `   - **${c}:** Essential for solving CAT QA/DI problems without tedious manual calculations.`).join("\n")}

4. **Exam Hall Strategy:**
   - Always evaluate whether variables are inversely or directly related before setting up equations.
   - Use boundary conditions, unit digits, and reciprocal tables to eliminate distractors in multiple-choice questions.

*Would you like to practice an interactive quiz on this video or ask about another timestamp?*`;
      }
    }

    // Save AI response in DB
    if (userId) {
      try {
        await query(
          `INSERT INTO public.ai_chat_messages (user_id, topic_id, lesson_id, role, message)
           VALUES ($1, $2, $3, 'assistant', $4)`,
          [userId, topicId || "general", lessonCode || "general", aiResponse]
        );
      } catch (dbErr) {
        console.warn("[Save AI Chat Error]", dbErr);
      }
    }

    return NextResponse.json({
      answer: aiResponse,
      reply: aiResponse,
      quiz: quizData,
      context: {
        topic: topic?.title,
        lesson: lessonTitle,
        coverage: lessonCoverage,
        chapters: knowledge.chapters,
      },
    });
  } catch (error: any) {
    console.error("[Chat API Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
