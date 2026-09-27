"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import { TOPICS_DATA } from "@/data/topicsData";
import { useAuth } from "@/context/AuthContext";
import styles from "./topics.module.css";

const categories = [
  "All Topics",
  "Quantitative Aptitude",
  "Data Interpretation",
  "Verbal Ability",
  "Design & Illustration",
];

export default function TopicsListPage() {
  const { user, logout } = useAuth();
  const isDemo = Boolean(user && user.email === "student@technocat.edu");
  const [activeNav, setActiveNav] = useState("My Topics");
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

  // For real users, only topics present in userProgressMap are enrolled courses!
  const enrolledTopics = useMemo(() => {
    if (isDemo) {
      return TOPICS_DATA;
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

  return (
    <div className={styles.topicsWrapper}>
      {/* ===== DARK UPPER HEADER ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          {/* Top Navigation Bar */}
          <nav className={styles.topNav} aria-label="Topics Navigation">
            {/* Brand Logo */}
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            {/* Nav Menu */}
            <div className={styles.navLinks}>
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Browse", href: "/browse" },
                { name: "My Topics", href: "/topics" },
                { name: "Intelligence Hub", href: "/intelligence" },
                { name: "Mock Viva Prep", href: "#" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href === "#") e.preventDefault();
                    setActiveNav(item.name);
                  }}
                  className={`${styles.navLink} ${
                    activeNav === item.name ? styles.navLinkActive : ""
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Utilities & Profile */}
            <PostLoginNavActions />
          </nav>

          {/* Header Title and Search Bar */}
          <div className={styles.headerContent}>
            <div>
              <div className={styles.pillBadge}>★ Comprehensive CAT Curriculum</div>
              <h1 className={styles.pageTitle}>
                My <span className={styles.headingHighlight}>Topics</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Explore your enrolled learning topics, watch video modules, and track your milestone progress.
              </p>
            </div>

            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Try search topic or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className={styles.categoryTabs}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.categoryTab} ${
                  selectedCategory === cat ? styles.categoryTabActive : ""
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ===== MAIN TOPICS GRID SECTION ===== */}
      <main className={styles.mainContent} style={{ paddingTop: "36px", paddingBottom: "80px" }}>
        {!isDemo && !loadingProgress && enrolledTopics.length === 0 ? (
          <div className={styles.emptyEnrollmentCard}>
            <div className={styles.emptyEnrollmentIconBox}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <path d="M12 6v6" />
                <path d="M9 9h6" />
              </svg>
            </div>
            <h2 className={styles.emptyEnrollmentTitle}>You haven&apos;t enrolled in any topics yet</h2>
            <p className={styles.emptyEnrollmentDesc}>
              Explore our comprehensive CAT curriculum across Quantitative Aptitude, DILR, and VARC. Enroll in a course from the Browse catalog to start learning and tracking your milestone progress here.
            </p>
            <Link href="/browse" className={styles.emptyEnrollmentBtn}>
              <span>Browse Catalog &amp; Enroll</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748B", fontSize: "15px" }}>
            No enrolled topics found matching your filter or search query.
          </div>
        ) : (
          <div className={styles.topicsGrid}>
            {filteredTopics.map((topic: any) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              className={styles.topicCard}
            >
              {/* Card Banner */}
              <div
                className={styles.cardBanner}
                style={{
                  background: topic.bannerGradient || "#1F2937",
                }}
              >
                {topic.bannerImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={topic.bannerImage}
                    alt={topic.title}
                    className={styles.cardImage}
                  />
                )}
                <span className={styles.categoryBadge}>{topic.category}</span>
              </div>

              {/* Card Body */}
              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>{topic.title}</h2>
                <p className={styles.cardDesc}>{topic.description}</p>

                {/* Instructor Row */}
                <div className={styles.instructorRow}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={topic.instructor.avatar}
                    alt={topic.instructor.name}
                    className={styles.instructorAvatar}
                  />
                  <div>
                    <div className={styles.instructorName}>{topic.instructor.name}</div>
                    <div className={styles.instructorRole}>{topic.instructor.role}</div>
                  </div>
                </div>

                {/* Progress Section */}
                {(() => {
                  const userProgress = userProgressMap[topic.id];
                  const progressPercent = isDemo
                    ? topic.progressPercent
                    : (userProgress ? userProgress.progress_percent : 0);
                  const completedLessons = isDemo
                    ? topic.completedLessonsCount
                    : (userProgress?.completed_lessons?.length || 0);

                  return (
                    <div className={styles.progressSection}>
                      <div className={styles.progressHeader}>
                        <span className={styles.progressLabel}>
                          {completedLessons}/{topic.totalLessons} Lessons
                        </span>
                        <span className={styles.progressPercent}>{progressPercent}%</span>
                      </div>
                      <div className={styles.progressBarBg}>
                        <div
                          className={styles.progressBarFill}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <div className={styles.cardActionBtn}>
                        <span>{progressPercent > 0 ? "Continue Learning" : "Start Topic"}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Link>
          ))}
        </div>
      )}
      </main>
    </div>
  );
}
