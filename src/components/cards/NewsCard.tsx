"use client";

import { ArrowRight, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatters";
import { SafeImage } from "@/components/ui/SafeImage";
import type { SummaryStatus } from "@/lib/constants";

export interface NewsCardProps {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  thumbnailUrl?: string | null;
  description: string | null;
  summaryStatus?: SummaryStatus;
  className?: string;
}

export function NewsCard({
  title,
  url,
  source,
  publishedAt,
  thumbnailUrl,
  description,
  summaryStatus = "completed",
  className,
}: NewsCardProps) {
  const timeDisplay = publishedAt ? formatRelativeTime(publishedAt) : "";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "bg-[var(--surface)] rounded-[16px] p-5 shadow-soft hover:shadow-soft-hover transition-all duration-300 flex gap-5 group cursor-pointer border border-transparent hover:border-primary/20 no-underline",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        {thumbnailUrl ? (
          <SafeImage
            src={thumbnailUrl}
            alt=""
            width={96}
            height={96}
            className="w-full h-full object-cover"
            fallbackSrc="/placeholders/news-placeholder.svg"
          />
        ) : (
          <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">
            {source.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-300">
              {source}
            </span>
            {timeDisplay && (
              <>
                <span className="text-[10px] text-gray-300 dark:text-gray-500">
                  &bull;
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeDisplay}
                </span>
              </>
            )}
            {summaryStatus === "pending" && (
              <span className="flex items-center gap-1 text-[10px] text-amber-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Summarising
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-[#0d1b1a] dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <div className="mt-3 flex items-center text-primary text-sm font-bold gap-1">
          Read more
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </a>
  );
}
