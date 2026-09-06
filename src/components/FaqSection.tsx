"use client";
import { useState } from "react";
import styles from "./FaqSection.module.css";

const faqs = [
  {
    q: "Which is the best CAT mock test series?",
    a: "Candidates can find several CAT mocks in the market but when it comes to the relevance of questions as per the CAT exam, user interface, TechnoCAT's AI-powered mock test series for CAT works best among aspirants. The best CAT mock test series by TechnoCAT comes with various key features including the Goal Tracker, Error Tracker, B-School Predictor, CAT mocks Comparison, etc.",
  },
  {
    q: "Is it important to take the CAT mock tests?",
    a: "Giving CAT mocks are really important for someone who is going for the aptitude examination like the Common Admission Test. Attempting the best CAT mock test series helps candidates get flexible with the types of questions asked, solving questions as per the sectional time, and sectional mocks as the VARC, QA and DILR mock tests help in strengthening your weak topics.",
  },
  {
    q: "How many sections are there in the CAT mock test?",
    a: "There are three main sections you will see while giving the best CAT mock test — VARC, DILR and QA, where the same alignment of sections are expected to be there in the upcoming CAT 2026 exam.",
  },
  {
    q: "Do I get the free CAT mock test?",
    a: "The first CAT mock test is free for the candidates so that they can simulate the exam pattern and the difficulty level of questions.",
  },
  {
    q: "What is the duration of the CAT mock test?",
    a: "The duration of the CAT mock test is 2 hours (120 minutes) which reflects the actual exam paper pattern. If there are any changes suggested by the exam authorities later, we will reflect the same changes in our CAT mock test series too.",
  },
  {
    q: "How many CAT mocks should one take before appearing for the actual exam?",
    a: "There is no fixed number for giving CAT mock tests. But it is recommended that candidates should attempt 25–30 mocks before sitting for the CAT exam.",
  },
  {
    q: "What are the advantages of solving the best CAT mock test series?",
    a: "Solving the best mock tests for CAT helps you in understanding the actual exam pattern, difficulty level of questions, competitive level as well as you can compare your performance with others and later work on your weak areas after the CAT mock analysis.",
  },
  {
    q: "How will CAT mock tests overall help in the preparation?",
    a: "CAT mocks help an individual in overall exam preparation. It can make one aware about strong and weak areas. TechnoCAT mock test series helps candidates evaluate their overall performance with AI-powered analysis features and CAT mock comparison.",
  },
  {
    q: "Is there any CAT mock test available with AI-Analysis?",
    a: "Yes, TechnoCAT provides an AI-driven CAT mock test series. This feature reduces the effort taken to analyse mocks by 3 times.",
  },
  {
    q: "Which is the best mock for CAT 2026 preparation?",
    a: "Candidates believe that TechnoCAT provides the best CAT mock tests for preparation with AI-driven features. Its relevance in terms of question difficulty and pattern has been one of the many reasons for its groundbreaking results in CAT 2025 with more than 500 99+%ilers.",
  },
  {
    q: "Can I crack the CAT exam without giving mock tests?",
    a: "Well, it completely depends on the individual's capabilities. The Common Admission Test is an aptitude exam which requires a good amount of practice. Solving mocks will help you simulate the actual exam pattern with understanding the difficulty level of questions asked in the CAT exam.",
  },
  {
    q: "How many CAT mocks does TechnoCAT provide?",
    a: "TechnoCAT provides 35 full-length CAT mocks and 45 sectional CAT mock tests.",
  },
  {
    q: "How to appear for CAT VARC mock tests?",
    a: "Candidates can appear for the CAT VARC mock tests on the TechnoCAT website. The VARC section consists of 24 questions based on last year's pattern. TechnoCAT offers one of the best VARC mock tests.",
  },
  {
    q: "How to access the best CAT mock tests?",
    a: "Candidates can access the best CAT mock tests on the official TechnoCAT website. With AI-powered analysis you can self-analyze your performance and improve weaker sections before appearing for the CAT exam.",
  },
  {
    q: "Can I get sectional CAT mock tests?",
    a: "Yes, candidates can access the 45 sectional mock tests for CAT which includes 15 mocks each across VARC, DILR and QA.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>FAQs: TechnoCAT Mock Test</h2>
        <div className={styles.list}>
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}>
                <button
                  className={styles.question}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className={styles.answer}>
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
