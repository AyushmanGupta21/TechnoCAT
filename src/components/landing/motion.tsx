"use client";

/*
 * Shared motion primitives for the public landing page.
 * - Transform/opacity only; short durations; collapses to fades when the
 *   visitor prefers reduced motion.
 * - Reveals replay only after the element has been far away (~2 viewports)
 *   and comes back, via useReplayInView / ReplayScope.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import styles from "./motion.module.css";

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ */
/* Reveal-once: each element animates the first time it scrolls into view */
/* ------------------------------------------------------------------ */

export function useReplayInView(ref: React.RefObject<Element | null>, disabled = false) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (disabled || !el || typeof IntersectionObserver === "undefined") return;
    // Enter: a quarter of the element (or half the viewport for tall ones) is visible
    const enter = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        const vh = window.innerHeight || 1;
        if (e.intersectionRatio >= 0.15 || e.intersectionRect.height >= vh * 0.35) setInView(true);
      },
      { threshold: [0, 0.15, 0.35], rootMargin: "0px 0px -8% 0px" }
    );
    // Plays once (like the reference site): no reset when scrolling away and back.
    enter.observe(el);
    return () => enter.disconnect();
  }, [ref, disabled]);
  return inView;
}

const ReplayContext = createContext<boolean | null>(null);

/** Wrap a page section; descendants read its replay state with useReplay(). */
export function ReplayScope({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useReplayInView(ref);
  return (
    <div ref={ref}>
      <ReplayContext.Provider value={inView}>{children}</ReplayContext.Provider>
    </div>
  );
}

/** Replay state of the nearest ReplayScope (or of `ref` when there is none). */
export function useReplay(ref?: React.RefObject<Element | null>) {
  const scoped = useContext(ReplayContext);
  const fallbackRef = useRef<Element | null>(null);
  // Elements with their own ref reveal individually as they enter; others follow their section.
  const own = useReplayInView(ref ?? fallbackRef, !ref);
  return ref ? own : (scoped ?? false);
}

/* ------------------------------------------------------------------ */
/* Reveal: fade + rise                                                 */
/* ------------------------------------------------------------------ */

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  /** kept for API compatibility; replay is distance-based now */
  once?: boolean;
};

export function Reveal({ delay = 0, y = 24, once: _once, children, ...rest }: RevealProps) {
  void _once;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useReplay(ref);
  const hidden = { opacity: 0, y: reduce ? 0 : y };
  return (
    <motion.div
      ref={ref}
      initial={hidden}
      animate={inView ? { opacity: 1, y: 0 } : hidden}
      transition={{ duration: reduce ? 0.2 : 0.65, delay: reduce || !inView ? 0 : delay, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* Stagger container + item, for grids and lists */

const groupVariants: Variants = {
  hidden: {},
  show: (stagger: number) => ({ transition: { staggerChildren: Math.min(Math.max(stagger, 0.06), 0.08), delayChildren: 0.02 } }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_OUT } },
};

const itemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

type GroupProps = HTMLMotionProps<"div"> & { stagger?: number };

export function RevealGroup({ stagger = 0.05, children, ...rest }: GroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useReplay(ref);
  return (
    <motion.div
      ref={ref}
      variants={groupVariants}
      custom={stagger}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, ...rest }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={reduce ? itemVariantsReduced : itemVariants} {...rest}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* SpotlightCard: cursor-following glow + slight lift on hover         */
/* ------------------------------------------------------------------ */

export type Tint = "blue" | "teal" | "violet" | "amber" | "coral";

type SpotlightProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "article" | "li";
  tone?: "light" | "dark";
  /** Tinted glass surface (uses the global .glass-card utility). */
  tint?: Tint;
};

export function SpotlightCard({
  as = "div",
  tone = "light",
  tint,
  className,
  children,
  onPointerMove,
  onPointerEnter,
  ...rest
}: SpotlightProps) {
  const ref = useRef<HTMLElement | null>(null);
  const rect = useRef<DOMRect | null>(null);
  const frame = useRef(0);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const handleEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    // read layout once per hover, not on every move
    rect.current = ref.current?.getBoundingClientRect() ?? null;
    onPointerEnter?.(e);
  };
  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    if (e.pointerType === "touch") return;
    pos.current = { x: e.clientX, y: e.clientY };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const el = ref.current;
      const r = rect.current;
      if (!el || !r) return;
      el.style.setProperty("--mx", `${pos.current.x - r.left}px`);
      el.style.setProperty("--my", `${pos.current.y - r.top}px`);
    });
  };
  const Tag = as as "div";
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={`${styles.spotlight} ${tone === "dark" ? styles.spotlightDark : ""} ${
        tint ? `glass-card ${tone === "dark" ? "glass-dark" : ""}` : ""
      } ${className ?? ""}`}
      data-tint={tint}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      {...rest}
    >
      <span className={styles.spotlightGlow} aria-hidden="true" />
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* TiltFrame: subtle mouse-parallax tilt for product imagery           */
/* ------------------------------------------------------------------ */

type TiltProps = React.HTMLAttributes<HTMLDivElement> & { max?: number };

export function TiltFrame({ max = 6, className, children, ...rest }: TiltProps) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 120, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 120, damping: 18, mass: 0.6 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max * 0.7, -max * 0.7]);
  const glareX = useTransform(sx, [0, 1], ["20%", "80%"]);
  const glareY = useTransform(sy, [0, 1], ["10%", "70%"]);
  const glare = useMotionTemplate`radial-gradient(600px circle at ${glareX} ${glareY}, rgba(255,255,255,0.22), transparent 45%)`;
  const rect = useRef<DOMRect | null>(null);
  const frame = useRef(0);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    rect.current = e.currentTarget.getBoundingClientRect();
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType === "touch") return;
    pos.current = { x: e.clientX, y: e.clientY };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const r = rect.current;
      if (!r) return;
      px.set((pos.current.x - r.left) / r.width);
      py.set((pos.current.y - r.top) / r.height);
    });
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div
      className={`${styles.tiltStage} ${className ?? ""}`}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      {...rest}
    >
      <motion.div
        className={styles.tiltInner}
        style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 1400 }}
      >
        {children}
        {!reduce && <motion.span className={styles.tiltGlare} style={{ background: glare }} aria-hidden="true" />}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CountUp: numbers that tick up when the section is (re)visited       */
/* ------------------------------------------------------------------ */

type CountUpProps = {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};

export function CountUp({ to, duration = 1, prefix = "", suffix = "", decimals = 0, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useReplay(ref);
  const reduce = useReducedMotion();
  const fmt = (v: number) =>
    `${prefix}${v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!inView) {
      // reset while far away so the count replays on the next visit
      if (!reduce) el.textContent = fmt(0);
      return;
    }
    if (reduce) {
      el.textContent = fmt(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = fmt(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to]);

  return (
    <span ref={ref} className={className}>
      {fmt(reduce ? to : 0)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Marquee: one CSS translate3d animation; runs only while on screen   */
/* ------------------------------------------------------------------ */

type MarqueeProps = {
  children: React.ReactNode;
  speed?: number; // seconds per loop
  className?: string;
  reverse?: boolean;
};

export function Marquee({ children, speed = 40, className, reverse = false }: MarqueeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`${styles.marquee} ${onScreen ? styles.marqueeRunning : ""} ${className ?? ""}`}>
      <div
        className={`${styles.marqueeTrack} ${reverse ? styles.marqueeReverse : ""}`}
        style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
      >
        <div className={styles.marqueeGroup}>{children}</div>
        <div className={styles.marqueeGroup} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SectionHead: eyebrow + title + lede, revealed together              */
/* ------------------------------------------------------------------ */

type SectionHeadProps = {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
};

export function SectionHead({ eyebrow, title, lede, align = "center", tone = "light", className }: SectionHeadProps) {
  return (
    <RevealGroup
      className={`${styles.head} ${align === "left" ? styles.headLeft : ""} ${tone === "dark" ? styles.headDark : ""} ${className ?? ""}`}
      stagger={0.07}
    >
      {eyebrow && (
        <RevealItem>
          <span className={styles.eyebrow}>{eyebrow}</span>
        </RevealItem>
      )}
      <RevealItem>
        <h2 className={styles.title}>{title}</h2>
      </RevealItem>
      {lede && (
        <RevealItem>
          <p className={styles.lede}>{lede}</p>
        </RevealItem>
      )}
    </RevealGroup>
  );
}


/* ------------------------------------------------------------------ */
/* GradientText: static gradient accent phrase (no animated sheen;     */
/* background-position animation repaints every frame)                 */
/* ------------------------------------------------------------------ */

export function GradientText({
  children,
  dark = false,
  className,
}: {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return <span className={`text-gradient ${dark ? "text-gradient-dark" : ""} ${className ?? ""}`}>{children}</span>;
}

/* ------------------------------------------------------------------ */
/* Doodle: hand-drawn SVG accents that draw in on (re)visit            */
/* ------------------------------------------------------------------ */

const DOODLES = {
  sparkle: { viewBox: "0 0 22 44", paths: ["M5 14 L16 9", "M5 22 L18 22", "M5 30 L16 35"] },
  swirl: {
    viewBox: "0 0 150 44",
    paths: ["M3 34 C 26 12, 52 6, 70 14 C 84 20, 80 34, 68 32 C 56 30, 60 14, 76 10 C 100 4, 124 14, 147 30"],
  },
  underline: { viewBox: "0 0 200 14", paths: ["M3 10 C 50 3, 120 2, 197 8"] },
  star: { viewBox: "0 0 28 28", paths: ["M14 3 C 15 11, 17 13, 25 14 C 17 15, 15 17, 14 25 C 13 17, 11 15, 3 14 C 11 13, 13 11, 14 3 Z"] },
} as const;

export function Doodle({
  kind,
  className,
  color = "var(--data-cyan)",
  strokeWidth = 2.2,
  delay = 0.3,
}: {
  kind: keyof typeof DOODLES;
  className?: string;
  color?: string;
  strokeWidth?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useReplay(ref);
  const d = DOODLES[kind];
  const hidden = { pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 };
  return (
    <svg ref={ref} className={`${styles.doodle} ${className ?? ""}`} viewBox={d.viewBox} fill="none" aria-hidden="true">
      {d.paths.map((p, i) => (
        <motion.path
          key={i}
          d={p}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={hidden}
          animate={inView ? { pathLength: 1, opacity: 1 } : hidden}
          transition={{ duration: reduce ? 0 : 0.55, delay: reduce || !inView ? 0 : delay + i * 0.06, ease: EASE_OUT }}
        />
      ))}
    </svg>
  );
}
