"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  originalMonthIndex?: number;
  isOverdue?: boolean;
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

  // 1. Current day's regular curriculum topics
  const currentDayTasks = useMemo(() => {
    return tasks.filter((t) => {
      const taskMonth = t.monthIndex !== undefined ? t.monthIndex : 8;
      const taskYear = t.year !== undefined ? t.year : 2026;
      return taskMonth === selectedMonthIndex && taskYear === selectedYear && t.day === selectedDay;
    });
  }, [tasks, selectedMonthIndex, selectedYear, selectedDay]);

  // 2. All pending (uncompleted) overdue tasks from earlier dates
  const pendingPastTasks = useMemo(() => {
    if (!isToday) return [];
    return tasks
      .filter((t) => {
        const taskMonth = t.monthIndex !== undefined ? t.monthIndex : 8;
        const taskYear = t.year !== undefined ? t.year : 2026;
        const taskDateVal = taskYear * 10000 + (taskMonth + 1) * 100 + t.day;
        return taskDateVal < todayDateVal && !t.isCompleted;
      })
      .sort((a, b) => {
        const dateA = (a.year ?? 2026) * 10000 + ((a.monthIndex ?? 8) + 1) * 100 + a.day;
        const dateB = (b.year ?? 2026) * 10000 + ((b.monthIndex ?? 8) + 1) * 100 + b.day;
        return dateA - dateB;
      });
  }, [tasks, isToday, todayDateVal]);

  // Total overdue count (actual pending overdue tasks + any overdue completed in this session)
  const [completedOverdueIds, setCompletedOverdueIds] = useState<string[]>([]);
  const totalOverdueCount = pendingPastTasks.length + completedOverdueIds.length;

  // 3. Student-configurable overdue quota for today
  const [overdueQuota, setOverdueQuota] = useState<number>(2);
  const [isBacklogExpanded, setIsBacklogExpanded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("technocat_overdue_quota");
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          setOverdueQuota(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSetOverdueQuota = (val: number) => {
    const clamped = Math.max(0, Math.min(val, totalOverdueCount));
    setOverdueQuota(clamped);
    try {
      localStorage.setItem("technocat_overdue_quota", clamped.toString());
    } catch (e) {
      // ignore
    }
  };

  // Assigned overdue tasks for today based on student's quota
  const assignedOverdueTasks = useMemo(() => {
    if (!isToday) return [];

    // All past tasks that were completed in this session
    const completedPast = tasks.filter(
      (t) => completedOverdueIds.includes(t.id) && t.isCompleted
    );

    // Uncompleted past tasks up to quota
    const slotsForUncompleted = Math.max(0, overdueQuota - completedPast.length);
    const selectedUncompleted = pendingPastTasks.slice(0, slotsForUncompleted);

    return [...completedPast, ...selectedUncompleted].map((t) => ({
      ...t,
      originalDay: t.day,
      originalMonthIndex: t.monthIndex,
      isOverdue: true,
    }));
  }, [isToday, tasks, completedOverdueIds, pendingPastTasks, overdueQuota]);

  // Remaining overdue backlog
  const remainingBacklogTasks = useMemo(() => {
    if (!isToday) return [];
    const assignedIds = new Set(assignedOverdueTasks.map((t) => t.id));
    return pendingPastTasks.filter((t) => !assignedIds.has(t.id));
  }, [isToday, pendingPastTasks, assignedOverdueTasks]);

  // Today's regular new topics
  const todayNewTopics = useMemo(() => {
    return currentDayTasks.map((t) => ({ ...t, isOverdue: false }));
  }, [currentDayTasks]);

  // Helper to maintain conflict-free, strictly chronological study slots
  const getChronologicalTimeSlot = (index: number, total: number): string => {
    if (total === 1) return "10:00 AM";
    if (total === 2) {
      return index === 0 ? "10:00 AM" : "03:00 PM";
    }
    if (total === 3) {
      const slots = ["09:30 AM", "01:30 PM", "04:30 PM"];
      return slots[index] || "06:00 PM";
    }
    if (total === 4) {
      const slots = ["09:00 AM", "11:30 AM", "02:30 PM", "05:00 PM"];
      return slots[index] || "06:30 PM";
    }
    if (total === 5) {
      const slots = ["09:00 AM", "11:00 AM", "01:30 PM", "03:45 PM", "05:30 PM"];
      return slots[index] || "07:00 PM";
    }
    // 6 or more tasks
    const slots = [
      "09:00 AM",
      "10:45 AM",
      "12:30 PM",
      "02:30 PM",
      "04:15 PM",
      "06:00 PM",
      "07:30 PM",
      "09:00 PM",
      "10:15 PM"
    ];
    return slots[index] || "09:30 PM";
  };

  // Assign conflict-free ascending chronological times across both Overdue and Today topics
  const { scheduledOverdueTasks, scheduledTodayTopics } = useMemo(() => {
    if (!isToday) {
      return { scheduledOverdueTasks: assignedOverdueTasks, scheduledTodayTopics: todayNewTopics };
    }
    const total = assignedOverdueTasks.length + todayNewTopics.length;

    const overdueWithTimes = assignedOverdueTasks.map((t, idx) => ({
      ...t,
      timeRange: getChronologicalTimeSlot(idx, total),
    }));

    const todayWithTimes = todayNewTopics.map((t, idx) => ({
      ...t,
      timeRange: getChronologicalTimeSlot(assignedOverdueTasks.length + idx, total),
    }));

    return {
      scheduledOverdueTasks: overdueWithTimes,
      scheduledTodayTopics: todayWithTimes,
    };
  }, [isToday, assignedOverdueTasks, todayNewTopics]);

  // Combined active visible tasks (1st assigned overdue, NEXT today's new topics)
  const allVisibleTasks = useMemo(() => {
    if (isToday) {
      return [...scheduledOverdueTasks, ...scheduledTodayTopics];
    }
    return currentDayTasks;
  }, [isToday, scheduledOverdueTasks, scheduledTodayTopics, currentDayTasks]);

  // Handle task check/uncheck
  const handleTaskToggle = (id: string) => {
    if (!isToday) return;
    const isOverdue = assignedOverdueTasks.some((t) => t.id === id);
    if (isOverdue) {
      setCompletedOverdueIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
    onToggleTask(id);
  };

  // Filtered by category
  const filteredOverdueTasks = useMemo(() => {
    if (activeFilter === "All") return scheduledOverdueTasks;
    return scheduledOverdueTasks.filter((t) => t.category === activeFilter);
  }, [scheduledOverdueTasks, activeFilter]);

  const filteredTodayTopics = useMemo(() => {
    if (activeFilter === "All") return scheduledTodayTopics;
    return scheduledTodayTopics.filter((t) => t.category === activeFilter);
  }, [scheduledTodayTopics, activeFilter]);

  const filteredTasks = useMemo(() => {
    if (isToday) {
      return [...filteredOverdueTasks, ...filteredTodayTopics];
    }
    if (activeFilter === "All") return currentDayTasks;
    return currentDayTasks.filter((t) => t.category === activeFilter);
  }, [isToday, filteredOverdueTasks, filteredTodayTopics, currentDayTasks, activeFilter]);

  const pendingCount = allVisibleTasks.filter((t) => !t.isCompleted).length;
  const completedCount = allVisibleTasks.filter((t) => t.isCompleted).length;

  const renderTaskCard = (task: ScheduleItem) => (
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
            {task.isOverdue && task.originalDay && (
              <span className={styles.rescheduledBadge}>
                ⚠️ Rolled Over from {months[task.originalMonthIndex ?? task.monthIndex ?? 8]?.slice(0, 3)} {task.originalDay}
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
        onClick={() => handleTaskToggle(task.id)}
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
  );

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
              <span style={{ fontSize: "12px", color: "#0D9488", fontWeight: "600" }}>
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

      {/* Filter Chips */}
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

      {/* INTELLIGENT BACKLOG SCHEDULER PANEL (When Viewing Today & Overdue Backlog Exists) */}
      {isToday && totalOverdueCount > 0 ? (
        <div className={styles.schedulerCard}>
          <div className={styles.schedulerTop}>
            <div className={styles.schedulerHeaderLeft}>
              <div className={styles.schedulerIconBox}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <div>
                <h3 className={styles.schedulerTitle}>
                  TechnoCAT Intelligent Scheduler
                  <span className={styles.schedulerBadge}>
                    ⚠️ {totalOverdueCount} Overdue Detected
                  </span>
                </h3>
                <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                  Cognitive load balancer: Backlog is intelligently paced alongside today&apos;s new topics.
                </p>
              </div>
            </div>

            <div className={styles.schedulerLoadBadge}>
              📋 Today&apos;s Load: <strong>{assignedOverdueTasks.length} Overdue</strong> + <strong>{todayNewTopics.length} New Topics</strong> ({assignedOverdueTasks.length + todayNewTopics.length} Total)
            </div>
          </div>

          <p className={styles.schedulerDesc}>
            It is impossible to finish a heavy backlog in one day. Set how many overdue tasks you want to tackle today:
            <strong> 1st your assigned overdue tasks will be cleared, next today&apos;s new topic(s) will be assigned.</strong>
          </p>

          <div className={styles.schedulerControlsRow}>
            <div className={styles.stepperWrap}>
              <span className={styles.stepperLabel}>Assign Overdue Tasks for Today:</span>
              <div className={styles.stepperBox}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  onClick={() => handleSetOverdueQuota(overdueQuota - 1)}
                  disabled={overdueQuota <= 0}
                  title="Decrease overdue tasks for today"
                >
                  –
                </button>
                <span className={styles.stepperValue}>{overdueQuota}</span>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  onClick={() => handleSetOverdueQuota(overdueQuota + 1)}
                  disabled={overdueQuota >= totalOverdueCount}
                  title="Increase overdue tasks for today"
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.presetChips}>
              {[
                { label: "0 (Only Today)", val: 0 },
                { label: "1 Task", val: 1 },
                { label: "2 Tasks (Recommended)", val: 2 },
                { label: "3 Tasks", val: 3 },
                { label: `All (${totalOverdueCount})`, val: totalOverdueCount },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  className={`${styles.presetChip} ${overdueQuota === preset.val ? styles.presetChipActive : ""}`}
                  onClick={() => handleSetOverdueQuota(preset.val)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Regular AI Assistant Insight for other states */
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
      )}

      {/* Timeline Task Cards or Contextual State */}
      <div className={styles.timelineList} style={{ flex: 1 }}>
        {isToday && totalOverdueCount > 0 ? (
          <>
            {/* 1. ASSIGNED OVERDUE SECTION (1st PRIORITY) */}
            {filteredOverdueTasks.length > 0 && (
              <div className={styles.sectionDivider}>
                <div className={styles.sectionDividerLeft}>
                  <span className={styles.sectionBadgeOverdue}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    1st Priority • Overdue Recovery
                  </span>
                  <span className={styles.sectionSubtitle}>
                    {filteredOverdueTasks.length} assigned task{filteredOverdueTasks.length > 1 ? "s" : ""}
                  </span>
                </div>
                <span className={styles.sectionHint}>Clear high-priority backlog first to build momentum</span>
              </div>
            )}

            {/* Overdue task cards */}
            {filteredOverdueTasks.map((task) => renderTaskCard(task))}

            {/* 2. TODAY'S NEW TOPICS SECTION (NEXT) */}
            {filteredTodayTopics.length > 0 && (
              <div className={styles.sectionDivider} style={{ marginTop: filteredOverdueTasks.length > 0 ? "18px" : "4px" }}>
                <div className={styles.sectionDividerLeft}>
                  <span className={styles.sectionBadgeToday}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Next • Today&apos;s Scheduled Topics
                  </span>
                  <span className={styles.sectionSubtitle}>
                    {filteredTodayTopics.length} new curriculum topic{filteredTodayTopics.length > 1 ? "s" : ""}
                  </span>
                </div>
                <span className={styles.sectionHint}>Scheduled syllabus progression</span>
              </div>
            )}

            {/* Today's new topic cards */}
            {filteredTodayTopics.map((task) => renderTaskCard(task))}

            {/* If both filters hide everything */}
            {filteredOverdueTasks.length === 0 && filteredTodayTopics.length === 0 && (
              <div className={styles.emptyTasks}>
                No tasks found under category &ldquo;{activeFilter}&rdquo; for today.
              </div>
            )}

            {/* 3. SMART BACKLOG DRAWER */}
            {remainingBacklogTasks.length > 0 && (
              <div className={styles.backlogDrawer}>
                <div className={styles.backlogDrawerHeader}>
                  <div>
                    <div className={styles.backlogDrawerTitle}>
                      <span>📦</span>
                      <span>Queued Backlog: <strong>{remainingBacklogTasks.length} pending tasks</strong></span>
                    </div>
                    <p className={styles.backlogDrawerDesc}>
                      Safely queued for upcoming study sessions so you don&apos;t feel overwhelmed. 100% syllabus coverage guaranteed.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.backlogToggleBtn}
                    onClick={() => setIsBacklogExpanded(!isBacklogExpanded)}
                  >
                    {isBacklogExpanded ? "Hide Queued Backlog ▲" : `View Queued Backlog (${remainingBacklogTasks.length}) ▼`}
                  </button>
                </div>

                {isBacklogExpanded && (
                  <div className={styles.backlogList}>
                    {remainingBacklogTasks.map((t) => (
                      <div key={t.id} className={styles.backlogItem}>
                        <div className={styles.backlogItemLeft}>
                          <span className={`${styles.categoryPill} ${styles[`pill${t.category}`]}`}>
                            {t.category}
                          </span>
                          <div>
                            <div className={styles.backlogItemTitle}>{t.title}</div>
                            <div className={styles.backlogItemMeta}>
                              {t.code} • {t.duration} • Rolled over from {months[t.monthIndex ?? 8]?.slice(0, 3)} {t.day}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.pullTaskBtn}
                          onClick={() => {
                            handleSetOverdueQuota(overdueQuota + 1);
                          }}
                          title="Assign this task to today"
                        >
                          + Assign to Today
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => renderTaskCard(task))
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
