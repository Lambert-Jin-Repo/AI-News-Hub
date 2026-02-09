import { getSupabaseClient } from "@/lib/supabase";
import { NewsFeed } from "./news-feed";
import { BackToHome } from "@/components/ui/BackToHome";

export const revalidate = 3600;

export const metadata = {
  title: "AI News — AI News Hub",
  description: "Latest AI industry news, updated daily.",
};

async function getInitialArticles() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("articles")
    .select(
      "id, title, slug, url, source, published_at, thumbnail_url, raw_excerpt, ai_summary, summary_status, is_featured, category"
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(20);

  return data || [];
}

async function getSources() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("articles")
    .select("source")
    .not("source", "is", null);

  if (!data) return [];
  const unique = [...new Set(data.map((r) => r.source as string))];
  return unique.sort();
}

async function getCategories(): Promise<string[]> {
  const { data } = await supabase
    .from("articles")
    .select("category")
    .not("category", "is", null)
    .order("category");

  if (!data) return [];
  return [...new Set(data.map((d) => d.category as string).filter(Boolean))];
}

export default async function NewsPage() {
  const [articles, sources, categories] = await Promise.all([
    getInitialArticles(),
    getSources(),
    getCategories(),
  ]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#0d1b1a] dark:text-white">
          AI News
        </h1>
        <BackToHome variant="icon" />
      </div>
      <NewsFeed
        initialArticles={articles}
        sources={sources}
        categories={categories}
      />
    </main>
  );
}
