import Link from "next/link";
import { NewsCard } from "@/components/cards/NewsCard";
import { ShareButton } from "@/components/ui/ShareButton";
import { getSupabaseClient } from "@/lib/supabase";
import {
  PlayCircle,
  Headphones,
  Play,
  ArrowRight,
  FileText,
  Hammer,
  Mail,
  Zap,
  Rocket,
  Eye,
  Lightbulb,
} from "lucide-react";

export const revalidate = 300; // 5 minutes

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

/**
 * Render inline bold markdown (**text**) as <strong> tags.
 */
function renderMarkdownInline(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
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
      <main className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hero Left: Daily Briefing */}
          <div className="lg:col-span-8 bg-[var(--surface)] rounded-[16px] shadow-soft p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                <div className="pulse-dot"></div>
                <span className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                  Live Updates
                </span>
              </div>
              <span className="text-[#4c9a93] dark:text-[#6bb5ae] text-sm font-medium">
                {displayDate}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#0d1b1a] dark:text-white leading-[1.15] mb-6">
              Your Daily <span className="text-primary">AI Briefing</span>
            </h1>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-200 space-y-4">
              {digestSections ? (
                /* Structured sectioned digest */
                <div className="space-y-6">
                  {digestSections.map((section: DigestSection, idx: number) => {
                    const IconComponent =
                      SECTION_ICONS[section.title] || FileText;
                    return (
                      <div key={idx}>
                        <div className="flex items-center gap-2 mb-2">
                          <IconComponent className="w-5 h-5 text-primary shrink-0" />
                          <h3 className="text-base font-bold text-[#0d1b1a] dark:text-white m-0">
                            {section.title}
                          </h3>
                        </div>
                        <div className="pl-7">
                          {section.content
                            .split("\n")
                            .filter(Boolean)
                            .map((line: string, i: number) => {
                              if (line.startsWith("- ")) {
                                return (
                                  <div
                                    key={i}
                                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1.5"
                                  >
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: renderMarkdownInline(
                                          line.slice(2)
                                        ),
                                      }}
                                    />
                                  </div>
                                );
                              }
                              return (
                                <p
                                  key={i}
                                  className="text-sm text-gray-600 dark:text-gray-300 mb-1.5"
                                  dangerouslySetInnerHTML={{
                                    __html: renderMarkdownInline(line),
                                  }}
                                />
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : digest?.summary_text ? (
                /* Fallback: old plain-text digest */
                digest.summary_text
                  .split("\n\n")
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((paragraph: string, i: number) => (
                    <p
                      key={i}
                      className={
                        i === 0
                          ? "text-lg leading-relaxed"
                          : "text-base leading-relaxed dark:opacity-100 opacity-90"
                      }
                    >
                      {paragraph}
                    </p>
                  ))
              ) : (
                <p className="text-lg leading-relaxed text-gray-400">
                  No digest available yet. Check back soon for today&apos;s AI
                  briefing.
                </p>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex gap-4">
              <Link
                href="/digests"
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all no-underline"
              >
                <PlayCircle className="w-5 h-5" />
                Read Full Digest
              </Link>
              <ShareButton />
            </div>
          </div>

          {/* Hero Right: Audio & Featured */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Audio Player Card */}
            <div className="bg-[var(--surface)] rounded-[16px] shadow-soft p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Headphones className="w-5 h-5" />
                  </div>
                  {digest?.audio_status === "completed" && (
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-300">
                      AUDIO READY
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#0d1b1a] dark:text-white mb-1">
                  Today&apos;s Audio Briefing
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {digest?.audio_url
                    ? "Listen to the key highlights on the go."
                    : "Audio briefing not yet available."}
                </p>
              </div>
              <div className="flex items-center gap-4 mt-6">
                {digest?.audio_url ? (
                  <audio controls className="w-full h-10">
                    <source src={digest.audio_url} type="audio/mpeg" />
                  </audio>
                ) : (
                  <>
                    <button
                      disabled
                      className="size-12 rounded-full bg-gray-300 dark:bg-gray-600 text-white flex items-center justify-center cursor-not-allowed"
                    >
                      <Play className="w-6 h-6 fill-current" />
                    </button>
                    <div className="flex items-center gap-1 h-8 flex-1">
                      <div
                        className="waveform-bar"
                        style={{ animationDelay: "0.1s", height: "15px" }}
                      ></div>
                      <div
                        className="waveform-bar"
                        style={{ animationDelay: "0.3s", height: "25px" }}
                      ></div>
                      <div
                        className="waveform-bar"
                        style={{ animationDelay: "0.5s", height: "10px" }}
                      ></div>
                      <div
                        className="waveform-bar"
                        style={{ animationDelay: "0.2s", height: "30px" }}
                      ></div>
                      <div
                        className="waveform-bar"
                        style={{ animationDelay: "0.4s", height: "18px" }}
                      ></div>
                      <div
                        className="waveform-bar"
                        style={{ animationDelay: "0.1s", height: "22px" }}
                      ></div>
                      <div
                        className="waveform-bar"
                        style={{ animationDelay: "0.6s", height: "12px" }}
                      ></div>
                      <div
                        className="waveform-bar"
                        style={{ animationDelay: "0.3s", height: "28px" }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Featured Tool Card */}
            <Link
              href="/tools"
              className="bg-[#102220] rounded-[16px] shadow-soft p-6 flex flex-col justify-center relative overflow-hidden group cursor-pointer no-underline"
            >
              {/* Decorative shapes */}
              <div className="absolute top-0 right-0 size-32 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-full backdrop-blur-sm border border-white/5">
                    FEATURED
                  </span>
                  <ArrowRight className="text-primary w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Browse AI Tools
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Discover the latest productivity apps and models.
                </p>
                <div className="flex items-center">
                  <span className="text-white text-sm font-bold">
                    {stats.tools > 0 ? `${stats.tools} tools` : "Explore directory"}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="bg-[var(--surface)] rounded-[16px] shadow-soft py-6 px-8 flex flex-col md:flex-row justify-around items-center gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
          <div className="flex items-center gap-4 px-6 w-full md:w-auto justify-center md:justify-start">
            <div className="p-3 bg-accent/10 rounded-full text-accent">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d1b1a] dark:text-white">
                {stats.articles}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">
                Articles Scanned
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6 w-full md:w-auto justify-center md:justify-start pt-6 md:pt-0">
            <div className="p-3 bg-accent/10 rounded-full text-accent">
              <Hammer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d1b1a] dark:text-white">
                {stats.tools}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">
                AI Tools
              </p>
            </div>
          </div>
          <Link href="/digests" className="flex items-center gap-4 px-6 w-full md:w-auto justify-center md:justify-start pt-6 md:pt-0 no-underline hover:opacity-80 transition-opacity">
            <div className="p-3 bg-accent/10 rounded-full text-accent">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d1b1a] dark:text-white">
                {stats.digests}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">
                Daily Briefings
              </p>
            </div>
          </Link>
        </div>

        {/* Latest Headlines */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0d1b1a] dark:text-white">
              Latest Headlines
            </h2>
            <Link
              href="/news"
              className="text-sm font-bold text-primary hover:underline flex items-center gap-1 no-underline"
            >
              View Archive
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="text-center py-12 text-gray-400">
              <p>No articles yet. News will appear here once the pipeline runs.</p>
            </div>
          )}
        </div>
      </main>
  );
}
