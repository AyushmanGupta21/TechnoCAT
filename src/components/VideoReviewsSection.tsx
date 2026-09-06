"use client";
import styles from "./VideoReviewsSection.module.css";

const videoReviews = [
  {
    id: "dQw4w9WgXcQ",
    title: "TechnoCAT Mock Review by Vinayak Agarwal (99.99%ile)",
    thumb: "https://media.iquanta.in/ui_images/mock-video-review1.webp",
  },
  {
    id: "dQw4w9WgXcQ",
    title: "iCAT Mock Analysis — How I cracked CAT in 3 months",
    thumb: "https://media.iquanta.in/ui_images/mock-video-review2.webp",
  },
  {
    id: "dQw4w9WgXcQ",
    title: "TechnoCAT vs Other Mock Series — Honest Review",
    thumb: "https://media.iquanta.in/ui_images/mock-video-review3.webp",
  },
  {
    id: "dQw4w9WgXcQ",
    title: "AI Mock Analysis Feature — Demo & Review",
    thumb: "https://media.iquanta.in/ui_images/mock-video-review4.webp",
  },
];

function PlayIcon() {
  return (
    <div className={styles.playBtn}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="white"
      >
        <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
      </svg>
    </div>
  );
}

export default function VideoReviewsSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>TechnoCAT Mock Video Reviews</h2>
        <p className={styles.subheading}>
          Hear directly from students who cracked CAT using TechnoCAT mock tests
        </p>

        <div className={styles.carousel}>
          {videoReviews.map((v, i) => (
            <div key={i} className={styles.videoCard}>
              <div className={styles.thumbWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.thumb}
                  alt={v.title}
                  className={styles.thumb}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {/* Coloured placeholder shown when CDN image is unavailable */}
                <div
                  className={styles.thumbPlaceholder}
                  style={{
                    background: [
                      "linear-gradient(135deg,#1e3a5f,#2563eb)",
                      "linear-gradient(135deg,#1a1a2e,#ED1C24)",
                      "linear-gradient(135deg,#064e3b,#10b981)",
                      "linear-gradient(135deg,#4c1d95,#8b5cf6)",
                    ][i % 4],
                  }}
                >
                  <span className={styles.thumbLabel}>CAT Mock Review {i + 1}</span>
                </div>
                <PlayIcon />
              </div>
              <p className={styles.videoTitle}>{v.title}</p>
            </div>
          ))}
        </div>

        <div className={styles.cta}>
          <button className={styles.ctaBtn}>Watch All Reviews →</button>
        </div>
      </div>
    </section>
  );
}
