"use client";

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
}

export function FilterBar({
  options,
  selected,
  onChange,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn("flex gap-2 flex-wrap", className)}
      role="tablist"
      aria-label="Filter options"
    >
      {options.map((option) => {
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
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
