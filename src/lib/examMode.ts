"use client";

// Exam interface mode shared by every test screen (PYQ attempts, module quizzes, topic quizzes).
// "classic" mirrors the real CAT computer-based-test layout; "modern" is the focused TechnoCAT design.
// The choice is remembered per device (localStorage) and kept in sync across open components.

import { useCallback, useEffect, useState } from "react";

export type ExamMode = "classic" | "modern";

const STORAGE_KEY = "technocat_exam_mode";
const EVENT = "technocat:exam-mode";
export const DEFAULT_EXAM_MODE: ExamMode = "modern";

function read(): ExamMode {
  if (typeof window === "undefined") return DEFAULT_EXAM_MODE;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "classic" || v === "modern" ? v : DEFAULT_EXAM_MODE;
  } catch {
    return DEFAULT_EXAM_MODE;
  }
}

export function useExamMode(): [ExamMode, (mode: ExamMode) => void] {
  const [mode, setModeState] = useState<ExamMode>(DEFAULT_EXAM_MODE);

  useEffect(() => {
    setModeState(read());
    const sync = () => setModeState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setMode = useCallback((next: ExamMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable: still switch for this session */
    }
    setModeState(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [mode, setMode];
}
