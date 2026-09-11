"use client";

import React, { useState, useEffect } from "react";
import styles from "./DailyStudySchedule.module.css";

export interface ScheduleItem {
  id: string;
  day: number;
  monthIndex?: number;
  year?: number;
  timeRange: string;
  duration: string;
  category: "QA" | "DILR" | "VARC" | "Mock";
  code: string;
  title: string;
  subtitle: string;
  isCompleted: boolean;
  originalDay?: number; // if rescheduled from earlier date
}

interface DailyStudyScheduleProps {
  selectedMonthIndex: number;
  selectedYear: number;
  selectedDay: number;
  tasks: ScheduleItem[];
  onToggleTask: (id: string) => void;
  onAddTask: () => void;
  onAutoAssignDay: (day: number) => void;
}

export default function DailyStudySchedule({
  selectedMonthIndex,
  selectedYear,
  selectedDay,
  tasks,
  onToggleTask,
  onAddTask,
  onAutoAssignDay,
}: DailyStudyScheduleProps) {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthName = months[selectedMonthIndex] || "September";

  // Today is automatically derived from the system/browser date
  const [todayState, setTodayState] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
      day: now.getDate(),
    };
  });

  useEffect(() => {
    const now = new Date();
    setTodayState({
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
      day: now.getDate(),
    });
  }, []);

  const TODAY_YEAR = todayState.year;
  const TODAY_MONTH_INDEX = todayState.monthIndex;
  const TODAY_DAY = todayState.day;

  // Selected date numeric comparison (e.g. 20260911)
  const selectedDateVal = selectedYear * 10000 + (selectedMonthIndex + 1) * 100 + selectedDay;
  const todayDateVal = TODAY_YEAR * 10000 + (TODAY_MONTH_INDEX + 1) * 100 + TODAY_DAY;
  
  // Rolling 30-day window from today reaches 30 days into the future
  const maxRollingDate = new Date(TODAY_YEAR, TODAY_MONTH_INDEX, TODAY_DAY + 30);
  const maxRollingDateVal =
    maxRollingDate.getFullYear() * 10000 +
    (maxRollingDate.getMonth() + 1) * 100 +
    maxRollingDate.getDate();

  const isToday = selectedDateVal === todayDateVal;
  const isPast = selectedDateVal < todayDateVal;
  const isWithinRollingWindow = selectedDateVal >= todayDateVal && selectedDateVal <= maxRollingDateVal;
  const isBeyondRollingWindow = selectedDateVal > maxRollingDateVal;

  // Filter tasks for the selected day in selected month & year
  const currentDayTasks = tasks.filter((t) => {
    const taskMonth = t.monthIndex !== undefined ? t.monthIndex : 8;
    const taskYear = t.year !== undefined ? t.year : 2026;
    return taskMonth === selectedMonthIndex && taskYear === selectedYear && t.day === selectedDay;
  });

  // Overdue tasks from previous days rolled over to today
  const overdueTasks = isToday
    ? tasks.filter((t) => {
        const taskMonth = t.monthIndex !== undefined ? t.monthIndex : 8;
        const taskYear = t.year !== undefined ? t.year : 2026;
        const taskDateVal = taskYear * 10000 + (taskMonth + 1) * 100 + t.day;
        return taskDateVal < todayDateVal && !t.isCompleted;
      })
    : [];

  const allVisibleTasks = isToday
    ? [
        ...overdueTasks.map((t) => ({ ...t, originalDay: t.day, originalMonthIndex: t.monthIndex })),
        ...currentDayTasks,
      ]
    : currentDayTasks;

  const filteredTasks = allVisibleTasks.filter((item) => {
    if (activeFilter === "All") return true;
    return item.category === activeFilter;
  });

  const pendingCount = allVisibleTasks.filter((t) => !t.isCompleted).length;
  const completedCount = allVisibleTasks.filter((t) => t.isCompleted).length;

  return (
    <div className={styles.scheduleBox}>
      <div className={styles.headerRow}>
        <div className={styles.dateTitleArea}>
          <div className={styles.calendarIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h2 className={styles.dateHeading}>
              {monthName} {selectedDay}, {selectedYear} Schedule
            </h2>
            {isToday && (
              <span style={{ fontSize: "12px", color: "#10B981", fontWeight: "600" }}>
                ● Today&apos;s Active Planner
              </span>
            )}
            {isPast && (
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "500" }}>
                Historical Session Record
              </span>
            )}
            {!isToday && !isPast && isWithinRollingWindow && (
              <span style={{ fontSize: "12px", color: "#2563EB", fontWeight: "600" }}>
                Active 1-Month Schedule Window
              </span>
            )}
            {isBeyondRollingWindow && (
              <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600" }}>
                Upcoming Schedule Window
              </span>
            )}
          </div>
        </div>

        <div className={styles.actionsArea}>
          <button type="button" className={styles.addTaskBtn} onClick={onAddTask}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {/* Filter Chips - show if within rolling window or tasks exist */}
      {(isWithinRollingWindow || filteredTasks.length > 0) && (
        <div className={styles.filterRow}>
          {["All", "QA", "DILR", "VARC", "Mock"].map((filter) => (
            <button
              key={filter}
              type="button"
              className={`${styles.filterChip} ${activeFilter === filter ? styles.filterChipActive : ""}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === "All" ? "All Tasks" : filter}
            </button>
          ))}
        </div>
      )}

      {/* AI Assistant Insight */}
      <div className={styles.aiNotice}>
        <div className={styles.aiIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <div className={styles.aiContent}>
          <p className={styles.aiTag}>AI Automated Study Tracker</p>
          <p className={styles.aiText}>
            {isBeyondRollingWindow ? (
              <>
                Schedules for <strong>{monthName} {selectedDay}, {selectedYear}</strong> unlock day-by-day on a rolling 1-month window as you progress through your enrolled CAT topics.
              </>
            ) : isToday && overdueTasks.length > 0 ? (
              <>
                <strong>{overdueTasks.length} pending task(s)</strong> from earlier dates were automatically rolled over to today to ensure 100% syllabus coverage.
              </>
            ) : isPast ? (
              <>
                Reviewing past study activity for {monthName} {selectedDay}. Completed drills contribute to your weekly benchmark analytics.
              </>
            ) : pendingCount === 0 && completedCount > 0 ? (
              <>
                🎉 Outstanding work! All tasks for {monthName} {selectedDay} are completed.
              </>
            ) : (
              <>
                You have <strong>{pendingCount} task(s) planned</strong> for {monthName} {selectedDay}. Focus on Quantitative drills first for maximum retention.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Timeline Task Cards or Contextual State */}
      <div className={styles.timelineList} style={{ flex: 1 }}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`${styles.taskCard} ${styles[`taskCard${task.category}`]} ${task.isCompleted ? styles.taskCardCompleted : ""}`}
            >
              <div className={styles.leftDetails}>
                <div className={styles.timeCol}>
                  <span className={styles.timeVal}>{task.timeRange}</span>
                  <span className={styles.timeDuration}>{task.duration}</span>
                </div>

                <div className={styles.infoCol}>
                  <div className={styles.pillRow}>
                    <span className={`${styles.categoryPill} ${styles[`pill${task.category}`]}`}>
                      {task.category}
                    </span>
                    <span className={styles.codeBadge}>{task.code}</span>
                    {task.originalDay && (
                      <span className={styles.rescheduledBadge}>
                        ⚠️ Rolled Over from {months[task.monthIndex ?? 8]?.slice(0, 3)} {task.originalDay}
                      </span>
                    )}
                  </div>
                  <h3
                    className={styles.taskTitle}
                    style={{
                      textDecoration: task.isCompleted ? "line-through" : "none",
                      color: task.isCompleted ? "#64748B" : "#0F172A",
                    }}
                  >
                    {task.title}
                  </h3>
                  <p className={styles.taskSubtitle}>{task.subtitle}</p>
                </div>
              </div>

              <button
                type="button"
                className={`${styles.checkboxBtn} ${task.isCompleted ? styles.checkboxBtnActive : ""} ${!isToday ? styles.checkboxBtnLocked : ""}`}
                onClick={() => {
                  if (isToday) {
                    onToggleTask(task.id);
                  }
                }}
                disabled={!isToday}
                title={
                  !isToday
                    ? isPast
                      ? "Historical archive: Completed sessions cannot be modified."
                      : `Locked: Tasks for ${monthName} ${selectedDay} will unlock on that date.`
                    : task.isCompleted
                    ? "Mark as incomplete"
                    : "Mark as complete"
                }
                aria-label={
                  !isToday
                    ? "Task locked"
                    : task.isCompleted
                    ? "Mark incomplete"
                    : "Mark complete"
                }
              >
                {task.isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : !isToday ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : null}
              </button>
            </div>
          ))
        ) : isPast ? (
          /* Past Day - DO NOT SHOW AUTO-ASSIGN */
          <div className={styles.emptyTasks} style={{ padding: "40px 20px" }}>
            <div style={{ marginBottom: "8px", color: "#94A3B8" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h4 style={{ fontSize: "15px", color: "#475569", margin: "0 0 4px 0", fontWeight: "600" }}>
              Past Study Archive ({monthName} {selectedDay}, {selectedYear})
            </h4>
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
              This date has passed. Unfinished tasks from earlier dates are automatically rolled over to today&apos;s active study plan.
            </p>
          </div>
        ) : isBeyondRollingWindow ? (
          /* Beyond 1-Month Rolling Window - Upcoming Task Scheduler */
          <div className={styles.autoPlanBox}>
            <div style={{ padding: "10px", background: "#EFF6FF", borderRadius: "50%", color: "#2563EB", marginBottom: "4px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className={styles.autoPlanTitle}>Upcoming Task Scheduler</h3>
            <p className={styles.autoPlanDesc}>
              Dynamic study tasks are assigned for a 1-month rolling window (currently scheduled through October 10). As each day passes from today to tomorrow, tasks for <strong>{monthName} {selectedDay}</strong> will be automatically scheduled one-by-one based on your enrolled syllabus.
            </p>
            <button
              type="button"
              className={styles.autoPlanBtn}
              onClick={onAddTask}
            >
              + Add Custom Target for {monthName} {selectedDay}
            </button>
          </div>
        ) : isWithinRollingWindow ? (
          activeFilter !== "All" && allVisibleTasks.length > 0 ? (
            <div className={styles.emptyTasks}>
              No tasks found under category &ldquo;{activeFilter}&rdquo; for {monthName} {selectedDay}.
            </div>
          ) : (
            <div className={styles.autoPlanBox}>
              <h3 className={styles.autoPlanTitle}>No Tasks Scheduled for {monthName} {selectedDay}</h3>
              <p className={styles.autoPlanDesc}>
                Our AI curriculum scheduler can automatically assign the next recommended lectures and practice drills from your enrolled CAT topics to this date.
              </p>
              <button
                type="button"
                className={styles.autoPlanBtn}
                onClick={() => onAutoAssignDay(selectedDay)}
              >
                ✨ Auto-Assign Enrolled Topics to {monthName.slice(0, 3)} {selectedDay}
              </button>
            </div>
          )
        ) : (
          <div className={styles.emptyTasks}>
            No tasks found for this date.
          </div>
        )}
      </div>
    </div>
  );
}
