import Link from "next/link";
import { FileText, Hammer, Mail } from "lucide-react";

interface StatsRowProps {
    stats: {
        articles: number;
        tools: number;
        digests: number;
    };
}

export function StatsRow({ stats }: StatsRowProps) {
    return (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] py-6 px-8 flex flex-col md:flex-row justify-around items-center gap-6 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
            <div className="flex items-center gap-4 px-6 w-full md:w-auto justify-center md:justify-start">
                <div className="p-2 bg-accent/10 rounded-md text-accent border border-accent/20">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                        {stats.articles}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                        Articles Scanned
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4 px-6 w-full md:w-auto justify-center md:justify-start pt-6 md:pt-0">
                <div className="p-2 bg-accent/10 rounded-md text-accent border border-accent/20">
                    <Hammer className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                        {stats.tools}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">AI Tools</p>
                </div>
            </div>
            <Link
                href="/digests"
                className="flex items-center gap-4 px-6 w-full md:w-auto justify-center md:justify-start pt-6 md:pt-0 no-underline hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#102220] rounded-md"
            >
                <div className="p-2 bg-accent/10 rounded-md text-accent border border-accent/20">
                    <Mail className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                        {stats.digests}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                        Daily Briefings
                    </p>
                </div>
            </Link>
        </div>
    );
}
