"use client";

import { useState, useCallback } from "react";
import { ToolCard } from "@/components/cards/ToolCard";
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

export function ToolsFeed({ initialTools, categories }: ToolsFeedProps) {
  const [tools, setTools] = useState<ToolRow[]>(initialTools);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialTools.length >= DEFAULTS.TOOLS_PER_PAGE &&
      initialTools[initialTools.length - 1]?.date_added
      ? initialTools[initialTools.length - 1].date_added
      : null
  );
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      const data = await fetchTools({
        q: query,
        category: selectedCategory,
        pricing: selectedPricing,
      });
      if (data) {
        setTools(data.tools);
        setNextCursor(data.nextCursor);
      }
      setLoading(false);
    },
    [fetchTools, selectedCategory, selectedPricing]
  );

  const handleCategoryFilter = useCallback(
    async (category: string) => {
      setSelectedCategory(category);
      setLoading(true);
      const data = await fetchTools({
        q: searchQuery,
        category: category || undefined,
        pricing: selectedPricing || undefined,
      });
      if (data) {
        setTools(data.tools);
        setNextCursor(data.nextCursor);
      }
      setLoading(false);
    },
    [fetchTools, searchQuery, selectedPricing]
  );

  const handlePricingFilter = useCallback(
    async (pricing: string) => {
      setSelectedPricing(pricing);
      setLoading(true);
      const data = await fetchTools({
        q: searchQuery,
        category: selectedCategory || undefined,
        pricing: pricing || undefined,
      });
      if (data) {
        setTools(data.tools);
        setNextCursor(data.nextCursor);
      }
      setLoading(false);
    },
    [fetchTools, searchQuery, selectedCategory]
  );

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
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
    setLoading(false);
  }, [fetchTools, nextCursor, loading, searchQuery, selectedCategory, selectedPricing]);

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
      {tools.length === 0 && !loading && (
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
