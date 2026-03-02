"use client";

import { TransitionLink } from "@/components/ui/TransitionLink";
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
  category?: string | null;
  className?: string;
}

function CardContent({
  title,
  source,
  publishedAt,
  thumbnailUrl,
  description,
  summaryStatus = "completed",
  category,
}: Omit<NewsCardProps, "url" | "className">) {
  const timeDisplay = publishedAt ? formatRelativeTime(publishedAt) : "";

  return (
    <>
      {/* Thumbnail */}
      <div className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-[var(--surface)] flex items-center justify-center">
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
          <span className="text-2xl font-bold text-[var(--border)]">
            {source.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
              {source}
            </span>
            {category && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {category}
              </span>
            )}
            {timeDisplay && (
              <>
                <span className="text-[10px] text-[var(--border)]">
                  &bull;
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] flex items-center gap-1">
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
          <h3 className="text-lg font-bold text-[var(--foreground)] leading-tight mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <div className="mt-3 flex items-center text-primary text-sm font-bold gap-1">
          Read more
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </>
  );
}

const cardClassName =
  "paradigm-card p-5 flex gap-5 group cursor-pointer no-underline focus:outline-none focus:ring-2 focus:ring-primary/50 scroll-reveal overflow-hidden min-w-0";

export function NewsCard({
  title,
  url,
  source,
  publishedAt,
  thumbnailUrl,
  description,
  summaryStatus = "completed",
  category,
  className,
}: NewsCardProps) {
  const contentProps = { title, source, publishedAt, thumbnailUrl, description, summaryStatus, category };
  const isInternal = url.startsWith("/");

  if (isInternal) {
    return (
      <TransitionLink
        href={url}
        className={cn(cardClassName, className)}
        aria-label={`Read article: ${title}`}
      >
        <CardContent {...contentProps} />
      </TransitionLink>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Read article: ${title}`}
      className={cn(cardClassName, className)}
    >
      <CardContent {...contentProps} />
    </a>
  );
}
