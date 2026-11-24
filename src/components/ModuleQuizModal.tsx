"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ModuleQuestion, evaluateQuiz, evaluateCATQuiz, QuizAnalysis } from "@/data/moduleQuizData";
import { notifyQuizCompleted } from "@/services/notificationService";
import PYQMarkdownViewer, { MathText } from "./pyq/PYQMarkdownViewer";
import styles from "./ModuleQuizModal.module.css";
import { useAuth } from "@/context/AuthContext";
import { submitQuizAttempt, type QuizAttemptContext } from "@/services/quizAttemptService";
import ProctorPanel, { ProctorConsent } from "./proctoring/ProctorPanel";
import ExamModeToggle from "./exam/ExamModeToggle";
import { useExamMode } from "@/lib/examMode";
import {
  ArrowLeft, ArrowRight, Award, BookOpen, Calculator, ChartColumn, Check, ChevronDown, Circle, Clock, Delete,
  Eraser, FileText, Flag, Keyboard, LayoutGrid, Lightbulb, ListChecks, Lock, Play, RotateCcw, Send, ShieldCheck,
  Target, Timer, TriangleAlert, Trophy, X, Zap,
} from "lucide-react";
import {
  useProctoring,
  logProctorEvent,
  newAttemptKey,
  type ProctorKind,
} from "./proctoring/useProctoring";

interface ModuleQuizModalProps {
  isOpen: boolean;
  title: string;
  isGrandQuiz?: boolean;
  questions: ModuleQuestion[];
  attemptNumber: number;
  maxAttempts?: number;
  initialReviewMode?: boolean;
  initialAnswers?: Record<number, number | string>;
  initialAnalysis?: QuizAnalysis | null;
  initialStrikes?: number;
  customDurationSeconds?: number;
  scoringScheme?: "standard" | "cat";
  /** When set, the finished attempt is recorded on the server (graded server-side). */
  attemptContext?: QuizAttemptContext;
  onClose: () => void;
  onPass: (score: number, total: number, earnedPoints: number, analysis: QuizAnalysis) => void;
  onFail: (score: number, total: number, analysis: QuizAnalysis) => void;
  onSelectLessonToRewatch?: (lessonId: string) => void;
  onResetAttemptsAfterRewatch?: () => void;
  onRetake?: () => void;
  onBackToAttempts?: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export default function ModuleQuizModal({
  isOpen,
  title,
  isGrandQuiz = false,
  questions,
  attemptNumber,
  maxAttempts = 3,
  initialReviewMode = false,
  initialAnswers,
  initialAnalysis,
  initialStrikes = 0,
  customDurationSeconds,
  scoringScheme = "standard",
  attemptContext,
  onClose,
  onPass,
  onFail,
  onSelectLessonToRewatch,
  onResetAttemptsAfterRewatch,
  onRetake,
  onBackToAttempts,
}: ModuleQuizModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | string>>(initialAnswers || {});
  // Timer: 12 minutes (720s) for module quiz (10 questions), 35 minutes (2100s) for grand quiz (30 questions)
  const initialDuration = customDurationSeconds ?? (isGrandQuiz ? 35 * 60 : 12 * 60);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  // Absolute deadline (ms epoch). The countdown is derived from the real clock so it
  // stays accurate even when the browser throttles timers (tab/window switches).
  const endAtRef = useRef<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(initialReviewMode);
  const [analysis, setAnalysis] = useState<QuizAnalysis | null>(initialAnalysis || null);

  // Post-submission solutions filter (display only)
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "skipped" | "marked" | "correct">("all");
  // Confirmation modal before finalizing manual submission
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  // Auto submission notification modal (timeout or cheat strikes)
  const [autoSubmitNotice, setAutoSubmitNotice] = useState<{
    type: "timeout" | "cheat";
    title: string;
    description: string;
    strikesCount?: number;
  } | null>(null);

  // Authenticated User Exam Environment Preferences
  const { user } = useAuth();
  const [examPrefs, setExamPrefs] = useState({
    ionCalculator: true,
    compactPalette: false,
    highContrast: false,
    timerAlerts: true,
  });

  // TCS iON On-Screen Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState("0");
  const [calcMemory, setCalcMemory] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcClearNext, setCalcClearNext] = useState(false);

  // Question palette (UI only): which questions were opened and which are marked for review.
  const [visitedSet, setVisitedSet] = useState<Set<number>>(() => new Set([0]));
  const [markedSet, setMarkedSet] = useState<Set<number>>(() => new Set());

  // Presentation only: Classic/Modern interface (shared, per device) + responsive drawers.
  // Switching mode never touches answers, timer, palette state or proctoring.
  const [examMode] = useExamMode();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [passageOpen, setPassageOpen] = useState(false);

  useEffect(() => {
    const loadPrefs = () => {
      try {
        const uid = user?.id || "demo-student";
        const raw = localStorage.getItem(`technocat_settings_${uid}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          setExamPrefs((prev) => ({
            ...prev,
            ionCalculator: parsed.ionCalculator ?? prev.ionCalculator,
            compactPalette: parsed.compactPalette ?? prev.compactPalette,
            highContrast: parsed.highContrast ?? prev.highContrast,
            timerAlerts: parsed.timerAlerts ?? prev.timerAlerts,
          }));
        } else if (user && user.preferences) {
          const userPrefs = user.preferences;
          setExamPrefs((prev) => ({
            ...prev,
            ionCalculator: userPrefs.ionCalculator ?? prev.ionCalculator,
            compactPalette: userPrefs.compactPalette ?? prev.compactPalette,
            highContrast: userPrefs.highContrast ?? prev.highContrast,
            timerAlerts: userPrefs.timerAlerts ?? prev.timerAlerts,
          }));
        }
      } catch {}
    };

    loadPrefs();

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setExamPrefs((prev) => ({
          ...prev,
          ionCalculator: e.detail.ionCalculator ?? prev.ionCalculator,
          compactPalette: e.detail.compactPalette ?? prev.compactPalette,
          highContrast: e.detail.highContrast ?? prev.highContrast,
          timerAlerts: e.detail.timerAlerts ?? prev.timerAlerts,
        }));
      }
    };
    window.addEventListener("technocat_exam_settings_updated", handleUpdate);
    return () => window.removeEventListener("technocat_exam_settings_updated", handleUpdate);
  }, [user]);

  const handleCalcDigit = (digit: string) => {
    if (calcClearNext) {
      setCalcInput(digit === "." ? "0." : digit);
      setCalcClearNext(false);
    } else {
      if (digit === "." && calcInput.includes(".")) return;
      setCalcInput(calcInput === "0" && digit !== "." ? digit : calcInput + digit);
    }
  };

  const executeCalc = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×":
      case "*": return a * b;
      case "÷":
      case "/": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleCalcOp = (op: string) => {
    const current = parseFloat(calcInput);
    if (isNaN(current)) return;
    if (calcMemory === null) {
      setCalcMemory(current);
    } else if (calcOp) {
      const res = executeCalc(calcMemory, current, calcOp);
      setCalcMemory(res);
      setCalcInput(String(Number(res.toFixed(6))));
    }
    setCalcOp(op);
    setCalcClearNext(true);
  };

  const handleCalcEquals = () => {
    if (calcOp && calcMemory !== null) {
      const current = parseFloat(calcInput);
      if (isNaN(current)) return;
      const res = executeCalc(calcMemory, current, calcOp);
      setCalcInput(String(Number(res.toFixed(6))));
      setCalcMemory(null);
      setCalcOp(null);
      setCalcClearNext(true);
    }
  };

  const handleCalcClear = () => {
    setCalcInput("0");
    setCalcMemory(null);
    setCalcOp(null);
    setCalcClearNext(false);
  };

  const handleCalcBackspace = () => {
    if (calcClearNext || calcInput.length <= 1) {
      setCalcInput("0");
    } else {
      setCalcInput(calcInput.slice(0, -1));
    }
  };

  const handleCalcSqrt = () => {
    const current = parseFloat(calcInput);
    if (!isNaN(current) && current >= 0) {
      setCalcInput(String(Number(Math.sqrt(current).toFixed(6))));
      setCalcClearNext(true);
    }
  };

  const handleSafeClose = useCallback(() => {
    if (!isSubmitted) {
      setProctorAlert("Exam in progress! The quiz interface can only be closed once it is ended.");
      return;
    }
    onClose();
  }, [isSubmitted, onClose]);

  // Proctoring Security State
  const [strikes, setStrikes] = useState<number>(initialStrikes);
  const [rawScore, setRawScore] = useState<number | null>(null);
  const strikesRef = useRef<number>(initialStrikes);
  const lastViolationTimeRef = useRef<number>(0);

  useEffect(() => {
    strikesRef.current = strikes;
  }, [strikes]);

  // Webcam proctoring. A timed (non-review) exam waits on a consent step; the timer and
  // anti-cheat listeners only start once the student begins (with or without the camera).
  const [examStarted, setExamStarted] = useState<boolean>(initialReviewMode);
  const [proctored, setProctored] = useState<boolean>(false);
  const attemptKeyRef = useRef<string>("");
  // Shared strike path (set by the anti-cheat effect while the exam is running).
  const registerViolationRef = useRef<(reason: string) => void>(() => {});
  const proctorKind: ProctorKind =
    attemptContext?.kind === "pyq" || attemptContext?.kind === "module_quiz" || attemptContext?.kind === "grand_quiz"
      ? attemptContext.kind
      : isGrandQuiz
        ? "grand_quiz"
        : "module_quiz";
  const proctorKindRef = useRef<ProctorKind>(proctorKind);
  useEffect(() => {
    proctorKindRef.current = proctorKind;
  }, [proctorKind]);

  const handleProctorViolation = useCallback((event: Parameters<typeof logProctorEvent>[2], message: string) => {
    if (!attemptKeyRef.current) attemptKeyRef.current = newAttemptKey();
    logProctorEvent(attemptKeyRef.current, proctorKindRef.current, event);
    registerViolationRef.current(`Webcam: ${message}`);
  }, []);

  const proctor = useProctoring({
    running: isOpen && examStarted && !isSubmitted && proctored,
    onViolation: handleProctorViolation,
  });

  const beginExam = useCallback(
    (withCamera: boolean) => {
      if (!attemptKeyRef.current) attemptKeyRef.current = newAttemptKey();
      if (!withCamera) {
        proctor.markOff();
        logProctorEvent(attemptKeyRef.current, proctorKindRef.current, "proctoring_declined");
      }
      setProctored(withCamera);
      endAtRef.current = Date.now() + initialDuration * 1000;
      setTimeLeft(initialDuration);
      setExamStarted(true);
    },
    [proctor, initialDuration]
  );

  const handleEnableCamera = useCallback(async () => {
    const granted = await proctor.enable();
    if (granted) beginExam(true);
  }, [proctor, beginExam]);

  const [proctorAlert, setProctorAlert] = useState<string | null>(null);
  const proctorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRef = useRef({
    isOpen: false,
    attemptNumber: attemptNumber,
    initialReviewMode: initialReviewMode,
    questionsKey: "",
  });

  // Guards against recording the same attempt twice (e.g. timer expiry + click).
  const attemptRecordedRef = useRef(false);

  const handleSubmit = useCallback(() => {
    const isCat = scoringScheme === "cat";
    const rawResult = isCat
      ? evaluateCATQuiz(questions, selectedAnswers)
      : evaluateQuiz(questions, selectedAnswers as Record<number, number>);
    const penaltyMarks = strikesRef.current;
    const penalizedScore = Math.max(0, rawResult.score - penaltyMarks);
    const maxTotal = rawResult.total || (questions.length * (isCat ? 3 : 1));
    const penalizedPercentage = Math.max(0, Math.round((penalizedScore / maxTotal) * 100));
    const penalizedPassed = isCat ? penalizedPercentage >= 50 : penalizedPercentage >= 70;
    const timeTakenSeconds = Math.max(1, initialDuration - timeLeft);

    setRawScore(rawResult.score);

    const finalResult: QuizAnalysis = {
      ...rawResult,
      score: penalizedScore,
      percentage: penalizedPercentage,
      passed: penalizedPassed,
      rawScore: rawResult.score,
      strikes: penaltyMarks,
      penaltyMarks,
      timeTakenSeconds,
      selectedAnswers,
      questions,
    };

    setAnalysis(finalResult);
    setIsSubmitted(true);

    if (attemptContext && !attemptRecordedRef.current) {
      attemptRecordedRef.current = true;
      void submitQuizAttempt(attemptContext, questions, selectedAnswers, {
        durationSeconds: timeTakenSeconds,
        strikes: penaltyMarks,
      });
    }

    const points = isGrandQuiz ? 100 : 50;

    try {
      notifyQuizCompleted(title, finalResult.score, maxTotal);
      if (finalResult.passed) {
        onPass?.(finalResult.score, finalResult.total, points, finalResult);
      } else {
        onFail?.(finalResult.score, finalResult.total, finalResult);
      }
    } catch (err) {
      console.error("Quiz submission callback error:", err);
    }
  }, [title, questions, selectedAnswers, scoringScheme, isGrandQuiz, initialDuration, timeLeft, onPass, onFail, attemptContext]);


  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Timer effect: derive remaining time from a fixed deadline instead of decrementing,
  // so throttled/background timers can never make the clock fall behind.
  useEffect(() => {
    if (!isOpen || isSubmitted || !examStarted) return;

    const tick = () => {
      if (endAtRef.current === null) {
        endAtRef.current = Date.now() + initialDuration * 1000;
      }
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setTimeLeft((prev) => (prev === remaining ? prev : remaining));
    };

    tick();
    const timer = setInterval(tick, 250);
    // Re-sync immediately when the user returns to the tab/window.
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [isOpen, isSubmitted, examStarted, initialDuration]);

  // Auto-submit when the time runs out
  useEffect(() => {
    if (!isOpen || isSubmitted || timeLeft > 0) return;
    setShowSubmitConfirm(false);
    setAutoSubmitNotice({
      type: "timeout",
      title: "Time's Up! Exam Auto-Submitted",
      description: "The allocated time for this assessment has expired. Your recorded answers have been automatically evaluated and submitted.",
    });
    handleSubmitRef.current();
  }, [isOpen, isSubmitted, timeLeft]);

  // Reset when modal is OPENED, RETAKEN, or viewing a different session
  useEffect(() => {
    if (!isOpen) {
      sessionRef.current.isOpen = false;
      proctor.stopStream();
      return;
    }

    const prev = sessionRef.current;
    const questionsKey = (questions || []).map((q) => q.id).join(",");
    const isNewSession =
      !prev.isOpen ||
      prev.attemptNumber !== attemptNumber ||
      prev.initialReviewMode !== initialReviewMode ||
      prev.questionsKey !== questionsKey;

    sessionRef.current = {
      isOpen: true,
      attemptNumber,
      initialReviewMode,
      questionsKey,
    };

    // If it's the exact same attempt of the same quiz while open, do not reset!
    // (This prevents the quiz from restarting when parent state updates on submission)
    if (!isNewSession) return;

    attemptRecordedRef.current = initialReviewMode; // review sessions never record
    setCurrentIdx(0);
    setSelectedAnswers(initialAnswers || {});
    setIsSubmitted(initialReviewMode);

    if (initialReviewMode) {
      const computed =
        initialAnalysis ||
        (scoringScheme === "cat"
          ? evaluateCATQuiz(questions, initialAnswers || {})
          : evaluateQuiz(questions, (initialAnswers as Record<number, number>) || {}));
      setAnalysis(computed);

      const resolvedStrikes =
        computed.strikes !== undefined && computed.strikes > 0
          ? computed.strikes
          : (initialStrikes || 0);
      const resolvedRaw =
        computed.rawScore !== undefined
          ? computed.rawScore
          : computed.score + resolvedStrikes;
      setRawScore(resolvedRaw);
      setStrikes(resolvedStrikes);
      strikesRef.current = resolvedStrikes;
      setExamStarted(true);
      setProctored(false);
      proctor.reset();
    } else {
      setAnalysis(null);
      setRawScore(null);
      setStrikes(0);
      strikesRef.current = 0;
      lastViolationTimeRef.current = 0;
      const freshDuration = customDurationSeconds ?? (isGrandQuiz ? 35 * 60 : 12 * 60);
      setTimeLeft(freshDuration);
      // The clock starts when the student begins (after the proctoring consent step).
      endAtRef.current = null;
      setExamStarted(false);
      setProctored(false);
      proctor.reset();
      attemptKeyRef.current = newAttemptKey();
    }
    setProctorAlert(null);
    setReviewFilter("all");
    setShowSubmitConfirm(false);
    setAutoSubmitNotice(null);
  }, [
    isOpen,
    attemptNumber,
    isGrandQuiz,
    questions,
    initialReviewMode,
    initialAnswers,
    initialAnalysis,
    initialStrikes,
    customDurationSeconds,
  ]);

  // PROCTORING & ANTI-CHEATING SECURITY CONTROLS
  useEffect(() => {
    if (!isOpen || isSubmitted || !examStarted) return;

    const handleViolation = (reason: string) => {
      if (isSubmitted) return;
      const now = Date.now();
      // Debounce: prevent duplicate strikes when blur & visibilitychange fire together
      if (now - lastViolationTimeRef.current < 1200) {
        return;
      }
      lastViolationTimeRef.current = now;

      const nextStrikes = strikesRef.current + 1;
      strikesRef.current = nextStrikes;
      setStrikes(nextStrikes);

      if (nextStrikes >= 3) {
        setShowSubmitConfirm(false);
        setAutoSubmitNotice({
          type: "cheat",
          title: "Exam Terminated: Security Violation",
          description: `The exam has been automatically submitted due to reaching 3 proctoring security strikes (${reason}). A penalty of -3 marks has been applied to your final score.`,
          strikesCount: 3,
        });
        setProctorAlert(
          "3 Proctoring Strikes Reached: Exam auto-submitted with penalties due to security policy violations."
        );
        handleSubmitRef.current();
      } else {
        setProctorAlert(
          `Proctoring Warning ${nextStrikes} of 3: ${reason} (-1 mark deducted from final score! Auto-submits on Strike 3)`
        );
        if (proctorTimerRef.current) clearTimeout(proctorTimerRef.current);
        proctorTimerRef.current = setTimeout(() => {
          setProctorAlert(null);
        }, 5000);
      }
    };

    // 1. Tab Switching & Window Focus Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Leaving the exam tab is prohibited!");
      }
    };

    const handleWindowBlur = () => {
      handleViolation("Switching away from exam window is prohibited!");
    };

    // 2. Keyboard Shortcut Interception (Screenshots, DevTools, Copy, Print)
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Direct PrintScreen key intercept
      if (e.key === "PrintScreen") {
        e.preventDefault();
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        handleViolation("Taking screenshots is strictly prohibited! (-1 mark penalty)");
        return;
      }

      // 2. Windows Snipping Tool (Win+Shift+S) or Mac Screenshot (Cmd+Shift+3/4/5)
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        ["s", "S", "3", "4", "5", "x", "X"].includes(e.key)
      ) {
        e.preventDefault();
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        handleViolation("Screen capture attempt detected! (-1 mark penalty)");
        return;
      }

      // 3. Block Ctrl/Cmd + C, U, S, P
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "C", "u", "U", "s", "S", "p", "P"].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      // 4. Block F12 and DevTools (Ctrl+Shift+I / J / C)
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          ["I", "i", "J", "j", "C", "c"].includes(e.key))
      ) {
        e.preventDefault();
        return;
      }

      // 5. Block Escape key from closing modal during exam
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setProctorAlert("Exam in progress! The quiz interface can only be closed once it is ended.");
        return;
      }
    };

    // Handle keyup specifically for PrintScreen which triggers on release in many Windows browsers
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        handleViolation("Taking screenshots is strictly prohibited! (-1 mark penalty)");
      }
    };

    // Prevent leaving tab / closing window during exam
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Exam in progress! Your progress will be lost if you leave.";
      return e.returnValue;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("beforeunload", handleBeforeUnload);
    // Webcam proctoring violations add strikes through this same path.
    registerViolationRef.current = handleViolation;

    return () => {
      registerViolationRef.current = () => {};
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (proctorTimerRef.current) clearTimeout(proctorTimerRef.current);
    };
  }, [isOpen, isSubmitted, examStarted]);

  // Lock the page behind the exam and hide the site nav bar so it can never
  // be painted over the exam header (timer, strikes, lock badge).
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("exam-active");
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("exam-active");
    };
  }, [isOpen]);

  useEffect(() => {
    setVisitedSet((prev) => (prev.has(currentIdx) ? prev : new Set(prev).add(currentIdx)));
  }, [currentIdx]);

  if (!isOpen) return null;

  // In-modal retake (no onRetake handler): go back through the proctoring consent step.
  const prepareFreshStart = () => {
    endAtRef.current = null;
    setExamStarted(false);
    setProctored(false);
    proctor.reset();
    attemptKeyRef.current = newAttemptKey();
    setVisitedSet(new Set([0]));
    setMarkedSet(new Set());
  };

  const showProctorConsent = !isSubmitted && !examStarted && !initialReviewMode;

  const currentQ = questions[currentIdx] || questions[0];
  const isLastQuestion = currentIdx === questions.length - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optIdx,
    }));
  };

  const handleSetTITAAnswer = (val: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => {
      const updated = { ...prev };
      if (val === "") {
        delete updated[currentIdx];
      } else {
        updated[currentIdx] = val;
      }
      return updated;
    });
  };

  const checkQuestionCorrect = (q: ModuleQuestion, idx: number): boolean => {
    const userChoice = selectedAnswers[idx];
    if (userChoice === undefined || userChoice === null || userChoice === "") return false;
    const isTITA = q.type === "TITA" || !q.options || q.options.length === 0;
    if (isTITA) {
      const cleanExpected = (q.titaAnswer || "").trim().toLowerCase();
      const cleanUser = String(userChoice).trim().toLowerCase();
      return cleanExpected !== "" && cleanExpected === cleanUser;
    }
    return userChoice === q.answer;
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ---- Display-only derived values (palette + results) ----
  type PaletteState = "answered" | "notAnswered" | "marked" | "answeredMarked" | "notVisited";
  const isAnsweredIdx = (idx: number) => selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== "";
  const paletteState = (idx: number): PaletteState => {
    const answered = isAnsweredIdx(idx);
    const marked = markedSet.has(idx);
    if (answered && marked) return "answeredMarked";
    if (marked) return "marked";
    if (answered) return "answered";
    if (visitedSet.has(idx)) return "notAnswered";
    return "notVisited";
  };
  const paletteCounts = questions.reduce(
    (acc, _q, idx) => {
      acc[paletteState(idx)] += 1;
      return acc;
    },
    { answered: 0, notAnswered: 0, marked: 0, answeredMarked: 0, notVisited: 0 }
  );
  const PALETTE_CLASS: Record<PaletteState, string> = {
    answered: styles.qPillAnswered,
    notAnswered: styles.qPillNotAnswered,
    marked: styles.qPillMarked,
    answeredMarked: styles.qPillAnsweredMarked,
    notVisited: styles.qPillNotVisited,
  };
  const PALETTE_LABEL: Record<PaletteState, string> = {
    answered: "Answered",
    notAnswered: "Not answered",
    notVisited: "Not visited",
    marked: "Marked for review",
    answeredMarked: "Answered & marked for review",
  };
  const LEGEND_ORDER: PaletteState[] = ["answered", "notAnswered", "notVisited", "marked", "answeredMarked"];

  const isCurrentMarked = markedSet.has(currentIdx);
  const toggleMarkCurrent = () =>
    setMarkedSet((prev) => {
      const next = new Set(prev);
      if (next.has(currentIdx)) next.delete(currentIdx);
      else next.add(currentIdx);
      return next;
    });
  // "Mark for review & next": marks the current question and moves to the next one.
  const markForReviewAndNext = () => {
    setMarkedSet((prev) => (prev.has(currentIdx) ? prev : new Set(prev).add(currentIdx)));
    setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1));
  };
  const goToQuestion = (idx: number) => {
    setCurrentIdx(idx);
    setPaletteOpen(false);
  };

  const correctCount = questions.filter((q, idx) => checkQuestionCorrect(q, idx)).length;
  const skippedCount = questions.filter((_q, idx) => !isAnsweredIdx(idx)).length;
  const wrongCount = Math.max(0, questions.length - correctCount - skippedCount);
  const attemptedCount = questions.length - skippedCount;
  const accuracyPct = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const markedReviewCount = questions.filter((_q, idx) => markedSet.has(idx)).length;
  const totalQ = questions.length || 1;
  const RING_R = 52;
  const RING_C = 2 * Math.PI * RING_R;
  const ringSegments = [
    { key: "correct", value: correctCount, color: "var(--data-emerald)" },
    { key: "wrong", value: wrongCount, color: "var(--data-coral)" },
    { key: "skipped", value: skippedCount, color: "#d3dbe8" },
  ];
  let ringOffset = 0;

  const REVIEW_FILTERS = [
    { key: "all", label: "All", count: questions.length },
    { key: "wrong", label: "Wrong", count: wrongCount },
    { key: "skipped", label: "Skipped", count: skippedCount },
    { key: "marked", label: "Marked", count: markedReviewCount },
    { key: "correct", label: "Correct", count: correctCount },
  ] as const;
  const reviewItems = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q, idx }) => {
      const correct = checkQuestionCorrect(q, idx);
      switch (reviewFilter) {
        case "wrong":
          return isAnsweredIdx(idx) && !correct;
        case "skipped":
          return !isAnsweredIdx(idx);
        case "marked":
          return markedSet.has(idx);
        case "correct":
          return correct;
        default:
          return true;
      }
    });

  const isPyq = attemptContext?.kind === "pyq";
  const cutoffPct = scoringScheme === "cat" ? 50 : 70;
  const kickerLabel = initialReviewMode
    ? `Report card · attempt ${attemptNumber}`
    : isPyq
      ? "CAT past paper · timed section"
      : isGrandQuiz
        ? "Grand comprehensive quiz"
        : "Compulsory module quiz";
  const timerTone =
    timeLeft < 120 ? styles.timerDanger : examPrefs.timerAlerts && timeLeft <= 300 && timeLeft > 0 ? styles.timerPulseWarning : "";

  // Presentation: the results screen always uses the Modern design.
  const classic = examMode === "classic" && !isSubmitted;
  const sectionLabel = attemptContext?.section || (isGrandQuiz ? "Grand quiz" : "Module quiz");
  const candidateName = user?.fullName?.trim() || "Candidate";
  const candidateInitial = candidateName.charAt(0).toUpperCase();
  const isCurrentTita = currentQ ? currentQ.type === "TITA" || !currentQ.options || currentQ.options.length === 0 : false;
  const timeTakenSeconds = analysis?.timeTakenSeconds || Math.max(1, initialDuration - timeLeft);
  const pad2 = (n: number) => String(n).padStart(2, "0");

  const resetForInModalRetake = () => {
    setIsSubmitted(false);
    setSelectedAnswers({});
    setTimeLeft(initialDuration);
    setCurrentIdx(0);
    setAnalysis(null);
    setRawScore(null);
    setStrikes(0);
    strikesRef.current = 0;
    prepareFreshStart();
    setProctorAlert(null);
    setShowSubmitConfirm(false);
    setAutoSubmitNotice(null);
    setPaletteOpen(false);
  };

  const modalContent = (
    <div
      className={styles.overlay}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        className={`${styles.modalBox} ${classic ? styles.classic : styles.modern} ${
          isSubmitted ? styles.modalBoxResult : ""
        } ${examPrefs.highContrast ? styles.highContrastExam : ""}`}
        data-exam-mode={classic ? "classic" : "modern"}
      >
        {/* Webcam proctoring consent step (timer starts only after this) */}
        {showProctorConsent && (
          <ProctorConsent
            status={proctor.status}
            onEnable={() => void handleEnableCamera()}
            onStartWithout={() => beginExam(false)}
            onCancel={onClose}
          />
        )}
        {/* Live camera preview + proctoring status while the exam runs */}
        {examStarted && !isSubmitted && !initialReviewMode && (
          <ProctorPanel
            status={proctor.status}
            liveHint={proctor.liveHint}
            videoRef={proctor.videoRef}
            proctored={proctored}
          />
        )}
        {/* Real-time Proctoring Warning Banner */}
        {proctorAlert && (
          <div className={styles.proctorWarningBanner} role="alert">
            <div className={styles.proctorWarningLeft}>
              <TriangleAlert size={16} strokeWidth={2.4} />
              <span>{proctorAlert}</span>
            </div>
            <button type="button" className={styles.proctorDismissBtn} onClick={() => setProctorAlert(null)}>
              Dismiss
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Top bar: paper name · proctoring · interface toggle · tools · timer */}
        <header className={styles.topBar}>
          <div className={styles.topBarTitle}>
            <span className={isGrandQuiz ? styles.grandQuizBadge : styles.quizBadge}>
              {initialReviewMode ? (
                <ChartColumn size={13} aria-hidden="true" />
              ) : isGrandQuiz ? (
                <Award size={13} aria-hidden="true" />
              ) : (
                <FileText size={13} aria-hidden="true" />
              )}
              {kickerLabel}
            </span>
            <h2 className={styles.modalTitle} title={title}>
              {title}
            </h2>
          </div>

          {!isSubmitted ? (
            <div className={styles.topBarTools}>
              <span
                className={`${styles.proctorChip} ${strikes > 0 ? styles.proctorChipStrike : ""}`}
                title="Proctoring strikes: each strike deducts 1 mark; 3 strikes auto-submit the exam."
              >
                {strikes > 0 ? (
                  <TriangleAlert size={14} strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <ShieldCheck size={14} aria-hidden="true" />
                )}
                <span className={styles.proctorChipText}>{proctored ? "Proctored" : "Unproctored"}</span>
                <span className={styles.srOnly}>, strikes</span>
                <b>{strikes}/3</b>
              </span>
              <ExamModeToggle tone={classic ? "dark" : "light"} className={styles.modeToggle} />
              {examPrefs.ionCalculator && (
                <button
                  type="button"
                  className={`${styles.toolBtn} ${styles.calcToolBtn} ${showCalculator ? styles.toolBtnOn : ""}`}
                  onClick={() => setShowCalculator((prev) => !prev)}
                  title="On-screen calculator"
                  aria-label={showCalculator ? "Hide calculator" : "Show calculator"}
                  aria-pressed={showCalculator}
                >
                  <Calculator size={16} aria-hidden="true" />
                  <span className={styles.toolBtnText}>Calculator</span>
                </button>
              )}
              <button
                type="button"
                className={`${styles.toolBtn} ${styles.questionsBtn}`}
                onClick={() => setPaletteOpen(true)}
                aria-expanded={paletteOpen}
                aria-controls="exam-question-palette"
              >
                <LayoutGrid size={16} aria-hidden="true" />
                <span className={styles.toolBtnText}>Questions</span>
                <b className={styles.questionsBtnCount}>
                  {answeredCount}/{questions.length}
                </b>
              </button>
              <div
                className={`${styles.timerBadge} ${timerTone}`}
                title={timeLeft <= 300 && examPrefs.timerAlerts ? "Under 5 minutes remaining" : "Time remaining"}
                role="timer"
                aria-live="off"
                aria-label={`Time left ${formatTimer(timeLeft)}`}
              >
                <Timer size={16} strokeWidth={2.2} className={styles.timerIcon} aria-hidden="true" />
                <span className={styles.timerLabel}>Time left</span>
                <span className={styles.timerValue}>{formatTimer(timeLeft)}</span>
              </div>
              <div className={styles.examLockedBadge} title="Exam in progress. You must submit before closing.">
                <Lock size={14} aria-hidden="true" />
                <span>Locked</span>
              </div>
            </div>
          ) : (
            <div className={styles.topBarTools}>
              {onBackToAttempts && (
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={onBackToAttempts}
                  title="Back to all attempts"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  <span className={styles.toolBtnText}>Back to attempts</span>
                </button>
              )}
              <button className={styles.closeBtn} onClick={handleSafeClose} title="Close report" aria-label="Close report">
                <X size={20} />
              </button>
            </div>
          )}
        </header>

        {/* On-screen calculator */}
        {showCalculator && !isSubmitted && examPrefs.ionCalculator && (
          <div className={styles.calcModalOverlay}>
            <div className={styles.calcHeader}>
              <span className={styles.calcTitle}>
                <Keyboard size={14} />
                Calculator
              </span>
              <button
                type="button"
                className={styles.calcCloseBtn}
                onClick={() => setShowCalculator(false)}
                title="Close calculator"
                aria-label="Close calculator"
              >
                <X size={14} />
              </button>
            </div>
            <div className={styles.calcScreen}>{calcInput}</div>
            <div className={styles.calcGrid}>
              <button type="button" className={`${styles.calcBtn} ${styles.calcBtnClear}`} onClick={handleCalcClear}>C</button>
              <button type="button" className={styles.calcBtn} onClick={handleCalcBackspace} aria-label="Backspace">
                <Delete size={16} />
              </button>
              <button type="button" className={styles.calcBtn} onClick={handleCalcSqrt}>√</button>
              <button type="button" className={`${styles.calcBtn} ${styles.calcBtnOp}`} onClick={() => handleCalcOp("÷")}>÷</button>

              <button type="button" className={styles.calcBtn} onClick={() => handleCalcDigit("7")}>7</button>
              <button type="button" className={styles.calcBtn} onClick={() => handleCalcDigit("8")}>8</button>
              <button type="button" className={styles.calcBtn} onClick={() => handleCalcDigit("9")}>9</button>
              <button type="button" className={`${styles.calcBtn} ${styles.calcBtnOp}`} onClick={() => handleCalcOp("×")}>×</button>

              <button type="button" className={styles.calcBtn} onClick={() => handleCalcDigit("4")}>4</button>
              <button type="button" className={styles.calcBtn} onClick={() => handleCalcDigit("5")}>5</button>
              <button type="button" className={styles.calcBtn} onClick={() => handleCalcDigit("6")}>6</button>
              <button type="button" className={`${styles.calcBtn} ${styles.calcBtnOp}`} onClick={() => handleCalcOp("-")}>-</button>

              <button type="button" className={styles.calcBtn} onClick={() => handleCalcDigit("1")}>1</button>
              <button type="button" className={styles.calcBtn} onClick={() => handleCalcDigit("2")}>2</button>
              <button type="button" className={styles.calcBtn} onClick={() => handleCalcDigit("3")}>3</button>
              <button type="button" className={`${styles.calcBtn} ${styles.calcBtnOp}`} onClick={() => handleCalcOp("+")}>+</button>

              <button type="button" className={styles.calcBtn} onClick={() => handleCalcDigit("0")}>0</button>
              <button type="button" className={styles.calcBtn} onClick={() => handleCalcDigit(".")}>.</button>
              <button type="button" className={`${styles.calcBtn} ${styles.calcBtnEquals}`} onClick={handleCalcEquals}>=</button>
            </div>
          </div>
        )}

        {!isSubmitted ? (
          <>
            {classic ? (
              /* Classic: flat section tab strip */
              <div className={styles.sectionBar}>
                <div className={styles.sectionTabs} role="tablist" aria-label="Sections">
                  <span role="tab" aria-selected="true" className={`${styles.sectionTab} ${styles.sectionTabActive}`}>
                    {sectionLabel}
                  </span>
                </div>
                <span className={styles.sectionBarInfo}>
                  Answered <b>{answeredCount}</b> of <b>{questions.length}</b>
                </span>
              </div>
            ) : (
              /* Modern: slim progress bar */
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label="Questions answered"
                aria-valuemin={0}
                aria-valuemax={questions.length}
                aria-valuenow={answeredCount}
              >
                <span style={{ width: `${(answeredCount / totalQ) * 100}%` }} />
              </div>
            )}

            <div className={styles.examLayout}>
              <div className={styles.examMain}>
                {/* Question header */}
                <div className={styles.qHeader}>
                  <div className={styles.qHeaderLeft}>
                    <span className={styles.qNumber}>
                      {classic ? (
                        <>
                          Question No. <strong>{currentIdx + 1}</strong>
                        </>
                      ) : (
                        <>
                          Question <strong>{pad2(currentIdx + 1)}</strong>
                          <span className={styles.qOf}>/ {pad2(questions.length)}</span>
                        </>
                      )}
                    </span>
                    {currentQ.type === "TITA" ? (
                      <span className={`${styles.typeChip} ${styles.typeChipTita}`}>TITA</span>
                    ) : (
                      <span className={`${styles.typeChip} ${styles.typeChipMcq}`}>MCQ</span>
                    )}
                    {currentQ.isOutsideContext && <span className={styles.outsideTag}>CAT applied problem</span>}
                  </div>
                  <div className={styles.qHeaderRight}>
                    {!isGrandQuiz && (
                      <span className={styles.attemptChip}>
                        Attempt <strong>{attemptNumber}/{maxAttempts}</strong>
                      </span>
                    )}
                    <span className={styles.cutoffNotice}>
                      <Target size={13} aria-hidden="true" />
                      {scoringScheme === "cat" ? (
                        <>
                          Marks <b className={styles.markPlus}>+3</b> <b className={styles.markMinus}>−1</b>
                          <span className={styles.markNote}>TITA +3 / 0</span>
                        </>
                      ) : (
                        "70% cutoff to pass"
                      )}
                    </span>
                  </div>
                </div>

                {/* Question body (never shows right/wrong or explanation during the exam) */}
                <div className={`${styles.qBody} ${currentQ.context ? styles.qBodySplit : ""}`}>
                  {currentQ.context && (
                    <section className={styles.passage} aria-label="Passage">
                      <button
                        type="button"
                        className={styles.passageToggle}
                        onClick={() => setPassageOpen((prev) => !prev)}
                        aria-expanded={passageOpen}
                      >
                        <BookOpen size={15} aria-hidden="true" />
                        <span>{passageOpen ? "Hide passage" : "Show passage"}</span>
                        <ChevronDown
                          size={16}
                          aria-hidden="true"
                          className={`${styles.passageChevron} ${passageOpen ? styles.passageChevronOpen : ""}`}
                        />
                      </button>
                      <div className={styles.passageHeader}>
                        <BookOpen size={15} aria-hidden="true" />
                        <span>{classic ? "Directions / passage" : "Passage"}</span>
                      </div>
                      <div className={`${styles.passageText} ${passageOpen ? "" : styles.passageCollapsed}`}>
                        <PYQMarkdownViewer content={currentQ.context} />
                      </div>
                    </section>
                  )}

                  <div className={styles.questionPane}>
                    {currentQ.concept && (
                      <div className={styles.questionMeta}>
                        <span className={styles.conceptBadge}>{currentQ.concept}</span>
                      </div>
                    )}

                    <div className={styles.questionTitle}>
                      <PYQMarkdownViewer content={currentQ.q} />
                    </div>

                    {isCurrentTita ? (
                      <div className={styles.titaContainer}>
                        <div className={styles.titaLabel}>
                          <span className={styles.titaLabelMain}>
                            <Keyboard size={15} aria-hidden="true" />
                            Type in the answer
                          </span>
                          <span className={styles.titaSubtext}>
                            Enter a number or the exact text. No negative marks for TITA in CAT.
                          </span>
                        </div>
                        <div className={styles.titaInputWrapper}>
                          <input
                            type="text"
                            className={styles.titaInput}
                            placeholder="Your answer"
                            aria-label="Your answer"
                            value={selectedAnswers[currentIdx] !== undefined ? String(selectedAnswers[currentIdx]) : ""}
                            onChange={(e) => handleSetTITAAnswer(e.target.value)}
                          />
                          {selectedAnswers[currentIdx] !== undefined && selectedAnswers[currentIdx] !== "" && (
                            <button
                              type="button"
                              onClick={() => handleSetTITAAnswer("")}
                              className={styles.titaClearBtn}
                              title="Clear answer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.optionsGrid} role="radiogroup" aria-label="Answer options">
                        {currentQ.options.map((optText, optIdx) => {
                          const isSelected = selectedAnswers[currentIdx] === optIdx;
                          return (
                            <div
                              key={optIdx}
                              role="radio"
                              aria-checked={isSelected}
                              tabIndex={0}
                              onClick={() => handleSelectOption(optIdx)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleSelectOption(optIdx);
                                }
                              }}
                              className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ""}`}
                            >
                              <div className={styles.optionKey}>{OPTION_LETTERS[optIdx]}</div>
                              <div className={styles.optionText}><MathText text={optText} /></div>
                              {isSelected && <Check size={16} strokeWidth={2.6} className={styles.optionTick} />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!classic && !isCurrentTita && (
                      <p className={styles.kbdHint}>
                        <kbd>Tab</kbd> to move between options · <kbd>Enter</kbd> or <kbd>Space</kbd> to select
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom action bar */}
                <div className={styles.actionBar}>
                  <div className={styles.actionGroup}>
                    {isCurrentMarked ? (
                      <button
                        type="button"
                        className={`${styles.navActionBtn} ${styles.btnMarkOn} ${styles.actMark}`}
                        onClick={toggleMarkCurrent}
                        aria-pressed={true}
                        title="Remove the review mark from this question"
                      >
                        <Flag size={15} aria-hidden="true" />
                        <span className={styles.lblLong}>Unmark review</span>
                        <span className={styles.lblShort}>Unmark</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.navActionBtn} ${styles.btnMark} ${styles.actMark}`}
                        onClick={markForReviewAndNext}
                        title="Mark this question for review and go to the next one"
                      >
                        <Flag size={15} aria-hidden="true" />
                        <span className={styles.lblLong}>Mark for review &amp; next</span>
                        <span className={styles.lblShort}>Mark</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${styles.navActionBtn} ${styles.btnGhost} ${styles.actClear}`}
                      onClick={() => handleSetTITAAnswer("")}
                      disabled={!isAnsweredIdx(currentIdx)}
                      aria-label="Clear response"
                      title="Clear response"
                    >
                      <Eraser size={15} aria-hidden="true" />
                      <span className={styles.lblLong}>Clear response</span>
                    </button>
                  </div>

                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={`${styles.navActionBtn} ${styles.btnSecondary} ${styles.actPrev}`}
                      onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                      disabled={currentIdx === 0}
                      aria-label="Previous question"
                      title="Previous question"
                    >
                      <ArrowLeft size={15} aria-hidden="true" />
                      <span className={styles.lblLong}>Previous</span>
                    </button>
                    {!isLastQuestion ? (
                      <button
                        type="button"
                        className={`${styles.navActionBtn} ${styles.btnPrimary} ${styles.actNext}`}
                        onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                      >
                        <span>Save &amp; next</span>
                        <ArrowRight size={15} aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.navActionBtn} ${styles.btnSubmit} ${styles.actNext}`}
                        onClick={() => setShowSubmitConfirm(true)}
                      >
                        <span>Submit</span>
                        <Send size={15} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Question palette (column on desktop, drawer on tablet/phone) */}
              <aside
                id="exam-question-palette"
                className={`${styles.paletteAside} ${proctored ? styles.paletteAsideCam : ""} ${
                  paletteOpen ? styles.paletteOpen : ""
                }`}
                aria-label="Question palette"
              >
                <div className={styles.drawerHead}>
                  <span className={styles.paletteTitle}>Questions</span>
                  <button
                    type="button"
                    className={styles.drawerClose}
                    onClick={() => setPaletteOpen(false)}
                    aria-label="Close question palette"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>

                {classic && (
                  <div className={styles.candidate}>
                    <span className={styles.candidateAvatar} aria-hidden="true">
                      {candidateInitial}
                    </span>
                    <div className={styles.candidateText}>
                      <span>Candidate</span>
                      <strong>{candidateName}</strong>
                    </div>
                  </div>
                )}

                <div className={styles.paletteHead}>
                  <span className={styles.paletteTitle}>{classic ? sectionLabel : "Question palette"}</span>
                  <span className={styles.paletteProgress}>
                    <strong>{answeredCount}</strong>/{questions.length}
                  </span>
                </div>
                <div className={styles.paletteMeter} aria-hidden="true">
                  <span style={{ width: `${(answeredCount / totalQ) * 100}%` }} />
                </div>

                <ul className={styles.legend} aria-label="Palette legend">
                  {LEGEND_ORDER.map((state) => (
                    <li key={state}>
                      <span className={`${styles.legendSwatch} ${PALETTE_CLASS[state]}`} aria-hidden="true">
                        <span className={styles.legendSwatchCount}>{paletteCounts[state]}</span>
                      </span>
                      <span className={styles.legendLabel}>{PALETTE_LABEL[state]}</span>
                      <b className={styles.legendCount}>{paletteCounts[state]}</b>
                    </li>
                  ))}
                </ul>

                <div className={`${styles.pillsRow} ${examPrefs.compactPalette ? styles.compactPillsRow : ""}`}>
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentIdx;
                    const state = paletteState(idx);
                    return (
                      <button
                        key={q.id || idx}
                        type="button"
                        onClick={() => goToQuestion(idx)}
                        aria-current={isCurrent ? "true" : undefined}
                        aria-label={`Question ${idx + 1}: ${PALETTE_LABEL[state]}${isCurrent ? " (current)" : ""}`}
                        title={PALETTE_LABEL[state]}
                        className={`${styles.qPill} ${PALETTE_CLASS[state]} ${isCurrent ? styles.qPillActive : ""}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <button type="button" className={styles.asideSubmitBtn} onClick={() => setShowSubmitConfirm(true)}>
                  <Send size={15} aria-hidden="true" />
                  Submit
                </button>
              </aside>
              {paletteOpen && (
                <div className={styles.drawerBackdrop} onClick={() => setPaletteOpen(false)} aria-hidden="true" />
              )}
            </div>
          </>
        ) : (
          /* Results, diagnostics & solutions review (only after submission) — Modern design */
          <div className={styles.resultScroll}>
            <div className={styles.resultContainer}>
              {/* Score summary */}
              <section className={styles.resultHero} aria-label="Score summary">
                <div className={`${styles.scoreFeature} ${analysis?.passed ? styles.trophyPass : styles.trophyFail}`}>
                  <div className={styles.resultTrophy}>
                    {analysis?.passed ? <Trophy size={16} aria-hidden="true" /> : <TriangleAlert size={16} aria-hidden="true" />}
                    <span>{analysis?.passed ? "Passed" : "Cutoff not met"}</span>
                  </div>
                  <h3 className={styles.resultHeading}>
                    {analysis?.passed
                      ? isGrandQuiz
                        ? "Course mastered"
                        : isPyq
                          ? "Strong attempt"
                          : "Module passed"
                      : `Cutoff not met (${cutoffPct}% required)`}
                  </h3>
                  <div className={styles.scoreBanner}>
                    <div className={styles.scoreMetricMain}>
                      <span className={styles.scoreVal}>{analysis?.score}</span>
                      <span className={styles.scoreOutOf}>/ {analysis?.total}</span>
                    </div>
                    <span className={styles.scoreLbl}>
                      {strikes > 0 ? "Final score" : scoringScheme === "cat" ? "Score" : "Correct answers"}
                    </span>
                  </div>
                  <p className={styles.resultSubheading}>
                    {isPyq
                      ? `You scored ${analysis?.score} of ${analysis?.total} marks (${analysis?.percentage}%).`
                      : analysis?.passed
                        ? isGrandQuiz
                          ? "You have completed the CAT grand comprehensive assessment."
                          : "You have mastered this module. The next module is now unlocked."
                        : `You scored ${analysis?.percentage}%. You need at least ${cutoffPct}% to unlock the next module.`}
                  </p>
                  <div className={styles.scoreFootRow}>
                    {strikes > 0 && (
                      <>
                        <span className={styles.scoreMetric}>
                          <b>{rawScore !== null ? rawScore : analysis?.score}</b> raw
                        </span>
                        <span className={`${styles.scoreMetric} ${styles.scoreMetricPenalty}`}>
                          <b>−{strikes}</b> penalty
                        </span>
                      </>
                    )}
                    <span className={styles.scoreMetric}>
                      <b>{analysis?.percentage}%</b> of max
                    </span>
                    {analysis?.passed && <span className={styles.xpAwardBadge}>+{isGrandQuiz ? 100 : 50} XP</span>}
                  </div>
                </div>

                <div className={`glass-card ${styles.accuracyCard}`} data-tint="teal">
                  <div className={styles.cardKicker}>Answer breakdown</div>
                  <div className={styles.accuracyBody}>
                    <svg
                      className={styles.ring}
                      viewBox="0 0 132 132"
                      role="img"
                      aria-label={`${correctCount} correct, ${wrongCount} wrong, ${skippedCount} skipped`}
                    >
                      <circle cx="66" cy="66" r={RING_R} fill="none" stroke="#eef2f8" strokeWidth="14" />
                      {ringSegments.map((seg) => {
                        const len = (seg.value / totalQ) * RING_C;
                        const el = (
                          <circle
                            key={seg.key}
                            cx="66"
                            cy="66"
                            r={RING_R}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="14"
                            strokeDasharray={`${len} ${RING_C - len}`}
                            strokeDashoffset={-ringOffset}
                            transform="rotate(-90 66 66)"
                          />
                        );
                        ringOffset += len;
                        return seg.value > 0 ? el : null;
                      })}
                      <text x="66" y="64" textAnchor="middle" className={styles.ringValue}>
                        {Math.round((correctCount / totalQ) * 100)}%
                      </text>
                      <text x="66" y="82" textAnchor="middle" className={styles.ringLabel}>
                        correct
                      </text>
                    </svg>
                    <ul className={styles.ringLegend}>
                      <li><span style={{ background: "var(--data-emerald)" }} />Correct<b>{correctCount}</b></li>
                      <li><span style={{ background: "var(--data-coral)" }} />Wrong<b>{wrongCount}</b></li>
                      <li><span style={{ background: "#d3dbe8" }} />Skipped<b>{skippedCount}</b></li>
                    </ul>
                  </div>
                  <div className={styles.qStrip} aria-hidden="true">
                    {questions.map((q, idx) => (
                      <span
                        key={q.id || idx}
                        className={
                          checkQuestionCorrect(q, idx)
                            ? styles.qStripCorrect
                            : isAnsweredIdx(idx)
                              ? styles.qStripWrong
                              : styles.qStripSkipped
                        }
                        title={`Q${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* KPI row */}
              <section className={styles.analyticsGrid} aria-label="Attempt statistics">
                <div className={`glass-card ${styles.analyticsCard}`} data-tint="blue">
                  <span className={styles.analyticsLbl}>
                    <ListChecks size={14} aria-hidden="true" />
                    Attempted
                  </span>
                  <span className={styles.analyticsVal}>
                    {attemptedCount}
                    <small>/ {questions.length}</small>
                  </span>
                </div>
                <div className={`glass-card ${styles.analyticsCard}`} data-tint="teal">
                  <span className={styles.analyticsLbl}>
                    <Check size={14} aria-hidden="true" />
                    Correct · wrong
                  </span>
                  <span className={styles.analyticsVal}>
                    <span className={styles.analyticsPass}>{correctCount}</span>
                    <small>·</small>
                    <span className={styles.analyticsStrike}>{wrongCount}</span>
                  </span>
                </div>
                <div className={`glass-card ${styles.analyticsCard}`} data-tint="violet">
                  <span className={styles.analyticsLbl}>
                    <Target size={14} aria-hidden="true" />
                    Accuracy
                  </span>
                  <span className={styles.analyticsVal}>
                    {accuracyPct}
                    <small>%</small>
                  </span>
                </div>
                <div className={`glass-card ${styles.analyticsCard}`} data-tint="blue">
                  <span className={styles.analyticsLbl}>
                    <Clock size={14} aria-hidden="true" />
                    Time taken
                  </span>
                  <span className={styles.analyticsVal}>{formatTimer(timeTakenSeconds)}</span>
                </div>
                <div className={`glass-card ${styles.analyticsCard}`} data-tint="amber">
                  <span className={styles.analyticsLbl}>
                    <Zap size={14} aria-hidden="true" />
                    Avg per question
                  </span>
                  <span className={styles.analyticsVal}>
                    {Math.max(1, Math.round(timeTakenSeconds / (questions.length || 1)))}
                    <small>s</small>
                  </span>
                </div>
                <div className={`glass-card ${styles.analyticsCard}`} data-tint={strikes > 0 ? "coral" : "teal"}>
                  <span className={styles.analyticsLbl}>
                    <ShieldCheck size={14} aria-hidden="true" />
                    Proctoring
                  </span>
                  <span className={`${styles.analyticsVal} ${strikes > 0 ? styles.analyticsStrike : styles.analyticsPass}`}>
                    {strikes > 0 ? `−${strikes} mark${strikes > 1 ? "s" : ""}` : "Clean"}
                  </span>
                </div>
              </section>

              {/* Proctoring penalty notice (if any strikes incurred) */}
              {strikes > 0 && (
                <div className={styles.penaltyNoticeBanner}>
                  <div className={styles.penaltyNoticeTitle}>
                    <TriangleAlert size={15} aria-hidden="true" />
                    <span>Proctoring penalty applied (−{strikes} mark{strikes > 1 ? "s" : ""})</span>
                  </div>
                  <div className={styles.penaltyNoticeDesc}>
                    You incurred <strong>{strikes} proctoring warning{strikes > 1 ? "s" : ""}</strong> during this exam (screenshot, tab switching or webcam proctoring).
                    A penalty of <strong>−{strikes} mark{strikes > 1 ? "s" : ""}</strong> was deducted from your raw score ({rawScore !== null ? rawScore : analysis?.score} → {analysis?.score}).
                  </div>
                </div>
              )}

              {/* Concept diagnosis & prescribed rewatches (if failed) */}
              {!analysis?.passed && analysis && (
                <>
                  {attemptNumber >= maxAttempts && (
                    <div className={styles.lockoutBanner}>
                      <div className={styles.lockoutTitle}>
                        <Lock size={17} aria-hidden="true" />
                        <span>Attempt limit reached ({maxAttempts} of {maxAttempts})</span>
                      </div>
                      <p className={styles.lockoutDesc}>
                        You have used all 3 attempts. Re-watch the recommended lectures below, then refresh your
                        attempts.
                      </p>
                      {onResetAttemptsAfterRewatch && (
                        <button type="button" className={styles.resetAttemptsBtn} onClick={onResetAttemptsAfterRewatch}>
                          <Check size={15} strokeWidth={2.6} />
                          I have re-watched the lectures — reset attempts
                        </button>
                      )}
                    </div>
                  )}

                  <div className={`glass-card ${styles.aiDiagnosisCard}`} data-tint="violet">
                    <div className={styles.aiCardHeader}>
                      <ListChecks size={18} className={styles.aiIconBox} aria-hidden="true" />
                      <h4 className={styles.aiCardTitle}>Concepts to review</h4>
                    </div>

                    <div className={styles.missedTopicsList}>
                      {analysis.missedConcepts.map((item, idx) => (
                        <div key={idx} className={styles.missedTopicItem}>
                          <div>
                            <strong>{item.concept}</strong>: {item.explanation}
                          </div>
                        </div>
                      ))}
                    </div>

                    {analysis.recommendedLessons.length > 0 && (
                      <div className={styles.recommendedLecturesSection}>
                        <div className={styles.recHeading}>Recommended lectures to re-watch</div>
                        <div className={styles.recLecturesList}>
                          {analysis.recommendedLessons.map((rec) => (
                            <div key={rec.lessonId} className={styles.recLectureRow}>
                              <div>
                                <div className={styles.recLectureTitle}>
                                  <Play size={13} aria-hidden="true" />
                                  {rec.lessonTitle}
                                </div>
                                <span className={styles.recLectureReason}>{rec.reason}</span>
                              </div>
                              {onSelectLessonToRewatch && (
                                <button
                                  type="button"
                                  className={styles.watchRecBtn}
                                  onClick={() => {
                                    onSelectLessonToRewatch(rec.lessonId);
                                    onClose();
                                  }}
                                >
                                  Watch lecture
                                  <ArrowRight size={14} aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Question-by-question review */}
              <section className={styles.solutionsSection} aria-labelledby="exam-review-title">
                <div className={styles.solutionsHeader}>
                  <h4 id="exam-review-title" className={styles.solutionsTitle}>
                    Question review
                  </h4>
                  <div className={styles.filterTabs} role="group" aria-label="Filter questions">
                    {REVIEW_FILTERS.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className={`${styles.filterTabBtn} ${reviewFilter === f.key ? styles.filterTabBtnActive : ""}`}
                        onClick={() => setReviewFilter(f.key)}
                        aria-pressed={reviewFilter === f.key}
                      >
                        {f.label} <b>{f.count}</b>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.reviewList}>
                  {reviewItems.length === 0 && (
                    <p className={styles.reviewEmpty}>No questions in this view.</p>
                  )}
                  {reviewItems.map(({ q, idx: originalIdx }) => {
                    const userChoice = selectedAnswers[originalIdx];
                    const isUserCorrect = checkQuestionCorrect(q, originalIdx);
                    const isTITA = q.type === "TITA" || !q.options || q.options.length === 0;
                    const isSkipped = userChoice === undefined || userChoice === null || userChoice === "";
                    const userLetter = !isTITA && typeof userChoice === "number" ? OPTION_LETTERS[userChoice] : null;
                    const correctLetter = !isTITA && q.answer >= 0 ? OPTION_LETTERS[q.answer] : null;

                    return (
                      <article
                        key={q.id || originalIdx}
                        className={`${styles.reviewCard} ${
                          isUserCorrect ? styles.reviewCardCorrect : isSkipped ? styles.reviewCardSkipped : styles.reviewCardWrong
                        }`}
                      >
                        <div className={styles.reviewCardHeader}>
                          <div className={styles.reviewCardHeadLeft}>
                            <span className={styles.reviewQNum}>Q{pad2(originalIdx + 1)}</span>
                            {q.concept && <span className={styles.conceptBadge}>{q.concept}</span>}
                            {isTITA && <span className={`${styles.typeChip} ${styles.typeChipTita}`}>TITA</span>}
                            {markedSet.has(originalIdx) && (
                              <span className={styles.reviewMarkedTag}>
                                <Flag size={11} aria-hidden="true" />
                                Marked
                              </span>
                            )}
                          </div>
                          {isUserCorrect ? (
                            <span className={styles.reviewStatusBadgeCorrect}>
                              <Check size={13} strokeWidth={2.8} aria-hidden="true" />
                              Correct {scoringScheme === "cat" ? <b>+3</b> : null}
                            </span>
                          ) : isSkipped ? (
                            <span className={styles.reviewStatusBadgeSkipped}>
                              <Circle size={11} strokeWidth={2.6} aria-hidden="true" />
                              Skipped <b>0</b>
                            </span>
                          ) : (
                            <span className={styles.reviewStatusBadgeWrong}>
                              <X size={13} strokeWidth={2.8} aria-hidden="true" />
                              Wrong {scoringScheme === "cat" ? <b>{isTITA ? "0" : "−1"}</b> : null}
                            </span>
                          )}
                        </div>

                        {q.context && (
                          <details className={styles.reviewPassage}>
                            <summary>
                              <BookOpen size={14} aria-hidden="true" />
                              Passage
                              <ChevronDown size={15} aria-hidden="true" className={styles.reviewPassageChevron} />
                            </summary>
                            <div className={styles.passageText}>
                              <PYQMarkdownViewer content={q.context} />
                            </div>
                          </details>
                        )}

                        <div className={styles.reviewQuestionText}>
                          <PYQMarkdownViewer content={q.q} />
                        </div>

                        <div className={styles.answerCompare}>
                          <div className={styles.answerCell}>
                            <span className={styles.answerCellLbl}>Your answer</span>
                            <span
                              className={`${styles.answerCellVal} ${
                                isSkipped ? styles.answerSkipped : isUserCorrect ? styles.answerRight : styles.answerWrong
                              }`}
                            >
                              {isSkipped ? "Not answered" : isTITA ? String(userChoice) : userLetter}
                            </span>
                          </div>
                          <div className={styles.answerCell}>
                            <span className={styles.answerCellLbl}>Correct answer</span>
                            <span className={`${styles.answerCellVal} ${styles.answerRight}`}>
                              {isTITA ? <MathText text={q.titaAnswer || q.explanation.slice(0, 80)} /> : correctLetter ?? "—"}
                            </span>
                          </div>
                        </div>

                        {!isTITA && (
                          <div className={styles.reviewOptionsList}>
                            {q.options.map((opt, optIdx) => {
                              const isSelectedByUser = userChoice === optIdx;
                              const isActualCorrect = q.answer === optIdx;

                              let rowClass = styles.reviewOptionItem;
                              let tag = null;

                              if (isSelectedByUser && isActualCorrect) {
                                rowClass += ` ${styles.reviewOptSelectedCorrect}`;
                                tag = (
                                  <span className={`${styles.reviewOptTag} ${styles.tagCorrect}`}>
                                    <Check size={12} strokeWidth={2.8} aria-hidden="true" />
                                    Your answer
                                  </span>
                                );
                              } else if (isSelectedByUser && !isActualCorrect) {
                                rowClass += ` ${styles.reviewOptSelectedWrong}`;
                                tag = (
                                  <span className={`${styles.reviewOptTag} ${styles.tagUserWrong}`}>
                                    <X size={12} strokeWidth={2.8} aria-hidden="true" />
                                    Your answer
                                  </span>
                                );
                              } else if (isActualCorrect) {
                                rowClass += ` ${styles.reviewOptCorrectAnswer}`;
                                tag = (
                                  <span className={`${styles.reviewOptTag} ${styles.tagCorrect}`}>
                                    <Check size={12} strokeWidth={2.8} aria-hidden="true" />
                                    Correct answer
                                  </span>
                                );
                              }

                              return (
                                <div key={optIdx} className={rowClass}>
                                  <div className={styles.reviewOptMain}>
                                    <span className={styles.reviewOptKey}>{OPTION_LETTERS[optIdx]}</span>
                                    <span><MathText text={opt} /></span>
                                  </div>
                                  {tag}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Solution */}
                        <div className={styles.explanationCallout}>
                          <div className={styles.explanationTitle}>
                            <Lightbulb size={15} aria-hidden="true" />
                            Solution
                          </div>
                          <div>
                            <PYQMarkdownViewer content={q.explanation} />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* Next steps */}
              <div className={styles.resultActions}>
                {onBackToAttempts && (
                  <button
                    type="button"
                    className={`${styles.navActionBtn} ${styles.btnBackToAttempts}`}
                    onClick={onBackToAttempts}
                    title="Return to the list of all past attempts"
                  >
                    <ArrowLeft size={15} aria-hidden="true" />
                    Back to all attempts
                  </button>
                )}
                {analysis?.passed ? (
                  <>
                    <button
                      type="button"
                      className={`${styles.navActionBtn} ${styles.btnRetakeScore}`}
                      onClick={() => {
                        if (onRetake) {
                          onRetake();
                        } else {
                          resetForInModalRetake();
                        }
                      }}
                    >
                      <RotateCcw size={15} aria-hidden="true" />
                      Retake with fresh questions
                    </button>
                    <button type="button" className={`${styles.navActionBtn} ${styles.btnPrimary}`} onClick={handleSafeClose}>
                      Continue learning
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </>
                ) : attemptNumber < maxAttempts ? (
                  <button
                    type="button"
                    className={`${styles.navActionBtn} ${styles.btnPrimary}`}
                    onClick={() => {
                      if (onRetake) {
                        onRetake();
                      } else {
                        resetForInModalRetake();
                      }
                    }}
                  >
                    <RotateCcw size={15} aria-hidden="true" />
                    Retake with fresh questions (attempt {attemptNumber + 1} of {maxAttempts})
                  </button>
                ) : (
                  <button type="button" className={`${styles.navActionBtn} ${styles.btnSecondary}`} onClick={handleSafeClose}>
                    Close &amp; review videos
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submission confirmation */}
        {showSubmitConfirm && (
          <div className={styles.confirmOverlay} onClick={() => setShowSubmitConfirm(false)}>
            <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className={styles.confirmIcon}>
                <Send size={22} />
              </div>
              <h3 className={styles.confirmTitle}>Submit your exam?</h3>
              <div className={styles.confirmStats}>
                <div>
                  <b>{answeredCount}<small>/{questions.length}</small></b>
                  <span>Answered</span>
                </div>
                <div>
                  <b>{paletteCounts.marked + paletteCounts.answeredMarked}</b>
                  <span>Marked</span>
                </div>
                <div>
                  <b>{formatTimer(timeLeft)}</b>
                  <span>Time left</span>
                </div>
              </div>
              <p className={styles.confirmDesc}>Once submitted, your answers are final and the exam is graded.</p>
              <div className={styles.confirmActions}>
                <button type="button" className={styles.confirmCancelBtn} onClick={() => setShowSubmitConfirm(false)}>
                  <ArrowLeft size={15} />
                  Continue exam
                </button>
                <button
                  type="button"
                  className={styles.confirmSubmitBtn}
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    handleSubmit();
                  }}
                >
                  Yes, submit
                  <Check size={15} strokeWidth={2.6} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto submission notification (timeout or proctoring violation) */}
        {autoSubmitNotice && (
          <div className={styles.confirmOverlay} onClick={() => setAutoSubmitNotice(null)}>
            <div
              className={`${styles.confirmBox} ${autoSubmitNotice.type === "cheat" ? styles.confirmBoxCheat : styles.confirmBoxTimeout}`}
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
            >
              <div className={styles.confirmIcon}>
                {autoSubmitNotice.type === "cheat" ? <TriangleAlert size={22} /> : <Clock size={22} />}
              </div>
              <h3 className={styles.confirmTitle}>{autoSubmitNotice.title}</h3>
              <p className={styles.confirmDesc}>{autoSubmitNotice.description}</p>
              {autoSubmitNotice.type === "cheat" && (
                <div className={`${styles.confirmNote} ${styles.confirmNoteCheat}`}>
                  <TriangleAlert size={15} />
                  <span>
                    <strong>Security advisory:</strong> switching tabs, minimising the exam window, taking screenshots or
                    opening developer tools is not allowed during the exam.
                  </span>
                </div>
              )}
              {autoSubmitNotice.type === "timeout" && (
                <div className={`${styles.confirmNote} ${styles.confirmNoteTimeout}`}>
                  <Clock size={15} />
                  <span>
                    <strong>Time is up:</strong> all answered questions have been graded. Unanswered questions are marked
                    as unattempted.
                  </span>
                </div>
              )}
              <div className={styles.confirmActions}>
                <button type="button" className={styles.confirmSubmitBtn} onClick={() => setAutoSubmitNotice(null)}>
                  View score &amp; analysis
                  <ChartColumn size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render at the document root so no page header/stacking context can cover the exam
  // header (timer, strikes, lock badge). Falls back to inline render during SSR.
  if (typeof document === "undefined") return modalContent;
  return createPortal(modalContent, document.body);
}
