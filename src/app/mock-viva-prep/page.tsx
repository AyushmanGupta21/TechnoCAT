"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./mock-viva-prep.module.css";
import PostLoginNavActions from "@/components/PostLoginNavActions";

interface VivaQuestion {
  tag: string;
  question: string;
  tips: string[];
}

interface VivaCategory {
  id: string;
  title: string;
  desc: string;
  color: string;
  bg: string;
  chip: string;
  chipColor: string;
  chipBg: string;
  icon: React.ReactNode;
  questions: VivaQuestion[];
}

const CATEGORIES: VivaCategory[] = [
  {
    id: "personal-hr",
    title: "Personal & HR",
    desc: "Tell-me-about-yourself, strengths, weaknesses and motivation questions that open almost every IIM interview.",
    color: "#2563EB",
    bg: "linear-gradient(135deg, #2563EB, #3B82F6)",
    chip: "12 Questions",
    chipColor: "#1D4ED8",
    chipBg: "#EFF6FF",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    questions: [
      {
        tag: "Icebreaker",
        question: "Walk me through your journey so far. Why did you choose to pursue an MBA at this stage of your career?",
        tips: [
          "Keep it under 90 seconds — academics, work, and a clear MBA trigger.",
          "End with why now, not just why MBA.",
          "Avoid repeating your resume line by line; add a narrative thread.",
        ],
      },
      {
        tag: "Self-awareness",
        question: "What is your single biggest weakness, and what specific steps are you taking to address it?",
        tips: [
          "Pick a real weakness, never a disguised strength like 'I work too hard'.",
          "Show a concrete corrective action and measurable progress.",
          "Do not pick a weakness that is core to your target role.",
        ],
      },
      {
        tag: "Motivation",
        question: "Where do you see yourself five years after completing this program?",
        tips: [
          "Connect the role to specific skills the MBA will build.",
          "Be ambitious but realistic; avoid vague 'leadership position' answers.",
          "Tie it back to your pre-MBA experience for continuity.",
        ],
      },
    ],
  },
  {
    id: "academics",
    title: "Academics & Subject",
    desc: "Depth questions on your graduation stream, favourite subjects, and core concepts you claim to know.",
    color: "#7C3AED",
    bg: "linear-gradient(135deg, #7C3AED, #8B5CF6)",
    chip: "15 Questions",
    chipColor: "#6D28D9",
    chipBg: "#F5F3FF",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    questions: [
      {
        tag: "Core concept",
        question: "You mentioned your favourite subject was Economics. Explain the difference between fiscal and monetary policy with a current example.",
        tips: [
          "Define both crisply before comparing.",
          "Use one recent real-world example (e.g. an RBI rate decision).",
          "Never claim a favourite subject you cannot defend in depth.",
        ],
      },
      {
        tag: "Application",
        question: "How does your engineering background give you an edge in a management role?",
        tips: [
          "Translate technical skills into business value (structured thinking, data).",
          "Give one concrete project example.",
          "Avoid dismissing your own degree as irrelevant.",
        ],
      },
    ],
  },
  {
    id: "current-affairs",
    title: "Current Affairs & GK",
    desc: "Economy, policy, business news and general awareness questions that test how informed you are.",
    color: "#0284C7",
    bg: "linear-gradient(135deg, #0284C7, #0EA5E9)",
    chip: "10 Questions",
    chipColor: "#0369A1",
    chipBg: "#F0F9FF",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    questions: [
      {
        tag: "Economy",
        question: "What is your view on India's push toward becoming a 5-trillion-dollar economy? What are the biggest roadblocks?",
        tips: [
          "Present a balanced view with 2 drivers and 2 challenges.",
          "Back claims with a rough figure or trend, not just opinion.",
          "Stay factual and neutral on politically sensitive points.",
        ],
      },
      {
        tag: "Business",
        question: "Pick a recent corporate acquisition that caught your attention and explain why it mattered.",
        tips: [
          "Choose something from the last 6 months you genuinely understand.",
          "Explain the strategic rationale, not just the headline.",
          "Be ready for a follow-up on the valuation or risks.",
        ],
      },
    ],
  },
  {
    id: "situational",
    title: "Situational & Behavioral",
    desc: "STAR-format scenarios on leadership, conflict, failure and ethics that reveal how you actually behave.",
    color: "#D97706",
    bg: "linear-gradient(135deg, #D97706, #F59E0B)",
    chip: "14 Questions",
    chipColor: "#B45309",
    chipBg: "#FFFBEB",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    ),
    questions: [
      {
        tag: "Leadership",
        question: "Describe a time you led a team through a difficult situation. What was the outcome?",
        tips: [
          "Use the STAR format: Situation, Task, Action, Result.",
          "Quantify the result wherever possible.",
          "Keep the focus on your actions, not the whole team's.",
        ],
      },
      {
        tag: "Failure",
        question: "Tell me about a significant failure and what you learned from it.",
        tips: [
          "Own the failure fully; do not shift blame.",
          "Spend most of the answer on the learning and change.",
          "Avoid trivial failures that sound rehearsed.",
        ],
      },
    ],
  },
  {
    id: "goals",
    title: "Career Goals & Fit",
    desc: "Why this B-school, short vs long-term goals and how the program connects to your plan.",
    color: "#059669",
    bg: "linear-gradient(135deg, #059669, #10B981)",
    chip: "9 Questions",
    chipColor: "#047857",
    chipBg: "#F0FDF4",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    questions: [
      {
        tag: "School fit",
        question: "Why this institute specifically, and not any other top B-school you have converted?",
        tips: [
          "Reference specific programs, clubs, or faculty — show you did homework.",
          "Connect the school's strengths to your goals.",
          "Avoid generic praise that could apply to any school.",
        ],
      },
      {
        tag: "Short-term goal",
        question: "What role and industry do you want to target immediately after your MBA, and why?",
        tips: [
          "Be specific about function and sector.",
          "Show the logical link from past experience to future goal.",
          "Keep it coherent with your long-term vision.",
        ],
      },
    ],
  },
  {
    id: "stress",
    title: "Stress & Curveball",
    desc: "Unexpected, pressure-testing questions designed to see how you stay composed under fire.",
    color: "#DC2626",
    bg: "linear-gradient(135deg, #DC2626, #EF4444)",
    chip: "8 Questions",
    chipColor: "#B91C1C",
    chipBg: "#FEF2F2",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    questions: [
      {
        tag: "Curveball",
        question: "Convince me in one minute why we should NOT select you for this program.",
        tips: [
          "Stay composed; the test is your reaction, not the content.",
          "Give an honest limitation, then flip it into growth intent.",
          "Never freeze or refuse the question — engage with it.",
        ],
      },
      {
        tag: "Pressure",
        question: "Your CAT percentile is lower than our average. Why should we still consider you?",
        tips: [
          "Acknowledge it factually without getting defensive.",
          "Redirect to your profile strengths and consistency.",
          "Show self-belief backed by evidence, not arrogance.",
        ],
      },
    ],
  },
];

const CHECKLIST = {
  before: {
    title: "Before the Interview",
    color: "#2563EB",
    bg: "#EFF6FF",
    items: [
      "Research the institute's flagship programs, clubs and recent achievements",
      "Prepare a crisp 60-second 'tell me about yourself' pitch",
      "Revise your graduation subjects and projects in depth",
      "Read the last 2 months of business and economy news",
      "Prepare 2-3 genuine questions to ask the panel",
    ],
  },
  during: {
    title: "During the Interview",
    color: "#059669",
    bg: "#F0FDF4",
    items: [
      "Maintain eye contact and sit with confident, open posture",
      "Pause briefly to structure your answer before speaking",
      "Use the STAR format for any experience-based question",
      "Stay honest — never bluff on topics you don't know",
      "Keep answers focused; stop when you've made your point",
    ],
  },
};

interface VivaFeedback {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  source?: string;
}

type AnswerMode = "audio" | "text";

export default function MockVivaPrepPage() {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Answer + feedback state
  const [answerMode, setAnswerMode] = useState<AnswerMode>("audio");
  const [textAnswer, setTextAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<VivaFeedback | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeCategory = CATEGORIES.find((c) => c.id === activeCategoryId) || null;
  const currentQuestion = activeCategory?.questions[questionIndex] || null;

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  // Clean up any live recording resources
  const cleanupRecorder = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  // Reset the answer/feedback area (e.g. when moving to a new question)
  const resetAnswerArea = () => {
    cleanupRecorder();
    setIsRecording(false);
    setRecordSeconds(0);
    setTextAnswer("");
    setFeedback(null);
    setEvalError(null);
    setRecorderError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      cleanupRecorder();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startPractice = (catId: string) => {
    setActiveCategoryId(catId);
    setQuestionIndex(0);
    setElapsed(0);
    setTimerRunning(true);
    resetAnswerArea();
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const nextQuestion = () => {
    if (!activeCategory) return;
    if (questionIndex < activeCategory.questions.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      setQuestionIndex(0);
    }
    setElapsed(0);
    setTimerRunning(true);
    resetAnswerArea();
  };

  const prevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((i) => i - 1);
      setElapsed(0);
      setTimerRunning(true);
      resetAnswerArea();
    }
  };

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ===== AUDIO RECORDING =====
  const startRecording = async () => {
    setRecorderError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setRecorderError("Audio recording isn't supported in this browser. You can type your answer instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setRecorderError("Microphone access was blocked. Allow mic permission or type your answer instead.");
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // ===== AI EVALUATION =====
  const evaluateAnswer = async () => {
    if (!currentQuestion || !activeCategory) return;
    const answerText = textAnswer.trim();
    if (!answerText) {
      setEvalError("Type your answer in the box below to get AI feedback.");
      return;
    }
    setIsEvaluating(true);
    setEvalError(null);
    setFeedback(null);
    setTimerRunning(false);
    try {
      const res = await fetch("/api/mock-viva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: answerText,
          category: activeCategory.title,
          tips: currentQuestion.tips,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEvalError(data?.error || "Could not evaluate your answer. Please try again.");
      } else {
        setFeedback(data as VivaFeedback);
      }
    } catch {
      setEvalError("Network error while evaluating. Check your connection and try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const answerWordCount = textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0;

  return (
    <div className={styles.pageWrapper}>
      {/* ===== STICKY NAV ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="Mock Viva Prep Navigation">
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            <div className={styles.navLinks}>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/browse" className={styles.navLink}>Browse</Link>
              <Link href="/topics" className={styles.navLink}>My Topics</Link>
              <Link href="/intelligence" className={styles.navLink}>Intelligence Hub</Link>
              <Link href="/mock-viva-prep" className={`${styles.navLink} ${styles.navLinkActive}`}>Mock Viva Prep</Link>
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* ===== BREADCRUMB ===== */}
      <div className={styles.breadcrumb}>
        <Link href="/dashboard" className={styles.breadcrumbLink}>Dashboard</Link> &gt; <span>Mock Viva Prep</span>
      </div>

      {/* ===== HERO ===== */}
      <section className={styles.heroSection}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.8L12 22l-2.4-7.2L2.4 12l7.2-2.8z" />
            </svg>
            GD-PI &amp; Interview Prep
          </div>
          <h1 className={styles.heroTitle}>
            Crack the <span>Mock Viva</span>,<br />
            Walk in Confident.
          </h1>
          <p className={styles.heroSubtitle}>
            Practice real IIM-style personal interview questions across HR, academics, current affairs and stress rounds — with timers, expert pointers and a prep checklist all in one place.
          </p>
          <div className={styles.heroActions}>
            <button
              className={styles.btnPrimary}
              onClick={() => startPractice("personal-hr")}
            >
              Start a Mock Session &rarr;
            </button>
            <a
              href="#checklist"
              className={styles.btnSecondary}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("checklist")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Prep Checklist
            </a>
          </div>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#EFF6FF", color: "#2563EB" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v4M16 2v4M3 10h18" />
                <rect x="3" y="4" width="18" height="18" rx="2" />
              </svg>
            </div>
            <div className={styles.statTextCol}>
              <span className={styles.statValue}>68+</span>
              <span className={styles.statLabel}>Curated viva questions</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#F0FDF4", color: "#059669" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className={styles.statTextCol}>
              <span className={styles.statValue}>6</span>
              <span className={styles.statLabel}>Interview round categories</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#FFFBEB", color: "#D97706" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className={styles.statTextCol}>
              <span className={styles.statValue}>Timed</span>
              <span className={styles.statLabel}>Response practice mode</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTENT ===== */}
      <div className={styles.contentWrapper}>
        {/* CATEGORIES */}
        <section>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Choose an Interview Round</h2>
            <p className={styles.sectionSubtitle}>
              Pick a category to start a timed practice session with sample questions and expert pointers.
            </p>
          </div>
          <div className={styles.catGrid}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`${styles.catCard} ${activeCategoryId === cat.id ? styles.catCardActive : ""}`}
                onClick={() => startPractice(cat.id)}
              >
                <div className={styles.catTopBorder} style={{ background: cat.bg }} />
                <div className={styles.catIcon} style={{ background: cat.bg }}>{cat.icon}</div>
                <div className={styles.catTitle}>{cat.title}</div>
                <div className={styles.catDesc}>{cat.desc}</div>
                <div className={styles.catMeta}>
                  <span className={styles.catChip} style={{ color: cat.chipColor, background: cat.chipBg }}>
                    {cat.chip}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* PRACTICE PANEL */}
        <section ref={panelRef}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Practice Session</h2>
            <p className={styles.sectionSubtitle}>
              Read the question, start speaking out loud, and keep an eye on your response time.
            </p>
          </div>

          <div className={styles.qaPanel}>
            {activeCategory && currentQuestion ? (
              <>
                <div className={styles.qaHeader}>
                  <div className={styles.qaHeaderLeft}>
                    <div className={styles.qaHeaderIcon}>{activeCategory.icon}</div>
                    <div>
                      <div className={styles.qaHeaderTitle}>{activeCategory.title}</div>
                      <div className={styles.qaHeaderSub}>Mock personal interview round</div>
                    </div>
                  </div>
                  <div className={`${styles.qaTimer} ${timerRunning ? styles.qaTimerRunning : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formatTime(elapsed)}
                  </div>
                </div>

                <div className={styles.qaBody}>
                  <div className={styles.qaProgress}>
                    <div className={styles.qaProgressBar}>
                      <div
                        className={styles.qaProgressFill}
                        style={{ width: `${((questionIndex + 1) / activeCategory.questions.length) * 100}%` }}
                      />
                    </div>
                    <span className={styles.qaProgressLabel}>
                      Q{questionIndex + 1} of {activeCategory.questions.length}
                    </span>
                  </div>

                  <div className={styles.qaQuestionCard}>
                    <span className={styles.qaQuestionTag}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      {currentQuestion.tag}
                    </span>
                    <p className={styles.qaQuestionText}>{currentQuestion.question}</p>
                  </div>

                  <div className={styles.qaTips}>
                    <div className={styles.qaTipsTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                      </svg>
                      How to answer this well
                    </div>
                    <ul className={styles.qaTipsList}>
                      {currentQuestion.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                  {/* ===== ANSWER AREA ===== */}
                  <div className={styles.answerBlock}>
                    <div className={styles.answerHead}>
                      <div className={styles.answerTitle}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
                        </svg>
                        Your Answer
                      </div>
                      <div className={styles.answerModeToggle}>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${answerMode === "audio" ? styles.modeBtnActive : ""}`}
                          onClick={() => setAnswerMode("audio")}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          </svg>
                          Record Audio
                        </button>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${answerMode === "text" ? styles.modeBtnActive : ""}`}
                          onClick={() => setAnswerMode("text")}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Type Answer
                        </button>
                      </div>
                    </div>

                    {answerMode === "audio" ? (
                      <div className={styles.recorder}>
                        <div className={`${styles.recordTime} ${isRecording ? styles.recordTimeLive : ""}`}>
                          {formatTime(recordSeconds)}
                        </div>
                        <button
                          type="button"
                          className={`${styles.recordBtn} ${isRecording ? styles.recordBtnActive : ""}`}
                          onClick={isRecording ? stopRecording : startRecording}
                          aria-label={isRecording ? "Stop recording" : "Start recording"}
                        >
                          {isRecording ? (
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                          ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
                            </svg>
                          )}
                        </button>
                        <div className={styles.recordHint}>
                          {isRecording ? "Recording… tap to stop" : audioUrl ? "Recorded — play it back below" : "Tap the mic and answer out loud"}
                        </div>
                        {audioUrl && (
                          <div className={styles.audioPlayback}>
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <audio controls src={audioUrl} />
                          </div>
                        )}
                        {recorderError && <div className={styles.recorderError}>{recorderError}</div>}
                        <p className={styles.recorderNote}>
                          Recording lets you rehearse speaking aloud. For AI scoring, switch to &ldquo;Type Answer&rdquo; and paste or type what you said.
                        </p>
                      </div>
                    ) : (
                      <>
                        <textarea
                          className={styles.answerTextarea}
                          placeholder="Type your answer here as you would speak it in the interview…"
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                        />
                        <div className={styles.answerFootRow}>
                          <span className={styles.wordCounter}>{answerWordCount} words</span>
                          <button
                            type="button"
                            className={styles.btnEvaluate}
                            onClick={evaluateAnswer}
                            disabled={isEvaluating || !textAnswer.trim()}
                          >
                            {isEvaluating ? (
                              <>
                                <span className={styles.spinner} />
                                Evaluating…
                              </>
                            ) : (
                              <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
                                </svg>
                                Get AI Feedback
                              </>
                            )}
                          </button>
                        </div>
                        {evalError && <div className={styles.recorderError}>{evalError}</div>}
                      </>
                    )}
                  </div>

                  {/* ===== FEEDBACK ===== */}
                  {feedback && (
                    <div className={styles.feedbackCard}>
                      <div className={styles.feedbackTop}>
                        <div className={styles.scoreRing}>
                          <svg width="72" height="72" viewBox="0 0 72 72">
                            <circle cx="36" cy="36" r="30" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                            <circle
                              cx="36"
                              cy="36"
                              r="30"
                              fill="none"
                              stroke={feedback.score >= 80 ? "#10B981" : feedback.score >= 65 ? "#2563EB" : "#F59E0B"}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 30}
                              strokeDashoffset={2 * Math.PI * 30 * (1 - feedback.score / 100)}
                            />
                          </svg>
                          <div className={styles.scoreRingVal}>{feedback.score}</div>
                        </div>
                        <div className={styles.feedbackVerdict}>
                          <span className={styles.feedbackVerdictLabel}>AI Panel Verdict</span>
                          <span className={styles.feedbackVerdictText}>{feedback.verdict}</span>
                          <span
                            className={styles.feedbackSourceTag}
                            style={
                              feedback.source === "ai"
                                ? { background: "#EEF2FF", color: "#4F46E5" }
                                : { background: "#F1F5F9", color: "#64748B" }
                            }
                          >
                            {feedback.source === "ai" ? "AI-evaluated" : "Rule-based estimate"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.feedbackBody}>
                        <div>
                          <div className={styles.feedbackColTitle} style={{ color: "#059669" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            What worked
                          </div>
                          <ul className={`${styles.feedbackList} ${styles.strengthList}`}>
                            {feedback.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className={styles.feedbackColTitle} style={{ color: "#D97706" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="20" x2="12" y2="10" />
                              <polyline points="7 15 12 20 17 15" />
                            </svg>
                            How to improve
                          </div>
                          <ul className={`${styles.feedbackList} ${styles.improveList}`}>
                            {feedback.improvements.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        {feedback.modelAnswer && (
                          <div className={styles.modelAnswerBox}>
                            <div className={styles.modelAnswerTitle}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              Sample strong answer
                            </div>
                            <p className={styles.modelAnswerText}>{feedback.modelAnswer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={styles.qaActions}>
                    <div className={styles.qaActionsLeft}>
                      <button
                        className={styles.btnGhost}
                        onClick={() => setTimerRunning((r) => !r)}
                      >
                        {timerRunning ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                            Pause Timer
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4" /></svg>
                            Resume Timer
                          </>
                        )}
                      </button>
                      <button
                        className={styles.btnGhost}
                        onClick={prevQuestion}
                        disabled={questionIndex === 0}
                      >
                        &larr; Previous
                      </button>
                    </div>
                    <button className={styles.btnNext} onClick={nextQuestion}>
                      {questionIndex < activeCategory.questions.length - 1 ? "Next Question" : "Restart Round"} &rarr;
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.qaEmpty}>
                <div className={styles.qaEmptyIcon}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-6 0v4" />
                    <rect x="5" y="9" width="14" height="11" rx="2" />
                    <circle cx="12" cy="14" r="1.5" />
                  </svg>
                </div>
                <div className={styles.qaEmptyTitle}>No active session yet</div>
                <p className={styles.qaEmptyDesc}>
                  Select an interview round above or hit &ldquo;Start a Mock Session&rdquo; to begin practicing with timed questions and expert tips.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CHECKLIST */}
        <section id="checklist">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Your Viva Readiness Checklist</h2>
            <p className={styles.sectionSubtitle}>
              Tick these off as you prepare — a solid process beats last-minute cramming.
            </p>
          </div>
          <div className={styles.checklistGrid}>
            {Object.entries(CHECKLIST).map(([groupKey, group]) => (
              <div key={groupKey} className={styles.checkCard}>
                <div className={styles.checkHead}>
                  <div className={styles.checkHeadIcon} style={{ background: group.bg, color: group.color }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                  <span className={styles.checkHeadTitle}>{group.title}</span>
                </div>
                {group.items.map((item, i) => {
                  const key = `${groupKey}-${i}`;
                  const done = checkedItems[key];
                  return (
                    <div key={key} className={styles.checkItem} onClick={() => toggleCheck(key)}>
                      <div className={`${styles.checkBox} ${done ? styles.checkBoxChecked : ""}`}>
                        {done && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className={`${styles.checkText} ${done ? styles.checkTextDone : ""}`}>{item}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
