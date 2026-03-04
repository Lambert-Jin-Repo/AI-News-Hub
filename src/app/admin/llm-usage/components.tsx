'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts';

const PROVIDER_COLORS: Record<string, string> = {
  gemini: '#4285F4',
  minimax: '#FF6B35',
  groq: '#10B981',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Summary {
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  totalTokensIn: number;
  totalTokensOut: number;
}

interface ProviderStat {
  provider: string;
  calls: number;
  successRate: number;
  avgLatencyMs: number;
}

interface FeatureStat {
  feature: string;
  calls: number;
}

interface TimelinePoint {
  time: string;
  [provider: string]: string | number;
}

interface FallbackEvent {
  time: string;
  provider: string;
  feature: string;
  success: boolean;
  error: string | null;
}

interface RecentCall {
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
}

// ---------------------------------------------------------------------------
// MetricCards
// ---------------------------------------------------------------------------

export function MetricCards({ summary }: { summary: Summary }) {
  const cards = [
    { label: 'Total Calls', value: summary.totalCalls.toLocaleString() },
    { label: 'Success Rate', value: `${summary.successRate}%` },
    { label: 'Avg Latency', value: `${(summary.avgLatencyMs / 1000).toFixed(1)}s` },
    {
      label: 'Tokens Used',
      value: `${formatK(summary.totalTokensIn)} in / ${formatK(summary.totalTokensOut)} out`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
          style={{ boxShadow: 'var(--shadow-soft)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{card.label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimelineChart
// ---------------------------------------------------------------------------

export function TimelineChart({ data, providers }: { data: TimelinePoint[]; providers: string[] }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
         style={{ boxShadow: 'var(--shadow-soft)' }}>
      <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--muted-foreground)' }}>
        Calls Over Time
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="time"
            tickFormatter={(t) => {
              const d = new Date(t);
              return d.getHours() !== undefined
                ? `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`
                : `${d.getMonth() + 1}/${d.getDate()}`;
            }}
            stroke="var(--muted-foreground)"
            fontSize={11}
          />
          <YAxis stroke="var(--muted-foreground)" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
            }}
          />
          {providers.map((provider) => (
            <Area
              key={provider}
              type="monotone"
              dataKey={provider}
              stackId="1"
              stroke={PROVIDER_COLORS[provider] || '#888'}
              fill={PROVIDER_COLORS[provider] || '#888'}
              fillOpacity={0.4}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProviderPieChart
// ---------------------------------------------------------------------------

export function ProviderPieChart({ data }: { data: ProviderStat[] }) {
  const pieData = data.map((d) => ({ name: d.provider, value: d.calls }));

  return (
    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
         style={{ boxShadow: 'var(--shadow-soft)' }}>
      <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--muted-foreground)' }}>
        Calls by Provider
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={PROVIDER_COLORS[entry.name] || '#888'} />
            ))}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LatencyBarChart
// ---------------------------------------------------------------------------

export function LatencyBarChart({ data }: { data: ProviderStat[] }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
         style={{ boxShadow: 'var(--shadow-soft)' }}>
      <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--muted-foreground)' }}>
        Avg Latency by Provider
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="provider" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="ms" />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
            }}
          />
          <Bar dataKey="avgLatencyMs" name="Avg Latency (ms)">
            {data.map((entry) => (
              <Cell key={entry.provider} fill={PROVIDER_COLORS[entry.provider] || '#888'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeatureBarChart
// ---------------------------------------------------------------------------

export function FeatureBarChart({ data }: { data: FeatureStat[] }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
         style={{ boxShadow: 'var(--shadow-soft)' }}>
      <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--muted-foreground)' }}>
        Calls by Feature
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
          <YAxis dataKey="feature" type="category" stroke="var(--muted-foreground)" fontSize={12} width={100} />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
            }}
          />
          <Bar dataKey="calls" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FallbackEvents
// ---------------------------------------------------------------------------

export function FallbackEvents({ events }: { events: FallbackEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
           style={{ boxShadow: 'var(--shadow-soft)' }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
          Fallback Events
        </h3>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No fallback events in this period.</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
         style={{ boxShadow: 'var(--shadow-soft)' }}>
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>
        Fallback Events
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {events.map((event, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="shrink-0 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {new Date(event.time).toLocaleTimeString()}
            </span>
            <span
              className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: PROVIDER_COLORS[event.provider] || '#888' }}
            >
              {event.provider}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {event.feature}
            </span>
            {event.error && (
              <span className="text-xs text-red-500 truncate">{event.error}</span>
            )}
            {event.success && (
              <span className="text-xs text-green-500">OK</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecentCallsTable
// ---------------------------------------------------------------------------

export function RecentCallsTable({ calls }: { calls: RecentCall[] }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-x-auto"
         style={{ boxShadow: 'var(--shadow-soft)' }}>
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>
        Recent Calls
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-2 px-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Time</th>
            <th className="text-left py-2 px-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Provider</th>
            <th className="text-left py-2 px-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Feature</th>
            <th className="text-left py-2 px-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Latency</th>
            <th className="text-left py-2 px-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Tokens</th>
            <th className="text-left py-2 px-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call, i) => (
            <tr key={i} className="border-b border-[var(--border)] last:border-b-0">
              <td className="py-2 px-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {new Date(call.created_at).toLocaleTimeString()}
              </td>
              <td className="py-2 px-2">
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: PROVIDER_COLORS[call.provider] || '#888' }}
                >
                  {call.provider}
                </span>
                {call.is_fallback && (
                  <span className="ml-1 text-xs text-amber-500">fallback</span>
                )}
              </td>
              <td className="py-2 px-2 text-xs" style={{ color: 'var(--foreground)' }}>
                {call.feature}
              </td>
              <td className="py-2 px-2 text-xs" style={{ color: 'var(--foreground)' }}>
                {call.latency_ms != null ? `${call.latency_ms}ms` : '—'}
              </td>
              <td className="py-2 px-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {call.tokens_in != null ? `${call.tokens_in}/${call.tokens_out ?? '?'}` : '—'}
              </td>
              <td className="py-2 px-2">
                {call.success ? (
                  <span className="text-xs text-green-500 font-medium">OK</span>
                ) : (
                  <span className="text-xs text-red-500 font-medium" title={call.error_type || ''}>
                    FAIL
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatK(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
