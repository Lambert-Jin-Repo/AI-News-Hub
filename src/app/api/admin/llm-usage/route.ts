import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getAdminClient } from '@/lib/supabase';

type Range = 'today' | '7d' | '30d';

function getDateRange(range: Range): { start: string; truncation: string } {
  const now = new Date();
  switch (range) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), truncation: 'hour' };
    }
    case '7d': {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start: start.toISOString(), truncation: 'day' };
    }
    case '30d': {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start: start.toISOString(), truncation: 'day' };
    }
  }
}

export async function GET(request: NextRequest) {
  // Auth check: verify session
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin check: query profiles table
  const admin = getAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
  }

  // Parse range
  const range = (request.nextUrl.searchParams.get('range') || 'today') as Range;
  if (!['today', '7d', '30d'].includes(range)) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
  }

  const { start, truncation } = getDateRange(range);

  // Fetch all logs for the range (limited to 10000 for safety)
  const { data: logs, error: fetchError } = await admin
    .from('llm_usage_logs')
    .select('*')
    .gte('created_at', start)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }

  const allLogs = logs || [];

  // Compute summary stats
  const totalCalls = allLogs.length;
  const successCalls = allLogs.filter((l) => l.success).length;
  const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 1000) / 10 : 0;
  const avgLatencyMs = totalCalls > 0
    ? Math.round(allLogs.reduce((sum, l) => sum + (l.latency_ms || 0), 0) / totalCalls)
    : 0;
  const totalTokensIn = allLogs.reduce((sum, l) => sum + (l.tokens_in || 0), 0);
  const totalTokensOut = allLogs.reduce((sum, l) => sum + (l.tokens_out || 0), 0);

  // By provider
  const providerMap = new Map<string, { calls: number; successes: number; totalLatency: number }>();
  for (const log of allLogs) {
    const entry = providerMap.get(log.provider) || { calls: 0, successes: 0, totalLatency: 0 };
    entry.calls++;
    if (log.success) entry.successes++;
    entry.totalLatency += log.latency_ms || 0;
    providerMap.set(log.provider, entry);
  }
  const byProvider = Array.from(providerMap.entries()).map(([provider, stats]) => ({
    provider,
    calls: stats.calls,
    successRate: Math.round((stats.successes / stats.calls) * 1000) / 10,
    avgLatencyMs: Math.round(stats.totalLatency / stats.calls),
  }));

  // By feature
  const featureMap = new Map<string, number>();
  for (const log of allLogs) {
    featureMap.set(log.feature, (featureMap.get(log.feature) || 0) + 1);
  }
  const byFeature = Array.from(featureMap.entries())
    .map(([feature, calls]) => ({ feature, calls }))
    .sort((a, b) => b.calls - a.calls);

  // Timeline (group by truncated time)
  const timelineMap = new Map<string, Record<string, number>>();
  for (const log of allLogs) {
    const date = new Date(log.created_at);
    let key: string;
    if (truncation === 'hour') {
      date.setMinutes(0, 0, 0);
      key = date.toISOString();
    } else {
      date.setHours(0, 0, 0, 0);
      key = date.toISOString();
    }
    const bucket = timelineMap.get(key) || {};
    bucket[log.provider] = (bucket[log.provider] || 0) + 1;
    timelineMap.set(key, bucket);
  }
  const timeline = Array.from(timelineMap.entries())
    .map(([time, providers]) => ({ time, ...providers }))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Fallback events
  const fallbackEvents = allLogs
    .filter((l) => l.is_fallback)
    .slice(0, 20)
    .map((l) => ({
      time: l.created_at,
      provider: l.provider,
      feature: l.feature,
      success: l.success,
      error: l.error_type,
    }));

  // Recent calls (last 50)
  const recentCalls = allLogs.slice(0, 50).map((l) => ({
    created_at: l.created_at,
    provider: l.provider,
    model: l.model,
    feature: l.feature,
    success: l.success,
    latency_ms: l.latency_ms,
    tokens_in: l.tokens_in,
    tokens_out: l.tokens_out,
    is_fallback: l.is_fallback,
    error_type: l.error_type,
  }));

  return NextResponse.json({
    summary: { totalCalls, successRate, avgLatencyMs, totalTokensIn, totalTokensOut },
    byProvider,
    byFeature,
    timeline,
    fallbackEvents,
    recentCalls,
  });
}
