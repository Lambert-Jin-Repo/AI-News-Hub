import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface FeaturedToolCardProps {
    toolsCount: number;
}

export function FeaturedToolCard({ toolsCount }: FeaturedToolCardProps) {
    return (
        <Link
            href="/tools"
            className="bg-[var(--surface)] text-[var(--foreground)] rounded-xl border border-[var(--border)] p-6 flex flex-col justify-center relative group hover:border-primary/50 transition-colors cursor-pointer no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#102220]"
        >
            {/* Decorative shapes */}
            <div className="absolute top-0 right-0 size-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-[var(--background)] text-xs font-bold rounded-md border border-[var(--border)]">
                        FEATURED
                    </span>
                    <ArrowRight className="text-primary w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-bold mb-2">Browse AI Tools</h3>
                <p className="text-muted-foreground text-sm mb-4">
                    Discover the latest productivity apps and models.
                </p>
                <div className="flex items-center">
                    <span className="text-sm font-bold">
                        {toolsCount > 0 ? `${toolsCount} tools` : "Explore directory"}
                    </span>
                </div>
            </div>
        </Link>
    );
}
