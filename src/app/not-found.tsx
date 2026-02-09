import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist or has been moved.",
};

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
            <div className="text-center max-w-md px-6">
                {/* 404 Icon */}
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--surface)] flex items-center justify-center">
                    <span className="text-4xl font-bold text-[var(--muted-foreground)]">
                        404
                    </span>
                </div>

                <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">
                    Page not found
                </h1>

                <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
                    Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have
                    been moved, deleted, or never existed in the first place.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
                    >
                        Back to Home
                    </Link>

                    <Link
                        href="/news"
                        className="px-6 py-3 bg-[var(--surface)] text-[var(--foreground)] rounded-lg font-medium hover:opacity-80 transition-opacity border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
                    >
                        Browse News
                    </Link>
                </div>

                {/* Additional navigation links */}
                <nav className="mt-12 pt-8 border-t border-[var(--border)]" aria-label="Quick links">
                    <p className="text-sm text-[var(--muted-foreground)] mb-4">
                        Or try one of these pages:
                    </p>
                    <ul className="flex flex-wrap justify-center gap-4 text-sm">
                        <li>
                            <Link
                                href="/tools"
                                className="text-[var(--accent)] hover:underline focus:outline-none focus:underline"
                            >
                                AI Tools
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/about"
                                className="text-[var(--accent)] hover:underline focus:outline-none focus:underline"
                            >
                                About
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}
