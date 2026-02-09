import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ARTICLE_CATEGORY, type ArticleCategory } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = new Set<string>(Object.values(ARTICLE_CATEGORY));
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get('q')?.trim() || '';
  const source = searchParams.get('source')?.trim() || '';
  const categoryParam = searchParams.get('category')?.trim() || '';
  const cursor = searchParams.get('cursor') || '';
  const limitParam = Number(searchParams.get('limit') || 20);
  const limit = Math.min(Math.max(limitParam, 1), 50);

  // Validate category against known values
  if (categoryParam && !VALID_CATEGORIES.has(categoryParam)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${[...VALID_CATEGORIES].join(', ')}` },
      { status: 400 },
    );
  }
  const category: ArticleCategory | '' = categoryParam as ArticleCategory | '';

  // Validate cursor format (ISO date string)
  if (cursor && !ISO_DATE_RE.test(cursor)) {
    return NextResponse.json(
      { error: 'Invalid cursor format. Must be an ISO date string.' },
      { status: 400 },
    );
  }

  let query = supabase
    .from('articles')
    .select('id, title, slug, url, source, published_at, thumbnail_url, raw_excerpt, ai_summary, summary_status, is_featured, category');

  // Full-text search
  if (q) {
    query = query.textSearch('search_vector', q, { type: 'websearch' });
  }

  // Source filter
  if (source) {
    query = query.eq('source', source);
  }

  // Category filter
  if (category) {
    query = query.eq('category', category);
  }

  // Cursor pagination — fetch articles before this published_at value
  if (cursor) {
    query = query.lt('published_at', cursor);
  }

  // Order by published_at descending, fetch one extra to determine nextCursor
  query = query
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit + 1);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  const articles = data || [];
  const hasMore = articles.length > limit;
  const page = hasMore ? articles.slice(0, limit) : articles;
  const nextCursor = hasMore && page[page.length - 1]?.published_at
    ? page[page.length - 1].published_at
    : null;

  return NextResponse.json(
    { articles: page, nextCursor },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    },
  );
}
