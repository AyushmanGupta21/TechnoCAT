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
import { ReplayScope } from "@/components/landing/motion";
import SmoothScroll from "@/components/landing/SmoothScroll";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", maxWidth: "100%", overflowX: "clip" }}>
      <Navbar />

      {/* Spacer for fixed navbar - mobile only */}
      <div className="mobile-nav-spacer" />

      <SmoothScroll />
      <main className="landing">
        {/* 1. Hero */}
        <ReplayScope><HeroSection /></ReplayScope>

        {/* 2. Problem-solving & Key Features carousels */}
        <ReplayScope><FeaturesSection /></ReplayScope>

        {/* NEW: IIM Call Predictor (Interactive Lead Gen) */}
        <ReplayScope><IimPredictor /></ReplayScope>

        {/* NEW: AI Feedback Loop & Chat Tutor */}
        <ReplayScope><AiFeedbackLoop /></ReplayScope>

        {/* 3. Why TechnoCAT Mocks Stand Out – dark feature cards */}
        <ReplayScope><WhyStandOutSection /></ReplayScope>

        {/* 4. Two Exam Modes – Classic vs Modern */}
        <ReplayScope><TwoModesSection /></ReplayScope>

        {/* 5. What You Get – stats grid + feature icons */}
        <ReplayScope><WhatYouGetSection /></ReplayScope>

        {/* 6. Community stats + phone mockups */}
        <ReplayScope><CommunitySection /></ReplayScope>

        {/* 7. Video reviews */}
        <ReplayScope><VideoReviewsSection /></ReplayScope>

        {/* 8. Pricing packages */}
        <ReplayScope><PricingSection /></ReplayScope>

        {/* 11. Comparison table */}
        <ReplayScope><ComparisonTable /></ReplayScope>

        {/* 12. Student feedback & topper cards */}
        <ReplayScope><FeedbackSection /></ReplayScope>

        {/* 13. FAQ accordion */}
        <ReplayScope><FaqSection /></ReplayScope>

        {/* 14. Footer */}
        <Footer />
        
        {/* NEW: Sticky Floating Banner */}
        <FloatingBanner />
      </main>
    </div>
  );
}
