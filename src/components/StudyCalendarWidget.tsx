"use client";

import React from "react";
import styles from "./StudyCalendarWidget.module.css";

interface StudyCalendarWidgetProps {
  selectedMonthIndex: number;
  onSelectMonthIndex: (monthIndex: number) => void;
  selectedYear?: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  taskCategoryMap?: Record<number, Array<"QA" | "DILR" | "VARC" | "Mock">>;
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
    const dots = taskCategoryMap && taskCategoryMap[d]
      ? taskCategoryMap[d]
      : isSeptember
      ? defaultSeptemberDots[d]
      : isOctober
      ? defaultOctoberDots[d]
      : undefined;

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

  return (
    <div className={styles.calendarBox}>
      <div className={styles.calendarHeader}>
        <div className={styles.monthNav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={handlePrevMonth}
            aria-label="Previous Month"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className={styles.monthTitle}>
            {months[selectedMonthIndex]} 2026
          </span>
          <button
            type="button"
            className={styles.navBtn}
            onClick={handleNextMonth}
            aria-label="Next Month"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

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
      </div>

      <div className={styles.calendarGrid}>
        <div className={styles.dayHeader}>Sun</div>
        <div className={styles.dayHeader}>Mon</div>
        <div className={styles.dayHeader}>Tue</div>
        <div className={styles.dayHeader}>Wed</div>
        <div className={styles.dayHeader}>Thu</div>
        <div className={styles.dayHeader}>Fri</div>
        <div className={styles.dayHeader}>Sat</div>

        {calendarDays.map((item, idx) => {
          const isActive = item.isCurrentMonth && item.day === selectedDay;
          const dots = item.isCurrentMonth
            ? ((taskCategoryMap && taskCategoryMap[item.day])
                ? taskCategoryMap[item.day]
                : item.dots)
            : undefined;

          return (
            <div
              key={idx}
              className={`${styles.dayCell} ${!item.isCurrentMonth ? styles.dayMuted : ""} ${isActive ? styles.dayActive : ""}`}
              onClick={() => {
                if (item.isCurrentMonth) {
                  onSelectDay(item.day);
                }
              }}
            >
              <span className={styles.dayNumber}>{item.day}</span>
              {dots && dots.length > 0 && (
                <div className={styles.dotsContainer}>
                  {dots.map((dot, dIdx) => (
                    <span
                      key={dIdx}
                      className={`${styles.dot} ${styles[`dot${dot}`]}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.legendRow}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotQA}`} />
          <span>QA</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotDILR}`} />
          <span>DILR</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotVARC}`} />
          <span>VARC</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotMock}`} />
          <span>Mock Test</span>
        </div>
      </div>
    </div>
  );
}
