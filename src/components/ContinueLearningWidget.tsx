"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudentMetrics, TopicProgressMetrics } from "@/lib/metrics/types";
import { getTopicById, type Lesson, type Topic } from "@/data/topicsData";
import styles from "./ContinueLearningWidget.module.css";

// Continue Learning: real enrolled topics (metrics.courses.topics) + real lesson titles from
// topicsData. "Up next" = first lesson of the topic that is not in the student's completed
// lessons (GET /api/topics/progress → progress[].completed_lessons).

interface ContinueLearningProps {
  metrics: StudentMetrics | null;
  isLoading?: boolean;
}

interface ProgressRow {
  topic_id: string;
  completed_lessons?: string[] | null;
}

/** All lessons of a topic in course order (modules first, then any loose lessons). */
function orderedLessons(topic: Topic): Lesson[] {
  const seen = new Set<string>();
  const out: Lesson[] = [];
  for (const m of topic.modules || []) {
    for (const l of m.lessons || []) {
      if (!seen.has(l.id)) {
        seen.add(l.id);
        out.push(l.moduleTitle ? l : { ...l, moduleTitle: m.title });
      }
    }
  }
  for (const l of topic.lessons || []) {
    if (!seen.has(l.id)) {
      seen.add(l.id);
      out.push(l);
    }
  }
  return out;
}

function formatStudy(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** The topic to resume: unfinished topic with the most recorded study time, else the first unfinished. */
function pickActiveTopic(topics: TopicProgressMetrics[]): TopicProgressMetrics | null {
  const unfinished = topics.filter((t) => t.progressPercent < 100);
  const pool = unfinished.length > 0 ? unfinished : topics;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => b.studySeconds - a.studySeconds || b.progressPercent - a.progressPercent)[0];
}

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default function ContinueLearningWidget({ metrics, isLoading = false }: ContinueLearningProps) {
  const router = useRouter();
  const [progressRows, setProgressRows] = useState<ProgressRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/topics/progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setProgressRows(Array.isArray(data?.progress) ? data.progress : []);
      })
      .catch(() => {
        if (!cancelled) setProgressRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const topics = metrics?.courses.topics ?? [];
  const active = pickActiveTopic(topics);
  const topic = active ? getTopicById(active.topicId) : undefined;
  const otherTopics = topics.filter((t) => t.topicId !== active?.topicId);

  const upNext = useMemo(() => {
    if (!active || !topic) return null;
    const lessons = orderedLessons(topic);
    const row = progressRows?.find((r) => r.topic_id === active.topicId);
    const done = new Set((row?.completed_lessons || []).filter((id) => lessons.some((l) => l.id === id)));
    // Use the recorded completed-lesson list when it agrees with the metrics count; otherwise
    // fall back to course order (lesson N+1 after N completed lessons).
    if (row && done.size === active.lessonsCompleted) {
      return lessons.find((l) => !done.has(l.id)) ?? null;
    }
    return lessons[active.lessonsCompleted] ?? null;
  }, [active, topic, progressRows]);

  if (isLoading || (!metrics && progressRows === null)) {
    return (
      <div className={styles.widgetBox}>
        <div className={styles.widgetHeader}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>Continue Learning</h2>
          </div>
        </div>
        <p className={styles.courseMeta}>Loading your courses…</p>
      </div>
    );
  }

  if (active) {
    const percent = Math.min(100, Math.max(0, Math.round(active.progressPercent)));
    const started = active.lessonsCompleted > 0 || active.studySeconds > 0;
    const finished = percent >= 100 || (active.totalLessons > 0 && active.lessonsCompleted >= active.totalLessons);
    const url = `/topics/${active.topicId}`;
    const metaParts = [`${active.lessonsCompleted} of ${active.totalLessons} lessons completed`];
    if (active.studySeconds > 0) metaParts.push(`${formatStudy(active.studySeconds)} studied`);

    return (
      <div className={styles.widgetBox}>
        <div className={styles.widgetHeader}>
          <div className={styles.titleArea}>
            <div className={styles.titleIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <h2 className={styles.title}>
              {started ? "Continue Where You Left Off" : "Start Your Enrolled Course"}
            </h2>
          </div>
          <span className={styles.activeBadge}>
            {finished ? "Completed" : started ? "In Progress" : "Enrolled"}
          </span>
        </div>

        <div className={styles.courseCard}>
          <div className={styles.leftSection}>
            {topic?.bannerImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={topic.bannerImage} alt={topic.shortTitle} className={styles.courseThumbnail} />
            )}
            <div className={styles.courseInfo}>
              <p className={styles.courseCategory}>
                {topic ? `${topic.category} • ${topic.codePrefix}` : active.section ?? "Course"}
              </p>
              <h3 className={styles.courseTitle}>{topic?.shortTitle ?? active.title}</h3>
              <p className={styles.courseMeta}>{metaParts.join(" • ")}</p>
              <div className={styles.progressContainer}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.progressText}>{percent}%</span>
              </div>
              {otherTopics.length > 0 && (
                <p className={styles.otherTopics}>
                  Also enrolled:{" "}
                  {otherTopics.map((t, i) => (
                    <React.Fragment key={t.topicId}>
                      {i > 0 && ", "}
                      <button type="button" className={styles.otherTopicLink} onClick={() => router.push(`/topics/${t.topicId}`)}>
                        {getTopicById(t.topicId)?.shortTitle ?? t.title} ({Math.round(t.progressPercent)}%)
                      </button>
                    </React.Fragment>
                  ))}
                </p>
              )}
            </div>
          </div>

          <div className={styles.rightSection}>
            <div className={styles.nextUpBox}>
              <span className={styles.nextUpLabel}>{finished ? "All lessons done" : "Up Next"}</span>
              <span className={styles.nextUpTitle}>
                {finished
                  ? "Take the Grand Quiz for this topic"
                  : upNext
                    ? `${upNext.code ? `${upNext.code} ` : ""}${upNext.title}${upNext.duration ? ` (${upNext.duration})` : ""}`
                    : progressRows === null
                      ? "Loading…"
                      : "Open the course to pick your next lesson"}
              </span>
            </div>
            <button className={styles.resumeBtn} onClick={() => router.push(url)}>
              <span>{finished ? "Open Course" : started ? "Resume Course" : "Start Course"}</span>
              <ArrowIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No enrolled topics yet (or metrics unavailable): onboarding state
  return (
    <div className={styles.widgetBox}>
      <div className={styles.widgetHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="12 8 8 12 12 16 16 12 12 8" />
            </svg>
          </div>
          <h2 className={styles.title}>{metrics ? "Start Your CAT Preparation" : "Continue Learning"}</h2>
        </div>
        {metrics && <span className={styles.starterBadge}>Ready to Begin</span>}
      </div>

      <div className={styles.courseCard}>
        <div className={styles.leftSection}>
          <div className={styles.courseInfo}>
            <p className={styles.courseCategory}>CAT Syllabus: QA, DILR &amp; VARC</p>
            <h3 className={styles.courseTitle}>
              {metrics ? "You haven't enrolled in any CAT topic yet" : "Your courses could not be loaded right now"}
            </h3>
            <p className={styles.courseMeta}>
              {metrics
                ? "Enroll in Quantitative Ability, DILR or VARC to start tracking lessons and progress here."
                : "Refresh the page to try again, or open My Topics."}
            </p>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.nextUpBox}>
            <span className={styles.nextUpLabel}>Step 1</span>
            <span className={styles.nextUpTitle}>{metrics ? "Explore Courses & Modules" : "Open My Topics"}</span>
          </div>
          <button className={styles.resumeBtn} onClick={() => router.push(metrics ? "/browse" : "/topics")}>
            <span>{metrics ? "Browse Courses" : "My Topics"}</span>
            <ArrowIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
