import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const date = searchParams.get('date')?.trim() || '';
  const cursor = searchParams.get('cursor')?.trim() || '';
  const limitParam = Number(searchParams.get('limit') || 30);
  const limit = Math.min(Math.max(limitParam, 1), 50);

  // Validate date format
  if (date && !DATE_RE.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format. Must be YYYY-MM-DD.' },
      { status: 400 },
    );
  }

  // Validate cursor format
  if (cursor && !DATE_RE.test(cursor)) {
    return NextResponse.json(
      { error: 'Invalid cursor format. Must be YYYY-MM-DD.' },
      { status: 400 },
    );
  }

  let query = supabase
    .from('daily_digests')
    .select('id, digest_date, summary_text, audio_url, audio_status, article_ids');

  // Specific date query
  if (date) {
    query = query.eq('digest_date', date);
  }

  // Cursor pagination on digest_date DESC
  if (cursor) {
    query = query.lt('digest_date', cursor);
  }

  query = query
    .order('digest_date', { ascending: false })
    .limit(limit + 1);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  const digests = data || [];
  const hasMore = digests.length > limit;
  const page = hasMore ? digests.slice(0, limit) : digests;
  const nextCursor = hasMore && page[page.length - 1]?.digest_date
    ? page[page.length - 1].digest_date
    : null;

  return NextResponse.json(
    { digests: page, nextCursor },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
      },
    },
  );
}
