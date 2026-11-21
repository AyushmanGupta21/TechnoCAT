"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./b-school-predictor.module.css";
import PostLoginNavActions from "@/components/PostLoginNavActions";
import BrandLogo from "@/components/BrandLogo";
import {
  CandidateProfile,
  evaluateBSchoolChances,
  BSchool,
  PredictionResult,
  TOP_B_SCHOOLS,
} from "@/data/bSchoolEngine";
import { estimatePercentile, PERCENTILE_DISCLAIMER } from "@/lib/metrics/percentile";
import type { StudentMetrics } from "@/lib/metrics/types";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type Category = CandidateProfile["category"];
type Gender = CandidateProfile["gender"];
type Discipline = CandidateProfile["gradDiscipline"];
type Stream = CandidateProfile["twelfthStream"];
type Tier = PredictionResult["chanceTier"];

/** Raw form values: everything starts empty, the student fills it in. */
interface FormState {
  tenth: string;
  twelfth: string;
  grad: string;
  workEx: string;
  percentile: string;
  category: Category | "";
  gender: Gender | "";
  gradDiscipline: Discipline | "";
}

/** Shape stored in profile preferences under `predictorProfile`. */
interface SavedPredictorProfile {
  tenthPercent: number;
  twelfthPercent: number;
  gradPercent: number;
  gradDiscipline: Discipline;
  twelfthStream?: Stream;
  workExMonths: number;
  category: Category;
  gender: Gender;
  /** Only stored when the student typed a target/expected percentile themselves. */
  targetPercentile?: number;
  updatedAt: string;
}

type PercentileSource = "estimate" | "handoff" | "saved" | "manual" | null;
type LoadStatus = "loading" | "ok" | "unauthorized" | "error";
type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

const EMPTY_FORM: FormState = {
  tenth: "",
  twelfth: "",
  grad: "",
  workEx: "",
  percentile: "",
  category: "",
  gender: "",
  gradDiscipline: "",
};

const CATEGORIES: Category[] = ["GENERAL", "NC_OBC", "EWS", "SC", "ST"];
const GENDERS: Gender[] = ["Male", "Female", "Other"];
const DISCIPLINES: Discipline[] = ["Engineering", "Non-Engineering"];
const STREAMS: Stream[] = ["Science", "Commerce", "Arts"];

const CATEGORY_LABEL: Record<Category, string> = {
  GENERAL: "General",
  NC_OBC: "NC-OBC",
  EWS: "EWS",
  SC: "SC",
  ST: "ST",
};

// Mirrors the category adjustment in calculateCompositeScore (src/data/bSchoolEngine.ts).
const CATEGORY_BONUS: Record<Category, number> = { GENERAL: 0, EWS: 4, NC_OBC: 6, SC: 14, ST: 20 };
const MAX_CATEGORY_BONUS = 20;

// Mirrors the work-experience curve in calculateCompositeScore (src/data/bSchoolEngine.ts).
function workExRatio(months: number): number {
  if (months >= 24 && months <= 36) return 1.0;
  if (months >= 12 && months < 24) return 0.7;
  if (months > 36 && months <= 48) return 0.7;
  if (months > 0 && months < 12) return 0.3;
  return 0;
}

const TIER_RANK: Record<Tier, number> = { Dream: 0, Target: 1, Safe: 2 };
const MAX_PERCENTILE_SWEEP = 99.9;
const WHAT_IF_STEP = 2;

const PREDICTOR_HANDOFF_KEY = "technocat_predictor_data";

const CAT_WEIGHT_MIN = Math.min(...TOP_B_SCHOOLS.map((s) => s.weights.catPercentile));
const CAT_WEIGHT_MAX = Math.max(...TOP_B_SCHOOLS.map((s) => s.weights.catPercentile));

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function fmtPct(n: number): string {
  // Two decimals only above 99 (matches estimatePercentile's precision)
  return n > 99 && Math.round(n * 10) / 10 !== n ? n.toFixed(2) : n.toFixed(1);
}

function readSavedProfile(raw: unknown): Partial<SavedPredictorProfile> {
  if (!isPlainObject(raw)) return {};
  const out: Partial<SavedPredictorProfile> = {};
  const num = (k: string, min: number, max: number) => {
    const v = raw[k];
    return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : undefined;
  };
  out.tenthPercent = num("tenthPercent", 0, 100);
  out.twelfthPercent = num("twelfthPercent", 0, 100);
  out.gradPercent = num("gradPercent", 0, 100);
  out.workExMonths = num("workExMonths", 0, 600);
  out.targetPercentile = num("targetPercentile", 0, 100);
  if (CATEGORIES.includes(raw.category as Category)) out.category = raw.category as Category;
  if (GENDERS.includes(raw.gender as Gender)) out.gender = raw.gender as Gender;
  if (DISCIPLINES.includes(raw.gradDiscipline as Discipline)) out.gradDiscipline = raw.gradDiscipline as Discipline;
  if (STREAMS.includes(raw.twelfthStream as Stream)) out.twelfthStream = raw.twelfthStream as Stream;
  return out;
}

/** Values handed over by the landing-page IIM Predictor widget (URL params, else sessionStorage). */
function readHandoff(): { tenth?: string; twelfth?: string; grad?: string; percentile?: string } {
  if (typeof window === "undefined") return {};
  const valid = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? v.trim() : undefined;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = {
    tenth: valid(params.get("tenth")),
    twelfth: valid(params.get("twelfth")),
    grad: valid(params.get("grad")),
    percentile: valid(params.get("percentile")),
  };
  if (fromUrl.tenth || fromUrl.twelfth || fromUrl.grad || fromUrl.percentile) return fromUrl;
  try {
    const saved = sessionStorage.getItem(PREDICTOR_HANDOFF_KEY);
    if (!saved) return {};
    const parsed: unknown = JSON.parse(saved);
    if (!isPlainObject(parsed)) return {};
    return {
      tenth: valid(parsed.tenth),
      twelfth: valid(parsed.twelfth),
      grad: valid(parsed.grad),
      percentile: valid(parsed.percentile),
    };
  } catch {
    return {};
  }
}

/** Validates the form; returns a CandidateProfile only when every field is filled and in range. */
function validateForm(form: FormState, twelfthStream: Stream): { profile: CandidateProfile | null; missing: string[] } {
  const missing: string[] = [];
  const pct = (v: string, label: string) => {
    const n = parseNum(v);
    if (n === null || n < 30 || n > 100) missing.push(label);
    return n ?? 0;
  };
  const percentile = parseNum(form.percentile);
  if (percentile === null || percentile <= 0 || percentile > 100) missing.push("CAT percentile (0–100)");
  const tenth = pct(form.tenth, "Class 10th % (30–100)");
  const twelfth = pct(form.twelfth, "Class 12th % (30–100)");
  const grad = pct(form.grad, "Graduation % (30–100)");
  const workEx = parseNum(form.workEx);
  if (workEx === null || workEx < 0 || workEx > 600 || !Number.isInteger(workEx)) missing.push("Work experience in months (0 if fresher)");
  if (!form.category) missing.push("Reservation category");
  if (!form.gender) missing.push("Gender");
  if (!form.gradDiscipline) missing.push("Academic stream");
  if (missing.length > 0) return { profile: null, missing };
  return {
    profile: {
      projectedPercentile: percentile as number,
      tenthPercent: tenth,
      twelfthPercent: twelfth,
      gradPercent: grad,
      // The engine does not read twelfthStream; we pass the saved value when there is one.
      twelfthStream,
      gradDiscipline: form.gradDiscipline as Discipline,
      workExMonths: workEx as number,
      category: form.category as Category,
      gender: form.gender as Gender,
    },
    missing,
  };
}

/** Lowest overall raw score whose estimated percentile reaches `p` on the reference curve. */
function overallScoreFor(p: number): number | null {
  for (let s = 0; s <= 198; s++) {
    if (estimatePercentile("OVERALL", s) >= p) return s;
  }
  return null;
}

interface Projections {
  /** Percentile at which the engine first places each school in the Safe tier (null = not below 99.9). */
  safeAt: Record<string, number | null>;
  /** Earliest school to move up a tier as the percentile rises. */
  nextTierUp: { school: BSchool; tier: Tier; percentile: number } | null;
  /** Re-run of the engine at percentile + WHAT_IF_STEP. */
  whatIf: {
    percentile: number;
    step: number;
    movers: { school: BSchool; from: Tier; to: Tier }[];
    marksDelta: number | null;
  } | null;
}

/** All what-if numbers come from re-running evaluateBSchoolChances at higher percentiles. */
function computeProjections(profile: CandidateProfile, base: PredictionResult[]): Projections {
  const current = profile.projectedPercentile;
  const baseRank: Record<string, number> = {};
  const safeAt: Record<string, number | null> = {};
  for (const r of base) {
    baseRank[r.school.id] = TIER_RANK[r.chanceTier];
    safeAt[r.school.id] = r.chanceTier === "Safe" ? current : null;
  }

  let nextTierUp: Projections["nextTierUp"] = null;
  for (let i = 1; ; i++) {
    const p = round1(current + i * 0.1);
    if (p > MAX_PERCENTILE_SWEEP) break;
    const { results } = evaluateBSchoolChances({ ...profile, projectedPercentile: p });
    let pending = false;
    for (const r of results) {
      const id = r.school.id;
      if (!nextTierUp && TIER_RANK[r.chanceTier] > baseRank[id]) {
        nextTierUp = { school: r.school, tier: r.chanceTier, percentile: p };
      }
      if (safeAt[id] === null && r.chanceTier === "Safe") safeAt[id] = p;
      if (safeAt[id] === null) pending = true;
    }
    if (!pending && nextTierUp) break;
  }

  let whatIf: Projections["whatIf"] = null;
  const step = round1(Math.min(WHAT_IF_STEP, MAX_PERCENTILE_SWEEP - current));
  if (step >= 0.1) {
    const target = round1(current + step);
    const { results } = evaluateBSchoolChances({ ...profile, projectedPercentile: target });
    const movers = results
      .filter((r) => TIER_RANK[r.chanceTier] > baseRank[r.school.id])
      .map((r) => ({
        school: r.school,
        from: base.find((b) => b.school.id === r.school.id)!.chanceTier,
        to: r.chanceTier,
      }));
    const fromMarks = overallScoreFor(current);
    const toMarks = overallScoreFor(target);
    const marksDelta = fromMarks !== null && toMarks !== null && toMarks > fromMarks ? toMarks - fromMarks : null;
    whatIf = { percentile: target, step, movers, marksDelta };
  }

  return { safeAt, nextTierUp, whatIf };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BSchoolPredictorPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [twelfthStream, setTwelfthStream] = useState<Stream>("Science");
  const [percentileSource, setPercentileSource] = useState<PercentileSource>(null);
  const [savedTarget, setSavedTarget] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [metricsStatus, setMetricsStatus] = useState<LoadStatus>("loading");
  const [profileStatus, setProfileStatus] = useState<LoadStatus>("loading");
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  const [activeTier, setActiveTier] = useState<"ALL" | "DREAM" | "TARGET" | "SAFE">("ALL");
  const [selectedSchool, setSelectedSchool] = useState<BSchool | null>(null);
  const [showInfoCard, setShowInfoCard] = useState(true);
  const [recalcPulse, setRecalcPulse] = useState(false);

  // On mount: load the saved predictor profile + metrics, then apply any landing-page hand-off.
  useEffect(() => {
    let cancelled = false;
    const handoff = readHandoff();

    async function load() {
      const [profileRes, metricsRes] = await Promise.allSettled([
        fetch("/api/profile", { cache: "no-store" }),
        fetch("/api/me/metrics", { cache: "no-store" }),
      ]);

      let saved: Partial<SavedPredictorProfile> = {};
      if (profileRes.status === "fulfilled") {
        const res = profileRes.value;
        if (res.status === 401) {
          if (!cancelled) setProfileStatus("unauthorized");
        } else if (res.ok) {
          try {
            const data = await res.json();
            const prefs = isPlainObject(data?.user?.preferences) ? data.user.preferences : {};
            saved = readSavedProfile(prefs.predictorProfile);
            if (!cancelled) setProfileStatus("ok");
          } catch {
            if (!cancelled) setProfileStatus("error");
          }
        } else if (!cancelled) {
          setProfileStatus("error");
        }
      } else if (!cancelled) {
        setProfileStatus("error");
      }

      let m: StudentMetrics | null = null;
      if (metricsRes.status === "fulfilled") {
        const res = metricsRes.value;
        if (res.status === 401) {
          if (!cancelled) setMetricsStatus("unauthorized");
        } else if (res.ok) {
          try {
            m = (await res.json()) as StudentMetrics;
            if (!cancelled) {
              setMetrics(m);
              setMetricsStatus("ok");
            }
          } catch {
            if (!cancelled) setMetricsStatus("error");
          }
        } else if (!cancelled) {
          setMetricsStatus("error");
        }
      } else if (!cancelled) {
        setMetricsStatus("error");
      }

      if (cancelled) return;

      const estimate = m?.percentile?.overallEstimate ?? null;
      let percentile = "";
      let source: PercentileSource = null;
      if (handoff.percentile) {
        percentile = handoff.percentile;
        source = "handoff";
      } else if (estimate !== null) {
        percentile = String(estimate);
        source = "estimate";
      } else if (saved.targetPercentile !== undefined) {
        percentile = String(saved.targetPercentile);
        source = "saved";
      }

      setForm({
        tenth: handoff.tenth ?? (saved.tenthPercent !== undefined ? String(saved.tenthPercent) : ""),
        twelfth: handoff.twelfth ?? (saved.twelfthPercent !== undefined ? String(saved.twelfthPercent) : ""),
        grad: handoff.grad ?? (saved.gradPercent !== undefined ? String(saved.gradPercent) : ""),
        workEx: saved.workExMonths !== undefined ? String(saved.workExMonths) : "",
        percentile,
        category: saved.category ?? "",
        gender: saved.gender ?? "",
        gradDiscipline: saved.gradDiscipline ?? "",
      });
      if (saved.twelfthStream) setTwelfthStream(saved.twelfthStream);
      setSavedTarget(saved.targetPercentile ?? null);
      setPercentileSource(source);
      setLoaded(true);
    }

    load().catch((err) => {
      console.error("Failed to load predictor data:", err);
      if (!cancelled) {
        setProfileStatus("error");
        setMetricsStatus("error");
        setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "percentile") setPercentileSource("manual");
    if (saveState.kind !== "idle" && saveState.kind !== "saving") setSaveState({ kind: "idle" });
  };

  const estimate = metrics?.percentile?.overallEstimate ?? null;
  const percentileDisclaimer = metrics?.percentile?.disclaimer || PERCENTILE_DISCLAIMER;
  const readinessScore = metrics?.readiness?.score ?? null;

  const { profile, missing } = useMemo(() => validateForm(form, twelfthStream), [form, twelfthStream]);
  const evaluation = useMemo(() => (profile ? evaluateBSchoolChances(profile) : null), [profile]);
  const projections = useMemo(
    () => (profile && evaluation ? computeProjections(profile, evaluation.results) : null),
    [profile, evaluation]
  );

  const percentileNum = parseNum(form.percentile);
  const showingEstimate =
    percentileSource === "estimate" && estimate !== null && percentileNum !== null && percentileNum === estimate;

  const handleSave = async () => {
    if (!profile) {
      setSaveState({ kind: "error", message: `Please complete: ${missing.join(", ")}.` });
      return;
    }
    setSaveState({ kind: "saving" });
    try {
      // POST replaces the whole preferences object, so read the latest copy and merge into it.
      const current = await fetch("/api/profile", { cache: "no-store" });
      if (current.status === 401) {
        setSaveState({ kind: "error", message: "Sign in to save your profile. Your predictions below still work." });
        return;
      }
      if (!current.ok) throw new Error(`GET /api/profile ${current.status}`);
      const data = await current.json();
      const prefs: Record<string, unknown> = isPlainObject(data?.user?.preferences) ? { ...data.user.preferences } : {};
      const previous = readSavedProfile(prefs.predictorProfile);

      const userTypedPercentile = percentileSource === "manual" || percentileSource === "handoff" || percentileSource === "saved";
      const targetPercentile = userTypedPercentile ? profile.projectedPercentile : previous.targetPercentile;

      const predictorProfile: SavedPredictorProfile = {
        tenthPercent: profile.tenthPercent,
        twelfthPercent: profile.twelfthPercent,
        gradPercent: profile.gradPercent,
        gradDiscipline: profile.gradDiscipline,
        twelfthStream,
        workExMonths: profile.workExMonths,
        category: profile.category,
        gender: profile.gender,
        ...(targetPercentile !== undefined ? { targetPercentile } : {}),
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { ...prefs, predictorProfile } }),
      });
      if (!res.ok) throw new Error(`POST /api/profile ${res.status}`);

      // The landing-page hand-off is now persisted in the profile; stop it overriding future visits.
      try {
        sessionStorage.removeItem(PREDICTOR_HANDOFF_KEY);
        if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
      } catch {
        /* ignore */
      }

      setSavedTarget(targetPercentile ?? null);
      setProfileStatus("ok");
      setSaveState({ kind: "saved" });
      setRecalcPulse(true);
      setTimeout(() => setRecalcPulse(false), 900);
    } catch (err) {
      console.error("Failed to save predictor profile:", err);
      setSaveState({ kind: "error", message: "Couldn't save your profile right now. Please try again." });
    }
  };

  // Slider fill percentages
  const percentileSliderValue = percentileNum !== null ? Math.min(99.9, Math.max(50, percentileNum)) : 50;
  const percentileSliderFill =
    percentileNum !== null ? Math.min(100, Math.max(0, ((percentileSliderValue - 50) / (99.9 - 50)) * 100)) : 0;
  const workExNum = parseNum(form.workEx);
  const workExSliderValue = workExNum !== null ? Math.min(60, Math.max(0, workExNum)) : 0;
  const workExSliderFill = workExNum !== null ? Math.min(100, Math.max(0, (workExSliderValue / 60) * 100)) : 0;

  const results = evaluation?.results ?? [];
  const counts = {
    Safe: results.filter((r) => r.chanceTier === "Safe").length,
    Target: results.filter((r) => r.chanceTier === "Target").length,
    Dream: results.filter((r) => r.chanceTier === "Dream").length,
  };
  const cutoffsCleared = results.filter((r) => r.isCutoffCleared).length;

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

  const schoolAdvice = (item: PredictionResult): string => {
    if (!profile || !projections) return "";
    if (item.chanceTier === "Safe") return "The model places this school in your Safe zone at your current inputs.";
    const at = projections.safeAt[item.school.id];
    if (at !== null && at !== undefined) {
      return `With your current academics, the model reaches the Safe zone at ~${fmtPct(at)} %ile (+${round1(at - profile.projectedPercentile)}).`;
    }
    return `The model doesn't reach the Safe zone below ${MAX_PERCENTILE_SWEEP} %ile with your current academics and work experience.`;
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Sticky App Header */}
      <header className={styles.darkHeader}>
        <div className={styles.headerInner}>
          <nav className={styles.topNav} aria-label="B-School Predictor Navigation">
            <Link href="/" className={styles.brandLogo} title="Back to TechnoCAT Home">
              <BrandLogo height={70} />
            </Link>

            <div className={styles.navLinks}>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/browse" className={styles.navLink}>Browse</Link>
              <Link href="/topics" className={styles.navLink}>My Topics</Link>
              <Link href="/intelligence" className={`${styles.navLink} ${styles.navLinkActive}`}>Intelligence Hub</Link>
              <Link href="/mock-viva-prep" className={styles.navLink}>Speak & Assess</Link>
            </div>

            <PostLoginNavActions />
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/intelligence" className={styles.breadcrumbLink}>Intelligence Hub</Link> &gt; <span>B-School Predictor &amp; Admission Engine</span>
      </div>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroBadge}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}>
            <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.8L12 22l-2.4-7.2L2.4 12l7.2-2.8z" />
          </svg>
          COMPOSITE SCORE &amp; ADMISSION ENGINE
        </div>
        <h1 className={styles.heroTitle}>
          Your Target B-Schools, <span>Projected from Your Journey.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          You don&apos;t have an official CAT score yet — and that&apos;s okay. Enter your academics and a CAT percentile
          (estimated from your PYQ section scores when available, or your own target) and the predictor applies each
          institute&apos;s published cutoffs and shortlisting weights to estimate your call chances. These are model
          estimates, not guarantees.
        </p>

        {/* Estimated percentile banner (from /api/me/metrics) */}
        <div className={styles.projectionBanner}>
          <div className={styles.bannerText}>
            <span className={styles.bannerSparkle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </span>
            {metricsStatus === "loading" ? (
              <span>Loading your estimated percentile…</span>
            ) : estimate !== null ? (
              <span>
                From your latest PYQ section scores
                {metrics?.percentile?.overallScore !== null && metrics?.percentile?.overallScore !== undefined
                  ? ` (${metrics.percentile.overallScore} marks overall)`
                  : ""}
                , your <strong>Estimated</strong> CAT percentile is{" "}
                <span className={styles.bannerHighlight}>{fmtPct(estimate)} %ile</span>
                <span className={styles.bannerDisclaimer}>{percentileDisclaimer}</span>
              </span>
            ) : metricsStatus === "ok" ? (
              <span>
                No estimated percentile yet — attempt a PYQ in all three sections (VARC, DILR, QA) to get one.
                Until then, enter a target or expected percentile below.
              </span>
            ) : metricsStatus === "unauthorized" ? (
              <span>Sign in to see a percentile estimated from your PYQ scores. Meanwhile, enter a target percentile below.</span>
            ) : (
              <span>We couldn&apos;t load your estimated percentile right now. Enter a target percentile below.</span>
            )}
          </div>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
            Edit the percentile below to test &apos;What-If&apos; score goals.
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
                    {!loaded
                      ? "Loading your saved profile…"
                      : profileStatus === "unauthorized"
                      ? "Fill in your academics and category. Sign in to save them to your profile."
                      : "Fill in your academics and category once — we save them to your profile."}
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

            {/* Percentile Box */}
            <div className={styles.percentileSectionBox}>
              <div className={styles.labelRow}>
                <span className={styles.labelWithInfo}>
                  {showingEstimate ? "Estimated CAT Percentile" : "Target / Expected CAT Percentile"}
                  <span
                    className={styles.infoIconCircle}
                    title="Change the percentile to test how different CAT outcomes affect the model's estimates"
                  >
                    i
                  </span>
                </span>
                <span className={styles.valueInputPill}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="—"
                    aria-label="CAT percentile"
                    className={styles.valueInput}
                    value={form.percentile}
                    disabled={!loaded}
                    onChange={(e) => updateField("percentile", e.target.value)}
                  />
                  %ile
                </span>
              </div>

              <div className={styles.sliderTrackWrapper}>
                <input
                  type="range"
                  min="50"
                  max="99.9"
                  step="0.1"
                  value={percentileSliderValue}
                  disabled={!loaded}
                  aria-label="CAT percentile slider"
                  className={styles.slider}
                  style={{
                    background: `linear-gradient(90deg, #2563EB 0%, #0EA5E9 ${percentileSliderFill}%, #E2E8F0 ${percentileSliderFill}%, #E2E8F0 100%)`,
                  }}
                  onChange={(e) => updateField("percentile", e.target.value)}
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

              {loaded && (
                <div className={styles.fieldHint}>
                  {showingEstimate ? (
                    <>
                      <span className={styles.estimateTag}>Estimated from your PYQ scores</span>
                      <span className={styles.fieldHintSmall}>{percentileDisclaimer}</span>
                    </>
                  ) : estimate !== null ? (
                    <>
                      Testing a what-if percentile. Your Estimated percentile from PYQs is {fmtPct(estimate)}.{" "}
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => {
                          setForm((prev) => ({ ...prev, percentile: String(estimate) }));
                          setPercentileSource("estimate");
                        }}
                      >
                        Use my estimate
                      </button>
                    </>
                  ) : percentileNum === null ? (
                    <>Enter the CAT percentile you expect or are aiming for. Attempt a PYQ in all three sections to get an estimate from your scores.</>
                  ) : percentileSource === "handoff" ? (
                    <>Percentile carried over from the predictor you filled in. Edit it any time.</>
                  ) : percentileSource === "saved" && savedTarget !== null ? (
                    <>Your saved target percentile. Edit it any time.</>
                  ) : (
                    <>Your target percentile — this is your input, not an estimate.</>
                  )}
                </div>
              )}
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
                    value={form.category}
                    disabled={!loaded}
                    onChange={(e) => updateField("category", e.target.value as Category | "")}
                  >
                    <option value="">Select category</option>
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
                    value={form.gender}
                    disabled={!loaded}
                    onChange={(e) => updateField("gender", e.target.value as Gender | "")}
                  >
                    <option value="">Select gender</option>
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
                      placeholder="Enter %"
                      className={styles.inputFieldClean}
                      value={form.tenth}
                      disabled={!loaded}
                      onChange={(e) => updateField("tenth", e.target.value)}
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
                      placeholder="Enter %"
                      className={styles.inputFieldClean}
                      value={form.twelfth}
                      disabled={!loaded}
                      onChange={(e) => updateField("twelfth", e.target.value)}
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
                      placeholder="Enter %"
                      className={styles.inputFieldClean}
                      value={form.grad}
                      disabled={!loaded}
                      onChange={(e) => updateField("grad", e.target.value)}
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
                    value={form.gradDiscipline}
                    disabled={!loaded}
                    onChange={(e) => updateField("gradDiscipline", e.target.value as Discipline | "")}
                  >
                    <option value="">Select stream</option>
                    <option value="Engineering">Engineering (B.Tech / B.E)</option>
                    <option value="Non-Engineering">Non-Engineering (B.Com/B.Sc/BBA/BA)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Work Experience Box */}
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
                    title="Full-time paid work experience after graduation. Enter 0 if you are a fresher."
                  >
                    i
                  </span>
                </span>
                <span className={styles.valueInputPill}>
                  <input
                    type="number"
                    min="0"
                    max="600"
                    step="1"
                    placeholder="—"
                    aria-label="Work experience in months"
                    className={styles.valueInput}
                    value={form.workEx}
                    disabled={!loaded}
                    onChange={(e) => updateField("workEx", e.target.value)}
                  />
                  Months
                </span>
              </div>

              <div className={styles.sliderTrackWrapper}>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={workExSliderValue}
                  disabled={!loaded}
                  aria-label="Work experience slider"
                  className={styles.slider}
                  style={{
                    background: `linear-gradient(90deg, #2563EB 0%, #0EA5E9 ${workExSliderFill}%, #DBEAFE ${workExSliderFill}%, #E2E8F0 100%)`,
                  }}
                  onChange={(e) => updateField("workEx", e.target.value)}
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
              {loaded && workExNum === null && (
                <div className={styles.fieldHint}>Enter your months of full-time work experience (0 if you&apos;re a fresher).</div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              className={styles.recalcBtn}
              onClick={handleSave}
              disabled={!loaded || saveState.kind === "saving"}
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
              <span>
                {saveState.kind === "saving"
                  ? "Saving…"
                  : saveState.kind === "saved"
                  ? "Profile Saved & Recalculated"
                  : "Save Profile & Recalculate"}
              </span>
              <span className={styles.recalcBtnArrow} aria-hidden="true">›</span>
            </button>
            {saveState.kind === "error" && (
              <div className={`${styles.saveStatus} ${styles.saveStatusError}`} role="alert">{saveState.message}</div>
            )}
            {saveState.kind === "saved" && (
              <div className={styles.saveStatus}>Saved to your profile — it will be pre-filled next time.</div>
            )}
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
                      Model estimate across published IIM shortlisting criteria.
                    </p>
                  </div>
                </div>

                <div className={styles.liveAnalysisBadge}>
                  <span className={styles.liveDot} />
                  Model Estimate
                </div>
              </div>

              {!loaded ? (
                <div className={styles.emptyState}>Loading your profile…</div>
              ) : !profile || !evaluation ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateTitle}>Complete your profile to see your admission strength</div>
                  <p>Still needed:</p>
                  <ul className={styles.emptyStateList}>
                    {missing.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <StrengthMeter
                  profile={profile}
                  evaluation={evaluation}
                  showingEstimate={showingEstimate}
                  readinessScore={readinessScore}
                  metricsStatus={metricsStatus}
                  counts={counts}
                  cutoffsCleared={cutoffsCleared}
                  total={results.length}
                  projections={projections}
                />
              )}
            </div>

            {/* What-if Box (computed by re-running the engine) */}
            {profile && projections?.whatIf && (
              <div className={styles.whatIfBox}>
                <div className={styles.whatIfBulb} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                  </svg>
                </div>
                <div className={styles.whatIfText}>
                  <strong>What-if:</strong> at{" "}
                  <strong className={styles.whatIfAccent}>{fmtPct(projections.whatIf.percentile)} %ile</strong> (+
                  {projections.whatIf.step}),{" "}
                  {projections.whatIf.movers.length > 0 ? (
                    <>
                      the model moves{" "}
                      <strong className={styles.whatIfAccent}>
                        {projections.whatIf.movers.length} school{projections.whatIf.movers.length === 1 ? "" : "s"}
                      </strong>{" "}
                      up a tier:{" "}
                      {projections.whatIf.movers
                        .map((mv) => `${mv.school.shortName} (${mv.from} → ${mv.to})`)
                        .join(", ")}
                      .
                    </>
                  ) : (
                    <>no school changes tier in the model — your academics and work experience set the limit here.</>
                  )}
                  {projections.whatIf.marksDelta !== null && (
                    <span className={styles.whatIfSmall}>
                      On the estimated CAT 2024 overall score curve, that is roughly +{projections.whatIf.marksDelta} marks.
                      Estimated — not an official score-percentile mapping.
                    </span>
                  )}
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
            )}
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
                {profile
                  ? `Model estimates for ${CATEGORY_LABEL[profile.category]} candidates, using published cutoffs and shortlisting weights.`
                  : "Complete your profile above to see model estimates for each institute."}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                className={styles.infoToggleBtn}
                onClick={() => setShowInfoCard(!showInfoCard)}
                title="Click to view guide on Dream, Target, and Safe tiers"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "5px" }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                {showInfoCard ? "Hide Tier Guide" : "What are Dream, Target & Safe?"}
              </button>

              {evaluation && (
                <div className={styles.tierTabs}>
                  {(["ALL", "DREAM", "TARGET", "SAFE"] as const).map((tier) => (
                    <button
                      key={tier}
                      className={`${styles.tierBtn} ${activeTier === tier ? styles.tierBtnActive : ""}`}
                      onClick={() => setActiveTier(tier)}
                    >
                      {tier === "ALL" && `All Schools (${results.length})`}
                      {tier === "DREAM" && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          Dream ({counts.Dream})
                        </span>
                      )}
                      {tier === "TARGET" && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                          </svg>
                          Target ({counts.Target})
                        </span>
                      )}
                      {tier === "SAFE" && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          Safe ({counts.Safe})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.modelNote} role="note">
            <strong>How to read this:</strong> chances are estimates from TechnoCAT&apos;s model, which applies each
            institute&apos;s published past cutoffs and shortlisting weights to the numbers you entered. They are not
            guarantees of a call — real cutoffs change every year and depend on the applicant pool, sectional
            cutoffs and institute-specific rules.
          </div>

          {/* i-Card (Admission Tier & Composite Score Explanation Guide) */}
          {showInfoCard && (
            <div className={styles.infoCard}>
              <div className={styles.infoCardTop}>
                <div className={styles.infoCardTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "text-bottom", marginRight: "6px" }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Understanding Admission Call Tiers &amp; Composite Scores
                  <span className={styles.infoCardBadge}>Quick Student Guide</span>
                </div>
                <button
                  onClick={() => setShowInfoCard(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94A3B8",
                    padding: "4px 8px",
                    display: "inline-flex",
                    alignItems: "center"
                  }}
                  title="Close Guide"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className={styles.infoTiersGrid}>
                <div className={`${styles.infoTierBox} ${styles.infoTierDream}`}>
                  <div className={styles.infoTierHeader}>
                    <span className={styles.infoTierName} style={{ color: "#6B21A8", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      Dream (Ambitious)
                    </span>
                    <span className={styles.infoTierOdds} style={{ background: "#F3E8FF", color: "#7E22CE" }}>Model score &lt; 60</span>
                  </div>
                  <p className={styles.infoTierDesc}>
                    Aspirational reach schools. With your current percentile and profile, the model sees the call as unlikely.
                  </p>
                  <div className={styles.infoTierStrategy} style={{ color: "#7E22CE", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginTop: "2px", flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span><strong>Strategy:</strong> Use the what-if box above to see the percentile at which a school moves into your Target zone.</span>
                  </div>
                </div>

                <div className={`${styles.infoTierBox} ${styles.infoTierTarget}`}>
                  <div className={styles.infoTierHeader}>
                    <span className={styles.infoTierName} style={{ color: "#1E40AF", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                      Target (Competitive)
                    </span>
                    <span className={styles.infoTierOdds} style={{ background: "#DBEAFE", color: "#1D4ED8" }}>Model score 60 – 84</span>
                  </div>
                  <p className={styles.infoTierDesc}>
                    Your realistic sweet spot: your inputs sit close to or above the school&apos;s past cutoff and composite profile.
                  </p>
                  <div className={styles.infoTierStrategy} style={{ color: "#1D4ED8", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginTop: "2px", flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span><strong>Strategy:</strong> Maintain consistency, clear sectional cutoffs, and prepare for interviews.</span>
                  </div>
                </div>

                <div className={`${styles.infoTierBox} ${styles.infoTierSafe}`}>
                  <div className={styles.infoTierHeader}>
                    <span className={styles.infoTierName} style={{ color: "#065F46", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Safe (Solid Bet)
                    </span>
                    <span className={styles.infoTierOdds} style={{ background: "#DCFCE7", color: "#15803D" }}>Model score 85+</span>
                  </div>
                  <p className={styles.infoTierDesc}>
                    Your inputs clear the school&apos;s past cutoff with a comfortable buffer in the model.
                  </p>
                  <div className={styles.infoTierStrategy} style={{ color: "#15803D", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginTop: "2px", flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span><strong>Strategy:</strong> Good backups — still apply on time and meet every sectional cutoff.</span>
                  </div>
                </div>
              </div>

              <div className={styles.infoFormulaNote}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px", flexShrink: 0 }}>
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                </svg>
                <span>
                  <strong>Why not just CAT percentile?</strong> Top B-schools shortlist on a <em>Composite Score (0–100)</em>.
                  In this model the CAT component carries {CAT_WEIGHT_MIN}–{CAT_WEIGHT_MAX}% of the weight depending on the
                  institute, alongside 10th &amp; 12th boards, graduation, work experience, and gender/academic diversity points.
                </span>
              </div>
            </div>
          )}

          {!evaluation ? (
            <div className={styles.emptyState} style={{ marginTop: "24px" }}>
              <div className={styles.emptyStateTitle}>
                {loaded ? "Your shortlist appears once your profile is complete" : "Loading…"}
              </div>
              {loaded && <p>Fill in every field in Candidate Credentials &amp; CAT Target above.</p>}
            </div>
          ) : (
            <div className={styles.collegeGrid} style={{ marginTop: "24px" }}>
              {filteredResults.map((item) => (
                <div key={item.school.id} className={styles.collegeCard}>
                  <div>
                    <div className={styles.colTop}>
                      <div className={styles.colAvatar} style={{ background: item.school.logoBg }}>
                        {item.school.shortName.charAt(0)}
                      </div>
                      <span className={getChancePillClass(item.chanceTier)}>
                        {item.chanceTier === "Safe" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            Safe · model {item.callProbability}
                          </span>
                        )}
                        {item.chanceTier === "Target" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="6" />
                              <circle cx="12" cy="12" r="2" />
                            </svg>
                            Target · model {item.callProbability}
                          </span>
                        )}
                        {item.chanceTier === "Dream" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            Dream · model {item.callProbability}
                          </span>
                        )}
                      </span>
                    </div>

                    <h3 className={styles.colName}>{item.school.shortName}</h3>
                    <div className={styles.colLocation}>{item.school.location}</div>

                    <div className={styles.colStatsRow}>
                      <div className={styles.statItem}>
                        <span className={styles.statLbl}>Past {CATEGORY_LABEL[profile!.category]} Cutoff</span>
                        <span className={styles.statValue}>
                          {item.school.overallCutoff[profile!.category]} %ile
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

                    <p className={styles.colAdvice}>{schoolAdvice(item)}</p>
                  </div>

                  <button className={styles.btnCriteria} onClick={() => setSelectedSchool(item.school)}>
                    View Selection Criteria &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* College Criteria Modal */}
      {selectedSchool && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSchool(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedSchool(null)} aria-label="Close modal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
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
              Shortlisting Weightage Used by the Model
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

// ---------------------------------------------------------------------------
// Strength meter (only rendered once the profile is complete)
// ---------------------------------------------------------------------------

function StrengthMeter({
  profile,
  evaluation,
  showingEstimate,
  readinessScore,
  metricsStatus,
  counts,
  cutoffsCleared,
  total,
  projections,
}: {
  profile: CandidateProfile;
  evaluation: ReturnType<typeof evaluateBSchoolChances>;
  showingEstimate: boolean;
  readinessScore: number | null;
  metricsStatus: LoadStatus;
  counts: Record<Tier, number>;
  cutoffsCleared: number;
  total: number;
  projections: Projections | null;
}) {
  const { profileRating, diversityScore } = evaluation;

  // Parse profileRating into primary title and parenthetical subtitle for the circular gauge badge
  const ratingMatch = profileRating.match(/^([^(]+)(\(.+\))?$/);
  const ratingPrimary = ratingMatch ? ratingMatch[1].trim() : profileRating;
  const ratingSecondary = ratingMatch && ratingMatch[2] ? ratingMatch[2].trim() : "(Academic Profile)";

  // Circular gauge geometry
  const gaugeRadius = 88;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeProgress = Math.min(0.96, Math.max(0.02, (profile.projectedPercentile - 45) / (100 - 45)));
  const gaugeDashOffset = gaugeCircumference * (1 - gaugeProgress);

  // Evaluation factor bars — each mirrors how the engine scores that factor
  const diversityBarPercent = Math.min(100, (diversityScore / 10) * 100);
  const wxRatio = workExRatio(profile.workExMonths);
  const workExBarPercent = wxRatio * 100;
  const workExLabel =
    wxRatio === 1
      ? "Full points (24–36 mo)"
      : wxRatio > 0
      ? `${Math.round(wxRatio * 100)}% of points`
      : profile.workExMonths === 0
      ? "Fresher (0 pts)"
      : "0 pts (over 48 mo)";
  const catBonus = CATEGORY_BONUS[profile.category];
  const categoryBarPercent = (catBonus / MAX_CATEGORY_BONUS) * 100;

  const next = projections?.nextTierUp ?? null;

  return (
    <>
      {/* Center Row: Circular Gauge + 4 Profile Insights Cards */}
      <div className={styles.meterAndInsightsGrid}>
        {/* Circular Gauge */}
        <div className={styles.gaugeWrapper}>
          <div className={styles.gaugeOuterRing}>
            <svg className={styles.gaugeSvg} viewBox="0 0 210 210" aria-hidden="true">
              <defs>
                <linearGradient id="strengthMeterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="45%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <circle cx="105" cy="105" r={gaugeRadius} fill="none" stroke="#E2E8F0" strokeWidth="14" />
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
              <div className={styles.percentileNumber}>{fmtPct(profile.projectedPercentile)}</div>
              <div className={styles.percentileLabel}>{showingEstimate ? "ESTIMATED %ILE" : "TARGET %ILE"}</div>
              <div className={styles.profileRatingBadge}>
                <span className={styles.ratingPrimaryText}>{ratingPrimary}</span>
                <span className={styles.ratingSecondaryText}>{ratingSecondary}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stack: 4 data-derived insight cards */}
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
              <div className={styles.insightTitle}>CAT Readiness</div>
              <div className={styles.insightDesc}>
                {readinessScore !== null
                  ? `${readinessScore}/100 from your concepts, accuracy, speed and consistency.`
                  : metricsStatus === "ok"
                  ? "Attempt a timed test to unlock your readiness score."
                  : metricsStatus === "loading"
                  ? "Loading…"
                  : "Readiness is unavailable right now."}
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
              <div className={styles.insightTitle}>Cutoffs Cleared</div>
              <div className={styles.insightDesc}>
                {cutoffsCleared} of {total} past {CATEGORY_LABEL[profile.category]} overall cutoffs at{" "}
                {fmtPct(profile.projectedPercentile)} %ile
              </div>
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
              <div className={styles.insightTitle}>Model Call Zones</div>
              <div className={styles.insightDesc}>
                {counts.Safe} Safe · {counts.Target} Target · {counts.Dream} Dream
              </div>
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
              <div className={styles.insightTitle}>Next Tier-Up</div>
              <div className={styles.insightDesc}>
                {next
                  ? `${next.school.shortName} moves to ${next.tier} at ~${fmtPct(next.percentile)} %ile (+${round1(next.percentile - profile.projectedPercentile)}).`
                  : counts.Safe === total
                  ? "Every school is already in your Safe zone."
                  : `No tier changes below ${MAX_PERCENTILE_SWEEP} %ile with your current academics.`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Evaluation Factors */}
      <div className={styles.evaluationFactorsCard}>
        <div className={styles.evalFactorsHeader}>
          <span className={styles.evalFactorsTitle}>Key Evaluation Factors</span>
          <span className={styles.evalFactorsSub}>As scored by the model</span>
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
              <div className={styles.metricBarFill} style={{ width: `${diversityBarPercent}%` }} />
            </div>
            <span className={styles.metricVal}>+{diversityScore} of 10 Pts</span>
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
              <div className={styles.metricBarFill} style={{ width: `${workExBarPercent}%` }} />
            </div>
            <span className={styles.metricVal}>{workExLabel}</span>
          </div>

          <div className={styles.metricRow}>
            <div className={styles.metricLeft}>
              <span className={styles.metricIconOrange} aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </span>
              <span>Category Adjustment</span>
            </div>
            <div className={styles.metricBarTrack}>
              <div className={styles.metricBarFill} style={{ width: `${categoryBarPercent}%` }} />
            </div>
            <span className={styles.metricVal}>
              {catBonus > 0 ? `+${catBonus} composite pts (${CATEGORY_LABEL[profile.category]})` : "No adjustment (General)"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
