"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Sparkles, ArrowRight, Wand2 } from "lucide-react";
import { AdvisorResult, type AdvisorData } from "./AdvisorResult";
import { AdvisorLoadingAnimation } from "./AdvisorLoadingAnimation";

interface WorkflowShowcaseProps {
  toolLogos: Record<string, string | null>;
}

const EXAMPLE_GOALS = [
  "Build a landing page with AI",
  "Create a YouTube video from scratch",
  "Automate my email workflow",
  "Generate social media content",
  "Build a chatbot for my website",
];

export function WorkflowShowcase({ toolLogos }: WorkflowShowcaseProps) {
  const [goal, setGoal] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState<AdvisorData | null>(null);
  const [suggestError, setSuggestError] = useState("");

  const handleSuggest = useCallback(async () => {
    if (!goal.trim() || suggesting) return;

    setSuggesting(true);
    setSuggestError("");
    setSuggested(null);

    try {
      const res = await fetch("/api/workflows/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        setSuggestError(data.error || "Could not generate workflow");
        return;
      }

      const data = await res.json();
      setSuggested(data.advisor);
    } catch {
      setSuggestError("Network error. Please try again.");
    } finally {
      setSuggesting(false);
    }
  }, [goal, suggesting]);

  const handleExampleClick = useCallback((example: string) => {
    setGoal(example);
    setSuggested(null);
    setSuggestError("");
  }, []);

  return (
    <section className="relative rounded-2xl overflow-hidden mb-8 bg-[var(--surface)] shadow-soft">
      {/* Soft decorative gradients */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-accent/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary/15 to-accent/15 rounded-xl">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0d1b1a] dark:text-white flex items-center gap-2">
                AI Workflow Advisor
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  Beta
                </span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Describe your goal — get a full workflow with tools, tips &amp; prompt templates
              </p>
            </div>
          </div>
          <Link
            href="/tools/workflows"
            className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 no-underline transition-colors shrink-0 mt-1"
          >
            Browse curated <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Input area */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
            placeholder="What do you want to build or achieve?"
            maxLength={200}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#0d1b1a] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all shadow-sm"
          />
          <button
            onClick={handleSuggest}
            disabled={!goal.trim() || suggesting}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/85 text-white text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {suggesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Generate</span>
              </>
            )}
          </button>
        </div>

        {/* Example chips */}
        {!suggested && !suggesting && (
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="text-xs text-gray-400 py-1">Try:</span>
            {EXAMPLE_GOALS.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
              >
                {example}
              </button>
            ))}
          </div>
        )}

        {/* Loading animation */}
        {suggesting && <AdvisorLoadingAnimation />}

        {/* Error */}
        {suggestError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 mt-2">
            <span className="text-sm text-red-600 dark:text-red-400">{suggestError}</span>
            <button
              onClick={handleSuggest}
              className="ml-auto text-xs text-red-500 hover:text-red-700 cursor-pointer underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* AI-generated advisor result */}
        {suggested && !suggesting && (
          <div className="mt-4 bg-gray-50/80 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50 p-5">
            <AdvisorResult data={suggested} toolLogos={toolLogos} />
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/50">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI-generated by MiniMax
              </span>
              <button
                onClick={() => {
                  setSuggested(null);
                  setGoal("");
                }}
                className="text-xs text-primary hover:text-primary/80 cursor-pointer font-medium"
              >
                Generate another →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
