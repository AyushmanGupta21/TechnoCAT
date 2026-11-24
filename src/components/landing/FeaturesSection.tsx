"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EASE_OUT, GradientText, RevealGroup, RevealItem, SectionHead, SpotlightCard, type Tint, useReplay } from "@/components/landing/motion";
import ui from "@/components/landing/ui.module.css";
import styles from "./FeaturesSection.module.css";

const inView = { once: false, amount: 0.25 } as const;

/* ------------------------------------------------------------------ */
/* Product vignettes: small coded previews instead of icon tiles       */
/* ------------------------------------------------------------------ */

/** Score-trend chart that draws itself in on the featured card */
function TrendChart() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  const line = "M4 92 C 40 86, 60 70, 92 72 S 150 48, 182 50 S 240 22, 276 14";
  const area = `${line} L 276 112 L 4 112 Z`;
  return (
    <div className={styles.chart} aria-hidden="true">
      <div className={styles.chartHead}>
        <span className={styles.chartLabel}>Overall percentile</span>
        <span className={`${ui.figure} ${styles.chartValue}`}>
          98.4<small>%ile</small>
        </span>
      </div>
      <svg viewBox="0 0 280 116" className={styles.chartSvg} preserveAspectRatio="none">
        <defs>
          <linearGradient id="featTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93b4fd" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#93b4fd" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="featTrendLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
        </defs>
        {[28, 56, 84].map((y) => (
          <line key={y} x1="0" x2="280" y1={y} y2={y} stroke="rgba(255,255,255,0.12)" strokeDasharray="2 4" />
        ))}
        <motion.path
          d={area}
          fill="url(#featTrendFill)"
          initial={{ opacity: 0 }}
          animate={rv ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.55, delay: reduce ? 0 : 1 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke="url(#featTrendLine)"
          strokeWidth="2.25"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={rv ? { pathLength: 1 } : { pathLength: reduce ? 1 : 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.2 }}
        />
      </svg>
      <div className={styles.chartAxis}>
        <span>Mock 1</span>
        <span>Mock 6</span>
        <span>Mock 12</span>
      </div>
    </div>
  );
}

const ERROR_ROWS = [
  { q: "Q14", sec: "DILR", tag: "Concept", c: "var(--tint-coral)" },
  { q: "Q06", sec: "QA", tag: "Calculation", c: "var(--tint-amber)" },
  { q: "Q21", sec: "VARC", tag: "Speed", c: "var(--tint-violet)" },
];

function ErrorVignette() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  return (
    <div className={styles.vig} aria-hidden="true">
      {ERROR_ROWS.map((r, i) => (
        <motion.div
          key={r.q}
          className={styles.errRow}
          initial={{ opacity: 0, x: reduce ? 0 : -8 }}
          animate={rv ? { opacity: 1, x: 0 } : { opacity: 0, x: reduce ? 0 : -8 }}
          transition={{ delay: reduce ? 0 : 0.15 + i * 0.09, duration: 0.45, ease: EASE_OUT }}
        >
          <span className={`${ui.figure} ${styles.errQ}`}>{r.q}</span>
          <span className={styles.errSec}>{r.sec}</span>
          <span className={styles.errTag} style={{ "--c": r.c } as React.CSSProperties}>
            <i className={styles.errDot} />
            {r.tag}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

const SCHOOLS = [
  { name: "IIM Ahmedabad", w: 0.48, c: "var(--data-violet)" },
  { name: "IIM Bangalore", w: 0.62, c: "var(--data-blue)" },
  { name: "IIM Calcutta", w: 0.78, c: "var(--data-teal)" },
];

function PredictorVignette() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  return (
    <div className={styles.vig} aria-hidden="true">
      {SCHOOLS.map((s, i) => (
        <div key={s.name} className={styles.rankRow}>
          <span className={`${ui.figure} ${styles.rankN}`}>{i + 1}</span>
          <span className={styles.rankName}>{s.name}</span>
          <span className={styles.rankTrack}>
            <motion.span
              className={styles.rankFill}
              style={{ background: s.c }}
              initial={{ scaleX: reduce ? s.w : 0 }}
              animate={rv ? { scaleX: s.w } : { scaleX: reduce ? s.w : 0 }}
              transition={{ delay: reduce ? 0 : 0.2 + i * 0.1, duration: 0.55, ease: EASE_OUT }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

function MockVignette() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  return (
    <div className={`${styles.vig} ${styles.mockVig}`} aria-hidden="true">
      <div className={styles.timerBox}>
        <span className={styles.timerLabel}>VARC</span>
        <span className={`${ui.figure} ${styles.timerVal}`}>40:00</span>
      </div>
      <div className={styles.palette}>
        {Array.from({ length: 12 }, (_, i) => (
          <motion.span
            key={i}
            className={`${styles.pCell} ${i < 5 ? styles.pDone : ""} ${i === 5 ? styles.pNow : ""} ${i === 2 ? styles.pMark : ""}`}
            initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
            animate={rv ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduce ? 1 : 0.6 }}
            transition={{ delay: reduce ? 0 : 0.1 + i * 0.035, duration: 0.3, ease: EASE_OUT }}
          >
            {i + 1}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

const ANALYTICS = [
  { sec: "VARC", acc: 0.82, spd: 0.64, att: 0.72 },
  { sec: "DILR", acc: 0.58, spd: 0.46, att: 0.5 },
  { sec: "QA", acc: 0.74, spd: 0.7, att: 0.66 },
];

function AnalyticsVignette() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  return (
    <div className={`${styles.vig} ${styles.anaVig}`} aria-hidden="true">
      <div className={styles.anaBars}>
        {ANALYTICS.map((a, i) => (
          <div key={a.sec} className={styles.anaGroup}>
            <div className={styles.anaPair}>
              {[a.acc, a.spd, a.att].map((v, j) => (
                <motion.span
                  key={j}
                  className={[styles.barAcc, styles.barSpd, styles.barAtt][j]}
                  style={{ height: `${v * 100}%` }}
                  initial={{ scaleY: reduce ? 1 : 0 }}
                  animate={rv ? { scaleY: 1 } : { scaleY: reduce ? 1 : 0 }}
                  transition={{ delay: reduce ? 0 : 0.15 + i * 0.1 + j * 0.05, duration: 0.55, ease: EASE_OUT }}
                />
              ))}
            </div>
            <span className={styles.anaLabel}>{a.sec}</span>
          </div>
        ))}
      </div>
      <div className={styles.anaLegend}>
        <span>
          <i className={styles.dotAcc} /> Accuracy
        </span>
        <span>
          <i className={styles.dotSpd} /> Speed
        </span>
        <span>
          <i className={styles.dotAtt} /> Attempts
        </span>
        <svg viewBox="0 0 120 36" className={styles.anaSpark}>
          <defs>
            <linearGradient id="anaSparkGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <motion.path
            d="M2 30 C 20 26, 30 18, 48 20 S 80 8, 118 6"
            fill="none"
            stroke="url(#anaSparkGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={rv ? { pathLength: 1 } : { pathLength: reduce ? 1 : 0 }}
            transition={{ delay: reduce ? 0 : 0.4, duration: 0.55, ease: EASE_OUT }}
          />
        </svg>
      </div>
    </div>
  );
}

function CommunityVignette() {
  const rv = useReplay();
  const reduce = useReducedMotion();
  return (
    <div className={`${styles.vig} ${styles.comVig}`} aria-hidden="true">
      <div className={styles.avatars}>
        {[
          ["AK", "var(--tint-blue)"],
          ["RS", "var(--tint-teal)"],
          ["MP", "var(--tint-amber)"],
          ["NV", "var(--tint-violet)"],
        ].map(([n, c]) => (
          <span key={n} className={styles.avatar} style={{ "--c": c } as React.CSSProperties}>
            {n}
          </span>
        ))}
      </div>
      <motion.div
        className={styles.reply}
        initial={{ opacity: 0, y: reduce ? 0 : 8 }}
        animate={rv ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 8 }}
        transition={{ delay: reduce ? 0 : 0.3, duration: 0.5, ease: EASE_OUT }}
      >
        Try the LR set first, then switch to DI.
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type Feature = {
  title: string;
  desc: string;
  linkText: string;
  href: string;
  Vignette?: () => React.ReactElement;
  area: string;
  tint: Tint;
};

const featured = {
  title: "AI performance analysis",
  desc: "A personal AI mentor reads every mock you take and shows where your marks are leaking, section by section.",
  linkText: "Smarter analysis, better scores",
  href: "/intelligence/ai-analysis",
};

const features: Feature[] = [
  {
    title: "Error tracking",
    desc: "Mistakes sorted by type, so you stop repeating them.",
    linkText: "Learn from mistakes",
    href: "/intelligence/error-tracking",
    Vignette: ErrorVignette,
    area: "error",
    tint: "coral",
  },
  {
    title: "B-school predictor",
    desc: "Your chances at top IIMs from percentile and profile.",
    linkText: "Plan your target list",
    href: "/intelligence/b-school-predictor",
    Vignette: PredictorVignette,
    area: "predict",
    tint: "violet",
  },
  {
    title: "Sectional and full mocks",
    desc: "6 free sectionals and 1 full mock. No credit card required.",
    linkText: "Real exam experience",
    href: "/browse?section=mocks&mock=latest#pyq-section",
    Vignette: MockVignette,
    area: "mocks",
    tint: "teal",
  },
  {
    title: "Detailed analytics",
    desc: "Accuracy, speed, attempts and improvement areas after every test.",
    linkText: "Track your progress",
    href: "/analytics",
    Vignette: AnalyticsVignette,
    area: "analytics",
    tint: "blue",
  },
  {
    title: "Learning community",
    desc: "Talk strategy with other aspirants and stay consistent.",
    linkText: "Join the discussion",
    href: "/intelligence/community",
    Vignette: CommunityVignette,
    area: "community",
    tint: "amber",
  },
];

export default function FeaturesSection() {
  const { user, openAuthModal } = useAuth();

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!user || user.isGuest) {
      e.preventDefault();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", href);
      }
      openAuthModal("signin");
    }
  };

  return (
    <section className={styles.section} id="features">
      <div className={ui.container}>
        <SectionHead
          eyebrow="Why choose TechnoCAT mocks"
          title={<>Key features of <GradientText>TechnoCAT mocks</GradientText></>}
          lede="Practice under real conditions, then see exactly what to fix."
          className={styles.head}
        />

        <RevealGroup className={styles.grid} stagger={0.05}>
          <RevealItem className={styles.featuredCell}>
            <SpotlightCard tone="dark" className={`${styles.card} ${styles.cardFeatured}`}>
              <Link
                href={featured.href}
                onClick={(e) => handleCardClick(e, featured.href)}
                className={`${styles.cardLink} ${styles.featuredLink}`}
              >
                <h3 className={styles.featTitle}>{featured.title}</h3>
                <p className={styles.featDesc}>{featured.desc}</p>
                <TrendChart />
                <span className={styles.cardFoot}>
                  {featured.linkText}
                  <ArrowUpRight size={16} strokeWidth={1.75} className={styles.footArrow} />
                </span>
              </Link>
            </SpotlightCard>
          </RevealItem>

          {features.map((f) => (
            <RevealItem key={f.title} className={`${styles.cell} ${styles[`a_${f.area}`] ?? ""}`}>
              <SpotlightCard tint={f.tint} className={styles.card}>
                <Link
                  href={f.href}
                  onClick={(e) => handleCardClick(e, f.href)}
                  className={styles.cardLink}
                  aria-label={`${f.title}: ${f.linkText}`}
                >
                  {f.Vignette && <f.Vignette />}
                  <div className={styles.cardText}>
                    <h3 className={styles.cardTitle}>
                      {f.title}
                      <ArrowUpRight size={16} strokeWidth={1.75} className={styles.footArrow} />
                    </h3>
                    <p className={styles.cardDesc}>{f.desc}</p>
                  </div>
                </Link>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
