import Parser from 'rss-parser';
import { sanitizeText } from '@/lib/sanitize';
import { slugify } from '@/lib/formatters';

export interface FetchedArticle {
  title: string;
  slug: string;
  url: string;
  source: string;
  published_at: string | null;
  thumbnail_url: string | null;
  raw_excerpt: string | null;
}

const parser = new Parser({
  timeout: 10_000,
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['media:content', 'mediaContent', { keepArray: false }],
      ['enclosure', 'enclosure', { keepArray: false }],
    ],
  },
});

/**
 * Extract a thumbnail URL from various RSS media fields.
 */
function extractThumbnail(item: Record<string, unknown>): string | null {
  // media:thumbnail
  const mediaThumbnail = item.mediaThumbnail as Record<string, unknown> | undefined;
  if (mediaThumbnail?.url) return String(mediaThumbnail.url);
  if (mediaThumbnail?.$?.url) {
    const attrs = mediaThumbnail.$ as Record<string, unknown>;
    return String(attrs.url);
  }

  // media:content with image type
  const mediaContent = item.mediaContent as Record<string, unknown> | undefined;
  if (mediaContent?.$) {
    const attrs = mediaContent.$ as Record<string, string>;
    if (attrs.medium === 'image' || attrs.type?.startsWith('image/')) {
      return attrs.url || null;
    }
  }

  // enclosure with image type
  const enclosure = item.enclosure as Record<string, unknown> | undefined;
  if (enclosure?.type && String(enclosure.type).startsWith('image/')) {
    return String(enclosure.url);
  }

  return null;
}

/**
 * Deduplicate slug by appending a numeric suffix if needed.
 */
function deduplicateSlug(slug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(slug)) {
    existingSlugs.add(slug);
    return slug;
  }
  let counter = 2;
  while (existingSlugs.has(`${slug}-${counter}`)) {
    counter++;
  }
  const uniqueSlug = `${slug}-${counter}`;
  existingSlugs.add(uniqueSlug);
  return uniqueSlug;
}

/**
 * Fetch and parse an RSS feed, returning normalised articles.
 */
export async function fetchRSS(
  feedUrl: string,
  sourceName: string,
): Promise<FetchedArticle[]> {
  const feed = await parser.parseURL(feedUrl);
  const slugs = new Set<string>();

  return feed.items
    .filter((item) => item.title && item.link)
    .map((item) => {
      const title = sanitizeText(item.title!, 500);
      const baseSlug = slugify(title);
      const slug = deduplicateSlug(baseSlug, slugs);

      return {
        title,
        slug,
        url: item.link!,
        source: sourceName,
        published_at: item.isoDate || item.pubDate || null,
        thumbnail_url: extractThumbnail(item as Record<string, unknown>),
        raw_excerpt: item.contentSnippet
          ? sanitizeText(item.contentSnippet, 5000)
          : item.content
            ? sanitizeText(item.content, 5000)
            : null,
      };
    });
}
