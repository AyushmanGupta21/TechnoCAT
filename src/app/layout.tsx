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
    url: "https://www.iquanta.in/cat-mock-test",
    siteName: "TechnoCAT",
    images: [
      {
        url: "https://media.iquanta.in/ui_images/cat-mock-test-series.webp",
        width: 1280,
        height: 720,
        alt: "Free CAT Mock Tests",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TechnoCAT: Free CAT Mock Tests 2026 - 35 Full Mocks & AI Analysis",
    description:
      "Boost your CAT preparation with TechnoCAT's AI Based mocks platform.",
    images: ["https://media.iquanta.in/ui_images/cat-mock-test-series.webp"],
  },
  icons: {
    icon: "https://media.iquanta.in/ui_images/new-dashboard/favicon-32x32.png",
    apple: "https://media.iquanta.in/ui_images/new-dashboard/apple-icon-57x57.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
