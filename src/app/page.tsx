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

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      <Navbar />

      {/* Spacer for fixed navbar - mobile only */}
      <div className="mobile-nav-spacer" />

      <main>
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Problem-solving & Key Features carousels */}
        <FeaturesSection />

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
            background: "#0E0F13",
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
                  fontWeight: 600,
                  color: "#fff",
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
                (plan, i) => (
                  <div
                    key={i}
                    style={{
                      background: i === 1 ? "#ED1C24" : "#1a1a2e",
                      borderRadius: "16px",
                      padding: "32px 24px",
                      textAlign: "center",
                      border: i === 1 ? "none" : "1px solid #2a2a3e",
                      transform: i === 1 ? "scale(1.05)" : "none",
                      boxShadow:
                        i === 1
                          ? "0 20px 60px rgba(237,28,36,0.35)"
                          : "none",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#fff",
                        marginBottom: "8px",
                      }}
                    >
                      {plan}
                    </h3>
                    <p
                      style={{
                        color:
                          i === 1 ? "rgba(255,255,255,0.9)" : "#9ca3af",
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
                        color: "#fff",
                        marginBottom: "24px",
                      }}
                    >
                      {i === 0 && "FREE"}
                      {i === 1 && "₹2,499"}
                      {i === 2 && "₹4,999"}
                    </div>
                    <button
                      style={{
                        background: i === 1 ? "#fff" : "#ED1C24",
                        color: i === 1 ? "#ED1C24" : "#fff",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "14px",
                        cursor: "pointer",
                        width: "100%",
                        border: "none",
                      }}
                    >
                      {i === 0 ? "Start Free" : "Enroll Now"}
                    </button>
                  </div>
                )
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
      </main>
    </div>
  );
}
