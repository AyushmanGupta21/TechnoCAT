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
  const [recalcPulse, setRecalcPulse] = useState(false);
  const [learningSummary, setLearningSummary] = useState<{
    points: number;
    readiness: number;
    mockAvgScore: number;
  }>({ points: 420, readiness: 68, mockAvgScore: 68 });

  // On mount, fetch user's live dashboard and mock metrics or apply custom values from the landing page
  useEffect(() => {
    let customTenth: number | null = null;
    let customTwelfth: number | null = null;
    let customGrad: number | null = null;
    let customPercentile: number | null = null;

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const qTenth = urlParams.get("tenth");
      const qTwelfth = urlParams.get("twelfth");
      const qGrad = urlParams.get("grad");
      const qPercentile = urlParams.get("percentile");

      if (qTenth || qTwelfth || qGrad || qPercentile) {
        if (qTenth && !isNaN(parseFloat(qTenth))) customTenth = parseFloat(qTenth);
        if (qTwelfth && !isNaN(parseFloat(qTwelfth))) customTwelfth = parseFloat(qTwelfth);
        if (qGrad && !isNaN(parseFloat(qGrad))) customGrad = parseFloat(qGrad);
        if (qPercentile && !isNaN(parseFloat(qPercentile))) customPercentile = parseFloat(qPercentile);
      } else {
        const saved = sessionStorage.getItem("technocat_predictor_data");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.tenth && !isNaN(parseFloat(parsed.tenth))) customTenth = parseFloat(parsed.tenth);
            if (parsed.twelfth && !isNaN(parseFloat(parsed.twelfth))) customTwelfth = parseFloat(parsed.twelfth);
            if (parsed.grad && !isNaN(parseFloat(parsed.grad))) customGrad = parseFloat(parsed.grad);
            if (parsed.percentile && !isNaN(parseFloat(parsed.percentile))) customPercentile = parseFloat(parsed.percentile);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    if (customTenth !== null || customTwelfth !== null || customGrad !== null || customPercentile !== null) {
      setProfile((prev) => ({
        ...prev,
        ...(customTenth !== null ? { tenthPercent: customTenth } : {}),
        ...(customTwelfth !== null ? { twelfthPercent: customTwelfth } : {}),
        ...(customGrad !== null ? { gradPercent: customGrad } : {}),
        ...(customPercentile !== null ? { projectedPercentile: customPercentile } : {}),
      }));
    }

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

        // Calculate dynamic projection based on preparation metrics only if user DID NOT provide a custom percentile
        if (customPercentile === null) {
          const calculatedPercentile = Math.min(
            99.8,
            Math.max(78.0, Math.round((85.0 + (mockAvg - 50) * 0.35 + (readinessVal / 100) * 5) * 10) / 10)
          );

          setProfile((prev) => ({
            ...prev,
            projectedPercentile: calculatedPercentile || 95.5,
          }));
        }
      } catch (err) {
        console.error("Failed to load user prep metrics:", err);
      }
    }
    fetchPrepData();
  }, []);

  const { results, profileRating, diversityScore } = evaluateBSchoolChances(profile);

  const handleRecalculate = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          "technocat_predictor_data",
          JSON.stringify({
            tenth: String(profile.tenthPercent),
            twelfth: String(profile.twelfthPercent),
            grad: String(profile.gradPercent),
            percentile: String(profile.projectedPercentile),
          })
        );
      } catch (e) {
        console.error(e);
      }
    }
    setRecalcPulse(true);
    setTimeout(() => setRecalcPulse(false), 900);
  };

  // Parse profileRating into primary title and parenthetical subtitle for the circular gauge badge
  const ratingMatch = profileRating.match(/^([^(]+)(\(.+\))?$/);
  const ratingPrimary = ratingMatch ? ratingMatch[1].trim() : profileRating;
  const ratingSecondary = ratingMatch && ratingMatch[2] ? ratingMatch[2].trim() : "(Composite Evaluated)";

  // Slider fill percentages
  const percentileSliderFill = Math.min(
    100,
    Math.max(0, ((profile.projectedPercentile - 50) / (99.9 - 50)) * 100)
  );
  const workExSliderFill = Math.min(100, Math.max(0, (profile.workExMonths / 60) * 100));

  // Circular gauge geometry
  const gaugeRadius = 88;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeProgress = Math.min(0.96, Math.max(0.18, (profile.projectedPercentile - 45) / (100 - 45)));
  const gaugeDashOffset = gaugeCircumference * (1 - gaugeProgress);

  // Evaluation factor bar widths
  const diversityBarPercent = Math.min(100, Math.max(32, 32 + (diversityScore / 10) * 68));
  const workExBarPercent =
    profile.workExMonths >= 18 && profile.workExMonths <= 36
      ? 82
      : profile.workExMonths > 0
      ? 55
      : 28;
  const categoryBarPercent = profile.category === "GENERAL" ? 56 : 84;

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
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="B-School Predictor Navigation">
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <img src="/logo.jpg" alt="TechnoCAT Logo" className={styles.logoImage} />
            </Link>

            <div className={styles.navLinks}>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/browse" className={styles.navLink}>Browse</Link>
              <Link href="/topics" className={styles.navLink}>My Topics</Link>
              <Link href="/intelligence" className={`${styles.navLink} ${styles.navLinkActive}`}>Intelligence Hub</Link>
              <Link href="#" onClick={(e) => e.preventDefault()} className={styles.navLink}>Mock Viva Prep</Link>
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
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
          {/* Left Panel: Candidate Credentials & CAT Target */}
          <div className={`${styles.card} ${styles.credentialsCard}`}>
            {/* Decorative Top Header */}
            <div className={styles.leftCardHeader}>
              <div className={styles.leftHeaderMain}>
                <div className={styles.headerIconBox} aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3L1 8.5L12 14L21 9.5V16H23V8.5L12 3Z"
                      fill="#2563EB"
                    />
                    <path
                      d="M5 12.2V16.8C5 18.8 8.1 20.5 12 20.5C15.9 20.5 19 18.8 19 16.8V12.2L12 15.7L5 12.2Z"
                      fill="#38BDF8"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>
                    Candidate Credentials <span className={styles.titleAccent}>&amp; CAT Target</span>
                  </h2>
                  <p className={styles.cardSubtitle}>
                    Update your academics and category to calculate realistic Composite Scores.
                  </p>
                </div>
              </div>

              {/* Decorative Corner Illustration & Floating Callout */}
              <div className={styles.cornerDecor} aria-hidden="true">
                <div className={styles.cornerTargetGraphic}>
                  <svg width="54" height="54" viewBox="0 0 64 64" fill="none">
                    <circle cx="34" cy="30" r="22" fill="#DBEAFE" />
                    <circle cx="34" cy="30" r="16" fill="#3B82F6" />
                    <circle cx="34" cy="30" r="10" fill="#FFFFFF" />
                    <circle cx="34" cy="30" r="5" fill="#1D4ED8" />
                    <path
                      d="M46 18L58 6M58 6H50M58 6V14"
                      stroke="#1D4ED8"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className={styles.cornerFloatingTag}>
                  <span>Set your profile</span>
                  <small>Get personalized predictions</small>
                </div>
              </div>
            </div>

            {/* Projected Percentile Slider Box */}
            <div className={styles.percentileSectionBox}>
              <div className={styles.labelRow}>
                <span className={styles.labelWithInfo}>
                  Projected / Target CAT Percentile
                  <span
                    className={styles.infoIconCircle}
                    title="Slide to test how different CAT percentiles impact your B-School Composite Score"
                  >
                    i
                  </span>
                </span>
                <span className={styles.sliderValue}>{profile.projectedPercentile.toFixed(1)} %ile</span>
              </div>

              <div className={styles.sliderTrackWrapper}>
                <input
                  type="range"
                  min="50"
                  max="99.9"
                  step="0.1"
                  value={profile.projectedPercentile}
                  className={styles.slider}
                  style={{
                    background: `linear-gradient(90deg, #2563EB 0%, #0EA5E9 ${percentileSliderFill}%, #E2E8F0 ${percentileSliderFill}%, #E2E8F0 100%)`,
                  }}
                  onChange={(e) =>
                    setProfile({ ...profile, projectedPercentile: parseFloat(e.target.value) })
                  }
                />
                <div className={styles.sliderScaleRow}>
                  <span>50</span>
                  <span>60</span>
                  <span>70</span>
                  <span>80</span>
                  <span>90</span>
                  <span>99</span>
                </div>
              </div>
            </div>

            {/* 2-Column Profile Inputs Grid */}
            <div className={styles.credentialsFieldsGrid}>
              {/* 1. Reservation Category */}
              <div className={styles.fieldCard}>
                <div className={styles.fieldCardIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className={styles.fieldCardBody}>
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
              </div>

              {/* 2. Gender Diversity */}
              <div className={styles.fieldCard}>
                <div className={styles.fieldCardIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="11" r="5" />
                    <path d="M13.5 7.5L19 2" />
                    <path d="M15 2h4v4" />
                    <path d="M10 16v6" />
                    <path d="M7 19h6" />
                  </svg>
                </div>
                <div className={styles.fieldCardBody}>
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

              {/* 3. Class 10th Score (%) */}
              <div className={styles.fieldCard}>
                <div className={styles.fieldCardIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <path d="M9 7h6" />
                    <path d="M9 11h4" />
                  </svg>
                </div>
                <div className={styles.fieldCardBody}>
                  <span className={styles.label}>Class 10th Score (%)</span>
                  <div className={styles.percentInputBox}>
                    <input
                      type="number"
                      min="30"
                      max="100"
                      step="any"
                      className={styles.inputFieldClean}
                      value={profile.tenthPercent}
                      onChange={(e) =>
                        setProfile({ ...profile, tenthPercent: parseFloat(e.target.value) || 0 })
                      }
                    />
                    <span className={styles.percentSuffix}>/ 100</span>
                  </div>
                </div>
              </div>

              {/* 4. Class 12th Score (%) */}
              <div className={styles.fieldCard}>
                <div className={styles.fieldCardIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <div className={styles.fieldCardBody}>
                  <span className={styles.label}>Class 12th Score (%)</span>
                  <div className={styles.percentInputBox}>
                    <input
                      type="number"
                      min="30"
                      max="100"
                      step="any"
                      className={styles.inputFieldClean}
                      value={profile.twelfthPercent}
                      onChange={(e) =>
                        setProfile({ ...profile, twelfthPercent: parseFloat(e.target.value) || 0 })
                      }
                    />
                    <span className={styles.percentSuffix}>/ 100</span>
                  </div>
                </div>
              </div>

              {/* 5. Graduation Score (%) */}
              <div className={styles.fieldCard}>
                <div className={styles.fieldCardIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10L12 5 2 10l10 5 10-5z" />
                    <path d="M6 12v5c0 2 3 3.5 6 3.5s6-1.5 6-3.5v-5" />
                  </svg>
                </div>
                <div className={styles.fieldCardBody}>
                  <span className={styles.label}>Graduation Score (%)</span>
                  <div className={styles.percentInputBox}>
                    <input
                      type="number"
                      min="30"
                      max="100"
                      step="any"
                      className={styles.inputFieldClean}
                      value={profile.gradPercent}
                      onChange={(e) =>
                        setProfile({ ...profile, gradPercent: parseFloat(e.target.value) || 0 })
                      }
                    />
                    <span className={styles.percentSuffix}>/ 100</span>
                  </div>
                </div>
              </div>

              {/* 6. Academic Stream */}
              <div className={styles.fieldCard}>
                <div className={styles.fieldCardIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="5" r="2.5" />
                    <circle cx="6" cy="19" r="2.5" />
                    <circle cx="18" cy="19" r="2.5" />
                    <path d="M12 7.5v4.5M12 12L6 16.5M12 12l6 4.5" />
                  </svg>
                </div>
                <div className={styles.fieldCardBody}>
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
            </div>

            {/* Work Experience Slider Box */}
            <div className={styles.workExSectionBox}>
              <div className={styles.labelRow}>
                <span className={styles.labelWithInfo}>
                  <span className={styles.workExIconBadge} aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </span>
                  Full-Time Work Experience
                  <span
                    className={styles.infoIconCircle}
                    title="Full-time paid work experience after graduation (18–36 months typically earns maximum IIM points)"
                  >
                    i
                  </span>
                </span>
                <span className={styles.sliderValue}>{profile.workExMonths} Months</span>
              </div>

              <div className={styles.sliderTrackWrapper}>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={profile.workExMonths}
                  className={styles.slider}
                  style={{
                    background: `linear-gradient(90deg, #2563EB 0%, #0EA5E9 ${workExSliderFill}%, #DBEAFE ${workExSliderFill}%, #E2E8F0 100%)`,
                  }}
                  onChange={(e) =>
                    setProfile({ ...profile, workExMonths: parseInt(e.target.value, 10) })
                  }
                />
                <div className={styles.sliderScaleRow}>
                  <span>0</span>
                  <span>12</span>
                  <span>24</span>
                  <span>36</span>
                  <span>48</span>
                  <span>60</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              className={styles.recalcBtn}
              onClick={handleRecalculate}
            >
              <span className={styles.recalcBtnIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="8" y1="11" x2="8.01" y2="11" />
                  <line x1="12" y1="11" x2="12.01" y2="11" />
                  <line x1="16" y1="11" x2="16.01" y2="11" />
                  <line x1="8" y1="15" x2="8.01" y2="15" />
                  <line x1="12" y1="15" x2="12.01" y2="15" />
                  <line x1="16" y1="15" x2="16.01" y2="15" />
                </svg>
              </span>
              <span>{recalcPulse ? "Profile Updated & Recalculated" : "Update Profile & Recalculate"}</span>
              <span className={styles.recalcBtnArrow} aria-hidden="true">›</span>
            </button>
          </div>

          {/* Right Panel: Admission Strength Meter */}
          <div className={`${styles.card} ${styles.strengthMeterCard} ${recalcPulse ? styles.strengthPulse : ""}`}>
            <div>
              {/* Header Row */}
              <div className={styles.rightCardHeader}>
                <div className={styles.leftHeaderMain}>
                  <div className={styles.headerIconBox} aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="13" width="4" height="8" rx="1.2" fill="#3B82F6" />
                      <rect x="10" y="6" width="4" height="15" rx="1.2" fill="#2563EB" />
                      <rect x="17" y="10" width="4" height="11" rx="1.2" fill="#0EA5E9" />
                    </svg>
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>
                      Admission <span className={styles.titleAccent}>Strength Meter</span>
                    </h2>
                    <p className={styles.cardSubtitle}>
                      Real-time composite evaluation across IIM criteria.
                    </p>
                  </div>
                </div>

                <div className={styles.liveAnalysisBadge}>
                  <span className={styles.liveDot} />
                  Live Analysis
                </div>
              </div>

              {/* Center Row: Circular Gauge + 4 Profile Insights Cards */}
              <div className={styles.meterAndInsightsGrid}>
                {/* Circular Gauge */}
                <div className={styles.gaugeWrapper}>
                  <div className={styles.gaugeOuterRing}>
                    <svg
                      className={styles.gaugeSvg}
                      viewBox="0 0 210 210"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="strengthMeterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366F1" />
                          <stop offset="45%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="105"
                        cy="105"
                        r={gaugeRadius}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="14"
                      />
                      <circle
                        cx="105"
                        cy="105"
                        r={gaugeRadius}
                        fill="none"
                        stroke="url(#strengthMeterGrad)"
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={gaugeCircumference}
                        strokeDashoffset={gaugeDashOffset}
                        transform="rotate(-95 105 105)"
                        style={{ transition: "stroke-dashoffset 0.45s ease" }}
                      />
                    </svg>

                    {/* Medal Badge on Top-Right of Ring */}
                    <div className={styles.gaugeMedalBadge} aria-hidden="true">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M8.5 14.5L7 22L12 19.5L17 22L15.5 14.5" fill="#EA580C" />
                        <circle cx="12" cy="10" r="6.5" fill="#F59E0B" />
                        <path
                          d="M12 6.5L13.09 8.7L15.5 9.05L13.75 10.75L14.18 13.15L12 12L9.82 13.15L10.25 10.75L8.5 9.05L10.91 8.7L12 6.5Z"
                          fill="#FEF3C7"
                        />
                      </svg>
                    </div>

                    {/* Inner Gauge Content */}
                    <div className={styles.gaugeInnerContent}>
                      <div className={styles.percentileNumber}>
                        {profile.projectedPercentile.toFixed(1)}
                      </div>
                      <div className={styles.percentileLabel}>PROJECTED %ILE</div>
                      <div className={styles.profileRatingBadge}>
                        <span className={styles.ratingPrimaryText}>{ratingPrimary}</span>
                        <span className={styles.ratingSecondaryText}>{ratingSecondary}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Stack: 4 Profile Insights Cards */}
                <div className={styles.insightsStack}>
                  <div className={`${styles.insightItem} ${styles.insightPurple}`}>
                    <div className={styles.insightIconBox} aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="4" />
                        <path d="M16 8l4-4" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.insightTitle}>Profile Insights</div>
                      <div className={styles.insightDesc}>
                        Your profile looks strong for top B-schools based on current inputs.
                      </div>
                    </div>
                  </div>

                  <div className={`${styles.insightItem} ${styles.insightBlue}`}>
                    <div className={styles.insightIconBox} aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3h12l4 6-10 12L2 9z" />
                        <path d="M2 9h20" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.insightTitle}>Competitive Profile</div>
                      <div className={styles.insightDesc}>Good academic foundation</div>
                    </div>
                  </div>

                  <div className={`${styles.insightItem} ${styles.insightGreen}`}>
                    <div className={styles.insightIconBox} aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 20V10" />
                        <path d="M12 20V14" />
                        <path d="M6 20v-4" />
                        <path d="M4 11l6-5 4 3 6-5" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.insightTitle}>Good Admission Chances</div>
                      <div className={styles.insightDesc}>Fit for many top institutes</div>
                    </div>
                  </div>

                  <div className={`${styles.insightItem} ${styles.insightOrange}`}>
                    <div className={styles.insightIconBox} aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="4" />
                        <path d="M15 9l4-4" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.insightTitle}>Keep Improving</div>
                      <div className={styles.insightDesc}>A few areas can boost your chances</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Evaluation Factors */}
              <div className={styles.evaluationFactorsCard}>
                <div className={styles.evalFactorsHeader}>
                  <span className={styles.evalFactorsTitle}>Key Evaluation Factors</span>
                  <span className={styles.evalFactorsSub}>Based on your current profile</span>
                </div>

                <div className={styles.metricsList}>
                  <div className={styles.metricRow}>
                    <div className={styles.metricLeft}>
                      <span className={styles.metricIconBlue} aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </span>
                      <span>Diversity Bonus Points</span>
                    </div>
                    <div className={styles.metricBarTrack}>
                      <div
                        className={styles.metricBarFill}
                        style={{ width: `${diversityBarPercent}%` }}
                      />
                    </div>
                    <span className={styles.metricVal}>+{diversityScore} Pts</span>
                  </div>

                  <div className={styles.metricRow}>
                    <div className={styles.metricLeft}>
                      <span className={styles.metricIconBlue} aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                      </span>
                      <span>Work Experience Rating</span>
                    </div>
                    <div className={styles.metricBarTrack}>
                      <div
                        className={styles.metricBarFill}
                        style={{ width: `${workExBarPercent}%` }}
                      />
                    </div>
                    <span className={styles.metricVal}>
                      {profile.workExMonths >= 18 && profile.workExMonths <= 36
                        ? "Optimal (Full Points)"
                        : profile.workExMonths > 0
                        ? "Partial Points"
                        : "Fresher"}
                    </span>
                  </div>

                  <div className={styles.metricRow}>
                    <div className={styles.metricLeft}>
                      <span className={styles.metricIconOrange} aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </span>
                      <span>Category Advantage</span>
                    </div>
                    <div className={styles.metricBarTrack}>
                      <div
                        className={styles.metricBarFill}
                        style={{ width: `${categoryBarPercent}%` }}
                      />
                    </div>
                    <span className={styles.metricVal}>{profile.category} Cutoff Scaled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Improvement Tip Box */}
            <div className={styles.whatIfBox}>
              <div className={styles.whatIfBulb} aria-hidden="true">
                💡
              </div>
              <div className={styles.whatIfText}>
                <strong>Target Improvement Tip:</strong> An increase of{" "}
                <strong className={styles.whatIfAccent}>+8 marks</strong> in your mock tests improves your
                projected percentile by <strong className={styles.whatIfAccent}>~1.8%</strong>, moving top
                schools like IIM Kozhikode and SPJIMR from &apos;Dream&apos; into your &apos;Target&apos; call zone!
              </div>
              <div className={styles.whatIfChartGraphic} aria-hidden="true">
                <svg width="46" height="42" viewBox="0 0 48 44" fill="none">
                  <path
                    d="M6 26C16 24 26 17 38 6M38 6H30M38 6V14"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect x="6" y="30" width="6" height="10" rx="1.5" fill="#FBBF24" />
                  <rect x="16" y="25" width="6" height="15" rx="1.5" fill="#F59E0B" />
                  <rect x="26" y="19" width="6" height="21" rx="1.5" fill="#F59E0B" />
                  <rect x="36" y="12" width="6" height="28" rx="1.5" fill="#D97706" />
                </svg>
              </div>
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
