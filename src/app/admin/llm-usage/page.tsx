'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MetricCards,
  TimelineChart,
  ProviderPieChart,
  LatencyBarChart,
  FeatureBarChart,
  FallbackEvents,
  RecentCallsTable,
} from './components';

type Range = 'today' | '7d' | '30d';

interface DashboardData {
  summary: {
    totalCalls: number;
    successRate: number;
    avgLatencyMs: number;
    totalTokensIn: number;
    totalTokensOut: number;
  };
  byProvider: { provider: string; calls: number; successRate: number; avgLatencyMs: number }[];
  byFeature: { feature: string; calls: number }[];
  timeline: { time: string; [key: string]: string | number }[];
  fallbackEvents: { time: string; provider: string; feature: string; success: boolean; error: string | null }[];
  recentCalls: {
    created_at: string;
    provider: string;
    model: string;
    feature: string;
    success: boolean;
    latency_ms: number | null;
    tokens_in: number | null;
    tokens_out: number | null;
    is_fallback: boolean;
    error_type: string | null;
  }[];
}

export default function LLMUsageDashboard() {
  const [range, setRange] = useState<Range>('today');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/llm-usage?range=${range}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Extract unique providers from timeline data for the chart
  const providers = data
    ? [...new Set(data.byProvider.map((p) => p.provider))]
    : [];

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            LLM Usage Monitor
          </h1>
          <div className="flex gap-2">
            {(['today', '7d', '30d'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  range === r
                    ? 'bg-primary text-white'
                    : 'bg-[var(--surface)] text-[var(--muted-foreground)] border border-[var(--border)] hover:bg-[var(--border)]'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
            Loading dashboard data...
          </div>
        )}

        {/* Dashboard content */}
        {data && (
          <>
            <MetricCards summary={data.summary} />

            <TimelineChart data={data.timeline} providers={providers} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProviderPieChart data={data.byProvider} />
              <LatencyBarChart data={data.byProvider} />
            </div>

            <FeatureBarChart data={data.byFeature} />

            <FallbackEvents events={data.fallbackEvents} />

            <RecentCallsTable calls={data.recentCalls} />
          </>
        )}

        {/* Empty state */}
        {data && data.summary.totalCalls === 0 && (
          <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
            No LLM calls recorded for this period. Trigger a summarise or digest job to see data.
          </div>
        )}
      </div>
    </div>
  );
}
