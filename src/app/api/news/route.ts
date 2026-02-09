import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get('q')?.trim() || '';
  const source = searchParams.get('source')?.trim() || '';
  const cursor = searchParams.get('cursor') || '';
  const limitParam = Number(searchParams.get('limit') || 20);
  const limit = Math.min(Math.max(limitParam, 1), 50);

  let query = supabase
    .from('articles')
    .select('id, title, slug, url, source, published_at, thumbnail_url, raw_excerpt, ai_summary, summary_status, is_featured');

  // Full-text search
  if (q) {
    query = query.textSearch('search_vector', q, { type: 'websearch' });
  }

  // Source filter
  if (source) {
    query = query.eq('source', source);
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
