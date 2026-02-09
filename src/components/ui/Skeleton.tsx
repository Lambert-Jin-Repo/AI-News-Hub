"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
                className
            )}
            aria-hidden="true"
        />
    );
}

interface NewsCardSkeletonProps {
    className?: string;
}

export function NewsCardSkeleton({ className }: NewsCardSkeletonProps) {
    return (
        <div
            className={cn(
                "bg-[var(--surface)] rounded-xl overflow-hidden shadow-sm border border-[var(--border)]",
                className
            )}
            role="presentation"
            aria-label="Loading news article"
        >
            {/* Image skeleton */}
            <Skeleton className="h-48 w-full rounded-none" />

            <div className="p-4 space-y-3">
                {/* Source badge skeleton */}
                <Skeleton className="h-5 w-20" />

                {/* Title skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                </div>

                {/* Excerpt skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>

                {/* Footer skeleton */}
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        </div>
    );
}

interface ToolCardSkeletonProps {
    className?: string;
}

export function ToolCardSkeleton({ className }: ToolCardSkeletonProps) {
    return (
        <div
            className={cn(
                "bg-[var(--surface)] rounded-xl overflow-hidden shadow-sm border border-[var(--border)] p-4",
                className
            )}
            role="presentation"
            aria-label="Loading tool"
        >
            <div className="flex items-start gap-4">
                {/* Logo skeleton */}
                <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />

                <div className="flex-1 space-y-3">
                    {/* Name skeleton */}
                    <Skeleton className="h-5 w-32" />

                    {/* Description skeleton */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>

                    {/* Tags skeleton */}
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Footer skeleton */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border)]">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
            </div>
        </div>
    );
}

interface DigestCardSkeletonProps {
    className?: string;
}

export function DigestCardSkeleton({ className }: DigestCardSkeletonProps) {
    return (
        <div
            className={cn(
                "bg-[var(--surface)] rounded-xl overflow-hidden shadow-sm border border-[var(--border)] p-6",
                className
            )}
            role="presentation"
            aria-label="Loading digest"
        >
            <div className="space-y-4">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-5 w-24" />
                </div>

                {/* Audio player skeleton */}
                <Skeleton className="h-12 w-full rounded-lg" />

                {/* Content skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        </div>
    );
}

interface CardGridSkeletonProps {
    count?: number;
    variant?: "news" | "tool" | "digest";
    className?: string;
}

export function CardGridSkeleton({
    count = 6,
    variant = "news",
    className,
}: CardGridSkeletonProps) {
    const SkeletonComponent =
        variant === "news"
            ? NewsCardSkeleton
            : variant === "tool"
                ? ToolCardSkeleton
                : DigestCardSkeleton;

    return (
        <div
            className={cn(
                "grid gap-6",
                variant === "news" || variant === "tool"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1",
                className
            )}
        >
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonComponent key={i} />
            ))}
        </div>
    );
}
