import { Sparkles, Calendar } from "lucide-react";

interface DailyWordCardProps {
    term: string;
    content: string;
    displayDate: string;
    provider?: string | null;
}

export function DailyWordCard({ term, content, displayDate }: DailyWordCardProps) {
    const formattedDate = new Date(displayDate + 'T00:00:00').toLocaleDateString("en-AU", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const renderContent = (text: string) => {
        const lines = text.split('\n').filter(line => line.trim() !== '');

        return (
            <div className="space-y-2 mt-3 text-sm">
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
        <div className="bg-[var(--surface)] rounded-[16px] shadow-soft p-6 relative overflow-hidden group hover:shadow-soft-hover transition-shadow">
            {/* Decorative gradient orb */}
            <div className="absolute top-0 right-0 size-24 bg-accent/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-accent/10 rounded-full text-accent">
                            <Sparkles className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                            Daily Word
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        <Calendar className="w-3 h-3" />
                        {formattedDate}
                    </div>
                </div>

                <h3 className="text-lg font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-1">
                    {term}
                </h3>

                {renderContent(content)}
            </div>
        </div>
    );
}
