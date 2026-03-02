"use client";

import { useParadigm, PARADIGMS, type Paradigm } from "@/components/providers/ParadigmProvider";
import { Palette } from "lucide-react";

const PARADIGM_LABELS: Record<string, string> = {
  glass: "Glass",
  m3e: "M3E",
  brutalist: "Brutal",
  bento: "Bento",
};

const PARADIGM_COLORS: Record<string, string> = {
  glass: "#667eea",
  m3e: "#6750A4",
  brutalist: "#FF6B9D",
  bento: "#4ECDC4",
};

export function ParadigmSwitcher() {
  const { paradigm, cycleParadigm } = useParadigm();

  // Only show in development
  if (process.env.NODE_ENV !== "development") return null;

  const label = paradigm ? PARADIGM_LABELS[paradigm] : "Default";
  const dotColor = paradigm ? PARADIGM_COLORS[paradigm] : "#0d968b";

  return (
    <button
      onClick={cycleParadigm}
      className="fixed bottom-8 right-24 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer text-sm font-medium text-[var(--foreground)]"
      title={`Current paradigm: ${label}. Click to cycle.`}
      aria-label={`Design paradigm: ${label}. Click to switch.`}
    >
      <span
        className="w-3 h-3 rounded-full shrink-0 transition-colors duration-200"
        style={{ backgroundColor: dotColor }}
      />
      <Palette className="w-4 h-4 opacity-60" />
      <span>{label}</span>
    </button>
  );
}
