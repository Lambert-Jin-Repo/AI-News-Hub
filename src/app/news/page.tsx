import { supabase } from "@/lib/supabase";
import { NewsFeed } from "./news-feed";
import { BackToHome } from "@/components/ui/BackToHome";

export const revalidate = 3600;

export const metadata = {
  title: "AI News — AI News Hub",
  description: "Latest AI industry news, updated daily.",
};

async function getInitialArticles() {
  const { data } = await supabase
    .from("articles")
    .select(
      "id, title, slug, url, source, published_at, thumbnail_url, raw_excerpt, ai_summary, summary_status, is_featured"
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(20);

  return data || [];
}

async function getSources() {
  const { data } = await supabase
    .from("articles")
    .select("source")
    .not("source", "is", null);

  if (!data) return [];
  const unique = [...new Set(data.map((r) => r.source as string))];
  return unique.sort();
}

export default async function NewsPage() {
  const [articles, sources] = await Promise.all([
    getInitialArticles(),
    getSources(),
  ]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#0d1b1a] dark:text-white">
          AI News
        </h1>
        <BackToHome variant="icon" />
      </div>
      <NewsFeed initialArticles={articles} sources={sources} />
    </main>
  );
}
