"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import AppNav from "@/components/app/AppNav";
import { Reveal, RevealGroup, RevealItem, GradientText } from "@/components/landing/motion";
import { TOPICS_DATA } from "@/data/topicsData";
import { useAuth } from "@/context/AuthContext";
import { DEMO_ENROLLED_TOPIC_IDS } from "@/lib/demo";
import styles from "./topics.module.css";

type SectionKey = "qa" | "dilr" | "varc" | "other";

/** Visual grouping only (marker colour). */
function sectionOf(t: { id: string; category: string }): SectionKey {
  const id = t.id.toLowerCase();
  const cat = t.category.toLowerCase();
  if (id.startsWith("qa-") || cat.includes("quant")) return "qa";
  if (id.startsWith("dilr-") || cat.includes("data") || cat.includes("dilr")) return "dilr";
  if (id.startsWith("varc-") || cat.includes("verbal") || cat.includes("varc")) return "varc";
  return "other";
}

const categories = [
  "All Topics",
  "Quantitative Aptitude",
  "Data Interpretation",
  "Verbal Ability",
  "Design & Illustration",
];

export default function TopicsListPage() {
  const { user } = useAuth();
  const isDemo = Boolean(user && user.email === "student@technocat.edu");
  const [selectedCategory, setSelectedCategory] = useState("All Topics");
  const [searchQuery, setSearchQuery] = useState("");
  const [userProgressMap, setUserProgressMap] = useState<Record<string, any>>({});
  const [loadingProgress, setLoadingProgress] = useState(!isDemo);

  useEffect(() => {
    if (!isDemo) {
      setLoadingProgress(true);
      fetch("/api/topics/progress")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.progress && Array.isArray(data.progress)) {
            const map: Record<string, any> = {};
            data.progress.forEach((p: any) => {
              map[p.topic_id] = p;
            });
            setUserProgressMap(map);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoadingProgress(false);
        });
    } else {
      setLoadingProgress(false);
    }
  }, [isDemo, user?.id]);

  // For real users, only topics present in userProgressMap are enrolled courses.
  // For the demo user, restrict to the demo-enrolled topics so unenrolled catalog items stay in Browse only.
  const enrolledTopics = useMemo(() => {
    if (isDemo) {
      return TOPICS_DATA.filter((topic: any) =>
        (DEMO_ENROLLED_TOPIC_IDS as readonly string[]).includes(topic.id)
      );
    }
    return TOPICS_DATA.filter((topic: any) => Boolean(userProgressMap[topic.id]));
  }, [isDemo, userProgressMap]);

  const filteredTopics = enrolledTopics.filter((topic: any) => {
    const matchesCategory =
      selectedCategory === "All Topics" || topic.category === selectedCategory;
    const matchesSearch =
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getProgress = (topic: any) => {
    const userProgress = userProgressMap[topic.id];
    const rawPercent = isDemo ? topic.progressPercent : userProgress ? userProgress.progress_percent : 0;
    const completedLessons = isDemo
      ? topic.completedLessonsCount
      : userProgress?.completed_lessons?.length || 0;
    const progressPercent = Math.max(0, Math.min(100, Math.round(Number(rawPercent) || 0)));
    return { progressPercent, completedLessons: Math.max(0, completedLessons || 0) };
  };

  const summary = enrolledTopics.reduce(
    (acc: { lessons: number; done: number }, t: any) => {
      acc.lessons += t.totalLessons || 0;
      acc.done += getProgress(t).completedLessons;
      return acc;
    },
    { lessons: 0, done: 0 }
  );

  return (
    <div className={styles.topicsWrapper}>
      <AppNav />

      {/* ===== PAGE HEADER ===== */}
      <section className={styles.pageHeader}>
        <div className={styles.container}>
          <Reveal className={styles.headerContent}>
            <div className={styles.headerCopy}>
              <span className={styles.kicker}>
                <span className={styles.kickerLine} aria-hidden="true" />
                Your learning
              </span>
              <h1 className={styles.pageTitle}>
                My <GradientText>topics</GradientText>
              </h1>
              <p className={styles.pageSubtitle}>
                Your enrolled courses, where you left off, and how far you have come.
              </p>
            </div>

            <div className={styles.headerAside}>
              <dl className={styles.summaryStats}>
                <div>
                  <dt>Enrolled</dt>
                  <dd>{enrolledTopics.length}</dd>
                </div>
                <div>
                  <dt>Lessons done</dt>
                  <dd>
                    {summary.done}
                    <span>/{summary.lessons}</span>
                  </dd>
                </div>
              </dl>
              <Link href="/browse" className={styles.primaryBtn}>
                Browse courses
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

          <div className={styles.toolbar}>
            <div className={styles.categoryTabs} role="tablist" aria-label="Filter by category">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`${styles.categoryTab} ${selectedCategory === cat ? styles.categoryTabActive : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <label className={styles.searchBox}>
              <Search className={styles.searchIcon} size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search your courses"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Search your courses"
              />
            </label>
          </div>
        </div>
      </section>

      {/* ===== ENROLLED COURSE ROWS ===== */}
      <main className={`${styles.mainContent} ${styles.container}`}>
        {!isDemo && !loadingProgress && enrolledTopics.length === 0 ? (
          <Reveal className={`glass-card ${styles.emptyEnrollmentCard}`} data-tint="blue">
            <span className={styles.emptyIcon} aria-hidden="true">
              <BookOpen size={20} />
            </span>
            <h2 className={styles.emptyEnrollmentTitle}>You haven&apos;t enrolled in a course yet</h2>
            <p className={styles.emptyEnrollmentDesc}>
              Pick a course from the library across Quantitative Aptitude, DILR and VARC. Once you enroll, it shows up
              here with your progress and a one-click resume.
            </p>
            <Link href="/browse" className={styles.primaryBtn}>
              <span>Browse and enroll</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Reveal>
        ) : filteredTopics.length === 0 ? (
          <div className={styles.noResults}>
            {loadingProgress ? "Loading your courses..." : "No enrolled courses match your filter or search."}
          </div>
        ) : (
          <RevealGroup className={styles.rowList}>
            {filteredTopics.map((topic: any) => {
              const { progressPercent, completedLessons } = getProgress(topic);
              const section = sectionOf(topic);
              const started = progressPercent > 0;

              return (
                <RevealItem key={topic.id}>
                  <Link href={`/topics/${topic.id}`} className={styles.topicRow} data-section={section}>
                    {/* Thumbnail */}
                    <div className={styles.rowThumb} style={{ background: topic.bannerGradient || "#1F2937" }}>
                      {topic.bannerImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={topic.bannerImage} alt={topic.title} className={styles.cardImage} />
                      )}
                    </div>

                    {/* Title + meta */}
                    <div className={styles.rowMain}>
                      <span className={styles.categoryBadge}>
                        <span className={styles.badgeDot} aria-hidden="true" />
                        {topic.category}
                      </span>
                      <h2 className={styles.cardTitle}>{topic.title}</h2>
                      <div className={styles.instructorRow}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={topic.instructor.avatar} alt={topic.instructor.name} className={styles.instructorAvatar} />
                        <span className={styles.instructorName}>{topic.instructor.name}</span>
                        <span className={styles.instructorRole}>{topic.instructor.role}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className={styles.rowProgress}>
                      <div className={styles.progressHeader}>
                        <span className={styles.progressLabel}>
                          <b>{completedLessons}</b>/{topic.totalLessons} lessons
                        </span>
                        <span className={styles.progressPercent}>{progressPercent}%</span>
                      </div>
                      <div className={styles.progressBarBg}>
                        <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>

                    {/* Resume */}
                    <span className={styles.cardActionBtn}>
                      <span>{started ? "Resume" : "Start"}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </Link>
                </RevealItem>
              );
            })}
          </RevealGroup>
        )}
      </main>
    </div>
  );
}
