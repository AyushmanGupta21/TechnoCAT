"use client";
import styles from "./VideoReviewsSection.module.css";

const videoReviews = [
  {
    title: "TechnoCAT Mock Review by Vinayak Agarwal (99.99%ile)",
    thumb: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "TechnoCAT Mock Analysis — How I cracked CAT in 3 months",
    thumb: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "TechnoCAT vs Other Mock Series — Honest Review",
    thumb: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "AI Mock Analysis Feature — Demo & Review",
    thumb: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=600&q=80"
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
        fill="var(--primary)"
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
                  className={styles.thumbImage}
                />
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
