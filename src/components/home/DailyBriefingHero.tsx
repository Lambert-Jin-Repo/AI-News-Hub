import React from "react";
import Link from "next/link";
import { FileText, PlayCircle } from "lucide-react";
import { ShareButton } from "@/components/ui/ShareButton";

interface DigestSection {
    title: string;
    content: string;
}

interface DailyBriefingHeroProps {
    displayDate: string;
    digestSections: DigestSection[] | null;
    digest: { summary_text?: string | null } | null;
    sectionIcons: Record<string, React.ComponentType<{ className?: string }>>;
}

function renderMarkdownInline(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function DailyBriefingHero({ displayDate, digestSections, digest, sectionIcons }: DailyBriefingHeroProps) {
    return (
        <div className="lg:col-span-8 bg-[var(--surface)] text-[var(--foreground)] rounded-xl border border-[var(--border)] p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                    <div className="pulse-dot"></div>
                    <span className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                        Live Updates
                    </span>
                </div>
                <span className="text-muted-foreground text-sm font-medium">
                    {displayDate}
                </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-[1.15] mb-6">
                Your Daily <span className="text-primary">AI Briefing</span>
            </h1>
            <div className="prose dark:prose-invert max-w-none space-y-4">
                {digestSections ? (
                    <div className="space-y-6">
                        {digestSections.map((section: DigestSection, idx: number) => {
                            const IconComponent = sectionIcons[section.title] || FileText;
                            return (
                                <div key={idx}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <IconComponent className="w-5 h-5 text-primary shrink-0" />
                                        <h3 className="text-base font-bold m-0">
                                            {section.title}
                                        </h3>
                                    </div>
                                    <div className="pl-7">
                                        {section.content
                                            .split("\n")
                                            .filter(Boolean)
                                            .map((line: string, i: number) => {
                                                if (line.startsWith("- ")) {
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="flex items-start gap-2 text-sm text-muted-foreground mb-1.5"
                                                        >
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                                            <span
                                                                dangerouslySetInnerHTML={{
                                                                    __html: renderMarkdownInline(line.slice(2)),
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <p
                                                        key={i}
                                                        className="text-sm text-muted-foreground mb-1.5"
                                                        dangerouslySetInnerHTML={{
                                                            __html: renderMarkdownInline(line),
                                                        }}
                                                    />
                                                );
                                            })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : digest?.summary_text ? (
                    digest.summary_text
                        .split("\n\n")
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((paragraph: string, i: number) => (
                            <p
                                key={i}
                                className={
                                    i === 0
                                        ? "text-lg leading-relaxed text-muted-foreground"
                                        : "text-base leading-relaxed text-muted-foreground opacity-90 dark:opacity-100"
                                }
                            >
                                {paragraph}
                            </p>
                        ))
                ) : (
                    <p className="text-lg leading-relaxed text-muted-foreground">
                        No digest available yet. Check back soon for today&apos;s AI briefing.
                    </p>
                )}
            </div>
            <div className="mt-8 pt-6 border-t border-[var(--border)] flex gap-4">
                <Link
                    href="/digests"
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-md font-bold text-sm hover:bg-primary-dark transition-all no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#102220]"
                >
                    <PlayCircle className="w-5 h-5" />
                    Read Full Digest
                </Link>
                <ShareButton />
            </div>
        </div>
    );
}
