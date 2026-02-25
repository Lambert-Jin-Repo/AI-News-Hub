import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";
import type { WorkflowStep } from "@/lib/supabase";

interface WorkflowCardProps {
  slug: string;
  title: string;
  description: string | null;
  costCategory: "free" | "paid";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number | null;
  steps: WorkflowStep[];
  toolLogos: Record<string, string | null>;
  className?: string;
}

const costColors = {
  free: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const difficultyColors = {
  beginner: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  intermediate: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function WorkflowCard({
  slug,
  title,
  description,
  costCategory,
  difficulty,
  estimatedMinutes,
  steps,
  toolLogos,
  className,
}: WorkflowCardProps) {
  return (
    <Link
      href={`/tools/workflows/${slug}`}
      className={cn(
        "block bg-[var(--surface)] rounded-2xl p-5 shadow-soft hover:shadow-soft-hover transition-all duration-300 border border-transparent hover:border-primary/20 group no-underline",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-[#0d1b1a] dark:text-white group-hover:text-primary transition-colors">
          {title}
        </h3>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
      </div>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {description}
        </p>
      )}

      {/* Mini tool logo row */}
      <div className="flex items-center gap-1.5 mb-3">
        {steps.map((step, i) => (
          <div key={step.order} className="flex items-center">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {toolLogos[step.toolSlug] ? (
                <SafeImage
                  src={toolLogos[step.toolSlug]!}
                  alt={step.label}
                  width={24}
                  height={24}
                  className="w-6 h-6 object-cover rounded"
                  fallbackSrc="/placeholders/tool-placeholder.svg"
                />
              ) : (
                <span className="text-xs font-bold text-gray-400">
                  {step.label.charAt(0)}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 mx-0.5" />
            )}
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase", costColors[costCategory])}>
          {costCategory}
        </span>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase", difficultyColors[difficulty])}>
          {difficulty}
        </span>
        {estimatedMinutes && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ~{estimatedMinutes} min
          </span>
        )}
        <span className="text-xs text-gray-400">
          {steps.length} steps
        </span>
      </div>
    </Link>
  );
}
