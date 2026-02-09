"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        // Log error to console in development, structured log in production
        logger.error("Unhandled error in page render", error, {
            digest: error.digest,
        });
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
            <div className="text-center max-w-md px-6">
                {/* Error Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <svg
                        className="w-10 h-10 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">
                    Something went wrong
                </h1>

                <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
                    We encountered an unexpected error. This has been logged and we&apos;ll
                    look into it. In the meantime, you can try refreshing the page or
                    return to the homepage.
                </p>

                {/* Error digest for debugging */}
                {error.digest && (
                    <p className="text-xs text-[var(--muted-foreground)] mb-6 font-mono bg-[var(--surface)] px-3 py-2 rounded-md inline-block">
                        Error ID: {error.digest}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
                        aria-label="Try again"
                    >
                        Try Again
                    </button>

                    <Link
                        href="/"
                        className="px-6 py-3 bg-[var(--surface)] text-[var(--foreground)] rounded-lg font-medium hover:opacity-80 transition-opacity border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
