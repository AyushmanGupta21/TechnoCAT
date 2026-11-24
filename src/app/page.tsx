import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WhyStandOutSection from "@/components/landing/WhyStandOutSection";
import TwoModesSection from "@/components/landing/TwoModesSection";
import WhatYouGetSection from "@/components/landing/WhatYouGetSection";
import CommunitySection from "@/components/landing/CommunitySection";
import VideoReviewsSection from "@/components/landing/VideoReviewsSection";
import ComparisonTable from "@/components/landing/ComparisonTable";
import FeedbackSection from "@/components/landing/FeedbackSection";
import FaqSection from "@/components/landing/FaqSection";
import Footer from "@/components/landing/Footer";
import FloatingBanner from "@/components/landing/FloatingBanner";
import AiFeedbackLoop from "@/components/landing/AiFeedbackLoop";
import IimPredictor from "@/components/landing/IimPredictor";
import PricingSection from "@/components/landing/PricingSection";
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
