"use client";

import Link from "next/link";
import { Terminal, Mail } from "lucide-react";

export function Footer() {
    return (
        <footer
            className="mt-12 bg-[#EBEBDF] dark:bg-[#0c1a19] border-t border-gray-200 dark:border-gray-800 py-10"
            role="contentinfo"
        >
            <div className="max-w-7xl mx-auto px-6">
                {/* Newsletter Section */}
                <div id="newsletter" className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <h3 className="text-lg font-bold text-[#0d1b1a] dark:text-white mb-2">
                                Stay Updated
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Get the latest AI news delivered to your inbox weekly.
                            </p>
                        </div>
                        <form
                            className="flex gap-2 w-full md:w-auto"
                            onSubmit={(e) => e.preventDefault()}
                            aria-label="Newsletter subscription"
                        >
                            <div className="relative flex-1 md:w-64">
                                <Mail
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                    aria-hidden="true"
                                />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-[#0d1b1a] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    aria-label="Email address for newsletter"
                                    disabled
                                />
                            </div>
                            <button
                                type="submit"
                                disabled
                                className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                                aria-label="Subscribe to newsletter (coming soon)"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                    <p className="text-xs text-gray-400 text-center md:text-right mt-3">
                        Newsletter coming soon. Stay tuned!
                    </p>
                </div>

                {/* Footer Content */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary"
                            aria-hidden="true"
                        >
                            <Terminal className="w-5 h-5" />
                        </div>
                        <span className="text-[#0d1b1a] dark:text-gray-200 font-bold">
                            AI News Hub
                        </span>
                    </div>
                    <nav
                        className="flex gap-8 text-sm font-medium text-gray-600 dark:text-gray-300"
                        aria-label="Footer navigation"
                    >
                        <Link
                            href="/about"
                            className="hover:text-primary transition-colors focus:outline-none focus:underline"
                        >
                            About
                        </Link>
                        <Link
                            href="/news"
                            className="hover:text-primary transition-colors focus:outline-none focus:underline"
                        >
                            News
                        </Link>
                        <Link
                            href="/tools"
                            className="hover:text-primary transition-colors focus:outline-none focus:underline"
                        >
                            Tools
                        </Link>
                        <Link
                            href="/digests"
                            className="hover:text-primary transition-colors focus:outline-none focus:underline"
                        >
                            Digests
                        </Link>
                    </nav>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} AI News Hub. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
