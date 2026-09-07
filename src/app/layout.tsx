import type { Metadata } from "next";
import "./globals.css";

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
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon",
  },
};

import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
