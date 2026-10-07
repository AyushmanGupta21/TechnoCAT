import { NextRequest, NextResponse } from "next/server";
import { query, getProfileById, getUserReadinessMetrics } from "@/lib/db";

async function resolveUserId(request: NextRequest): Promise<string | null> {
  const cookieUserId = request.cookies.get("technocat_user_id")?.value;
  if (cookieUserId && cookieUserId.trim().length > 0) {
    return cookieUserId.trim();
  }

  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token.length > 0) {
      try {
        const profile = await getProfileById(token);
        if (profile?.id) return profile.id;
      } catch {
        // ignore lookup error
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const body = await request.json();
    const { messages = [], question } = body;

    // Normalise incoming message history
    let conversation: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (Array.isArray(messages) && messages.length > 0) {
      conversation = messages
        .filter((m: any) => m && m.content && (m.role === "user" || m.role === "assistant"))
        .map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: String(m.content).trim(),
        }));
    } else if (question && typeof question === "string" && question.trim()) {
      conversation = [{ role: "user", content: question.trim() }];
    }

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Please provide a question." }, { status: 400 });
    }

    const latestUserMsg = conversation[conversation.length - 1]?.content || "";

    // 1. Gather Real Student Performance Context from Database
    let studentName = "CAT Aspirant";
    let targetYear = "2026";
    let dreamSchool = "IIM Ahmedabad / IIM Bangalore";
    let readinessInfo = {
      readiness: 0,
      concepts: 0,
      accuracy: 0,
      speed: 0,
      consistency: 0,
      hasActivity: false,
    };
    let mockAttemptsCount = 0;
    let recentScores: number[] = [];
    let completedLessonsCount = 0;

    if (userId) {
      try {
        const profile = await getProfileById(userId);
        if (profile) {
          studentName = profile.fullName || studentName;
          targetYear = profile.targetYear || targetYear;
          dreamSchool = profile.dreamSchool || dreamSchool;
        }

        readinessInfo = await getUserReadinessMetrics(userId);

        const attemptsRes = await query(
          `SELECT score, percentage, completed_at
           FROM public.pyq_attempts
           WHERE user_id = $1
           ORDER BY completed_at DESC
           LIMIT 5`,
          [userId]
        );
        mockAttemptsCount = attemptsRes.rows?.length || 0;
        recentScores = (attemptsRes.rows || []).map((r: any) => Number(r.score) || 0);

        const topicProgressRes = await query(
          `SELECT completed_lessons FROM public.topic_progress WHERE user_id = $1`,
          [userId]
        );
        completedLessonsCount = (topicProgressRes.rows || []).reduce((acc: number, r: any) => {
          if (Array.isArray(r.completed_lessons)) return acc + r.completed_lessons.length;
          return acc;
        }, 0);
      } catch (err) {
        console.warn("[Mentor Context Query Error]", err);
      }
    }

    // 2. Build Expert CAT Mentor System Prompt
    const performanceContextText = readinessInfo.hasActivity
      ? `CURRENT STUDENT PERFORMANCE DATA (FROM TECHNOCAT DATABASE):
- Overall CAT Readiness: ${readinessInfo.readiness}%
- Concepts Mastery: ${readinessInfo.concepts}%
- Mock Test Accuracy: ${readinessInfo.accuracy}%
- Solving Speed: ${readinessInfo.speed}%
- Test Consistency: ${readinessInfo.consistency}%
- Recorded Mock Attempts: ${mockAttemptsCount} (Recent scores: ${recentScores.join(", ") || "N/A"})
- Completed Lessons: ${completedLessonsCount} lessons
- Target CAT Year: ${targetYear}
- Dream B-School: ${dreamSchool}`
      : `CURRENT STUDENT PERFORMANCE DATA:
- Activity Level: ZERO ACTIVITY (Brand-new student, no mocks attempted yet, no lessons marked complete).
- Readiness Meter: 0% across all metrics.
- Target CAT Year: ${targetYear}
- Dream B-School: ${dreamSchool}

CRITICAL DATA HONESTY INSTRUCTION:
The student currently has 0 recorded mock attempts and 0% readiness.
NEVER invent or hallucinate mock scores, accuracy numbers, or specific past question mistakes.
If the student asks "Why is my readiness low?", "Analyze my mock scores", or "What are my weak areas?", explain honestly and warmly that their CAT Readiness Meter is at 0% because they haven't attempted their first diagnostic mock or completed lessons on TechnoCAT yet. Guide them to attempt their first mock in the Browse / PYQ section or complete their foundational lessons to generate their personalized readiness profile.`;

    const systemPrompt = `You are the TechnoCAT AI Mentor, a distinguished, deeply strategic, encouraging, and razor-sharp CAT exam preparation mentor.
You are mentoring student: "${studentName}".

${performanceContextText}

CAT EXAM STRUCTURE & METHODOLOGY:
- CAT consists of 3 sections (40 mins each, 66 questions total):
  1. VARC (Verbal Ability & Reading Comprehension): 24 questions (~16 RC, ~8 VA including Para Jumbles, Para Summary, Odd One Out).
  2. DILR (Data Interpretation & Logical Reasoning): 20-22 questions in 4-5 caselet sets.
  3. QA (Quantitative Ability): 22 questions across Arithmetic (highest weightage ~8-9 Qs), Algebra (~7-8 Qs), Geometry (~3-4 Qs), Numbers (~1-2 Qs), Modern Math (~1-2 Qs).

MENTORING INSTRUCTIONS:
1. Act as an elite CAT tutor: deliver practical, actionable, high-conviction advice.
2. Structure responses logically using clear markdown: bold key takeaways, bullet points, numbered step-by-step processes, and clean spacing.
3. Understand conversational context: If previous turns discussed a topic (e.g., QA or DILR), follow-up questions inherit that context naturally.
4. When explaining strategies, provide specific examples, time-allocation rules (e.g., the 2-minute ditch rule, Round 1/2/3 question selection), and concrete formulas or shortcuts.
5. If the user asks about their performance, refer strictly to the real performance data above without hallucinating fake numbers.
6. Keep answers concise, highly impactful, and motivating — avoid unnecessary filler.`;

    // 3. Attempt Call to NVIDIA NIM with Working Llama 3.2 11B / 90B
    let aiResponse = "";
    if (process.env.NVIDIA_API_KEY) {
      const modelsToTry = [
        "meta/llama-3.2-11b-vision-instruct",
        "meta/llama-3.2-90b-vision-instruct",
        "nvidia/nemotron-3-ultra-550b-a55b",
      ];

      for (const model of modelsToTry) {
        try {
          const apiMessages = [
            { role: "system", content: systemPrompt },
            ...conversation.slice(-8), // Keep up to last 8 turns for context
          ];

          const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages: apiMessages,
              temperature: 0.6,
              max_tokens: 800,
            }),
            signal: AbortSignal.timeout(9000),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content?.trim();
            if (content) {
              aiResponse = content;
              break;
            }
          }
        } catch (callErr) {
          console.warn(`[NVIDIA Model ${model} Attempt Failed]`, callErr);
        }
      }
    }

    // 4. Grounded CAT AI Fallback Engine (Ensures 100% Uptime & Dynamic Responses)
    if (!aiResponse) {
      aiResponse = generateGroundedCATMentorResponse(
        latestUserMsg,
        conversation,
        studentName,
        readinessInfo
      );
    }

    // 5. Audit Log to Database
    if (userId) {
      try {
        await query(
          `INSERT INTO public.ai_chat_messages (user_id, topic_id, lesson_id, role, message)
           VALUES ($1, 'mentor', 'intelligence_hub', 'user', $2)`,
          [userId, latestUserMsg]
        );
        await query(
          `INSERT INTO public.ai_chat_messages (user_id, topic_id, lesson_id, role, message)
           VALUES ($1, 'mentor', 'intelligence_hub', 'assistant', $2)`,
          [userId, aiResponse]
        );
      } catch (dbErr) {
        // Non-blocking log error
      }
    }

    return NextResponse.json({
      answer: aiResponse,
      reply: aiResponse,
      hasPerformanceData: readinessInfo.hasActivity,
    });
  } catch (error: any) {
    console.error("[Mentor API Error]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate mentor response" },
      { status: 500 }
    );
  }
}

/**
 * High-quality grounded fallback engine tailored to the CAT exam syllabus,
 * user context, and multi-turn inquiry.
 */
function generateGroundedCATMentorResponse(
  query: string,
  history: Array<{ role: string; content: string }>,
  name: string,
  readiness: {
    readiness: number;
    concepts: number;
    accuracy: number;
    speed: number;
    consistency: number;
    hasActivity: boolean;
  }
): string {
  const q = query.toLowerCase();
  const firstName = name.split(" ")[0] || "there";

  // Check previous turns for section context
  const pastText = history.map((h) => h.content.toLowerCase()).join(" ");
  const isQaContext = pastText.includes("qa") || pastText.includes("quant") || pastText.includes("arithmetic") || pastText.includes("algebra");
  const isDilrContext = pastText.includes("dilr") || pastText.includes("data interpretation") || pastText.includes("puzzle") || pastText.includes("set");
  const isVarcContext = pastText.includes("varc") || pastText.includes("reading comprehension") || pastText.includes("rc");

  // 1. Greetings
  if (q.match(/^(hi|hello|hey|greetings|morning|afternoon|evening)/)) {
    return `Hi ${firstName}! 👋\n\nGreat to connect with you. I'm ready to help you optimize your CAT preparation.\n\nWhether you need:\n- **Topic Strategy** (QA, DILR, or VARC)\n- **Mock Analysis & Score Improvement**\n- **Personalized Study Schedule**\n- **Concept Breakdowns & Shortcuts**\n\nWhat would you like to work on right now?`;
  }

  // 2. Readiness / Performance Analysis Queries
  if (q.includes("readiness") || q.includes("my score") || q.includes("my performance") || q.includes("why is my readiness")) {
    if (!readiness.hasActivity) {
      return `### Your CAT Readiness Profile: Getting Started\n\nHi ${firstName}, your current CAT Readiness Meter is at **0%** because you haven't completed any lessons or attempted your first mock test on TechnoCAT yet.\n\n**To start building your real readiness profile:**\n1. **Take a Baseline Mock:** Head over to the **Browse → PYQ Section** and attempt a full past CAT paper or sectional test.\n2. **Complete Foundation Lessons:** Watch core concepts in Arithmetic or DILR foundations.\n3. **Practice Accuracy:** Solve 15–20 high-yield questions under timed conditions.\n\nAs soon as you submit your first test, your Readiness Meter will calculate your exact **Accuracy (${readiness.accuracy}%)**, **Speed (${readiness.speed}%)**, and **Concept Mastery (${readiness.concepts}%)**!`;
    }

    return `### Personalized Readiness Breakdown for ${firstName}\n\n- **Overall Readiness:** **${readiness.readiness}%**\n- **Concept Mastery:** **${readiness.concepts}%**\n- **Mock Accuracy:** **${readiness.accuracy}%**\n- **Solving Speed:** **${readiness.speed}%**\n- **Consistency:** **${readiness.consistency}%**\n\n**Strategic Recommendation:**\n${
      readiness.accuracy < 70
        ? "Your primary bottleneck is **Accuracy**. Prioritize question selection over raw attempts. Before submitting an answer, verify step-by-step arithmetic to eliminate silly calculation errors."
        : readiness.speed < 60
        ? "Your accuracy is dependable, but your **Speed** is limiting your percentile. Implement the **2-minute rule**: if you haven't cracked the structure of a problem in 120 seconds, flag and move forward."
        : "You have a solid foundation! Focus on mock consistency and transitioning to difficult LOD-3 questions."
    }`;
  }

  // 3. QA / Quantitative Ability
  if (q.includes("qa") || q.includes("quant") || (isQaContext && (q.includes("topic") || q.includes("improve") || q.includes("start")))) {
    if (q.includes("arithmetic") || q.includes("weak in arithmetic")) {
      return `### High-Yield Arithmetic Improvement Plan\n\nArithmetic constitutes **35–40% of the entire CAT QA section** (8 to 9 questions). Mastering it guarantees a 90+ percentile in QA.\n\n#### The 4 Core Pillars:\n1. **Percentages & Fractions:** Memorize fractions to decimals up to $1/20$ ($1/7 \\approx 14.28\\%$, $1/8 = 12.5\\%$, $1/16 = 6.25\\%$). This saves 40 seconds per question.\n2. **Profit, Loss & Discount:** Master multiplying factors (e.g., $25\\%$ profit $\\implies 1.25 \\times CP$).\n3. **Ratios, Proportions & Mixtures:** Use alligation diagrams rather than multi-variable algebraic equations.\n4. **Time-Speed-Distance & Time-Work:** Focus on inverse proportionality ($S_1/S_2 = T_2/T_1$ when distance is constant).\n\n#### Weekly Action Routine:\n- Solve 20 Arithmetic questions daily under a 30-minute timer.\n- Maintain an **Error Log** for calculation slips vs conceptual gaps.`;
    }

    return `### Master Strategy for Quantitative Ability (QA)\n\nIn CAT, QA is **an exam of rejection, not selection**. You only need **9 to 11 correct questions** out of 22 to secure a 95+ percentile!\n\n#### 3-Round Solving Protocol:\n1. **Round 1 (Minutes 0–15): The Low-Hanging Fruit**\n   - Solve straightforward Arithmetic (Percentages, Simple TSD) and direct Algebra questions.\n   - Never spend more than 1.5 minutes here.\n2. **Round 2 (Minutes 15–32): Solvable with Effort**\n   - Tackle medium Geometry, Functions, Logarithms, and multi-step Arithmetic.\n3. **Round 3 (Minutes 32–40): The Buffer**\n   - Revisit 2 flagged questions where you eliminated two options.\n\n#### Key Focus Areas:\n- **Arithmetic:** ~8 Questions (Highest ROI)\n- **Algebra:** ~7 Questions (Linear/Quadratic, Functions, Logarithms)\n- **Geometry & Mensuration:** ~3 Questions`;
  }

  // 4. DILR / Data Interpretation & Logical Reasoning
  if (q.includes("dilr") || q.includes("data interpretation") || q.includes("logical reasoning") || q.includes("set") || isDilrContext) {
    return `### The Proven DILR 4-Step Set Selection Strategy\n\nIn DILR, scoring **2 complete sets with 100% accuracy** (8 to 10 questions) lands you directly in the **95–97th percentile bracket**.\n\n#### The Golden 5-Minute Scanning Phase:\n- **Minutes 0–5:** Do NOT pick up a pen to solve. Spend 1 minute scanning each of the 4 sets.\n- **Rate Each Set:**\n  - **Tier 1 (Familiar):** Matrix matching, standard arrangements, or simple table calculations.\n  - **Tier 2 (Moderate):** Games & tournaments or set theory with clear rules.\n  - **Tier 3 (Trap):** Vague conditions, multi-layered branching, or unfamiliar puzzle rules.\n\n#### Execution Rules:\n1. Commit 15 minutes per selected set.\n2. **The 6-Minute Drop Rule:** If 6 minutes have passed and your grid/table is still blank, drop the set immediately without emotional attachment.\n3. Verify all constraints before answering TITA (Type-In-The-Answer) questions.`;
  }

  // 5. VARC / Verbal Ability & Reading Comprehension
  if (q.includes("varc") || q.includes("verbal") || q.includes("reading comprehension") || q.includes("rc") || isVarcContext) {
    return `### Strategic Blueprint for VARC (99th Percentile Approach)\n\nVARC is not an English vocabulary test; it is a test of **logical comprehension and author intent**.\n\n#### Reading Comprehension (RC - 16 Questions):\n1. **Structural Reading:** Do not memorize facts. Note the central thesis, author's tone (critical, neutral, analytical), and transition words (*however, nevertheless, consequently*).\n2. **Paragraph Mapping:** Write down 3–4 words per paragraph summarizing its function.\n3. **Options Elimination:** Eliminate options that are:\n   - *Too Extreme* (always, never, completely)\n   - *Out of Scope* (true in the real world, but not supported by the passage)\n   - *Opposite distortion* (subtly twists the author's argument)\n\n#### Verbal Ability (VA - 8 Questions):\n- **Para Jumbles:** Find mandatory pairs (noun $\\rightarrow$ pronoun, chronological markers).\n- **Para Summary:** Focus on the conclusion sentence and eliminate options missing the core condition.`;
  }

  // 6. Time Management & Mock Strategy
  if (q.includes("time") || q.includes("manage") || q.includes("mock") || q.includes("test")) {
    return `### Time Management & Mock Execution Framework\n\n#### 40-Minute Sectional Blueprint:\n- **Minutes 0–2:** Scan the section to identify easy pickups.\n- **The 2-Minute Commitment Rule:** If a question doesn't have a clear solution path within 120 seconds, bookmark it and move forward immediately.\n- **Avoid Ego-Trap Questions:** A difficult 5-minute question awards the same $+3$ marks as a 45-second direct question.\n\n#### The 3-Hour Post-Mock Analysis Routine:\nAfter every mock, divide all incorrect or unattempted questions into **3 Buckets**:\n1. **Bucket A (Silly Error):** You knew the concept but made a calculation or reading slip. Fix by slowing down final calculations.\n2. **Bucket B (Time Trap):** You spent $>3.5$ minutes on a question. Work on early rejection.\n3. **Bucket C (Conceptual Gap):** You didn't recognize the theorem. Re-watch the lesson video on TechnoCAT and practice 10 similar problems.`;
  }

  // 7. Study Plan / Roadmap
  if (q.includes("plan") || q.includes("schedule") || q.includes("roadmap") || q.includes("month")) {
    return `### Structured 30-Day CAT Preparation Roadmap\n\n#### Week 1: Arithmetic Core & RC Foundations\n- **QA:** Percentages, Profit & Loss, Ratio & Proportion, Averages.\n- **VARC:** Read 2 Aeon/Guardian essays daily + solve 2 RCs under 10 minutes each.\n- **DILR:** Matrix arrangements and linear/circular seating arrangements.\n\n#### Week 2: Advanced Arithmetic & Set Theory\n- **QA:** Time-Speed-Distance, Time & Work, Alligations & Mixtures.\n- **VARC:** Para Jumbles & Para Summaries.\n- **DILR:** Venn diagrams (3 & 4 sets) and grouped distribution tables.\n\n#### Week 3: Algebra & Games/Tournaments\n- **QA:** Linear/Quadratic equations, Inequalities, Functions, and Logarithms.\n- **VARC:** Critical reasoning inference questions.\n- **DILR:** Games & Tournaments, Truth-Liar puzzles.\n\n#### Week 4: Full Mocks & Error Tracking\n- Take 2 full-length CAT mocks under strict 120-minute conditions.\n- Spend 4 hours thoroughly analyzing each attempt using your TechnoCAT Error Tracker.`;
  }

  // General default response
  return `### Strategic CAT Guidance for ${firstName}\n\nRegarding your query about **"${query}"**:\n\n1. **Core Concept Mastery:** Focus on high-frequency CAT question types first. In QA, prioritize Arithmetic and Algebra; in DILR, master set identification within 4 minutes; in VARC, focus on option elimination rather than skimming.\n2. **Accuracy First:** In CAT's $+3 / -1$ scoring scheme, achieving an $80\\%$ accuracy on 12 attempts ($+36 - 2 = 34$ marks) yields a far higher percentile than $50\\%$ accuracy on 20 attempts ($+30 - 10 = 20$ marks).\n3. **Timed Drill Practice:** Always solve questions in 20-minute timed sets rather than untimed casual solving.\n\nWould you like me to create a specific study drill, explain a particular topic, or analyze your section-wise plan?`;
}
