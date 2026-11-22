"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  ChevronRight,
  Crosshair,
  Gauge,
  GraduationCap,
  Info,
  Layers,
  Lightbulb,
  Save,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";
import styles from "./b-school-predictor.module.css";
import AppNav from "@/components/app/AppNav";
import BackLink from "@/components/app/BackLink";
import { Reveal, RevealGroup, RevealItem, GradientText } from "@/components/landing/motion";
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

  const schoolAdvice = (item: PredictionResult): string => {
    if (!profile || !projections) return "";
    if (item.chanceTier === "Safe") return "The model places this school in your Safe zone at your current inputs.";
    const at = projections.safeAt[item.school.id];
    if (at !== null && at !== undefined) {
      return `With your current academics, the model reaches the Safe zone at ~${fmtPct(at)} %ile (+${round1(at - profile.projectedPercentile)}).`;
    }
    return `The model doesn't reach the Safe zone below ${MAX_PERCENTILE_SWEEP} %ile with your current academics and work experience.`;
  };

  const tierClass = (tier: Tier) => (tier === "Safe" ? styles.tierSafe : tier === "Target" ? styles.tierTarget : styles.tierDream);
  const tierIcon = (tier: Tier) =>
    tier === "Safe" ? <ShieldCheck size={13} aria-hidden="true" /> : tier === "Target" ? <Crosshair size={13} aria-hidden="true" /> : <Star size={13} aria-hidden="true" />;
  const rankOf = (item: PredictionResult) => results.indexOf(item) + 1;

  return (
    <div className={styles.page}>
      <AppNav />

      <main className={styles.main}>
        {/* Page header */}
        <Reveal className={styles.head}>
          <BackLink href="/intelligence" label="Back to Intelligence Hub" />
          <div className={styles.headRow}>
            <div className={styles.headText}>
              <h1 className={styles.title}>
                Your target B-schools, <GradientText>projected</GradientText>
              </h1>
              <p className={styles.lede}>
                You don&apos;t have an official CAT score yet, and that&apos;s okay. Enter your academics and a CAT percentile
                (estimated from your PYQ section scores when available, or your own target) and the predictor applies each
                institute&apos;s published cutoffs and shortlisting weights to estimate your call chances. These are model
                estimates, not guarantees.
              </p>
            </div>
          </div>

          {/* Estimated percentile banner (from /api/me/metrics) */}
          <div className={`glass-card ${styles.banner}`} data-tint="blue">
            <Target size={18} className={styles.bannerIcon} aria-hidden="true" />
            <div className={styles.bannerText}>
              {metricsStatus === "loading" ? (
                <span>Loading your estimated percentile…</span>
              ) : estimate !== null ? (
                <span>
                  From your latest PYQ section scores
                  {metrics?.percentile?.overallScore !== null && metrics?.percentile?.overallScore !== undefined
                    ? ` (${metrics.percentile.overallScore} marks overall)`
                    : ""}
                  , your <strong>estimated</strong> CAT percentile is{" "}
                  <span className={styles.bannerHighlight}>{fmtPct(estimate)} %ile</span>
                  <span className={styles.bannerDisclaimer}>{percentileDisclaimer}</span>
                </span>
              ) : metricsStatus === "ok" ? (
                <span>
                  No estimated percentile yet. Attempt a PYQ in all three sections (VARC, DILR, QA) to get one.
                  Until then, enter a target or expected percentile below.
                </span>
              ) : metricsStatus === "unauthorized" ? (
                <span>Sign in to see a percentile estimated from your PYQ scores. Meanwhile, enter a target percentile below.</span>
              ) : (
                <span>We couldn&apos;t load your estimated percentile right now. Enter a target percentile below.</span>
              )}
            </div>
            <span className={styles.bannerHint}>Edit the percentile below to test what-if score goals.</span>
          </div>
        </Reveal>

        {/* Split grid: inputs vs summary */}
        <div className={styles.splitGrid}>
          {/* Left: candidate credentials & CAT target */}
          <Reveal className={`glass-card ${styles.formCard}`} data-tint="blue">
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Candidate credentials <span className={styles.titleMuted}>&amp; CAT target</span></h2>
              <p className={styles.cardSub}>
                {!loaded
                  ? "Loading your saved profile…"
                  : profileStatus === "unauthorized"
                  ? "Fill in your academics and category. Sign in to save them to your profile."
                  : "Fill in your academics and category once; we save them to your profile."}
              </p>
            </div>

            {/* Percentile */}
            <div className={styles.rangeBox}>
              <div className={styles.labelRow}>
                <span className={styles.labelWithInfo}>
                  <Gauge size={16} aria-hidden="true" style={{ color: "#3B82F6" }} />
                  {showingEstimate ? "Estimated CAT percentile" : "Target / expected CAT percentile"}
                  <span className={styles.infoIcon} title="Change the percentile to test how different CAT outcomes affect the model's estimates">
                    <Info size={14} aria-hidden="true" />
                  </span>
                </span>
                <span className={styles.valuePill}>
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

              <div className={styles.sliderWrap}>
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
                    background: `linear-gradient(90deg, #2556E0 0%, #06B6D4 ${percentileSliderFill}%, #E4E9F2 ${percentileSliderFill}%, #E4E9F2 100%)`,
                  }}
                  onChange={(e) => updateField("percentile", e.target.value)}
                />
                <div className={styles.sliderScale}>
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
                      Testing a what-if percentile. Your estimated percentile from PYQs is {fmtPct(estimate)}.{" "}
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
                    <>Your target percentile. This is your input, not an estimate.</>
                  )}
                </div>
              )}
            </div>

            {/* Profile inputs */}
            <div className={styles.fieldsGrid}>
              <label className={styles.field}>
                <span className={styles.label}><Users size={15} aria-hidden="true" />Reservation category</span>
                <select
                  className={styles.control}
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
              </label>

              <label className={styles.field}>
                <span className={styles.label}><UserRound size={15} aria-hidden="true" />Gender diversity</span>
                <select
                  className={styles.control}
                  value={form.gender}
                  disabled={!loaded}
                  onChange={(e) => updateField("gender", e.target.value as Gender | "")}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female (+Gender Diversity Points)</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}><BookOpen size={15} aria-hidden="true" />Class 10th score (%)</span>
                <span className={styles.controlWrap}>
                  <input
                    type="number"
                    min="30"
                    max="100"
                    step="any"
                    placeholder="Enter %"
                    className={styles.controlInput}
                    value={form.tenth}
                    disabled={!loaded}
                    onChange={(e) => updateField("tenth", e.target.value)}
                  />
                  <span className={styles.suffix}>/ 100</span>
                </span>
              </label>

              <label className={styles.field}>
                <span className={styles.label}><BookOpen size={15} aria-hidden="true" />Class 12th score (%)</span>
                <span className={styles.controlWrap}>
                  <input
                    type="number"
                    min="30"
                    max="100"
                    step="any"
                    placeholder="Enter %"
                    className={styles.controlInput}
                    value={form.twelfth}
                    disabled={!loaded}
                    onChange={(e) => updateField("twelfth", e.target.value)}
                  />
                  <span className={styles.suffix}>/ 100</span>
                </span>
              </label>

              <label className={styles.field}>
                <span className={styles.label}><GraduationCap size={15} aria-hidden="true" />Graduation score (%)</span>
                <span className={styles.controlWrap}>
                  <input
                    type="number"
                    min="30"
                    max="100"
                    step="any"
                    placeholder="Enter %"
                    className={styles.controlInput}
                    value={form.grad}
                    disabled={!loaded}
                    onChange={(e) => updateField("grad", e.target.value)}
                  />
                  <span className={styles.suffix}>/ 100</span>
                </span>
              </label>

              <label className={styles.field}>
                <span className={styles.label}><Layers size={15} aria-hidden="true" />Academic stream</span>
                <select
                  className={styles.control}
                  value={form.gradDiscipline}
                  disabled={!loaded}
                  onChange={(e) => updateField("gradDiscipline", e.target.value as Discipline | "")}
                >
                  <option value="">Select stream</option>
                  <option value="Engineering">Engineering (B.Tech / B.E)</option>
                  <option value="Non-Engineering">Non-Engineering (B.Com/B.Sc/BBA/BA)</option>
                </select>
              </label>
            </div>

            {/* Work experience */}
            <div className={styles.rangeBox}>
              <div className={styles.labelRow}>
                <span className={styles.labelWithInfo}>
                  <Briefcase size={16} aria-hidden="true" style={{ color: "#3B82F6" }} />
                  Full-time work experience
                  <span className={styles.infoIcon} title="Full-time paid work experience after graduation. Enter 0 if you are a fresher.">
                    <Info size={14} aria-hidden="true" />
                  </span>
                </span>
                <span className={styles.valuePill}>
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
                  months
                </span>
              </div>

              <div className={styles.sliderWrap}>
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
                    background: `linear-gradient(90deg, #2556E0 0%, #06B6D4 ${workExSliderFill}%, #E4E9F2 ${workExSliderFill}%, #E4E9F2 100%)`,
                  }}
                  onChange={(e) => updateField("workEx", e.target.value)}
                />
                <div className={styles.sliderScale}>
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

            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}
              onClick={handleSave}
              disabled={!loaded || saveState.kind === "saving"}
            >
              <Save size={17} aria-hidden="true" />
              <span>
                {saveState.kind === "saving"
                  ? "Saving…"
                  : saveState.kind === "saved"
                  ? "Profile saved & recalculated"
                  : "Save profile & recalculate"}
              </span>
            </button>
            {saveState.kind === "error" && (
              <div className={`${styles.saveStatus} ${styles.saveStatusError}`} role="alert">{saveState.message}</div>
            )}
            {saveState.kind === "saved" && (
              <div className={styles.saveStatus}>Saved to your profile. It will be pre-filled next time.</div>
            )}
          </Reveal>

          {/* Right: admission strength (featured summary) */}
          <Reveal delay={0.08} className={`${styles.summaryCard} ${recalcPulse ? styles.summaryPulse : ""}`}>
            <div className={styles.summaryHead}>
              <div>
                <h2 className={styles.summaryTitle}>Admission strength</h2>
                <p className={styles.summarySub}>Model estimate across published IIM shortlisting criteria.</p>
              </div>
              <span className={styles.modelBadge}><span className={styles.liveDot} aria-hidden="true" />Model estimate</span>
            </div>

            {!loaded ? (
              <div className={styles.summaryEmpty}>Loading your profile…</div>
            ) : !profile || !evaluation ? (
              <div className={styles.summaryEmpty}>
                <div className={styles.summaryEmptyTitle}>Complete your profile to see your admission strength</div>
                <p>Still needed:</p>
                <ul className={styles.missingList}>
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

            {/* What-if (computed by re-running the engine) */}
            {profile && projections?.whatIf && (
              <div className={styles.whatIf}>
                <Lightbulb size={18} className={styles.whatIfIcon} aria-hidden="true" />
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
                    <>no school changes tier in the model; your academics and work experience set the limit here.</>
                  )}
                  {projections.whatIf.marksDelta !== null && (
                    <span className={styles.whatIfSmall}>
                      On the estimated CAT 2024 overall score curve, that is roughly +{projections.whatIf.marksDelta} marks.
                      Estimated, not an official score-percentile mapping.
                    </span>
                  )}
                </div>
              </div>
            )}
          </Reveal>
        </div>

        {/* Results */}
        <section className={styles.results} aria-labelledby="shortlist-title">
          <Reveal className={styles.resultsHead}>
            <div>
              <h2 id="shortlist-title" className={styles.sectionTitle}>
                Predicted B-school <GradientText>shortlist</GradientText>
              </h2>
              <p className={styles.sectionSub}>
                {profile
                  ? `Model estimates for ${CATEGORY_LABEL[profile.category]} candidates, using published cutoffs and shortlisting weights.`
                  : "Complete your profile above to see model estimates for each institute."}
              </p>
            </div>

            <div className={styles.resultsTools}>
              <button
                type="button"
                className={styles.guideBtn}
                onClick={() => setShowInfoCard(!showInfoCard)}
                aria-expanded={showInfoCard}
              >
                <Info size={15} aria-hidden="true" />
                {showInfoCard ? "Hide tier guide" : "What are Dream, Target & Safe?"}
              </button>

              {evaluation && (
                <div className={styles.segment} role="group" aria-label="Filter by tier">
                  {(["ALL", "DREAM", "TARGET", "SAFE"] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      aria-pressed={activeTier === tier}
                      className={`${styles.segBtn} ${activeTier === tier ? styles.segBtnActive : ""}`}
                      onClick={() => setActiveTier(tier)}
                    >
                      {tier === "ALL" && <>All <span className={styles.segCount}>{results.length}</span></>}
                      {tier === "DREAM" && <><i className={styles.dotDream} aria-hidden="true" />Dream <span className={styles.segCount}>{counts.Dream}</span></>}
                      {tier === "TARGET" && <><i className={styles.dotTarget} aria-hidden="true" />Target <span className={styles.segCount}>{counts.Target}</span></>}
                      {tier === "SAFE" && <><i className={styles.dotSafe} aria-hidden="true" />Safe <span className={styles.segCount}>{counts.Safe}</span></>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          <p className={styles.modelNote} role="note">
            <strong>How to read this:</strong> chances are estimates from TechnoCAT&apos;s model, which applies each
            institute&apos;s published past cutoffs and shortlisting weights to the numbers you entered. They are not
            guarantees of a call; real cutoffs change every year and depend on the applicant pool, sectional
            cutoffs and institute-specific rules.
          </p>

          {/* Tier guide */}
          {showInfoCard && (
            <Reveal className={styles.guide}>
              <div className={styles.guideTop}>
                <h3 className={styles.guideTitle}>Understanding admission call tiers &amp; composite scores</h3>
                <button type="button" className={styles.iconBtn} onClick={() => setShowInfoCard(false)} aria-label="Close guide">
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <RevealGroup className={styles.guideGrid}>
                <RevealItem className={`glass-card ${styles.guideTier}`} data-tint="violet">
                  <div className={styles.guideTierHead}>
                    <span className={`${styles.tierName} ${styles.tierDream}`}><Star size={15} aria-hidden="true" />Dream (ambitious)</span>
                    <span className={styles.guideOdds}>Model score &lt; 60</span>
                  </div>
                  <p className={styles.guideDesc}>
                    Aspirational reach schools. With your current percentile and profile, the model sees the call as unlikely.
                  </p>
                  <p className={styles.guideStrategy}><strong>Strategy:</strong> Use the what-if box above to see the percentile at which a school moves into your Target zone.</p>
                </RevealItem>

                <RevealItem className={`glass-card ${styles.guideTier}`} data-tint="blue">
                  <div className={styles.guideTierHead}>
                    <span className={`${styles.tierName} ${styles.tierTarget}`}><Crosshair size={15} aria-hidden="true" />Target (competitive)</span>
                    <span className={styles.guideOdds}>Model score 60 – 84</span>
                  </div>
                  <p className={styles.guideDesc}>
                    Your realistic sweet spot: your inputs sit close to or above the school&apos;s past cutoff and composite profile.
                  </p>
                  <p className={styles.guideStrategy}><strong>Strategy:</strong> Maintain consistency, clear sectional cutoffs, and prepare for interviews.</p>
                </RevealItem>

                <RevealItem className={`glass-card ${styles.guideTier}`} data-tint="teal">
                  <div className={styles.guideTierHead}>
                    <span className={`${styles.tierName} ${styles.tierSafe}`}><ShieldCheck size={15} aria-hidden="true" />Safe (solid bet)</span>
                    <span className={styles.guideOdds}>Model score 85+</span>
                  </div>
                  <p className={styles.guideDesc}>
                    Your inputs clear the school&apos;s past cutoff with a comfortable buffer in the model.
                  </p>
                  <p className={styles.guideStrategy}><strong>Strategy:</strong> Good backups. Still apply on time and meet every sectional cutoff.</p>
                </RevealItem>
              </RevealGroup>

              <div className={styles.formulaNote}>
                <Lightbulb size={16} aria-hidden="true" />
                <span>
                  <strong>Why not just CAT percentile?</strong> Top B-schools shortlist on a <em>Composite Score (0–100)</em>.
                  In this model the CAT component carries {CAT_WEIGHT_MIN}–{CAT_WEIGHT_MAX}% of the weight depending on the
                  institute, alongside 10th &amp; 12th boards, graduation, work experience, and gender/academic diversity points.
                </span>
              </div>
            </Reveal>
          )}

          {!evaluation ? (
            <div className={`glass-card ${styles.emptyCard}`} data-tint="blue">
              <div className={styles.emptyTitle}>
                {loaded ? "Your shortlist appears once your profile is complete" : "Loading…"}
              </div>
              {loaded && <p>Fill in every field in candidate credentials &amp; CAT target above.</p>}
            </div>
          ) : (
            <div className={`glass-card ${styles.table}`} data-tint="blue">
              <div className={styles.tableHead} aria-hidden="true">
                <span>#</span>
                <span>Institute</span>
                <span>Model chance</span>
                <span>Past {CATEGORY_LABEL[profile!.category]} cutoff</span>
                <span>Composite</span>
                <span>Avg CTC</span>
                <span>Fees</span>
                <span />
              </div>
              <RevealGroup className={styles.tableBody}>
                {filteredResults.map((item) => (
                  <RevealItem key={item.school.id}>
                    <div className={`${styles.row} ${tierClass(item.chanceTier)}`}>
                      <span className={styles.rank}>{String(rankOf(item)).padStart(2, "0")}</span>

                      <div className={styles.school}>
                        <span className={styles.avatar} style={{ background: item.school.logoBg }} aria-hidden="true">
                          {item.school.shortName.charAt(0)}
                        </span>
                        <div className={styles.schoolText}>
                          <h3 className={styles.schoolName}>{item.school.shortName}</h3>
                          <span className={styles.schoolLoc}>{item.school.location}</span>
                        </div>
                      </div>

                      <div className={styles.chance}>
                        <div className={styles.chanceTop}>
                          <span className={styles.tierChip}>{tierIcon(item.chanceTier)}{item.chanceTier}</span>
                          <span className={styles.chanceVal}>{item.callProbability}</span>
                        </div>
                        <div className={styles.meter} aria-label={`Model score ${item.callProbability} of 100`}>
                          <span className={styles.meterFill} style={{ width: `${item.callProbability}%` }} />
                          <span className={styles.meterTick} style={{ left: "60%" }} />
                          <span className={styles.meterTick} style={{ left: "85%" }} />
                        </div>
                      </div>

                      <div className={styles.cell}>
                        <span className={styles.cellLbl}>Past {CATEGORY_LABEL[profile!.category]} cutoff</span>
                        <span className={`${styles.cellVal} ${item.isCutoffCleared ? styles.cleared : ""}`}>
                          {item.school.overallCutoff[profile!.category]} %ile
                        </span>
                      </div>
                      <div className={styles.cell}>
                        <span className={styles.cellLbl}>Composite call index</span>
                        <span className={`${styles.cellVal} ${styles.cellAccent}`}>{item.compositeScore}<small>/100</small></span>
                      </div>
                      <div className={styles.cell}>
                        <span className={styles.cellLbl}>Avg CTC package</span>
                        <span className={styles.cellVal}>₹{item.school.avgPackageLpa} LPA</span>
                      </div>
                      <div className={styles.cell}>
                        <span className={styles.cellLbl}>Tuition fee</span>
                        <span className={styles.cellVal}>₹{item.school.feesLakhs}L</span>
                      </div>

                      <button type="button" className={styles.criteriaBtn} onClick={() => setSelectedSchool(item.school)}>
                        Criteria <ArrowRight size={14} aria-hidden="true" />
                      </button>

                      <p className={styles.advice}>{schoolAdvice(item)}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          )}
        </section>
      </main>

      {/* College criteria modal */}
      {selectedSchool && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSchool(null)}>
          <div className={styles.modalBox} role="dialog" aria-modal="true" aria-labelledby="criteria-title" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={`${styles.iconBtn} ${styles.modalClose}`} onClick={() => setSelectedSchool(null)} aria-label="Close modal">
              <X size={16} aria-hidden="true" />
            </button>
            <div className={styles.modalHead}>
              <span className={styles.avatar} style={{ background: selectedSchool.logoBg, width: 44, height: 44, fontSize: 17 }} aria-hidden="true">
                {selectedSchool.shortName.charAt(0)}
              </span>
              <div>
                <h3 id="criteria-title" className={styles.modalTitle}>{selectedSchool.name}</h3>
                <span className={styles.modalBadge}>{selectedSchool.badge}</span>
              </div>
            </div>

            <p className={styles.modalSummary}>{selectedSchool.criteriaSummary}</p>

            <h4 className={styles.modalSubhead}>Shortlisting weightage used by the model</h4>
            <div className={styles.weightsGrid}>
              {[
                { label: "CAT score", value: selectedSchool.weights.catPercentile, color: "#3B82F6" },
                { label: "Class 10th marks", value: selectedSchool.weights.tenthMarks, color: "#06B6D4" },
                { label: "Class 12th marks", value: selectedSchool.weights.twelfthMarks, color: "#14B8A6" },
                { label: "Graduation marks", value: selectedSchool.weights.graduationMarks, color: "#8B5CF6" },
                { label: "Work experience", value: selectedSchool.weights.workExperience, color: "#F59E0B" },
                { label: "Diversity points", value: selectedSchool.weights.genderDiversity + selectedSchool.weights.academicDiversity, color: "#10B981" },
              ].map((w) => (
                <div key={w.label} className={styles.weightItem}>
                  <div className={styles.weightTop}>
                    <span>{w.label}</span>
                    <strong>{w.value}%</strong>
                  </div>
                  <span className={styles.weightTrack}><span style={{ width: `${Math.min(100, w.value)}%`, background: w.color }} /></span>
                </div>
              ))}
            </div>

            <div className={styles.highlight}>
              <span className={styles.highlightLbl}>Campus highlight</span>
              <span>{selectedSchool.keyHighlight}</span>
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
  const zoneTotal = Math.max(1, counts.Safe + counts.Target + counts.Dream);

  return (
    <>
      <div className={styles.meterGrid}>
        {/* Circular gauge */}
        <div className={styles.gauge}>
          <svg className={styles.gaugeSvg} viewBox="0 0 210 210" aria-hidden="true">
            <defs>
              <linearGradient id="strengthMeterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93C5FD" />
                <stop offset="100%" stopColor="#67E8F9" />
              </linearGradient>
            </defs>
            <circle cx="105" cy="105" r={gaugeRadius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
            <circle
              cx="105"
              cy="105"
              r={gaugeRadius}
              fill="none"
              stroke="url(#strengthMeterGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={gaugeCircumference}
              strokeDashoffset={gaugeDashOffset}
              transform="rotate(-90 105 105)"
              style={{ transition: "stroke-dashoffset 0.45s ease" }}
            />
          </svg>
          <div className={styles.gaugeInner}>
            <span className={styles.gaugeLabel}>{showingEstimate ? "Estimated %ile" : "Target %ile"}</span>
            <span className={styles.gaugeValue}>{fmtPct(profile.projectedPercentile)}</span>
            <span className={styles.rating}>
              <strong>{ratingPrimary}</strong>
              <small>{ratingSecondary}</small>
            </span>
          </div>
        </div>

        {/* Data-derived insights */}
        <div className={styles.insights}>
          <div className={styles.zones}>
            <div className={styles.zonesTop}>
              <span className={styles.insightTitle}>Model call zones</span>
              <span className={styles.zonesLegend}>
                <span><i className={styles.dotSafe} />{counts.Safe} Safe</span>
                <span><i className={styles.dotTarget} />{counts.Target} Target</span>
                <span><i className={styles.dotDream} />{counts.Dream} Dream</span>
              </span>
            </div>
            <div className={styles.zoneBar} aria-label={`${counts.Safe} Safe, ${counts.Target} Target, ${counts.Dream} Dream`}>
              {counts.Safe > 0 && <span className={styles.zoneSafe} style={{ flexGrow: counts.Safe / zoneTotal }} />}
              {counts.Target > 0 && <span className={styles.zoneTarget} style={{ flexGrow: counts.Target / zoneTotal }} />}
              {counts.Dream > 0 && <span className={styles.zoneDream} style={{ flexGrow: counts.Dream / zoneTotal }} />}
            </div>
          </div>

          <div className={styles.insight}>
            <Trophy size={16} aria-hidden="true" style={{ color: "#67E8F9" }} />
            <div>
              <div className={styles.insightTitle}>Cutoffs cleared</div>
              <div className={styles.insightDesc}>
                <strong>{cutoffsCleared} of {total}</strong> past {CATEGORY_LABEL[profile.category]} overall cutoffs at{" "}
                {fmtPct(profile.projectedPercentile)} %ile
              </div>
            </div>
          </div>

          <div className={styles.insight}>
            <TrendingUp size={16} aria-hidden="true" style={{ color: "#FCD34D" }} />
            <div>
              <div className={styles.insightTitle}>Next tier-up</div>
              <div className={styles.insightDesc}>
                {next
                  ? `${next.school.shortName} moves to ${next.tier} at ~${fmtPct(next.percentile)} %ile (+${round1(next.percentile - profile.projectedPercentile)}).`
                  : counts.Safe === total
                  ? "Every school is already in your Safe zone."
                  : `No tier changes below ${MAX_PERCENTILE_SWEEP} %ile with your current academics.`}
              </div>
            </div>
          </div>

          <div className={styles.insight}>
            <Gauge size={16} aria-hidden="true" style={{ color: "#C4B5FD" }} />
            <div>
              <div className={styles.insightTitle}>CAT readiness</div>
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
        </div>
      </div>

      {/* Key evaluation factors */}
      <div className={styles.factors}>
        <div className={styles.factorsHead}>
          <span className={styles.factorsTitle}>Key evaluation factors</span>
          <span className={styles.factorsSub}>As scored by the model</span>
        </div>

        <div className={styles.factorRow}>
          <span className={styles.factorName}><Users size={15} aria-hidden="true" />Diversity bonus points</span>
          <span className={styles.factorTrack}><span style={{ width: `${diversityBarPercent}%`, background: "#2DD4BF" }} /></span>
          <span className={styles.factorVal}>+{diversityScore} of 10 pts</span>
        </div>

        <div className={styles.factorRow}>
          <span className={styles.factorName}><Briefcase size={15} aria-hidden="true" />Work experience rating</span>
          <span className={styles.factorTrack}><span style={{ width: `${workExBarPercent}%`, background: "#60A5FA" }} /></span>
          <span className={styles.factorVal}>{workExLabel}</span>
        </div>

        <div className={styles.factorRow}>
          <span className={styles.factorName}><Star size={15} aria-hidden="true" />Category adjustment</span>
          <span className={styles.factorTrack}><span style={{ width: `${categoryBarPercent}%`, background: "#FBBF24" }} /></span>
          <span className={styles.factorVal}>
            {catBonus > 0 ? `+${catBonus} composite pts (${CATEGORY_LABEL[profile.category]})` : "No adjustment (General)"}
          </span>
        </div>
      </div>
    </>
  );
}
