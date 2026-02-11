import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PRICING_MODEL, type PricingModel } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const VALID_PRICING = new Set<string>(Object.values(PRICING_MODEL));
// Compound cursor format: ISO_DATE|UUID
const COMPOUND_CURSOR_RE = /^(\d{4}-\d{2}-\d{2}(T[\d:.]+Z?))\|(.+)$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get('q')?.trim() || '';
  const category = searchParams.get('category')?.trim() || '';
  const pricingParam = searchParams.get('pricing')?.trim() || '';
  const cursor = searchParams.get('cursor') || '';
  const limitParam = Number(searchParams.get('limit') || 24);
  const limit = Math.min(Math.max(limitParam, 1), 50);

  // Validate pricing model against known values
  if (pricingParam && !VALID_PRICING.has(pricingParam)) {
    return NextResponse.json(
      { error: `Invalid pricing. Must be one of: ${[...VALID_PRICING].join(', ')}` },
      { status: 400 },
    );
  }
  const pricing: PricingModel | '' = pricingParam as PricingModel | '';

  // Validate compound cursor format
  if (cursor && !COMPOUND_CURSOR_RE.test(cursor)) {
    return NextResponse.json(
      { error: 'Invalid cursor format. Must be date_added|id.' },
      { status: 400 },
    );
  }

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

  // Compound cursor pagination — prevents skipping tools with same date
  if (cursor) {
    const match = COMPOUND_CURSOR_RE.exec(cursor);
    if (match) {
      const cursorDate = match[1];
      const cursorId = match[3];
      query = query.or(`date_added.lt.${cursorDate},and(date_added.eq.${cursorDate},id.lt.${cursorId})`);
    }
  }

  // Order by date_added descending, then id descending as tiebreaker
  query = query
    .order('date_added', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
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
  const lastItem = page[page.length - 1];
  const nextCursor = hasMore && lastItem?.date_added
    ? `${lastItem.date_added}|${lastItem.id}`
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
