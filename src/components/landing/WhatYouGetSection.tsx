"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpenText,
  ChartColumn,
  Clock3,
  Compass,
  FileStack,
  Gauge,
  Layers,
  PlayCircle,
  ShieldCheck,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import CardInfoModal, { CardInfoData } from "./CardInfoModal";
import styles from "./WhatYouGetSection.module.css";
import ui from "@/components/landing/ui.module.css";
import { CountUp, EASE_OUT, GradientText, RevealGroup, RevealItem, SectionHead, SpotlightCard, type Tint, useReplay } from "@/components/landing/motion";

type Stat = {
  id: string;
  value: number;
  suffix?: string;
  title: string;
  details: string[];
  route: string;
};

const stats: Stat[] = [
  {
    id: "full_mocks",
    value: 35,
    title: "Full-length CAT mocks",
    details: ["20 proctored full mocks", "15 unproctored full mocks"],
    route: "/dashboard",
  },
  {
    id: "sectionals",
    value: 45,
    title: "Sectional CAT mock tests",
    details: ["15 mocks each for VARC, LRDI and QA"],
    route: "/topics",
  },
  {
    id: "pyqs",
    value: 24,
    title: "PYQs as mocks",
    details: ["Attempt actual exam papers as CAT mocks"],
    route: "/browse?section=pyqs#pyq-section",
  },
  {
    id: "omet",
    value: 15,
    title: "OMET mocks",
    details: ["XAT, NMAT, SNAP, MAH-CET and other MBA exams"],
    route: "/#courses",
  },
  {
    id: "solutions",
    value: 100,
    suffix: "%",
    title: "Detailed solutions",
    details: ["Text and video solutions for every mock"],
    route: "/#why-stand-out",
  },
  {
    id: "ai_analysis",
    value: 3,
    suffix: "×",
    title: "Faster mock analysis",
    details: ["AI analysis saves 3x the time you spend reviewing a mock"],
    route: "/intelligence/ai-analysis",
  },
];

const featureIcons = [
  { Icon: BookOpenText, label: "Personalised study plan", route: "/dashboard", color: "var(--data-blue)" },
  { Icon: Compass, label: "Strategy builder", route: "/intelligence", color: "var(--data-teal)" },
  { Icon: TrendingUp, label: "Weak topic recommendations", route: "/intelligence/ai-analysis", color: "var(--data-coral)" },
  { Icon: ChartColumn, label: "Progress reports", route: "/analytics", color: "var(--data-violet)" },
  { Icon: Smartphone, label: "Works on mobile", route: "/dashboard", color: "var(--data-amber)" },
];

/* Each light card gets its own glass tint and matching accent for its figure */
const CARD_TINT: Record<string, { tint?: Tint; accent: string }> = {
  full_mocks: { accent: "#fff" },
  sectionals: { tint: "teal", accent: "#0f9488" },
  pyqs: { tint: "violet", accent: "#7c3aed" },
  omet: { tint: "amber", accent: "#d97706" },
  solutions: { tint: "coral", accent: "#e11d48" },
  ai_analysis: { tint: "blue", accent: "var(--blue-600)" },
};

/* Small label chip per card (inline icon at text size) */
const CARD_LABEL: Record<string, { label: string; Icon: typeof Layers }> = {
  sectionals: { label: "Sectionals", Icon: Layers },
  pyqs: { label: "Past papers", Icon: FileStack },
  omet: { label: "Other MBA exams", Icon: Compass },
  solutions: { label: "Video + text", Icon: PlayCircle },
  ai_analysis: { label: "AI analysis", Icon: Gauge },
};

const SECTION_COLORS: Record<string, string> = {
  VARC: "var(--data-blue)",
  LRDI: "var(--data-teal)",
  QA: "var(--data-amber)",
};
const TAG_COLORS = ["var(--tint-blue)", "var(--tint-teal)", "var(--tint-violet)", "var(--tint-coral)"];

/* Small coded product vignettes, one per stat card */
function Vignette({ id, reduce }: { id: string; reduce: boolean }) {
  const rv = useReplay();
  const grow = (i: number) => ({
    initial: { scaleX: reduce ? 1 : 0 },
    animate: rv ? { scaleX: 1 } : { scaleX: reduce ? 1 : 0 },
    transition: { duration: 0.55, delay: reduce ? 0 : 0.2 + i * 0.12, ease: EASE_OUT },
  });
  const pop = (i: number) => ({
    initial: { opacity: 0, scale: reduce ? 1 : 0.5 },
    animate: rv ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduce ? 1 : 0.5 },
    transition: { duration: 0.3, delay: reduce ? 0 : 0.15 + i * 0.02, ease: EASE_OUT },
  });

  switch (id) {
    case "full_mocks":
      return (
        <div className={styles.vMocks} aria-hidden="true">
          <div className={styles.vSplit}>
            <motion.span className={styles.vSplitA} style={{ flexGrow: 20, originX: 0 }} {...grow(0)} />
            <motion.span className={styles.vSplitB} style={{ flexGrow: 15, originX: 0 }} {...grow(1)} />
          </div>
          <div className={styles.vLegend}>
            <span><i className={styles.dotA} />20 proctored</span>
            <span><i className={styles.dotB} />15 unproctored</span>
          </div>
        </div>
      );
    case "sectionals":
      return (
        <div className={styles.vBars} aria-hidden="true">
          {["VARC", "LRDI", "QA"].map((k, i) => (
            <div key={k} className={styles.vBarRow}>
              <span className={styles.vKey}>{k}</span>
              <span className={styles.vTrack}>
                <motion.span className={styles.vFill} style={{ originX: 0, background: SECTION_COLORS[k] }} {...grow(i)} />
              </span>
              <span className={styles.vNum}>15</span>
            </div>
          ))}
        </div>
      );
    case "pyqs":
      return (
        <div className={styles.vCells} aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.span key={i} className={styles.vCell} {...pop(i)} />
          ))}
        </div>
      );
    case "omet":
      return (
        <div className={styles.vTags} aria-hidden="true">
          {["XAT", "NMAT", "SNAP", "MAH-CET"].map((t, i) => (
            <motion.span
              key={t}
              className={styles.vTag}
              style={{ "--tag": TAG_COLORS[i] } as React.CSSProperties}
              {...pop(i * 3)}
            >
              {t}
            </motion.span>
          ))}
        </div>
      );
    case "solutions":
      return (
        <div className={styles.vPlayer} aria-hidden="true">
          <span className={styles.vPlay} />
          <span className={styles.vTrack}>
            <motion.span className={styles.vFill} style={{ originX: 0, width: "62%" }} {...grow(0)} />
          </span>
          <span className={styles.vNum}>04:12</span>
        </div>
      );
    case "ai_analysis":
      return (
        <div className={styles.vCompare} aria-hidden="true">
          <div className={styles.vBarRow}>
            <span className={styles.vKey}>Manual</span>
            <span className={styles.vTrack}>
              <motion.span className={`${styles.vFill} ${styles.vFillMuted}`} style={{ originX: 0 }} {...grow(0)} />
            </span>
            <span className={styles.vNum}>3h</span>
          </div>
          <div className={styles.vBarRow}>
            <span className={styles.vKey}>TechnoCAT</span>
            <span className={styles.vTrack}>
              <motion.span className={`${styles.vFill} ${styles.vFillGood}`} style={{ originX: 0, width: "33%" }} {...grow(1)} />
            </span>
            <span className={styles.vNum}>1h</span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

/* Featured card illustration: a fanned stack of mock papers + live chip */
function FeaturedArt({ reduce }: { reduce: boolean }) {
  const rv = useReplay();
  const sheets = [
    { r: -9, x: -26, y: 10, o: 0.45 },
    { r: -4, x: -12, y: 4, o: 0.7 },
    { r: 2, x: 0, y: 0, o: 1 },
  ];
  return (
    <div className={styles.art} aria-hidden="true">
      {sheets.map((sh, i) => (
        <motion.div
          key={i}
          className={`${styles.sheet} ${i === 2 ? styles.sheetTop : ""}`}
          initial={{ rotate: 0, x: 0, y: 24, opacity: 0 }}
          animate={rv ? { rotate: sh.r, x: sh.x, y: sh.y, opacity: sh.o } : { rotate: 0, x: 0, y: 24, opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : 0.15 + i * 0.12, ease: EASE_OUT }}
        >
          {i === 2 && (
            <>
              <div className={styles.sheetHead}>
                <span className={styles.sheetTitle}>Mock 12</span>
                <span className={styles.sheetTimer}>
                  <Clock3 size={11} strokeWidth={2} /> 2:00:00
                </span>
              </div>
              <div className={styles.sheetSecs}>
                {(["VARC", "LRDI", "QA"] as const).map((k, j) => (
                  <span key={k} style={{ "--sc": SECTION_COLORS[k] } as React.CSSProperties}>
                    <motion.i
                      style={{ originX: 0 }}
                      initial={{ scaleX: reduce ? 1 : 0 }}
                      animate={rv ? { scaleX: 1 } : { scaleX: reduce ? 1 : 0 }}
                      transition={{ duration: 0.55, delay: reduce ? 0 : 0.6 + j * 0.12, ease: EASE_OUT }}
                    />
                    {k}
                  </span>
                ))}
              </div>
              <div className={styles.sheetGrid}>
                {Array.from({ length: 15 }).map((_, j) => (
                  <motion.b
                    key={j}
                    initial={{ opacity: 0, scale: reduce ? 1 : 0.4 }}
                    animate={rv ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduce ? 1 : 0.4 }}
                    transition={{ duration: 0.25, delay: reduce ? 0 : 0.7 + j * 0.03 }}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>
      ))}
      <motion.span
        className={styles.liveChip}
        initial={{ opacity: 0, y: reduce ? 0 : 10, scale: reduce ? 1 : 0.9 }}
        animate={rv ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: reduce ? 0 : 10, scale: reduce ? 1 : 0.9 }}
        transition={{ duration: 0.6, delay: reduce ? 0 : 1.1, ease: EASE_OUT }}
      >
        <ShieldCheck size={13} strokeWidth={2} /> Proctored
      </motion.span>
    </div>
  );
}

export default function WhatYouGetSection() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [modalData, setModalData] = useState<CardInfoData | null>(null);
  const reduce = !!useReducedMotion();

  const handleRouteClick = (route: string) => {
    if (route.startsWith("/#") || route.startsWith("#")) {
      const id = route.replace(/^\/?#/, "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
      router.push(route);
      return;
    }

    if (!user || user.isGuest) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", route);
      }
      openAuthModal("signin");
      return;
    }

    router.push(route);
  };

  return (
    <>
      <section className={`${ui.section} ${ui.sectionCanvas} ${styles.sec}`} id="what-you-get">
        <div className={ui.container}>
          <SectionHead
            eyebrow="What you get"
            title={
              <>
                Everything in a <GradientText>TechnoCAT mock series</GradientText>
              </>
            }
            lede="Full mocks, sectionals, past papers and other MBA exams, all with solutions."
            className={styles.compactHead}
          />

          <RevealGroup className={styles.grid} stagger={0.05}>
            {stats.map((s) => {
              const feature = s.id === "full_mocks";
              const lab = CARD_LABEL[s.id];
              return (
                <RevealItem key={s.id} className={`${styles.cell} ${styles[`a_${s.id}`]}`}>
                  <SpotlightCard
                    className={`${styles.card} ${feature ? styles.cardFeature : ""} ${styles[`c_${s.id}`] ?? ""}`}
                    tone={feature ? "dark" : "light"}
                    tint={CARD_TINT[s.id]?.tint}
                    style={{ "--acc": CARD_TINT[s.id]?.accent } as React.CSSProperties}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRouteClick(s.route)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRouteClick(s.route);
                      }
                    }}
                    aria-label={`${s.title}: open`}
                  >
                    {feature ? (
                      <div className={styles.featureBody}>
                        <div className={styles.featureText}>
                          <span className={styles.featureLabel}>The full series</span>
                          <CountUp to={s.value} className={styles.number} />
                          <h3 className={styles.cardTitle}>{s.title}</h3>
                          <Vignette id={s.id} reduce={reduce} />
                        </div>
                        <FeaturedArt reduce={reduce} />
                      </div>
                    ) : (
                      <>
                        <div className={styles.cardTop}>
                          {lab && (
                            <span className={styles.label}>
                              <lab.Icon size={13} strokeWidth={2} />
                              {lab.label}
                            </span>
                          )}
                          <ArrowUpRight size={16} strokeWidth={1.75} className={styles.arrow} />
                        </div>
                        <div className={styles.figureRow}>
                          <CountUp to={s.value} suffix={s.suffix} className={styles.number} />
                          <h3 className={styles.cardTitle}>{s.title}</h3>
                        </div>
                        <Vignette id={s.id} reduce={reduce} />
                        <p className={styles.cardDetail}>{s.details[0]}</p>
                      </>
                    )}
                  </SpotlightCard>
                </RevealItem>
              );
            })}
          </RevealGroup>

          <RevealGroup className={styles.featureRow} stagger={0.05}>
            {featureIcons.map(({ Icon, label, route, color }) => (
              <RevealItem key={label}>
                <button type="button" className={styles.feature} onClick={() => handleRouteClick(route)}>
                  <Icon size={18} strokeWidth={1.75} className={styles.featureIcon} style={{ color }} />
                  <span>{label}</span>
                </button>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <CardInfoModal isOpen={!!modalData} onClose={() => setModalData(null)} data={modalData} />
    </>
  );
}
