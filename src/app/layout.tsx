import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Satoshi (Fontshare, free for commercial use), self-hosted from src/app/fonts.
// Body and UI text; exposed as --font-sans.
const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Satoshi-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});
// Plus Jakarta Sans (SIL OFL 1.1) for headlines: variable font (weights 200–800, Latin subset) self-hosted from
// src/app/fonts. Loaded locally because the next/font/google loader for this family fails on Vercel builds.
// 800 is its heaviest weight (900 requests map to it).
const display = localFont({
  src: [{ path: "./fonts/PlusJakartaSans-Variable.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-display",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TechnoCAT: Free CAT Mock Tests 2026 - 35 Full Mocks & AI Analysis",
  description:
    "Boost your CAT preparation with TechnoCAT's AI Based mocks platform. Get 35 full CAT mock tests, 45 sectionals, AI-powered analysis, and a B-School Predictor to simulate real exam pattern.",
  keywords:
    "CAT mock test,CAT mock tests,CAT mock test free,mock test for CAT,free mock test for CAT,CAT exam free mock test,CAT mock exam,CAT exam mock test,Free CAT Mock Tests,CAT Mock",
  openGraph: {
    title: "TechnoCAT: Free CAT Mock Tests 2026 - 35 Full Mocks & AI Analysis",
    description:
      "Boost your CAT preparation with TechnoCAT's AI Based mocks platform. Get 35 full CAT mock tests, 45 sectionals, AI-powered analysis, and a B-School Predictor to simulate real exam pattern.",
    url: "https://technocatt.vercel.app",
    siteName: "TechnoCAT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TechnoCAT: Free CAT Mock Tests 2026 - 35 Full Mocks & AI Analysis",
    description:
      "Boost your CAT preparation with TechnoCAT's AI Based mocks platform.",
  },
  // Icons come from the app/icon.png and app/apple-icon.png file conventions.
};

import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${satoshi.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
