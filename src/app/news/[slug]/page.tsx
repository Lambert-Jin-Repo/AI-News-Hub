import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatRelativeTime } from "@/lib/formatters";
import type { SummaryStatus } from "@/lib/constants";

export const revalidate = 3600;

interface ArticleDetailProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  const { data } = await supabase
    .from("articles")
    .select(
      "id, title, slug, url, source, published_at, thumbnail_url, raw_excerpt, ai_summary, summary_status, is_featured"
    )
    .eq("slug", slug)
    .single();

  return data;
}

async function getRelatedArticles(
  articleId: string,
  source: string | null,
  limit = 4
) {
  let query = supabase
    .from("articles")
    .select("id, title, slug, source, published_at, thumbnail_url")
    .neq("id", articleId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (source) {
    query = query.eq("source", source);
  }

  const { data } = await query;
  return data || [];
}

export async function generateMetadata({ params }: ArticleDetailProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { title: "Article Not Found — AI News Hub" };
  }

  return {
    title: `${article.title} — AI News Hub`,
    description:
      article.ai_summary || article.raw_excerpt || "Read this article on AI News Hub.",
  };
}

export default async function ArticleDetailPage({
  params,
}: ArticleDetailProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article.id, article.source);
  const timeDisplay = article.published_at
    ? formatRelativeTime(article.published_at)
    : null;
  const summaryStatus = article.summary_status as SummaryStatus;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors mb-6 no-underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to News
      </Link>

      {/* Article header */}
      <article>
        {/* Source and time */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-300">
            {article.source || "Unknown"}
          </span>
          {timeDisplay && (
            <>
              <span className="text-xs text-gray-300 dark:text-gray-500">
                &bull;
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-300 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeDisplay}
              </span>
            </>
          )}
        </div>

        <h1 className="text-3xl font-bold text-[#0d1b1a] dark:text-white leading-tight mb-6">
          {article.title}
        </h1>

        {/* Thumbnail */}
        {article.thumbnail_url && (
          <div className="rounded-2xl overflow-hidden mb-6 bg-gray-100 dark:bg-gray-800">
            <SafeImage
              src={article.thumbnail_url}
              alt={article.title}
              width={800}
              height={400}
              className="w-full h-auto object-cover max-h-96"
              fallbackSrc="/placeholders/news-placeholder.svg"
            />
          </div>
        )}

        {/* AI Summary */}
        {summaryStatus === "completed" && article.ai_summary && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wide mb-2">
              AI Summary
            </h2>
            <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
              {article.ai_summary}
            </p>
          </div>
        )}

        {/* Raw excerpt */}
        {article.raw_excerpt && (
          <div className="prose dark:prose-invert max-w-none mb-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {article.raw_excerpt}
            </p>
          </div>
        )}

        {/* Read original */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors no-underline"
        >
          Read Original Article
          <ExternalLink className="w-4 h-4" />
        </a>
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-[#0d1b1a] dark:text-white mb-4">
            More from {article.source || "this source"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedArticles.map((related) => (
              <a
                key={related.id}
                href={related.slug ? `/news/${related.slug}` : "#"}
                className="bg-[var(--surface)] rounded-xl p-4 shadow-soft hover:shadow-soft-hover transition-all border border-transparent hover:border-primary/20 no-underline group"
              >
                <div className="flex gap-3">
                  <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {related.thumbnail_url ? (
                      <SafeImage
                        src={related.thumbnail_url}
                        alt=""
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        fallbackSrc="/placeholders/news-placeholder.svg"
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-300 dark:text-gray-600">
                        {(related.source || "?").charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#0d1b1a] dark:text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {related.title}
                    </h3>
                    {related.published_at && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                        {formatRelativeTime(related.published_at)}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
