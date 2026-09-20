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
import PricingSection from "@/components/PricingSection";

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
        <PricingSection />

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
