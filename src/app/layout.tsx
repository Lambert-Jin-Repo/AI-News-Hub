import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { FloatingControls } from "@/components/ui/FloatingControls";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ainewshub.dev';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "AI News Hub — Your Daily AI Briefing",
    template: "%s — AI News Hub",
  },
  description: "Stay informed with AI-curated news summaries, daily audio digests, and a curated directory of the best AI tools. Updated every hour.",
  keywords: ["AI news", "artificial intelligence", "machine learning", "AI tools", "daily digest", "tech news"],
  authors: [{ name: "AI News Hub" }],
  creator: "AI News Hub",
  publisher: "AI News Hub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "AI News Hub",
    title: "AI News Hub — Your Daily AI Briefing",
    description: "Stay informed with AI-curated news summaries, daily audio digests, and a curated directory of the best AI tools.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI News Hub — Your Daily AI Briefing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI News Hub — Your Daily AI Briefing",
    description: "Stay informed with AI-curated news summaries, daily audio digests, and a curated directory of the best AI tools.",
    images: ["/og-image.png"],
    creator: "@ainewshub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <FloatingControls />
        </ThemeProvider>
      </body>
    </html>
  );
}
