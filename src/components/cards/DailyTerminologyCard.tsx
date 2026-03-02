"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, ArrowRight } from "lucide-react";

interface TerminologyData {
    term: string;
    content: string;
    provider: string;
}

export function DailyTerminologyCard() {
    const [data, setData] = useState<TerminologyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchTerminology() {
            try {
                setLoading(true);
                const res = await fetch("/api/terminology");
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchTerminology();
    }, []);

    const renderContent = (content: string) => {
        const lines = content.split('\n').filter(line => line.trim() !== '');

        return (
            <div className="space-y-3 mt-4 text-sm">
                {lines.map((line, i) => {
                    let formattedLine = line;
                    formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--foreground)]">$1</strong>');

                    return (
                        <p
                            key={i}
                            className="text-[var(--muted-foreground)] leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formattedLine }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="paradigm-card p-6 relative overflow-hidden group">
            {/* Decorative gradient orb */}
            <div className="absolute top-0 right-0 size-32 bg-accent/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-accent/10 rounded-full text-accent">
                            <Sparkles className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                            Word of the Day
                        </span>
                    </div>
                    {loading && <RefreshCw className="w-4 h-4 text-[var(--muted-foreground)] animate-spin" />}
                </div>

                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-6 bg-[var(--border)] rounded w-3/4"></div>
                        <div className="h-4 bg-[var(--border)] rounded w-full mt-4"></div>
                        <div className="h-4 bg-[var(--border)] rounded w-5/6"></div>
                        <div className="h-4 bg-[var(--border)] rounded w-4/6"></div>
                    </div>
                ) : error ? (
                    <div className="text-sm text-[var(--muted-foreground)] text-center py-4">
                        Could not load today&apos;s terminology.
                    </div>
                ) : data ? (
                    <>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                            {data.term}
                        </h3>
                        {renderContent(data.content)}
                        <div className="mt-5 pt-4 border-t border-[var(--border)]">
                            <Link
                                href="/daily-words"
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-dark transition-colors no-underline group/link"
                            >
                                Learn More
                                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
