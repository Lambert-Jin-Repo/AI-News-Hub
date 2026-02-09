import { verifyCronAuth, unauthorizedResponse, successResponse, errorResponse } from '@/lib/auth';
import { getAdminClient, type Source } from '@/lib/supabase';
import { fetchRSS, type FetchedArticle } from '@/lib/fetchers/rss-fetcher';
import { fetchGNews } from '@/lib/fetchers/gnews-fetcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface FetchResult {
  source: string;
  fetched: number;
  inserted: number;
  skipped: number;
  error?: string;
}

async function fetchFromSource(source: Source): Promise<{
  articles: FetchedArticle[];
  error?: string;
}> {
  try {
    const config = source.config;

    if (source.type === 'rss') {
      const url = String(config.url || '');
      if (!url) return { articles: [], error: 'No URL in config' };
      const articles = await fetchRSS(url, source.name);
      return { articles };
    }

    if (source.type === 'api') {
      const provider = String(config.provider || '');
      if (provider === 'gnews') {
        const articles = await fetchGNews(config);
        return { articles };
      }
      return { articles: [], error: `Unknown API provider: ${provider}` };
    }

    return { articles: [], error: `Unknown source type: ${source.type}` };
  } catch (err) {
    return {
      articles: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const admin = getAdminClient();

    // Get active sources
    const { data: sources, error: sourcesError } = await admin
      .from('sources')
      .select('*')
      .eq('is_active', true);

    if (sourcesError) {
      return errorResponse(`Failed to load sources: ${sourcesError.message}`);
    }

    if (!sources || sources.length === 0) {
      return successResponse({ message: 'No active sources', results: [] });
    }

    const results: FetchResult[] = [];

    for (const source of sources as Source[]) {
      const { articles, error: fetchError } = await fetchFromSource(source);

      if (fetchError) {
        // Update source with error
        await admin
          .from('sources')
          .update({ last_error: fetchError })
          .eq('id', source.id);

        results.push({
          source: source.name,
          fetched: 0,
          inserted: 0,
          skipped: 0,
          error: fetchError,
        });
        continue;
      }

      let inserted = 0;
      let skipped = 0;

      // Insert articles one by one to handle conflicts gracefully
      for (const article of articles) {
        const { error: insertError } = await admin
          .from('articles')
          .insert({
            title: article.title,
            slug: article.slug,
            url: article.url,
            source: article.source,
            published_at: article.published_at,
            thumbnail_url: article.thumbnail_url,
            raw_excerpt: article.raw_excerpt,
            summary_status: 'pending',
          });

        if (insertError) {
          // Unique constraint violation = duplicate, expected
          if (insertError.code === '23505') {
            skipped++;
          } else {
            skipped++;
            console.error(`Insert error for "${article.title}":`, insertError.message);
          }
        } else {
          inserted++;
        }
      }

      // Update source metadata
      await admin
        .from('sources')
        .update({
          last_fetched_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', source.id);

      results.push({
        source: source.name,
        fetched: articles.length,
        inserted,
        skipped,
      });
    }

    const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);

    return successResponse({
      message: `Fetch complete: ${totalInserted} inserted, ${totalSkipped} skipped`,
      results,
    });
  } catch (err) {
    console.error('Fetch job failed:', err);
    return errorResponse(
      err instanceof Error ? err.message : 'Internal error',
    );
  }
}
