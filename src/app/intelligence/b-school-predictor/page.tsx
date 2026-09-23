"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./b-school-predictor.module.css";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import {
  CandidateProfile,
  evaluateBSchoolChances,
  BSchool,
  PredictionResult,
} from "@/data/bSchoolEngine";

export default function BSchoolPredictorPage() {
  const [profile, setProfile] = useState<CandidateProfile>({
    projectedPercentile: 95.5,
    tenthPercent: 88,
    twelfthPercent: 85,
    twelfthStream: "Science",
    gradPercent: 78,
    gradDiscipline: "Engineering",
    workExMonths: 20,
    category: "GENERAL",
    gender: "Male",
  });

  const [activeTier, setActiveTier] = useState<"ALL" | "DREAM" | "TARGET" | "SAFE">("ALL");
  const [selectedSchool, setSelectedSchool] = useState<BSchool | null>(null);
  const [showInfoCard, setShowInfoCard] = useState(true);
  const [learningSummary, setLearningSummary] = useState<{
    points: number;
    readiness: number;
    mockAvgScore: number;
  }>({ points: 420, readiness: 68, mockAvgScore: 68 });

  // On mount, fetch user's live dashboard and mock metrics to project starting CAT percentile
  useEffect(() => {
    async function fetchPrepData() {
      try {
        const [dashRes, aiRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/ai-analysis"),
        ]);

        let pts = 420;
        let readinessVal = 68;
        let mockAvg = 68;

        if (dashRes.ok) {
          const dash = await dashRes.json();
          if (dash.metrics?.pointsEarned) pts = dash.metrics.pointsEarned;
          if (dash.summary?.totalHoursWeek) {
            readinessVal = Math.min(95, Math.max(50, dash.summary.totalHoursWeek * 2.2));
          }
        }

        if (aiRes.ok) {
          const ai = await aiRes.json();
          if (ai.data?.overview?.latestScore) {
            mockAvg = ai.data.overview.latestScore;
          }
        }

        setLearningSummary({ points: pts, readiness: Math.round(readinessVal), mockAvgScore: mockAvg });

        // Calculate dynamic projection based on preparation metrics
        // Base mapping: 60 marks ~ 90%ile, 75 marks ~ 96%ile, 90 marks ~ 99%ile
        const calculatedPercentile = Math.min(
          99.8,
          Math.max(78.0, Math.round((85.0 + (mockAvg - 50) * 0.35 + (readinessVal / 100) * 5) * 10) / 10)
        );

        setProfile((prev) => ({
          ...prev,
          projectedPercentile: calculatedPercentile || 95.5,
        }));
      } catch (err) {
        console.error("Failed to load user prep metrics:", err);
      }
    }
    fetchPrepData();
  }, []);

  const { results, profileRating, diversityScore } = evaluateBSchoolChances(profile);

  const filteredResults = results.filter((res) => {
    if (activeTier === "ALL") return true;
    if (activeTier === "DREAM") return res.chanceTier === "Dream";
    if (activeTier === "TARGET") return res.chanceTier === "Target";
    if (activeTier === "SAFE") return res.chanceTier === "Safe";
    return true;
  });

  const getChancePillClass = (tier: string) => {
    if (tier === "Safe") return `${styles.chancePill} ${styles.chanceSafe}`;
    if (tier === "Target") return `${styles.chancePill} ${styles.chanceTarget}`;
    return `${styles.chancePill} ${styles.chanceDream}`;
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Sticky App Header */}
      <header className={styles.darkHeader}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard">
            <Image src="/logo.jpg" alt="TechnoCAT Logo" width={180} height={75} className={styles.logo} />
          </Link>
          <nav className={styles.mainNav}>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/browse" className={styles.navLink}>Browse</Link>
            <Link href="/topics" className={styles.navLink}>My Topics</Link>
            <Link href="/intelligence" className={`${styles.navLink} ${styles.active}`}>Intelligence Hub</Link>
            <Link href="#!" onClick={(e) => e.preventDefault()} className={styles.navLink}>Mock Viva Prep</Link>
          </nav>
        </div>
        <PostLoginNavActions />
      </header>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/intelligence">Intelligence Hub</Link> &gt; <span>B-School Predictor &amp; Admission Engine</span>
      </div>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroBadge}>
          <span>✦</span> COMPOSITE SCORE &amp; ADMISSION ENGINE
        </div>
        <h1 className={styles.heroTitle}>
          Your Target B-Schools, <span>Projected from Your Journey.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          You don&apos;t have an official CAT score yet — and that&apos;s okay! TechnoCAT projects your CAT percentile
          from your learning pace, mock attempts, and academic credentials to calculate institute-specific Composite Scores.
        </p>

        {/* Dynamic Learning Projection Banner */}
        <div className={styles.projectionBanner}>
          <div className={styles.bannerText}>
            <span className={styles.bannerSparkle}>🎯</span>
            <span>
              Based on your <strong>{learningSummary.readiness}% CAT Readiness</strong>, recent mock trajectory (~{learningSummary.mockAvgScore} marks),
              and course points ({learningSummary.points} pts), your projected baseline is{" "}
              <span className={styles.bannerHighlight}>{profile.projectedPercentile}%ile</span>.
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
            Adjust the slider below to test &apos;What-If&apos; score goals.
          </span>
        </div>
      </section>

      {/* Main Container */}
      <main className={styles.container}>
        {/* Split Grid: Inputs vs Dynamic Gauge */}
        <div className={styles.splitGrid}>
          {/* Left Panel: Profile & Percentile Inputs */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Candidate Credentials &amp; CAT Target</h2>
            <p className={styles.cardSubtitle}>
              Update your academics and category to calculate realistic Composite Scores.
            </p>

            {/* Projected Percentile Slider */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <span className={styles.label}>Projected / Target CAT Percentile</span>
                <span className={styles.sliderValue}>{profile.projectedPercentile.toFixed(1)}%ile</span>
              </div>
              <input
                type="range"
                min="70"
                max="99.9"
                step="0.1"
                value={profile.projectedPercentile}
                className={styles.slider}
                onChange={(e) =>
                  setProfile({ ...profile, projectedPercentile: parseFloat(e.target.value) })
                }
              />
            </div>

            {/* Category & Gender */}
            <div className={styles.inputGrid} style={{ marginBottom: "20px" }}>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <span className={styles.label}>Reservation Category</span>
                <select
                  className={styles.selectField}
                  value={profile.category}
                  onChange={(e) => setProfile({ ...profile, category: e.target.value as any })}
                >
                  <option value="GENERAL">General (Open)</option>
                  <option value="NC_OBC">NC-OBC</option>
                  <option value="EWS">EWS</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <span className={styles.label}>Gender Diversity</span>
                <select
                  className={styles.selectField}
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female (+Gender Diversity Points)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* 10th & 12th Board Marks */}
            <div className={styles.inputGrid} style={{ marginBottom: "20px" }}>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <span className={styles.label}>Class 10th Score (%)</span>
                <input
                  type="number"
                  min="50"
                  max="100"
                  className={styles.inputField}
                  value={profile.tenthPercent}
                  onChange={(e) =>
                    setProfile({ ...profile, tenthPercent: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <span className={styles.label}>Class 12th Score (%)</span>
                <input
                  type="number"
                  min="50"
                  max="100"
                  className={styles.inputField}
                  value={profile.twelfthPercent}
                  onChange={(e) =>
                    setProfile({ ...profile, twelfthPercent: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            {/* Graduation Marks & Discipline */}
            <div className={styles.inputGrid} style={{ marginBottom: "20px" }}>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <span className={styles.label}>Graduation Score (%)</span>
                <input
                  type="number"
                  min="50"
                  max="100"
                  className={styles.inputField}
                  value={profile.gradPercent}
                  onChange={(e) =>
                    setProfile({ ...profile, gradPercent: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <span className={styles.label}>Academic Stream</span>
                <select
                  className={styles.selectField}
                  value={profile.gradDiscipline}
                  onChange={(e) => setProfile({ ...profile, gradDiscipline: e.target.value as any })}
                >
                  <option value="Engineering">Engineering (B.Tech / B.E)</option>
                  <option value="Non-Engineering">Non-Engineering (B.Com/B.Sc/BBA/BA)</option>
                </select>
              </div>
            </div>

            {/* Work Experience */}
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <div className={styles.labelRow}>
                <span className={styles.label}>Full-Time Work Experience</span>
                <span className={styles.sliderValue}>{profile.workExMonths} Months</span>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                step="1"
                value={profile.workExMonths}
                className={styles.slider}
                onChange={(e) =>
                  setProfile({ ...profile, workExMonths: parseInt(e.target.value, 10) })
                }
              />
            </div>
          </div>

          {/* Right Panel: Gauge & Profile Insights */}
          <div className={styles.card} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h2 className={styles.cardTitle}>Admission Strength Meter</h2>
              <p className={styles.cardSubtitle}>Real-time composite evaluation across IIM criteria.</p>

              <div className={styles.gaugeBox}>
                <div className={styles.percentileCircle}>
                  <div className={styles.percentileNumber}>{profile.projectedPercentile.toFixed(1)}</div>
                  <div className={styles.percentileLabel}>Projected %ile</div>
                </div>
                <div className={styles.profileRatingBadge}>
                  {profileRating}
                </div>
              </div>

              <div className={styles.metricsList}>
                <div className={styles.metricRow}>
                  <span>Diversity Bonus Points</span>
                  <span className={styles.metricVal}>+{diversityScore} Pts</span>
                </div>
                <div className={styles.metricRow}>
                  <span>Work Experience Rating</span>
                  <span className={styles.metricVal}>
                    {profile.workExMonths >= 18 && profile.workExMonths <= 36
                      ? "Optimal (Full Points)"
                      : profile.workExMonths > 0
                      ? "Partial Points"
                      : "Fresher"}
                  </span>
                </div>
                <div className={styles.metricRow}>
                  <span>Category Advantage</span>
                  <span className={styles.metricVal}>{profile.category} Cutoff Scaled</span>
                </div>
              </div>
            </div>

            <div className={styles.whatIfBox}>
              <strong>💡 Target Improvement Tip:</strong> An increase of <strong>+8 marks</strong> in your mock tests
              improves your projected percentile by ~1.8%, moving top schools like IIM Kozhikode and SPJIMR from &apos;Dream&apos; into your &apos;Target&apos; call zone!
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div>
          <div className={styles.resultsHeader}>
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0F172A", marginBottom: "4px" }}>
                Predicted B-School Shortlist
              </h2>
              <p style={{ color: "#64748B", fontSize: "14px" }}>
                Showing call probabilities based on official shortlisting formulas for {profile.category} candidates.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                className={styles.infoToggleBtn}
                onClick={() => setShowInfoCard(!showInfoCard)}
                title="Click to view guide on Dream, Target, and Safe tiers"
              >
                <span>ℹ️</span> {showInfoCard ? "Hide Tier Guide" : "What are Dream, Target & Safe?"}
              </button>

              <div className={styles.tierTabs}>
                {(["ALL", "DREAM", "TARGET", "SAFE"] as const).map((tier) => (
                  <button
                    key={tier}
                    className={`${styles.tierBtn} ${activeTier === tier ? styles.tierBtnActive : ""}`}
                    onClick={() => setActiveTier(tier)}
                  >
                    {tier === "ALL" && `All Schools (${results.length})`}
                    {tier === "DREAM" && `🌟 Dream (${results.filter((r) => r.chanceTier === "Dream").length})`}
                    {tier === "TARGET" && `🎯 Target (${results.filter((r) => r.chanceTier === "Target").length})`}
                    {tier === "SAFE" && `🛡️ Safe (${results.filter((r) => r.chanceTier === "Safe").length})`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* i-Card (Admission Tier & Composite Score Explanation Guide) */}
          {showInfoCard && (
            <div className={styles.infoCard}>
              <div className={styles.infoCardTop}>
                <div className={styles.infoCardTitle}>
                  <span>ℹ️</span> Understanding Admission Call Tiers &amp; Composite Scores
                  <span className={styles.infoCardBadge}>Quick Student Guide</span>
                </div>
                <button
                  onClick={() => setShowInfoCard(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "18px",
                    fontWeight: "700",
                    cursor: "pointer",
                    color: "#94A3B8",
                    padding: "4px 8px",
                  }}
                  title="Close Guide"
                >
                  ✕
                </button>
              </div>

              <div className={styles.infoTiersGrid}>
                <div className={`${styles.infoTierBox} ${styles.infoTierDream}`}>
                  <div className={styles.infoTierHeader}>
                    <span className={styles.infoTierName} style={{ color: "#6B21A8" }}>🌟 Dream (Ambitious)</span>
                    <span className={styles.infoTierOdds} style={{ background: "#F3E8FF", color: "#7E22CE" }}>&lt; 60% Odds</span>
                  </div>
                  <p className={styles.infoTierDesc}>
                    Aspirational reach colleges (e.g. IIM A/B/C, FMS). Call is competitive under your current projected score or profile filters.
                  </p>
                  <div className={styles.infoTierStrategy} style={{ color: "#7E22CE" }}>
                    🎯 Strategy: Boost mock scores by +8 to +15 marks to shift into Target zone.
                  </div>
                </div>

                <div className={`${styles.infoTierBox} ${styles.infoTierTarget}`}>
                  <div className={styles.infoTierHeader}>
                    <span className={styles.infoTierName} style={{ color: "#1E40AF" }}>🎯 Target (Competitive)</span>
                    <span className={styles.infoTierOdds} style={{ background: "#DBEAFE", color: "#1D4ED8" }}>60% – 84% Odds</span>
                  </div>
                  <p className={styles.infoTierDesc}>
                    Your primary sweet spot (e.g. IIM L/K/I, XLRI, SPJIMR). Your composite score strongly matches historical interview shortlists.
                  </p>
                  <div className={styles.infoTierStrategy} style={{ color: "#1D4ED8" }}>
                    🎯 Strategy: Maintain consistency, clear sectional cutoffs, and prepare for interviews.
                  </div>
                </div>

                <div className={`${styles.infoTierBox} ${styles.infoTierSafe}`}>
                  <div className={styles.infoTierHeader}>
                    <span className={styles.infoTierName} style={{ color: "#065F46" }}>🛡️ Safe (Solid Bet)</span>
                    <span className={styles.infoTierOdds} style={{ background: "#DCFCE7", color: "#15803D" }}>85%+ Odds</span>
                  </div>
                  <p className={styles.infoTierDesc}>
                    High-probability calls (e.g. CAP IIMs, MDI Gurgaon, IIM Shillong). Your score exceeds cutoffs with a comfortable safety buffer.
                  </p>
                  <div className={styles.infoTierStrategy} style={{ color: "#15803D" }}>
                    🎯 Strategy: Reliable tier-1 backups that ensure admission even on a tough exam day.
                  </div>
                </div>
              </div>

              <div className={styles.infoFormulaNote}>
                <span>💡</span>
                <span>
                  <strong>Why not just CAT percentile?</strong> Top IIMs calculate a <em>Composite Score (0–100)</em> weighting CAT score (35–65%), 10th &amp; 12th boards, graduation, work experience, and gender/academic diversity points.
                </span>
              </div>
            </div>
          )}

          <div className={styles.collegeGrid} style={{ marginTop: "24px" }}>
            {filteredResults.map((item) => (
              <div key={item.school.id} className={styles.collegeCard}>
                <div>
                  <div className={styles.colTop}>
                    <div className={styles.colAvatar} style={{ background: item.school.logoBg }}>
                      {item.school.shortName.charAt(0)}
                    </div>
                    <span className={getChancePillClass(item.chanceTier)}>
                      {item.chanceTier === "Safe" && "🛡️ High Chance (85%+)"}
                      {item.chanceTier === "Target" && "🎯 Competitive (60-84%)"}
                      {item.chanceTier === "Dream" && "🌟 Ambitious (<60%)"}
                    </span>
                  </div>

                  <h3 className={styles.colName}>{item.school.shortName}</h3>
                  <div className={styles.colLocation}>{item.school.location}</div>

                  <div className={styles.colStatsRow}>
                    <div className={styles.statItem}>
                      <span className={styles.statLbl}>Category Cutoff</span>
                      <span className={styles.statValue}>
                        {item.school.overallCutoff[profile.category]}%ile
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLbl}>Composite Call Index</span>
                      <span className={styles.statValue} style={{ color: "#2563EB" }}>
                        {item.compositeScore} / 100
                      </span>
                    </div>
                    <div className={styles.statItem} style={{ marginTop: "8px" }}>
                      <span className={styles.statLbl}>Avg CTC Package</span>
                      <span className={styles.statValue}>₹{item.school.avgPackageLpa} LPA</span>
                    </div>
                    <div className={styles.statItem} style={{ marginTop: "8px" }}>
                      <span className={styles.statLbl}>Tuition Fee</span>
                      <span className={styles.statValue}>₹{item.school.feesLakhs}L</span>
                    </div>
                  </div>

                  <p className={styles.colAdvice}>{item.gapAdvice}</p>
                </div>

                <button className={styles.btnCriteria} onClick={() => setSelectedSchool(item.school)}>
                  View Selection Criteria &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* College Criteria Modal */}
      {selectedSchool && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSchool(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedSchool(null)}>
              ✕
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div
                className={styles.colAvatar}
                style={{ background: selectedSchool.logoBg, width: "40px", height: "40px", fontSize: "16px" }}
              >
                {selectedSchool.shortName.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  {selectedSchool.name}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>{selectedSchool.badge}</span>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginTop: "12px" }}>
              {selectedSchool.criteriaSummary}
            </p>

            <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", marginTop: "20px" }}>
              Official Shortlisting Weightage
            </h4>
            <div className={styles.weightsGrid}>
              <div className={styles.weightItem}>
                <span>CAT Score</span>
                <span style={{ color: "#2563EB" }}>{selectedSchool.weights.catPercentile}%</span>
              </div>
              <div className={styles.weightItem}>
                <span>Class 10th Marks</span>
                <span>{selectedSchool.weights.tenthMarks}%</span>
              </div>
              <div className={styles.weightItem}>
                <span>Class 12th Marks</span>
                <span>{selectedSchool.weights.twelfthMarks}%</span>
              </div>
              <div className={styles.weightItem}>
                <span>Graduation Marks</span>
                <span>{selectedSchool.weights.graduationMarks}%</span>
              </div>
              <div className={styles.weightItem}>
                <span>Work Experience</span>
                <span>{selectedSchool.weights.workExperience}%</span>
              </div>
              <div className={styles.weightItem}>
                <span>Diversity Points</span>
                <span style={{ color: "#059669" }}>
                  {selectedSchool.weights.genderDiversity + selectedSchool.weights.academicDiversity}%
                </span>
              </div>
            </div>

            <div style={{ background: "#F0F9FF", padding: "14px 18px", borderRadius: "12px", border: "1px solid #BAE6FD" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#0369A1", marginBottom: "4px" }}>
                Campus Highlight:
              </div>
              <div style={{ fontSize: "13px", color: "#1E293B" }}>{selectedSchool.keyHighlight}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
