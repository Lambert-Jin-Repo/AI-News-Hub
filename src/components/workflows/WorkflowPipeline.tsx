"use client";

import { ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

export interface PipelineStep {
  order: number;
  toolSlug: string;
  label: string;
  description: string;
  isOptional: boolean;
}

interface WorkflowPipelineProps {
  steps: PipelineStep[];
  toolLogos: Record<string, string | null>;
  className?: string;
}

export function WorkflowPipeline({ steps, toolLogos, className }: WorkflowPipelineProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-thin",
        className
      )}
    >
      {steps.map((step, i) => (
        <div key={step.order} className="flex items-center snap-start shrink-0">
          {/* Step */}
          <div
            className={cn(
              "flex flex-col items-center gap-1.5 w-20",
              step.isOptional && "opacity-60"
            )}
            title={step.description}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center",
                step.isOptional && "border border-dashed border-gray-300 dark:border-gray-600"
              )}
            >
              {toolLogos[step.toolSlug] ? (
                <SafeImage
                  src={toolLogos[step.toolSlug]!}
                  alt={step.label}
                  width={32}
                  height={32}
                  className="w-8 h-8 object-cover rounded-lg"
                  fallbackSrc="/placeholders/tool-placeholder.svg"
                />
              ) : (
                <span className="text-sm font-bold text-gray-400">
                  {step.label.charAt(0)}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center leading-tight truncate w-full">
              {step.label}
            </span>
            {step.isOptional && (
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Optional</span>
            )}
          </div>

          {/* Arrow connector */}
          {i < steps.length - 1 && (
            <ChevronRight
              className={cn(
                "w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mx-0.5",
                step.isOptional && "opacity-50"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
