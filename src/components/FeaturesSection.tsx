import styles from "./FeaturesSection.module.css";

const problemImages = [
  "https://media.iquanta.in/ui_images/CAT_Mock_Analysis_Takes_3_4_Hours.webp",
  "https://media.iquanta.in/ui_images/The_iCAT_Mock_Dashboard,.webp",
  "https://media.iquanta.in/ui_images/Solving_All_Problems_of_CAT_Aspirants.webp",
  "https://media.iquanta.in/ui_images/Solving_All_Problems_of_CAT_Aspirants2.webp",
  "https://media.iquanta.in/ui_images/Solving_All_Problems_of_CAT_Aspirants3.webp",
  "https://media.iquanta.in/ui_images/Solving_All_Problems_of_CAT_Aspirants4.webp",
  "https://media.iquanta.in/ui_images/Solving_All_Problems_of_CAT_Aspirants5.webp",
  "https://media.iquanta.in/ui_images/Solving_All_Problems_of_CAT_Aspirants6.webp",
];

const keyFeatureImages = [
  { src: "https://media.iquanta.in/ui_images/Analyse_3X_Faster_with_iCAT.webp", alt: "Personalised AI Analysis & Performance Report" },
  { src: "https://media.iquanta.in/ui_images/Error_Tracker_AI_Based_CAT_Mock_Analysis.webp", alt: "Error Tracker: AI-Based CAT Mock Analysis" },
  { src: "https://media.iquanta.in/ui_images/Reaching_Your_Dream_B_School_Requires_a_Clear_Plan.webp", alt: "B-School Predictor" },
  { src: "https://media.iquanta.in/ui_images/Difficult_to_Know_Where_You_Stand_Against_CAT_Toppers.webp", alt: "Nationwide Ranking" },
  { src: "https://media.iquanta.in/ui_images/Personalised_AI Analysis_Perform_nce_Report.webp", alt: "Personalised AI Analysis" },
  { src: "https://media.iquanta.in/ui_images/Every_Low_CAT_Mock_Score_Has_a_Reason.webp", alt: "Score Analysis" },
  { src: "https://media.iquanta.in/ui_images/Difficult_to_Know_What_to_Improve_Next.webp", alt: "Improvement Tracker" },
  { src: "https://media.iquanta.in/ui_images/Practising_on_Easy_Mocks_Can_Hurt_Your_CAT_Preparation.webp", alt: "Difficulty Calibrated Mocks" },
];

export default function FeaturesSection() {
  return (
    <>
      {/* Problems section */}
      <section className={styles.problemsSection}>
        <div className={styles.container}>
          <div className={styles.inner}>
            <h2 className={styles.heading}>
              Solving All Problems of CAT Aspirants via TechnoCAT Analysis Features
            </h2>
            <div className={styles.carouselOuter}>
              <div className={styles.scrollContainer}>
                <div className={styles.carousel}>
                  {problemImages.map((src, i) => (
                    <div key={i} className={styles.imgCard}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt="Solving All Problems of CAT Aspirants via TechnoCAT Analysis Features"
                        className={styles.cardImg}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features section */}
      <section className={styles.keyFeaturesSection}>
        <div className={styles.container}>
          <div className={styles.inner}>
            <h2 className={styles.heading}>Key Features of Best CAT Mock Tests (TechnoCAT)</h2>
            <p className={styles.subHeading}>
              Get detailed analysis of key features that comes with the best CAT mock test series (TechnoCAT 2026)
            </p>
            <div className={styles.carouselOuter}>
              <div className={styles.scrollContainer}>
                <div className={styles.carousel}>
                  {keyFeatureImages.map((item, i) => (
                    <div key={i} className={styles.featureCard}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.src}
                        alt={item.alt}
                        className={styles.cardImg}
                        loading="lazy"
                      />
                    </div>
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
