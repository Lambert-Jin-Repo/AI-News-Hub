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
                    "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
                    "text-sm font-medium text-gray-700 dark:text-gray-200",
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
                "text-gray-400 hover:text-primary hover:bg-primary/5 dark:text-gray-500 dark:hover:text-primary dark:hover:bg-primary/10",
                "border border-transparent hover:border-primary/20",
                "group relative",
                className
            )}
            aria-label="Back to Home"
            title="Back to Home"
        >
            <House className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {/* Tooltip on hover */}
            <span className="absolute right-full mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Home
            </span>
        </Link>
    );
}
