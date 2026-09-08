import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import WhyStandOutSection from "@/components/WhyStandOutSection";
import TwoModesSection from "@/components/TwoModesSection";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import CommunitySection from "@/components/CommunitySection";
import VideoReviewsSection from "@/components/VideoReviewsSection";
import ComparisonTable from "@/components/ComparisonTable";
import FeedbackSection from "@/components/FeedbackSection";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";
import FloatingBanner from "@/components/FloatingBanner";
import AiFeedbackLoop from "@/components/AiFeedbackLoop";
import IimPredictor from "@/components/IimPredictor";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", paddingBottom: "80px" }}>
      <Navbar />

      {/* Spacer for fixed navbar - mobile only */}
      <div className="mobile-nav-spacer" />

      <main>
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Problem-solving & Key Features carousels */}
        <FeaturesSection />

        {/* NEW: IIM Call Predictor (Interactive Lead Gen) */}
        <IimPredictor />

        {/* NEW: AI Feedback Loop & Chat Tutor */}
        <AiFeedbackLoop />

        {/* 3. Why TechnoCAT Mocks Stand Out – dark feature cards */}
        <WhyStandOutSection />

        {/* 4. Two Exam Modes – Classic vs Modern */}
        <TwoModesSection />

        {/* 5. What You Get – stats grid + feature icons */}
        <WhatYouGetSection />

        {/* 6. Community stats + phone mockups */}
        <CommunitySection />

        {/* 7. Video reviews */}
        <VideoReviewsSection />

        {/* 8. Pricing packages */}
        <section
          id="courses"
          style={{
            background: "transparent",
            padding: "64px 0",
            scrollMarginTop: "32px",
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              padding: "0 1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "30px",
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(2rem, 4vw, 2.6rem)",
                  fontWeight: 700,
                  color: "var(--text-main)",
                  textAlign: "center",
                }}
              >
                TechnoCAT Mocks Packages
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "24px",
              }}
            >
              {["TechnoCAT Basic", "TechnoCAT Pro", "TechnoCAT Premium"].map(
                (plan, i) => {
                  const cardBg = 
                    i === 0 ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)" :
                    i === 1 ? "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)" :
                    "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)";
                  const borderColor = 
                    i === 0 ? "#bae6fd" :
                    i === 1 ? "#ddd6fe" :
                    "#fde68a";

                  return (
                  <div
                    key={i}
                    className={`pricingCard ${i === 1 ? 'pro' : ''}`}
                    style={{
                      background: cardBg,
                      border: `1px solid ${borderColor}`,
                      boxShadow: i === 1 ? "var(--shadow-lg)" : "var(--shadow-sm)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "var(--text-main)",
                        marginBottom: "8px",
                      }}
                    >
                      {plan}
                    </h3>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "14px",
                        marginBottom: "24px",
                      }}
                    >
                      {i === 0 && "5 Full Mocks + Analysis"}
                      {i === 1 && "35 Full Mocks + 45 Sectionals"}
                      {i === 2 && "All Mocks + Mentorship + PYQs"}
                    </p>
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        color: "var(--primary-dark)",
                        marginBottom: "24px",
                      }}
                    >
                      {i === 0 && "FREE"}
                      {i === 1 && "₹2,499"}
                      {i === 2 && "₹4,999"}
                    </div>
                    <button
                      className={`pricingBtn ${i === 1 ? 'pro' : ''}`}
                      style={{
                        background: i === 1 ? "var(--primary)" : "var(--white)",
                        color: i === 1 ? "#fff" : "var(--primary-dark)",
                        border: i === 1 ? "none" : "1px solid var(--primary-light)",
                      }}
                    >
                      {i === 0 ? "Start Free" : "Enroll Now"}
                    </button>
                  </div>
                )}
              )}
            </div>
          </div>
        </section>

        {/* 11. Comparison table */}
        <ComparisonTable />

        {/* 12. Student feedback & topper cards */}
        <FeedbackSection />

        {/* 13. FAQ accordion */}
        <FaqSection />

        {/* 14. Footer */}
        <Footer />
        
        {/* NEW: Sticky Floating Banner */}
        <FloatingBanner />
      </main>
    </div>
  );
}
