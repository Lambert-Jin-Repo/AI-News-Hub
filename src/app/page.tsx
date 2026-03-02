import Link from "next/link";
import { NewsCard } from "@/components/cards/NewsCard";
import { DailyTerminologyCard } from "@/components/cards/DailyTerminologyCard";
import { getSupabaseClient } from "@/lib/supabase";
import {
  ArrowRight,
  Zap,
  Rocket,
  Eye,
  Lightbulb,
} from "lucide-react";
import { DailyBriefingHero } from "@/components/home/DailyBriefingHero";
import { AudioPlayerCard } from "@/components/home/AudioPlayerCard";
import { FeaturedToolCard } from "@/components/home/FeaturedToolCard";
import { StatsRow } from "@/components/home/StatsRow";

export const dynamic = 'force-dynamic';

async function getLatestDigest() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("daily_digests")
    .select("id, digest_date, summary_text, audio_url, audio_status")
    .order("digest_date", { ascending: false })
    .limit(1)
    .single();

  return data;
}

async function getLatestArticles() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("articles")
    .select(
      "id, title, slug, url, source, published_at, thumbnail_url, raw_excerpt, ai_summary, summary_status, is_featured"
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(6);

  return data || [];
}

async function getStats() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      articles: 0,
      tools: 0,
      digests: 0,
    };
  }

  const [articlesRes, toolsRes, digestsRes] = await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("daily_digests")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    articles: articlesRes.count ?? 0,
    tools: toolsRes.count ?? 0,
    digests: digestsRes.count ?? 0,
  };
}

// Section icon mapping for structured digest
const SECTION_ICONS: Record<string, typeof Zap> = {
  "The Big Picture": Zap,
  "Key Releases": Rocket,
  "Worth Watching": Eye,
  "Developer Takeaway": Lightbulb,
};

interface DigestSection {
  title: string;
  content: string;
}

function parseDigestSections(text: string): DigestSection[] | null {
  const parts = text.split(/^## /m).filter(Boolean);
  if (parts.length < 2) return null; // Not sectioned format

  const sections: DigestSection[] = [];
  for (const part of parts) {
    const [titleLine, ...rest] = part.split("\n");
    const title = titleLine.trim();
    sections.push({ title, content: rest.join("\n").trim() });
  }

  return sections.length > 0 ? sections : null;
}

export default async function Home() {
  const [digest, articles, stats] = await Promise.all([
    getLatestDigest(),
    getLatestArticles(),
    getStats(),
  ]);

  // Use digest date if available, otherwise use a static server-side date
  // This prevents hydration mismatch from timezone differences
  const displayDate = digest?.digest_date
    ? new Date(digest.digest_date + 'T00:00:00').toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : new Date().toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Australia/Perth", // Force consistent timezone (AWST)
    });

  const digestSections = digest?.summary_text
    ? parseDigestSections(digest.summary_text)
    : null;

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Section Grid */}
      <div className="home-hero-grid gap-6">
        {/* Hero Left: Daily Briefing */}
        <DailyBriefingHero
          displayDate={displayDate}
          digestSections={digestSections}
          digest={digest}
          sectionIcons={SECTION_ICONS}
        />

        {/* Hero Right: Audio & Featured & Terminology */}
        <div className="home-sidebar flex flex-col gap-6">
          <AudioPlayerCard digest={digest} />
          <FeaturedToolCard toolsCount={stats.tools} />
          <DailyTerminologyCard />
        </div>
      </div>

      {/* Stats Row */}
      <StatsRow stats={stats} />

      {/* Latest Headlines */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Latest Headlines</h2>
          <Link
            href="/news"
            className="text-sm font-bold text-primary hover:underline flex items-center gap-1 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#102220] rounded-sm"
          >
            View Archive
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {articles.length > 0 ? (
          <div className="news-card-grid gap-6">
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
        ) : (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-[var(--border)] rounded-xl">
            <p>No articles yet. News will appear here once the pipeline runs.</p>
          </div>
        )}
      </div>
    </main>
  );
}
