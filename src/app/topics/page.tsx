"use client";

import React, { useState } from "react";
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
  const [activeNav, setActiveNav] = useState("My Topics");
  const [selectedCategory, setSelectedCategory] = useState("All Topics");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = TOPICS_DATA.filter((topic) => {
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
              <span className={styles.logoTechno}>Techno</span><span className={styles.logoCAT}>CAT</span>
            </Link>

            {/* Nav Menu */}
            <div className={styles.navLinks}>
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Browse", href: "/browse", hasDropdown: true },
                { name: "My Topics", href: "/topics" },
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
                  {item.hasDropdown && (
                    <svg
                      className={styles.dropdownChevron}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
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
        <div className={styles.topicsGrid}>
          {filteredTopics.map((topic) => (
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
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span className={styles.progressLabel}>
                      {topic.completedLessonsCount}/{topic.totalLessons} Lessons
                    </span>
                    <span className={styles.progressPercent}>{topic.progressPercent}%</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${topic.progressPercent}%` }}
                    />
                  </div>

                  <div className={styles.cardActionBtn}>
                    <span>Continue Learning</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
