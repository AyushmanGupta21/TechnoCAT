"use client";

// Classic / Modern switch for exam screens. Usage: <ExamModeToggle /> (reads/writes the shared mode),
// or controlled: <ExamModeToggle mode={mode} onChange={setMode} />. `tone="dark"` for dark headers.

import { LayoutGrid, Monitor } from "lucide-react";
import { useExamMode, type ExamMode } from "@/lib/examMode";
import styles from "./ExamModeToggle.module.css";

type Props = {
  mode?: ExamMode;
  onChange?: (mode: ExamMode) => void;
  tone?: "light" | "dark";
  className?: string;
};

export default function ExamModeToggle({ mode: controlled, onChange, tone = "light", className }: Props) {
  const [shared, setShared] = useExamMode();
  const mode = controlled ?? shared;
  const set = onChange ?? setShared;

  return (
    <div
      className={`${styles.toggle} ${tone === "dark" ? styles.dark : ""} ${className ?? ""}`}
      role="radiogroup"
      aria-label="Exam interface"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "classic"}
        className={`${styles.option} ${mode === "classic" ? styles.active : ""}`}
        onClick={() => set("classic")}
        title="Classic: the actual CAT exam layout"
      >
        <Monitor size={14} strokeWidth={2} aria-hidden="true" />
        Classic
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === "modern"}
        className={`${styles.option} ${mode === "modern" ? styles.active : ""}`}
        onClick={() => set("modern")}
        title="Modern: the focused TechnoCAT interface"
      >
        <LayoutGrid size={14} strokeWidth={2} aria-hidden="true" />
        Modern
      </button>
    </div>
  );
}
