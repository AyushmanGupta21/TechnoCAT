import styles from "./FeedbackSection.module.css";

const mockFeedbacks = Array.from({ length: 11 }, (_, i) => ({
  src: `https://media.iquanta.in/ui_images/mock-feedback${i + 1}.webp`,
  alt: `Feedback ${i + 1}`,
}));

const toppers = [
  {
    name: "Vinayak Agarwal",
    percentile: "99.99",
    quote: "Grateful to TechnoCAT teachers & Indrajeet Singh sir's questions which helped me master speed in CAT.",
    img: "https://media.iquanta.in/ui_images/Vinayak-Agarwal-topper-2025.webp",
    feedbackImg: "https://media.iquanta.in/ui_images/Vinayak-Agarwal-feedback.webp",
    bg: "linear-gradient(180deg,#FDF8DD 0%,#F69B6D 100%)",
    textColor: "#5A260C",
  },
  {
    name: "Parav Goyal | LRDI 100%iler",
    percentile: "99.98",
    quote: "TechnoCAT faculty doubt clearing sessions are gold and love the CAT mocks analysis",
    img: "https://media.iquanta.in/ui_images/Topper_2025_Parav_Goyal.webp",
    feedbackImg: "https://media.iquanta.in/ui_images/Parav-Goyal-Feedback.webp",
    bg: "linear-gradient(180deg,#e4ffef 0%,#89d6a4 100%)",
    textColor: "#063416",
  },
  {
    name: "Soumyadip Mukherjee",
    percentile: "99.97",
    quote: "I love the live and application classes of TechnoCAT. It strengthened my concepts through continuous practice.",
    img: "https://media.iquanta.in/ui_images/Soumyadip Mukherjee-Topper-2025.webp",
    feedbackImg: "https://media.iquanta.in/ui_images/Soumyadip-Mukherjee-Feedback.webp",
    bg: "linear-gradient(180deg,#d7f2f8 0%,#71bccd 100%)",
    textColor: "#052e39",
  },
  {
    name: "Anmol Gupta | LRDI 100%iler",
    percentile: "99.96",
    quote: "Thank you Jeet sir for your guidance and TechnoCAT team for constant support in this CAT 99%ile journey.",
    img: "https://media.iquanta.in/ui_images/Anmol-Gupta-Topper-2025.webp",
    feedbackImg: "https://media.iquanta.in/ui_images/Anmol-Gupta-Feedback.webp",
    bg: "linear-gradient(180deg,#e6cfff 0%,#b38cdc 100%)",
    textColor: "#1e0538",
  },
  {
    name: "Swastik Mukherjee",
    percentile: "99.96",
    quote: "TechnoCAT CAT mocks are great. It helped me adapt well and mock analysis learnings improve my score.",
    img: "https://media.iquanta.in/ui_images/Swastik-Mukherjee-Topper-2025.webp",
    feedbackImg: "https://media.iquanta.in/ui_images/Swastik-Mukherjee-Feedback.webp",
    bg: "linear-gradient(180deg,#fdf8dd 0%,#fdf8dd 100%)",
    textColor: "#5A260C",
  },
  {
    name: "Chirag Surana",
    percentile: "99.96",
    quote: "TechnoCAT CAT books laid a strong foundation for concept clarity and helped me stay consistent.",
    img: "https://media.iquanta.in/ui_images/Chirag-Surana-Topper-2025.webp",
    feedbackImg: "https://media.iquanta.in/ui_images/Chirag-Surana-Feedback.webp",
    bg: "linear-gradient(180deg,#fdf8dd 0%,#f69b6d 100%)",
    textColor: "#5A260C",
  },
  {
    name: "Harsh Khudania",
    percentile: "99.93",
    quote: "Thanks to the TechnoCAT CAT preparation community for keeping me motivated and consistent to 99%ile in CAT.",
    img: "https://media.iquanta.in/ui_images/Harsh-Khudania-Topper-2025.webp",
    feedbackImg: "https://media.iquanta.in/ui_images/Harsh-Khudania-Feedback.png",
    bg: "linear-gradient(180deg,#e4ffef 0%,#89d6a4 100%)",
    textColor: "#063416",
  },
];

export default function FeedbackSection() {
  return (
    <>
      {/* Mock feedback carousel */}
      <section className={styles.mockFeedbackSection}>
        <div className={styles.container}>
          <div className={styles.inner}>
            <div className={styles.titleGroup}>
              <h2 className={styles.heading}>TechnoCAT Mock Student Feedback</h2>
            </div>
            <div className={styles.carouselWrapper}>
              <div className={styles.scrollContainer}>
                <div className={styles.feedbackCarousel} aria-label="CAT student feedback">
                  {mockFeedbacks.map((fb, i) => (
                    <div key={i} className={styles.feedbackCard}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fb.src}
                        alt={fb.alt}
                        className={styles.feedbackImg}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Topper feedback carousel */}
        <div className={styles.container}>
          <div className={styles.inner}>
            <div className={styles.titleGroup}>
              <h2 className={styles.heading}>TechnoCAT Student &amp; Expert Feedback</h2>
            </div>
            <div className={styles.carouselWrapper}>
              <div className={styles.scrollContainer}>
                <div className={styles.feedbackCarousel}>
                  {toppers.map((topper, i) => (
                    <button
                      key={i}
                      type="button"
                      className={styles.topperCard}
                      style={{ background: topper.bg }}
                      aria-label={`Read CAT topper feedback: ${topper.name}`}
                    >
                      <div className={styles.topperContent} style={{ color: topper.textColor }}>
                        <div className={styles.topperHeader}>
                          <span className={styles.topperLabel}>TechnoCAT CAT 2025 Topper</span>
                          <div className={styles.quoteWrap}>
                            <p className={styles.quoteText}>{topper.quote}</p>
                          </div>
                          <div className={styles.topperProfile}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={topper.img}
                              alt={`CAT Topper — ${topper.name}`}
                              className={styles.topperAvatar}
                              loading="lazy"
                              width={80}
                              height={80}
                            />
                            <div>
                              <div className={styles.topperName} style={{ color: topper.textColor }}>{topper.name}</div>
                              <div className={styles.percentileBadge} style={{ backgroundColor: topper.textColor }}>
                                <div className={styles.percentileText}>
                                  {topper.percentile}
                                  <div className={styles.percentileUnit}>%iler</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={styles.feedbackImgWrap}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={topper.feedbackImg}
                            alt={`${topper.name} CAT Topper Feedback`}
                            className={styles.topperFeedbackImg}
                            loading="lazy"
                            width={344}
                            height={187}
                          />
                        </div>
                        <div className={styles.journeyBtn}>
                          Know my Journey
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
