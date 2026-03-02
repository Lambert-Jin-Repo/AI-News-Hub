"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  options: FilterOption[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
  /** Number of items to show when collapsed. 0 = show all (no collapse). */
  collapsedCount?: number;
}

export function FilterBar({
  options,
  selected,
  onChange,
  className,
  collapsedCount = 0,
}: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const shouldCollapse = collapsedCount > 0 && options.length > collapsedCount;
  const visibleOptions = shouldCollapse && !expanded
    ? options.slice(0, collapsedCount)
    : options;
  const hiddenCount = options.length - collapsedCount;

  // If the selected value is in hidden options, force expand
  const selectedIsHidden =
    shouldCollapse &&
    !expanded &&
    selected &&
    !visibleOptions.some((o) => o.value === selected);

  const displayOptions = selectedIsHidden ? options : visibleOptions;
  const isExpanded = expanded || selectedIsHidden;

  return (
    <div
      className={cn("flex gap-2 flex-wrap items-center", className)}
      role="tablist"
      aria-label="Filter options"
    >
      {displayOptions.map((option) => {
        const isActive = option.value === selected;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer",
              isActive
                ? "bg-primary text-white shadow-sm"
                : "bg-[var(--surface)] text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/20"
            )}
          >
            {option.label}
          </button>
        );
      })}
      {shouldCollapse && (
        <button
          onClick={() => setExpanded(!isExpanded)}
          className="px-3 py-2 rounded-full text-sm font-medium text-primary hover:bg-primary/10 transition-all cursor-pointer flex items-center gap-1"
          aria-label={isExpanded ? "Show fewer filters" : `Show ${hiddenCount} more filters`}
        >
          {isExpanded ? (
            <>
              Less <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              +{hiddenCount} more <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
