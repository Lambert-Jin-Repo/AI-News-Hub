import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsCardProps {
    source: string;
    timeAgo: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    iconBgInfo: string; // e.g. "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700"
    className?: string;
}

export function NewsCard({
    source,
    timeAgo,
    title,
    description,
    icon,
    iconBgInfo,
    className,
}: NewsCardProps) {
    return (
        <div
            className={cn(
                "bg-[var(--surface)] rounded-[16px] p-5 shadow-soft hover:shadow-soft-hover transition-all duration-300 flex gap-5 group cursor-pointer border border-transparent hover:border-primary/20",
                className
            )}
        >
            <div
                className={cn(
                    "shrink-0 w-24 h-24 rounded-xl flex items-center justify-center",
                    iconBgInfo
                )}
            >
                <div className="text-3xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
            </div>
            <div className="flex flex-col justify-between flex-1">
                <div>
                    <div className="flex gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-300">
                            {source}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-300 dark:text-gray-400">
                            •
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-300">
                            {timeAgo}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0d1b1a] dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2">
                        {description}
                    </p>
                </div>
                <div className="mt-3 flex items-center text-primary text-sm font-bold">
                    Read more
                </div>
            </div>
        </div>
    );
}
