"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { NewsCard } from "@/components/cards/NewsCard";
import { NewsCardSkeleton } from "@/components/cards/NewsCardSkeleton";
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
  | "category"
>;

interface NewsFeedProps {
  initialArticles: ArticleRow[];
  sources: string[];
  categories?: string[];
}

type LoadingType = "idle" | "refresh" | "more";

export function NewsFeed({ initialArticles, sources, categories = [] }: NewsFeedProps) {
  const [articles, setArticles] = useState<ArticleRow[]>(initialArticles);
  const [nextCursor, setNextCursor] = useState<string | null>(() => {
    const last = initialArticles[initialArticles.length - 1];
    return initialArticles.length >= 20 && last?.published_at
      ? `${last.published_at}|${last.id}`
      : null;
  });
  const [loadingType, setLoadingType] = useState<LoadingType>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const fetchArticles = useCallback(
    async (params: { q?: string; source?: string; category?: string; cursor?: string }) => {
      const url = new URL("/api/news", window.location.origin);
      if (params.q) url.searchParams.set("q", params.q);
      if (params.source) url.searchParams.set("source", params.source);
      if (params.category) url.searchParams.set("category", params.category);
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
      setLoadingType("refresh");
      const data = await fetchArticles({ q: query, source: selectedSource, category: selectedCategory });
      if (data) {
        setArticles(data.articles);
        setNextCursor(data.nextCursor);
      }
      setLoadingType("idle");
    },
    [fetchArticles, selectedSource, selectedCategory]
  );

  const handleSourceFilter = useCallback(
    async (source: string) => {
      setSelectedSource(source);
      setLoadingType("refresh");
      const data = await fetchArticles({
        q: searchQuery,
        source: source || undefined,
        category: selectedCategory || undefined,
      });
      if (data) {
        setArticles(data.articles);
        setNextCursor(data.nextCursor);
      }
      setLoadingType("idle");
    },
    [fetchArticles, searchQuery, selectedCategory]
  );

  const handleCategoryFilter = useCallback(
    async (category: string) => {
      setSelectedCategory(category);
      setLoadingType("refresh");
      const data = await fetchArticles({
        q: searchQuery,
        source: selectedSource || undefined,
        category: category || undefined,
      });
      if (data) {
        setArticles(data.articles);
        setNextCursor(data.nextCursor);
      }
      setLoadingType("idle");
    },
    [fetchArticles, searchQuery, selectedSource]
  );

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || loadingType !== "idle") return;
    setLoadingType("more");
    const data = await fetchArticles({
      q: searchQuery || undefined,
      source: selectedSource || undefined,
      category: selectedCategory || undefined,
      cursor: nextCursor,
    });
    if (data) {
      setArticles((prev) => [...prev, ...data.articles]);
      setNextCursor(data.nextCursor);
    }
    setLoadingType("idle");
  }, [fetchArticles, nextCursor, loadingType, searchQuery, selectedSource, selectedCategory]);

  const sourceOptions = [
    { label: "All Sources", value: "" },
    ...sources.map((s) => ({ label: s, value: s })),
  ];

  const categoryOptions = [
    { label: "All Topics", value: "" },
    ...categories.map((c) => ({ label: c.toUpperCase(), value: c })),
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
            options={sourceOptions}
            selected={selectedSource}
            onChange={handleSourceFilter}
          />
        )}
        {categories.length > 0 && (
          <FilterBar
            options={categoryOptions}
            selected={selectedCategory}
            onChange={handleCategoryFilter}
          />
        )}
      </div>

      {/* Article list */}
      {loadingType === "refresh" ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {articles.length === 0 && (
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
                category={article.category}
              />
            ))}
          </div>

          {/* Load more skeletons */}
          {loadingType === "more" && (
            <div className="space-y-4 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Load more button */}
      {nextCursor && loadingType !== "refresh" && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingType !== "idle"}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loadingType === "more" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
