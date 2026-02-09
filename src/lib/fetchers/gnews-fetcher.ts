import { sanitizeText } from '@/lib/sanitize';
import { slugify } from '@/lib/formatters';
import type { FetchedArticle } from './rss-fetcher';

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

/**
 * Fetch articles from the GNews API.
 *
 * Free tier: 100 requests/day, up to 10 articles per request.
 * Articles have a 12-hour delay on the free plan.
 *
 * @param config - Source config from the sources table
 *   Expected shape: { provider: "gnews", query: string, lang: string, max: number }
 */
export async function fetchGNews(
  config: Record<string, unknown>,
): Promise<FetchedArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    throw new Error('GNEWS_API_KEY is not set');
  }

  const query = encodeURIComponent(String(config.query || 'artificial intelligence'));
  const lang = String(config.lang || 'en');
  const max = Number(config.max || 10);

  const url = `https://gnews.io/api/v4/search?q=${query}&lang=${lang}&max=${max}&token=${apiKey}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`GNews API error ${response.status}: ${body}`);
  }

  const data: GNewsResponse = await response.json();
  const slugs = new Set<string>();

  return data.articles.map((article) => {
    const title = sanitizeText(article.title, 500);
    const baseSlug = slugify(title);
    let slug = baseSlug;
    if (slugs.has(slug)) {
      let counter = 2;
      while (slugs.has(`${slug}-${counter}`)) counter++;
      slug = `${baseSlug}-${counter}`;
    }
    slugs.add(slug);

    return {
      title,
      slug,
      url: article.url,
      source: article.source.name,
      published_at: article.publishedAt,
      thumbnail_url: article.image,
      raw_excerpt: article.description
        ? sanitizeText(article.description, 5000)
        : null,
    };
  });
}
