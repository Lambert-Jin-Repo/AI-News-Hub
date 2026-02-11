"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { ToolCard } from "@/components/cards/ToolCard";
import { ToolCardSkeleton } from "@/components/cards/ToolCardSkeleton";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterBar } from "@/components/ui/FilterBar";
import type { Tool } from "@/lib/supabase";
import { DEFAULTS } from "@/lib/constants";

type ToolRow = Pick<
  Tool,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "url"
  | "category"
  | "pricing_model"
  | "tags"
  | "logo_url"
  | "date_added"
>;

interface ToolsFeedProps {
  initialTools: ToolRow[];
  categories: string[];
}

const pricingOptions = [
  { label: "All Pricing", value: "" },
  { label: "Free", value: "free" },
  { label: "Freemium", value: "freemium" },
  { label: "Paid", value: "paid" },
];

type LoadingType = "idle" | "refresh" | "more";

export function ToolsFeed({ initialTools, categories }: ToolsFeedProps) {
  const [tools, setTools] = useState<ToolRow[]>(initialTools);
  const [nextCursor, setNextCursor] = useState<string | null>(() => {
    const last = initialTools[initialTools.length - 1];
    return initialTools.length >= DEFAULTS.TOOLS_PER_PAGE && last?.date_added
      ? `${last.date_added}|${last.id}`
      : null;
  });
  const [loadingType, setLoadingType] = useState<LoadingType>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPricing, setSelectedPricing] = useState("");

  const fetchTools = useCallback(
    async (params: {
      q?: string;
      category?: string;
      pricing?: string;
      cursor?: string;
    }) => {
      const url = new URL("/api/tools", window.location.origin);
      if (params.q) url.searchParams.set("q", params.q);
      if (params.category) url.searchParams.set("category", params.category);
      if (params.pricing) url.searchParams.set("pricing", params.pricing);
      if (params.cursor) url.searchParams.set("cursor", params.cursor);

      const res = await fetch(url.toString());
      if (!res.ok) return null;
      return res.json() as Promise<{
        tools: ToolRow[];
        nextCursor: string | null;
      }>;
    },
    []
  );

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      setLoadingType("refresh");
      const data = await fetchTools({
        q: query,
        category: selectedCategory,
        pricing: selectedPricing,
      });
      if (data) {
        setTools(data.tools);
        setNextCursor(data.nextCursor);
      }
      setLoadingType("idle");
    },
    [fetchTools, selectedCategory, selectedPricing]
  );

  const handleCategoryFilter = useCallback(
    async (category: string) => {
      setSelectedCategory(category);
      setLoadingType("refresh");
      const data = await fetchTools({
        q: searchQuery,
        category: category || undefined,
        pricing: selectedPricing || undefined,
      });
      if (data) {
        setTools(data.tools);
        setNextCursor(data.nextCursor);
      }
      setLoadingType("idle");
    },
    [fetchTools, searchQuery, selectedPricing]
  );

  const handlePricingFilter = useCallback(
    async (pricing: string) => {
      setSelectedPricing(pricing);
      setLoadingType("refresh");
      const data = await fetchTools({
        q: searchQuery,
        category: selectedCategory || undefined,
        pricing: pricing || undefined,
      });
      if (data) {
        setTools(data.tools);
        setNextCursor(data.nextCursor);
      }
      setLoadingType("idle");
    },
    [fetchTools, searchQuery, selectedCategory]
  );

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || loadingType !== "idle") return;
    setLoadingType("more");
    const data = await fetchTools({
      q: searchQuery || undefined,
      category: selectedCategory || undefined,
      pricing: selectedPricing || undefined,
      cursor: nextCursor,
    });
    if (data) {
      setTools((prev) => [...prev, ...data.tools]);
      setNextCursor(data.nextCursor);
    }
    setLoadingType("idle");
  }, [fetchTools, nextCursor, loadingType, searchQuery, selectedCategory, selectedPricing]);

  const categoryOptions = [
    { label: "All Categories", value: "" },
    ...categories.map((c) => ({ label: c, value: c })),
  ];

  return (
    <div>
      {/* Search and filters */}
      <div className="space-y-4 mb-8">
        <SearchInput
          placeholder="Search tools..."
          onChange={handleSearch}
          debounceMs={400}
        />
        <div className="flex flex-col sm:flex-row gap-4">
          {categories.length > 0 && (
            <FilterBar
              options={categoryOptions}
              selected={selectedCategory}
              onChange={handleCategoryFilter}
            />
          )}
          <FilterBar
            options={pricingOptions}
            selected={selectedPricing}
            onChange={handlePricingFilter}
          />
        </div>
      </div>

      {/* Tool grid */}
      {loadingType === "refresh" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ToolCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {tools.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              No tools found.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <ToolCard
                key={tool.id}
                name={tool.name}
                slug={tool.slug}
                description={tool.description}
                url={tool.url || "#"}
                category={tool.category || "Uncategorized"}
                pricingModel={tool.pricing_model}
                tags={tool.tags || []}
                logoUrl={tool.logo_url}
              />
            ))}
          </div>

          {/* Load more skeletons */}
          {loadingType === "more" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <ToolCardSkeleton key={i} />
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
