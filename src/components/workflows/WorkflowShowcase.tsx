"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Loader2, Sparkles, ArrowRight, Clock } from "lucide-react";
import { WorkflowPipeline, type PipelineStep } from "./WorkflowPipeline";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { Workflow } from "@/lib/supabase";

interface WorkflowShowcaseProps {
  workflows: Workflow[];
  toolLogos: Record<string, string | null>;
}

type FilterMode = "free" | "paid" | "random" | "suggest";

const costColors = {
  free: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const difficultyColors = {
  beginner: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  intermediate: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface SuggestedWorkflow {
  title: string;
  description: string;
  steps: PipelineStep[];
  cost_category: string | null;
  difficulty: string | null;
  estimated_minutes: number | null;
}

export function WorkflowShowcase({ workflows, toolLogos }: WorkflowShowcaseProps) {
  const [mode, setMode] = useState<FilterMode>("free");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [goal, setGoal] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedWorkflow | null>(null);
  const [suggestError, setSuggestError] = useState("");

  const freeWorkflows = useMemo(() => workflows.filter(w => w.cost_category === "free"), [workflows]);
  const paidWorkflows = useMemo(() => workflows.filter(w => w.cost_category === "paid"), [workflows]);

  const currentWorkflow = useMemo(() => {
    if (mode === "suggest") return null;
    const list = mode === "free" ? freeWorkflows : mode === "paid" ? paidWorkflows : workflows;
    if (list.length === 0) return null;
    return list[currentIndex % list.length];
  }, [mode, currentIndex, freeWorkflows, paidWorkflows, workflows]);

  const handleToggle = useCallback((newMode: FilterMode) => {
    if (newMode === "suggest") {
      setMode("suggest");
      return;
    }
    if (newMode === mode) {
      // Clicking same toggle cycles to next
      setCurrentIndex(prev => prev + 1);
    } else {
      setMode(newMode);
      setCurrentIndex(0);
    }
    // Clear suggestion when switching to browse
    setSuggested(null);
    setSuggestError("");
  }, [mode]);

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
      setSuggested(data.workflow);
    } catch {
      setSuggestError("Network error. Please try again.");
    } finally {
      setSuggesting(false);
    }
  }, [goal, suggesting]);

  if (workflows.length === 0) return null;

  return (
    <section className="bg-[var(--surface)] rounded-2xl p-5 shadow-soft mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#0d1b1a] dark:text-white">
          Recommended Workflows
        </h2>
        <Link
          href="/tools/workflows"
          className="text-sm text-primary hover:underline flex items-center gap-1 no-underline"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Toggle pills */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(["free", "paid", "random"] as const).map((f) => (
          <button
            key={f}
            onClick={() => handleToggle(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
              mode === f
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {f === "free" ? "Free" : f === "paid" ? "Paid" : "Random"}
          </button>
        ))}
        <button
          onClick={() => handleToggle("suggest")}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer flex items-center gap-1",
            mode === "suggest"
              ? "bg-primary text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" /> Suggest
        </button>
      </div>

      {/* Content */}
      {mode === "suggest" ? (
        <div>
          {/* Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
              placeholder="Describe what you want to build..."
              maxLength={200}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#0d1b1a] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleSuggest}
              disabled={!goal.trim() || suggesting}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {suggesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </button>
          </div>

          {/* Loading skeleton */}
          {suggesting && (
            <div className="animate-pulse space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="flex items-center gap-3 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    {i < 4 && <Skeleton className="w-4 h-4" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {suggestError && (
            <p className="text-sm text-red-500 dark:text-red-400">{suggestError}</p>
          )}

          {/* AI-generated result */}
          {suggested && !suggesting && (
            <div className="animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-[#0d1b1a] dark:text-white mb-1">
                {suggested.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {suggested.description}
              </p>
              <WorkflowPipeline
                steps={suggested.steps}
                toolLogos={toolLogos}
              />
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span>{suggested.steps.length} steps</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI-generated
                </span>
              </div>
            </div>
          )}

          {/* Back to curated */}
          {(suggested || suggestError) && (
            <button
              onClick={() => {
                setMode("free");
                setCurrentIndex(0);
                setSuggested(null);
                setSuggestError("");
              }}
              className="mt-3 text-sm text-primary hover:underline cursor-pointer"
            >
              Back to curated workflows
            </button>
          )}
        </div>
      ) : currentWorkflow ? (
        <div>
          <h3 className="text-xl font-bold text-[#0d1b1a] dark:text-white mb-1">
            {currentWorkflow.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {currentWorkflow.description}
          </p>

          <WorkflowPipeline
            steps={currentWorkflow.steps}
            toolLogos={toolLogos}
          />

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {currentWorkflow.estimated_minutes && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{currentWorkflow.estimated_minutes} min
              </span>
            )}
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase", costColors[currentWorkflow.cost_category])}>
              {currentWorkflow.cost_category}
            </span>
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase", difficultyColors[currentWorkflow.difficulty])}>
              {currentWorkflow.difficulty}
            </span>
            <span className="text-xs text-gray-400">
              {currentWorkflow.steps.length} steps
            </span>

            <Link
              href={`/tools/workflows/${currentWorkflow.slug}`}
              className="ml-auto text-sm text-primary hover:underline flex items-center gap-1 no-underline"
            >
              See details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No workflows available for this filter.</p>
      )}
    </section>
  );
}
