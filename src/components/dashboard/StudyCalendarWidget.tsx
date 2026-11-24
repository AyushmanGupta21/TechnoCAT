"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./StudyCalendarWidget.module.css";

interface StudyCalendarWidgetProps {
  selectedMonthIndex: number;
  onSelectMonthIndex: (monthIndex: number) => void;
  selectedYear?: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  taskCategoryMap?: Record<number, Array<"QA" | "DILR" | "VARC" | "Mock">>;
  isDemo?: boolean;
}

interface CalendarDate {
  day: number;
  isCurrentMonth: boolean;
  dots?: Array<"QA" | "DILR" | "VARC" | "Mock">;
}

const defaultSeptemberDots: Record<number, Array<"QA" | "DILR" | "VARC" | "Mock">> = {
  1: ["QA"],
  2: ["DILR"],
  3: ["QA", "VARC"],
  4: ["Mock"],
  6: ["QA"],
  7: ["QA", "DILR"],
  8: ["VARC"],
  9: ["QA", "Mock"],
  10: ["QA", "DILR", "VARC"],
  11: ["DILR"],
  12: ["Mock"],
  14: ["QA"],
  15: ["QA", "VARC"],
  16: ["QA", "DILR", "VARC"],
  17: ["QA", "DILR"],
  18: ["Mock"],
  20: ["VARC"],
  21: ["QA"],
  22: ["DILR"],
  23: ["QA", "VARC"],
  24: ["QA", "DILR", "Mock"],
  25: ["Mock"],
  27: ["QA"],
  28: ["DILR"],
  29: ["VARC"],
  30: ["Mock"],
};

const defaultOctoberDots: Record<number, Array<"QA" | "DILR" | "VARC" | "Mock">> = {
  1: ["QA", "DILR"],
  2: ["VARC", "QA"],
  3: ["DILR", "Mock"],
  4: ["QA", "VARC"],
  5: ["QA", "DILR"],
  6: ["QA", "VARC"],
  7: ["Mock"],
  8: ["DILR", "VARC"],
  9: ["QA", "DILR"],
  10: ["QA", "VARC"],
  11: ["QA", "DILR"],
  12: ["Mock"],
  13: ["VARC", "QA"],
  14: ["DILR"],
  15: ["QA", "VARC"],
  16: ["DILR"],
  17: ["QA"],
  18: ["Mock"],
  19: ["VARC"],
  20: ["QA", "DILR"],
};

export default function StudyCalendarWidget({
  selectedMonthIndex,
  onSelectMonthIndex,
  selectedYear = 2026,
  selectedDay,
  onSelectDay,
  taskCategoryMap,
  isDemo = false,
}: StudyCalendarWidgetProps) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = selectedYear || 2026;
  const isSeptember = selectedMonthIndex === 8 && year === 2026;
  const isOctober = selectedMonthIndex === 9 && year === 2026;

  const handlePrevMonth = () => {
    onSelectMonthIndex(selectedMonthIndex === 0 ? 11 : selectedMonthIndex - 1);
  };

  const handleNextMonth = () => {
    onSelectMonthIndex(selectedMonthIndex === 11 ? 0 : selectedMonthIndex + 1);
  };

  // Dynamically compute calendar days matrix for the active month & year
  const firstDayOfWeek = new Date(year, selectedMonthIndex, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, selectedMonthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, selectedMonthIndex, 0).getDate();

  const calendarDays: CalendarDate[] = [];

  // 1. Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
    });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dots = isDemo
      ? (taskCategoryMap && taskCategoryMap[d]
          ? taskCategoryMap[d]
          : isSeptember
          ? defaultSeptemberDots[d]
          : isOctober
          ? defaultOctoberDots[d]
          : undefined)
      : (taskCategoryMap && taskCategoryMap[d] ? taskCategoryMap[d] : undefined);

    calendarDays.push({
      day: d,
      isCurrentMonth: true,
      dots,
    });
  }

  // 3. Next month leading days (fill standard 35 or 42 calendar grid cells)
  const targetCells = calendarDays.length > 35 ? 42 : 35;
  const remainingCells = targetCells - calendarDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    calendarDays.push({
      day: d,
      isCurrentMonth: false,
    });
  }

  const legend: { key: "QA" | "DILR" | "VARC" | "Mock"; label: string }[] = [
    { key: "QA", label: "QA" },
    { key: "DILR", label: "DILR" },
    { key: "VARC", label: "VARC" },
    { key: "Mock", label: "Mock test" },
  ];

  return (
    <section className={`glass-card ${styles.calendarBox}`} data-tint="teal">
      <div className={styles.calendarHeader}>
        <h2 className={styles.monthTitle}>
          {months[selectedMonthIndex]} <span className={styles.yearText}>2026</span>
        </h2>
        <div className={styles.monthNav}>
          <button type="button" className={styles.navBtn} onClick={handlePrevMonth} aria-label="Previous Month">
            <ChevronLeft size={16} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            className={styles.todayBtn}
            onClick={() => {
              const now = new Date();
              onSelectMonthIndex(now.getMonth());
              onSelectDay(now.getDate());
            }}
          >
            Today
          </button>
          <button type="button" className={styles.navBtn} onClick={handleNextMonth} aria-label="Next Month">
            <ChevronRight size={16} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}

        {calendarDays.map((item, idx) => {
          const isActive = item.isCurrentMonth && item.day === selectedDay;
          const dots = item.isCurrentMonth
            ? ((taskCategoryMap && taskCategoryMap[item.day])
                ? taskCategoryMap[item.day]
                : item.dots)
            : undefined;

          return (
            <button
              type="button"
              key={idx}
              className={`${styles.dayCell} ${!item.isCurrentMonth ? styles.dayMuted : ""} ${isActive ? styles.dayActive : ""}`}
              tabIndex={item.isCurrentMonth ? 0 : -1}
              aria-pressed={isActive}
              onClick={() => {
                if (item.isCurrentMonth) {
                  onSelectDay(item.day);
                }
              }}
            >
              <span className={styles.dayNumber}>{item.day}</span>
              <span className={styles.dotsContainer}>
                {dots && dots.length > 0 &&
                  dots.map((dot, dIdx) => (
                    <span key={dIdx} className={`${styles.dot} ${styles[`dot${dot}`]}`} />
                  ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.legendRow}>
        {legend.map((l) => (
          <span key={l.key} className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles[`dot${l.key}`]}`} />
            {l.label}
          </span>
        ))}
      </div>
    </section>
  );
}
