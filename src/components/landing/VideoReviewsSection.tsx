"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, useReducedMotion, useScroll, useSpring } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, Play, Quote } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CardInfoModal, { CardInfoData } from "./CardInfoModal";
import styles from "./VideoReviewsSection.module.css";
import ui from "@/components/landing/ui.module.css";
import { GradientText, Reveal, RevealGroup, RevealItem, SectionHead } from "@/components/landing/motion";

const videoReviews = [
  {
    title: "TechnoCAT mock review by Vinayak Agarwal (99.99%ile)",
    thumb: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
    badge: "CAT 99.99%ile topper",
    quote: "TechnoCAT's DILR sets and AI mock analysis accurately predicted my strong topics and helped me shave 25 minutes off time management.",
    bullets: [
      "Converted: IIM Ahmedabad & IIM Calcutta",
      "Strategy: Solved 28 TechnoCAT full mocks in test-day conditions",
      "Key tip: Used the Error Tracker to diagnose recurring algebra traps",
    ],
  },
  {
    title: "TechnoCAT mock analysis: how I cracked CAT in 3 months",
    thumb: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
    badge: "99.42%ile in 90 days",
    quote: "Starting late in August, the automated error tracking and sectional drills were life savers. I focused 100% on high-ROI questions.",
    bullets: [
      "Converted: IIM Lucknow & FMS Delhi",
      "Sectionals attempted: 35 targeted topic tests",
      "Key tip: Indra Sir's video solutions clarify nuances in 4-5 minutes",
    ],
  },
  {
    title: "TechnoCAT vs other mock series: an honest review",
    thumb: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
    badge: "In-depth benchmark",
    quote: "Other mocks inflate difficulties unnaturally; TechnoCAT replicates the actual IIM CAT calibration and real time-pressure UI.",
    bullets: [
      "Converted: SPJIMR & IIM Kozhikode",
      "Accuracy gain: +18% in Reading Comprehension",
      "Key tip: Dual UI (Classic + Modern) eliminates surprises on exam day",
    ],
  },
  {
    title: "AI mock analysis: demo and review",
    thumb: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=600&q=80",
    badge: "AI mentor demo",
    quote: "Mock analysis used to take 3 hours on spreadsheets. TechnoCAT's AI breaks down question attempts and unforced errors instantly.",
    bullets: [
      "Converted: IIM Indore (99.2%ile)",
      "Time saved: 2.5 hours per mock analysis session",
      "Key tip: Review the AI speed-accuracy quadrant right after submission",
    ],
  },
];

// Each review card gets its own glass tint; badge dots use the data palette
const CARD_TINTS = ["blue", "teal", "violet", "amber"] as const;
const BADGE_DOTS = ["#34d399", "#60a5fa", "#fbbf24", "#a78bfa"];

export default function VideoReviewsSection() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [modalData, setModalData] = useState<CardInfoData | null>(null);
  const reduce = useReducedMotion();

  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const { scrollXProgress } = useScroll({ container: trackRef });
  const progress = useSpring(scrollXProgress, { stiffness: 200, damping: 30 });

  // Mouse drag-to-scroll (touch already has native momentum + snap)
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: 0 });
  const [dragging, setDragging] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  /* ---------- Auto drift: slow continuous scroll, seamless loop ---------- */
  // The list is rendered twice; when we pass the first copy we jump back by its width.
  const trackInView = useInView(trackRef, { amount: 0.2 });
  const hover = useRef(false);
  const focusWithin = useRef(false);
  const touchHold = useRef(0); // timestamp until which touch interaction pauses drift
  const autoOn = !reduce;

  // Width of one copy of the list; measured on mount/resize only (no layout reads per frame)
  const loopW = useRef(0);
  const measureLoop = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const slides = el.querySelectorAll<HTMLElement>("[data-card]");
    const n = videoReviews.length;
    loopW.current = slides.length > n ? slides[n].offsetLeft - slides[0].offsetLeft : 0;
  }, []);
  const loopWidth = useCallback(() => loopW.current, []);
  useEffect(() => {
    measureLoop();
    window.addEventListener("resize", measureLoop);
    return () => window.removeEventListener("resize", measureLoop);
  }, [measureLoop]);

  useEffect(() => {
    if (!autoOn || !trackInView) return;
    let raf = 0;
    let last = performance.now();
    let pos = trackRef.current?.scrollLeft ?? 0; // float position we own; only written, never read per frame
    let resync = true;
    const SPEED = 34; // px per second
    const tick = (now: number) => {
      const el = trackRef.current;
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const paused =
        !el || hover.current || focusWithin.current || drag.current.active || now < touchHold.current || document.hidden;
      if (el && paused) resync = true; // user may scroll/drag while paused
      if (el && !paused) {
        if (resync) {
          pos = el.scrollLeft;
          resync = false;
        }
        pos += SPEED * dt;
        const w = loopW.current;
        if (w > 0 && pos >= w) pos -= w;
        el.scrollLeft = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoOn, trackInView]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    touchHold.current = performance.now() + 1200; // let the smooth scroll finish before drifting again
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    if (dir === -1 && el.scrollLeft < step) {
      // wrap backwards into the duplicate set so "previous" always works
      const w = loopWidth();
      if (w > 0) el.scrollLeft += w;
    }
    el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current.moved = 0;
    if (e.pointerType !== "mouse") touchHold.current = performance.now() + 4000;
    if (e.pointerType !== "mouse" || !trackRef.current) return;
    drag.current = { active: true, startX: e.clientX, startLeft: trackRef.current.scrollLeft, moved: 0 };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || !trackRef.current) return;
    const dx = e.clientX - d.startX;
    d.moved = Math.max(d.moved, Math.abs(dx));
    if (d.moved > 5 && !dragging) setDragging(true);
    trackRef.current.scrollLeft = d.startLeft - dx;
  };
  const endDrag = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (dragging) {
      setDragging(false);
      // let scroll-snap settle on the nearest card once snapping is re-enabled
      requestAnimationFrame(() => {
        const el = trackRef.current;
        if (el) el.scrollBy({ left: 0 });
      });
    }
  };

  const handleAuthAction = (destination: string) => {
    if (!user || user.isGuest) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("technocat_auth_redirect", destination);
      }
      openAuthModal("signin");
    } else {
      router.push(destination);
    }
  };

  const handleCardClick = (review: (typeof videoReviews)[0]) => {
    // ignore the click that ends a drag
    if (drag.current.moved > 5) {
      drag.current.moved = 0;
      return;
    }
    setModalData({
      badge: review.badge,
      title: review.title,
      description: `"${review.quote}"`,
      highlights: review.bullets,
      primaryBtnText: "Attempt a free TechnoCAT mock",
      onPrimaryClick: () => handleAuthAction("/dashboard"),
    });
  };

  return (
    <>
      <section className={`${ui.section} ${ui.sectionCanvas} ${styles.sec}`} id="reviews">
        <div className={ui.container}>
          <div className={styles.headRow}>
            <SectionHead
              align="left"
              eyebrow="Video reviews"
              title={
                <>
                  Students who cracked CAT with <GradientText>TechnoCAT mocks</GradientText>
                </>
              }
              lede="In their own words: what they practised and where they converted."
              className={`${styles.head} ${styles.compactHead}`}
            />
            <Reveal className={styles.navBtns} delay={0.15}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => scrollByCard(-1)}
                disabled={!canPrev && !autoOn}
                aria-label="Previous review"
              >
                <ChevronLeft size={20} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => scrollByCard(1)}
                disabled={!canNext && !autoOn}
                aria-label="Next review"
              >
                <ChevronRight size={20} strokeWidth={1.75} />
              </button>
            </Reveal>
          </div>
        </div>

        <div className={styles.trackOuter}>
          <RevealGroup stagger={0.05}>
            <div
              ref={trackRef}
              className={`${styles.track} ${dragging ? styles.trackDragging : ""} ${autoOn ? styles.trackAuto : ""}`}
              onScroll={autoOn ? undefined : updateEdges}
              onMouseEnter={() => (hover.current = true)}
              onMouseLeave={() => (hover.current = false)}
              onFocus={() => (focusWithin.current = true)}
              onBlur={() => (focusWithin.current = false)}
              onTouchStart={() => (touchHold.current = performance.now() + 4000)}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
            >
              {(autoOn ? [...videoReviews, ...videoReviews] : videoReviews).map((v, i) => (
                <RevealItem
                  key={`${v.title}-${i}`}
                  className={styles.slide}
                  data-card
                  aria-hidden={i >= videoReviews.length ? true : undefined}
                >
                  <button
                    type="button"
                    tabIndex={i >= videoReviews.length ? -1 : undefined}
                    className={`${styles.card} glass-card`}
                    data-tint={CARD_TINTS[i % CARD_TINTS.length]}
                    onClick={() => handleCardClick(v)}
                    aria-label={`Watch review: ${v.title}`}
                    draggable={false}
                  >
                    <span className={styles.thumbWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.thumb} alt="" className={styles.thumb} draggable={false} loading="lazy" />
                      <span className={styles.thumbShade} aria-hidden="true" />
                      <span className={styles.badge}>
                        <i className={styles.badgeDot} style={{ background: BADGE_DOTS[i % BADGE_DOTS.length] }} />
                        {v.badge}
                      </span>
                      <span className={styles.player} aria-hidden="true">
                        <span className={styles.playerBtn}>
                          <Play size={12} strokeWidth={1.75} fill="currentColor" />
                        </span>
                        <span className={styles.playerTrack}>
                          <span className={styles.playerFill} />
                        </span>
                        <span className={styles.playerLabel}>Watch</span>
                      </span>
                    </span>
                    <span className={styles.body}>
                      <span className={styles.title}>{v.title}</span>
                      <span className={styles.quote}>
                        <Quote size={14} strokeWidth={1.75} className={styles.quoteIcon} />
                        {v.quote}
                      </span>
                    </span>
                  </button>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>
        </div>

        <div className={ui.container}>
          <div className={styles.footer}>
            <div className={styles.progress} aria-hidden="true">
              <motion.span className={styles.progressBar} style={{ scaleX: progress }} />
            </div>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSecondary}`}
              onClick={() => handleAuthAction("/intelligence/community")}
            >
              Watch all reviews and join the community
              <ArrowRight size={16} strokeWidth={1.75} data-arrow />
            </button>
          </div>
        </div>
      </section>

      <CardInfoModal isOpen={!!modalData} onClose={() => setModalData(null)} data={modalData} />
    </>
  );
}
