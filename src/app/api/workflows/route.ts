import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const { searchParams } = request.nextUrl;
  const costCategory = searchParams.get('cost_category')?.trim() || '';

  if (costCategory && costCategory !== 'free' && costCategory !== 'paid') {
    return NextResponse.json(
      { error: 'Invalid cost_category. Must be "free" or "paid".' },
      { status: 400 },
    );
  }

  let query = supabase
    .from('workflows')
    .select('id, slug, title, description, cost_category, difficulty, estimated_minutes, steps, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (costCategory) {
    query = query.eq('cost_category', costCategory);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { workflows: data || [] },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
      },
    },
  );
}
