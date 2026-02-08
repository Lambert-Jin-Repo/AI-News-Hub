import { Calendar, Headphones, FileText } from "lucide-react";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { cn } from "@/lib/utils";

export interface DigestCardProps {
  digestDate: string;
  summaryText: string;
  audioUrl: string | null;
  audioStatus: "pending" | "completed" | "failed";
  articleCount: number;
  className?: string;
  expanded?: boolean;
}

export function DigestCard({
  digestDate,
  summaryText,
  audioUrl,
  audioStatus,
  articleCount,
  className,
  expanded = false,
}: DigestCardProps) {
  const formattedDate = new Date(digestDate).toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={cn(
        "bg-[var(--surface)] rounded-2xl shadow-soft overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-[#0d1b1a] dark:text-white">
              Daily Digest
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <FileText className="w-4 h-4" />
            <span>{articleCount} articles</span>
          </div>
          {audioUrl && audioStatus === "completed" && (
            <div className="flex items-center gap-1.5 text-sm text-primary">
              <Headphones className="w-4 h-4" />
              <span>Audio available</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="p-5">
        <p
          className={cn(
            "text-gray-600 dark:text-gray-300 leading-relaxed",
            !expanded && "line-clamp-4"
          )}
        >
          {summaryText}
        </p>
      </div>

      {/* Audio Player (if available) */}
      {audioUrl && audioStatus === "completed" && (
        <div className="px-5 pb-5">
          <AudioPlayer src={audioUrl} title="Listen to today's digest" />
        </div>
      )}

      {/* Audio Pending State */}
      {audioStatus === "pending" && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Audio is being generated...</span>
          </div>
        </div>
      )}
    </div>
  );
}
