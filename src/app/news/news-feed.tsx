"use client";

import { useState, useCallback } from "react";
import { NewsCard } from "@/components/cards/NewsCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterBar } from "@/components/ui/FilterBar";
import type { Article } from "@/lib/supabase";

type ArticleRow = Pick<
  Article,
  | "id"
  | "title"
  | "slug"
  | "url"
  | "source"
  | "published_at"
  | "thumbnail_url"
  | "raw_excerpt"
  | "ai_summary"
  | "summary_status"
  | "is_featured"
>;

interface NewsFeedProps {
  initialArticles: ArticleRow[];
  sources: string[];
}

export function NewsFeed({ initialArticles, sources }: NewsFeedProps) {
  const [articles, setArticles] = useState<ArticleRow[]>(initialArticles);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialArticles.length >= 20 && initialArticles[initialArticles.length - 1]?.published_at
      ? initialArticles[initialArticles.length - 1].published_at
      : null
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("");

  const fetchArticles = useCallback(
    async (params: { q?: string; source?: string; cursor?: string }) => {
      const url = new URL("/api/news", window.location.origin);
      if (params.q) url.searchParams.set("q", params.q);
      if (params.source) url.searchParams.set("source", params.source);
      if (params.cursor) url.searchParams.set("cursor", params.cursor);

      const res = await fetch(url.toString());
      if (!res.ok) return null;
      return res.json() as Promise<{
        articles: ArticleRow[];
        nextCursor: string | null;
      }>;
    },
    []
  );

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      setLoading(true);
      const data = await fetchArticles({ q: query, source: selectedSource });
      if (data) {
        setArticles(data.articles);
        setNextCursor(data.nextCursor);
      }
      setLoading(false);
    },
    [fetchArticles, selectedSource]
  );

  const handleSourceFilter = useCallback(
    async (source: string) => {
      setSelectedSource(source);
      setLoading(true);
      const data = await fetchArticles({
        q: searchQuery,
        source: source || undefined,
      });
      if (data) {
        setArticles(data.articles);
        setNextCursor(data.nextCursor);
      }
      setLoading(false);
    },
    [fetchArticles, searchQuery]
  );

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    const data = await fetchArticles({
      q: searchQuery || undefined,
      source: selectedSource || undefined,
      cursor: nextCursor,
    });
    if (data) {
      setArticles((prev) => [...prev, ...data.articles]);
      setNextCursor(data.nextCursor);
    }
    setLoading(false);
  }, [fetchArticles, nextCursor, loading, searchQuery, selectedSource]);

  const filterOptions = [
    { label: "All Sources", value: "" },
    ...sources.map((s) => ({ label: s, value: s })),
  ];

  return (
    <div>
      {/* Search and filters */}
      <div className="space-y-4 mb-8">
        <SearchInput
          placeholder="Search articles..."
          onChange={handleSearch}
          debounceMs={400}
        />
        {sources.length > 0 && (
          <FilterBar
            options={filterOptions}
            selected={selectedSource}
            onChange={handleSourceFilter}
          />
        )}
      </div>

      {/* Article list */}
      {articles.length === 0 && !loading && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-12">
          No articles found.
        </p>
      )}

      <div className="space-y-4">
        {articles.map((article) => (
          <NewsCard
            key={article.id}
            title={article.title}
            url={article.slug ? `/news/${article.slug}` : article.url}
            source={article.source || "Unknown"}
            publishedAt={article.published_at}
            thumbnailUrl={article.thumbnail_url}
            description={article.ai_summary || article.raw_excerpt}
            summaryStatus={article.summary_status}
          />
        ))}
      </div>

      {/* Load more */}
      {nextCursor && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
