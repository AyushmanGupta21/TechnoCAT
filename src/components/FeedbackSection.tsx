"use client";

import { Quote, Star } from "lucide-react";
import { GradientText, Marquee, Reveal, SectionHead, type Tint } from "@/components/landing/motion";
import ui from "@/components/landing/ui.module.css";
import styles from "./FeedbackSection.module.css";

const feedbacks = [
  {
    name: "Vinayak Agarwal",
    percentile: "99.99",
    quote: "Grateful to TechnoCAT mentors. Their advanced mock analytics helped me identify my weak zones instantly and master my timing strategy.",
  },
  {
    name: "Parav Goyal",
    percentile: "99.98",
    quote: "The personalized AI tutor is incredible. It's like having a top-tier mentor available 24/7 to clear doubts and provide structured practice.",
  },
  {
    name: "Soumyadip Mukherjee",
    percentile: "99.97",
    quote: "TechnoCAT's mocks are identical to the real CAT exam. The difficulty curve and question patterns gave me immense confidence on the D-Day.",
  },
  {
    name: "Anmol Gupta",
    percentile: "99.96",
    quote: "The error tracking feature saved me hours. Instead of manually finding what went wrong, the platform gave me actionable improvement plans.",
  },
  {
    name: "Swastik Mukherjee",
    percentile: "99.96",
    quote: "A perfectly designed UI that doesn't distract you. The sheer quality of the video solutions sets TechnoCAT apart from other mock series.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

const TINTS: Tint[] = ["blue", "teal", "violet", "amber", "coral"];

function FeedbackCard({ fb, tint }: { fb: (typeof feedbacks)[number]; tint: Tint }) {
  return (
    <figure className={`${styles.card} glass-card`} data-tint={tint}>
      <div className={styles.cardTop}>
        <Quote size={22} strokeWidth={1.75} className={styles.quoteIcon} aria-hidden="true" />
        <span className={styles.stars} aria-label="Rated 5 out of 5">
          {[0, 1, 2, 3, 4].map((s) => (
            <Star key={s} size={14} strokeWidth={0} fill="currentColor" aria-hidden="true" />
          ))}
        </span>
      </div>
      <blockquote className={styles.quote}>{fb.quote}</blockquote>
      <figcaption className={styles.person}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(fb.name)}
        </span>
        <span className={styles.personText}>
          <span className={styles.name}>{fb.name}</span>
          <span className={styles.pct}>
            <span className={ui.figure}>{fb.percentile}</span> percentile
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function FeedbackSection() {
  return (
    <section className={`${ui.section} ${styles.section}`}>
      <div className={ui.container}>
        <SectionHead
          className={styles.head}
          eyebrow="Student stories"
          title={<>What our <GradientText>students</GradientText> say</>}
          lede="Aspirants who used TechnoCAT mocks on their way to their target B-schools."
        />
      </div>

      <Reveal>
        <Marquee speed={60} className={styles.marquee}>
          {feedbacks.map((fb, i) => (
            <div key={fb.name} className={styles.slot}>
              <FeedbackCard fb={fb} tint={TINTS[i % TINTS.length]} />
            </div>
          ))}
        </Marquee>
      </Reveal>
    </section>
  );
}
