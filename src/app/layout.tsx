import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AI News Hub - Daily Digest & Latest Headlines",
  description: "Your daily AI briefing and latest headlines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} antialiased bg-background-light dark:bg-background-dark text-[#0d1b1a] dark:text-gray-100 font-display`}
      >
        {children}
      </body>
    </html>
  );
}
