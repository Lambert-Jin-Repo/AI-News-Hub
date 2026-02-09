import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get('q')?.trim() || '';
  const category = searchParams.get('category')?.trim() || '';
  const pricing = searchParams.get('pricing')?.trim() || '';
  const cursor = searchParams.get('cursor') || '';
  const limitParam = Number(searchParams.get('limit') || 24);
  const limit = Math.min(Math.max(limitParam, 1), 50);

  let query = supabase
    .from('tools')
    .select('id, name, slug, description, url, category, pricing_model, tags, logo_url, date_added')
    .eq('is_active', true);

  // Full-text search
  if (q) {
    query = query.textSearch('search_vector', q, { type: 'websearch' });
  }

  // Category filter
  if (category) {
    query = query.eq('category', category);
  }

  // Pricing filter
  if (pricing) {
    query = query.eq('pricing_model', pricing);
  }

  // Cursor pagination — fetch tools before this date_added value
  if (cursor) {
    query = query.lt('date_added', cursor);
  }

  // Order by date_added descending, fetch one extra to determine nextCursor
  query = query
    .order('date_added', { ascending: false, nullsFirst: false })
    .limit(limit + 1);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  const tools = data || [];
  const hasMore = tools.length > limit;
  const page = hasMore ? tools.slice(0, limit) : tools;
  const nextCursor = hasMore && page[page.length - 1]?.date_added
    ? page[page.length - 1].date_added
    : null;

  return NextResponse.json(
    { tools: page, nextCursor },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    },
  );
}
