"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import { TOPICS_DATA } from "@/data/topicsData";
import { useAuth } from "@/context/AuthContext";
import styles from "./browse.module.css";

// Assuming user is enrolled in these for mock logic
const ENROLLED_TOPIC_IDS = ["qa-quantitative-ability", "dilr-data-interpretation"];

export default function BrowsePage() {
  const [activeNav, setActiveNav] = useState("Browse");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Filter topics based on search
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return TOPICS_DATA;
    const lowerQ = searchQuery.toLowerCase();
    return TOPICS_DATA.filter(t => 
      t.title.toLowerCase().includes(lowerQ) || 
      t.category.toLowerCase().includes(lowerQ) ||
      t.description.toLowerCase().includes(lowerQ)
    );
  }, [searchQuery]);

  return (
    <div className={styles.browseWrapper}>
      {/* ===== HEADER ===== */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav}>
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
                  className={`${styles.navLink} ${activeNav === item.name ? styles.navLinkActive : ""}`}
                >
                  {item.name}
                  {item.hasDropdown && (
                    <svg className={styles.dropdownChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </Link>
              ))}
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* ===== HERO SEARCH ===== */}
      <section className={styles.heroSection}>
        <div className={styles.pillBadge}>★ Explore CAT Syllabus</div>
        <h1 className={styles.heroTitle}>
          What do you want to <span className={styles.headingHighlight}>learn today?</span>
        </h1>
        <p className={styles.heroSubtitle}>Explore the complete CAT curriculum, from Quant to VARC.</p>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search for 'Algebra', 'Reading Comprehension', etc..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <main className={styles.mainContent}>
        {/* Categories (only show if not searching) */}
        {!searchQuery && (
          <>
            <h2 className={styles.sectionTitle}>Browse by Category</h2>
            <div className={styles.categoryGrid}>
              <div className={styles.categoryCard} onClick={() => setSearchQuery("Quantitative")}>
                <div className={styles.catIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div className={styles.catInfo}>
                  <h3>Quantitative Ability</h3>
                  <p>51 Lessons</p>
                </div>
              </div>
              <div className={styles.categoryCard} onClick={() => setSearchQuery("Data")}>
                <div className={styles.catIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div className={styles.catInfo}>
                  <h3>DILR</h3>
                  <p>20 Lessons</p>
                </div>
              </div>
              <div className={styles.categoryCard} onClick={() => setSearchQuery("Verbal")}>
                <div className={styles.catIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </div>
                <div className={styles.catInfo}>
                  <h3>VARC</h3>
                  <p>18 Lessons</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Course Grid */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Topics'}
          </h2>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Categories
            </button>
          )}
        </div>
        
        {filteredTopics.length === 0 ? (
          <div className={styles.noResults}>No topics found matching your search.</div>
        ) : (
          <div className={styles.topicsGrid}>
            {filteredTopics.map(topic => {
              const isEnrolled = ENROLLED_TOPIC_IDS.includes(topic.id);

              return (
                <div key={topic.id} className={styles.topicCard}>
                  {/* Banner */}
                  <div className={styles.cardBanner} style={{ background: topic.bannerGradient || "#1F2937" }}>
                    {topic.bannerImage && (
                      <img 
                        src={topic.bannerImage} 
                        alt={topic.title}
                        className={styles.cardBannerBg}
                      />
                    )}
                    <div className={styles.topicBadge}>{topic.category}</div>
                  </div>

                  {/* Body */}
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{topic.title}</h3>
                    <p className={styles.cardDesc}>{topic.description}</p>
                    
                    <div className={styles.instructorRow}>
                      <img src={topic.instructor.avatar} alt={topic.instructor.name} className={styles.instructorAvatar} />
                      <div className={styles.instructorInfo}>
                        <span className={styles.instructorName}>{topic.instructor.name}</span>
                        <span className={styles.instructorRole}>{topic.instructor.role}</span>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      {isEnrolled ? (
                        <button 
                          className={`${styles.enrollBtn} ${styles.btnSecondary}`}
                          onClick={() => router.push(`/topics/${topic.id}`)}
                        >
                          Go to Course
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      ) : (
                        <button 
                          className={`${styles.enrollBtn} ${styles.btnPrimary}`}
                          onClick={() => {
                            // In a real app, this would hit an API to enroll
                            router.push(`/topics/${topic.id}`);
                          }}
                        >
                          Enroll Now
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}