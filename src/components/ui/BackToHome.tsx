"use client";

import Link from "next/link";
import { House } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackToHomeProps {
    className?: string;
    variant?: "pill" | "icon" | "ghost";
}

export function BackToHome({ className, variant = "ghost" }: BackToHomeProps) {
    if (variant === "pill") {
        // Current style (pill with text)
        return (
            <Link
                href="/"
                className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                    "bg-[var(--surface)] hover:bg-[var(--border)]",
                    "text-sm font-medium text-[var(--foreground)]",
                    "transition-colors duration-200 no-underline",
                    className
                )}
            >
                <House className="w-4 h-4" />
                Back to Home
            </Link>
        );
    }

    // Minimalist Icon Button (Ghost/Outline style)
    return (
        <Link
            href="/"
            className={cn(
                "inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300",
                "text-[var(--muted-foreground)] hover:text-primary hover:bg-primary/5",
                "border border-transparent hover:border-primary/20",
                "group relative",
                className
            )}
            aria-label="Back to Home"
            title="Back to Home"
        >
            <House className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {/* Tooltip on hover */}
            <span className="absolute right-full mr-2 px-2 py-1 bg-[var(--foreground)] text-[var(--surface)] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Home
            </span>
        </Link>
    );
}
