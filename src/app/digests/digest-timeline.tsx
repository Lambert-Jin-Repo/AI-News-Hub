"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { DigestCard } from "@/components/cards/DigestCard";

interface DigestRow {
  id: string;
  digest_date: string;
  summary_text: string | null;
  audio_url: string | null;
  audio_status: "pending" | "completed" | "failed";
  article_ids: string[] | null;
}

interface DigestTimelineProps {
  initialDigests: DigestRow[];
  initialNextCursor: string | null;
}

function formatDateLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DigestTimeline({
  initialDigests,
  initialNextCursor,
}: DigestTimelineProps) {
  const [digests, setDigests] = useState<DigestRow[]>(initialDigests);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchDigests = useCallback(
    async (params: { date?: string; cursor?: string }) => {
      const url = new URL("/api/digests", window.location.origin);
      if (params.date) url.searchParams.set("date", params.date);
      if (params.cursor) url.searchParams.set("cursor", params.cursor);

      const res = await fetch(url.toString());
      if (!res.ok) return null;
      return res.json() as Promise<{
        digests: DigestRow[];
        nextCursor: string | null;
      }>;
    },
    []
  );

  const handleDateChange = useCallback(
    async (date: string) => {
      setSelectedDate(date);
      if (!date) {
        // Reset to show all digests
        setLoading(true);
        const data = await fetchDigests({});
        if (data) {
          setDigests(data.digests);
          setNextCursor(data.nextCursor);
        }
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await fetchDigests({ date });
      if (data) {
        setDigests(data.digests);
        setNextCursor(null); // Date query returns single result, no pagination
      }
      setLoading(false);
    },
    [fetchDigests]
  );

  const handlePrevDay = useCallback(() => {
    const base = selectedDate || todayString();
    handleDateChange(shiftDate(base, -1));
  }, [selectedDate, handleDateChange]);

  const handleNextDay = useCallback(() => {
    const base = selectedDate || todayString();
    const next = shiftDate(base, 1);
    if (next <= todayString()) {
      handleDateChange(next);
    }
  }, [selectedDate, handleDateChange]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchDigests({ cursor: nextCursor });
    if (data) {
      setDigests((prev) => [...prev, ...data.digests]);
      setNextCursor(data.nextCursor);
    }
    setLoadingMore(false);
  }, [fetchDigests, nextCursor, loadingMore]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div>
      {/* Date Navigation */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={handlePrevDay}
          className="p-2 rounded-lg bg-[var(--surface)] shadow-soft hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <input
          type="date"
          value={selectedDate}
          max={todayString()}
          onChange={(e) => handleDateChange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-[var(--surface)] text-sm text-[#0d1b1a] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={handleNextDay}
          disabled={!selectedDate || selectedDate >= todayString()}
          className="p-2 rounded-lg bg-[var(--surface)] shadow-soft hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        {selectedDate && (
          <button
            onClick={() => handleDateChange("")}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            Show all
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : digests.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">
            {selectedDate
              ? `No digest available for ${formatDateLabel(selectedDate)}.`
              : "No digests available yet."}
          </p>
        </div>
      ) : (
        /* Timeline */
        <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-4 pl-8 space-y-8">
          {digests.map((digest) => (
            <div key={digest.id} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-[41px] top-2 w-4 h-4 rounded-full bg-primary border-2 border-white dark:border-gray-900 shadow-sm" />

              {/* Date label */}
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                {formatDateLabel(digest.digest_date)}
              </p>

              {/* Digest card */}
              <div
                className="cursor-pointer"
                onClick={() => toggleExpand(digest.id)}
              >
                <DigestCard
                  digestDate={digest.digest_date}
                  summaryText={digest.summary_text || "No summary available."}
                  audioUrl={digest.audio_url}
                  audioStatus={digest.audio_status}
                  articleCount={digest.article_ids?.length ?? 0}
                  expanded={expandedIds.has(digest.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {nextCursor && !loading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load older digests"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
