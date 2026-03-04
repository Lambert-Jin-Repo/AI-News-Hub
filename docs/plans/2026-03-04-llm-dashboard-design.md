# Design: LLM Usage Monitor Dashboard

> **Date:** 2026-03-04
> **Status:** Approved
> **Goal:** Add a live admin dashboard to monitor all LLM API calls (Gemini, MiniMax, Groq) with charts, metrics, and call history.

---

## Requirements

- Track every LLM call: provider, model, feature, latency, tokens, success/failure
- Admin-only access via Supabase Auth (existing user, `is_admin` flag)
- Auto-refresh polling (15s interval) for live feel
- Charts for calls over time, provider distribution, latency, feature breakdown
- Fallback event timeline (when primary → fallback triggers)
- Recent calls table (last 50)
- 30-day data retention with auto-cleanup
- Chart library: Recharts

---

## Architecture

### Data Flow

```
Feature (summariser, digest, workflow, etc.)
  │
  ▼
generateText(prompt, content, { feature: 'summarise', provider: 'default' })
  │
  ▼
callGemini() / callMiniMax() / callGroq()
  │  ← capture: start_time, tokens_in, tokens_out, success, error
  │
  ▼
logLLMUsage()  ← async INSERT into llm_usage_logs (fire-and-forget)
  │
  ▼
Return LLMResponse to caller (never blocked by logging)
```

### Database

**Table: `llm_usage_logs`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| created_at | timestamptz | When the call was made |
| provider | text | `gemini`, `minimax`, `groq` |
| model | text | `gemini-2.5-flash`, `MiniMax-M2.5`, etc. |
| feature | text | `summarise`, `digest`, `workflow`, `daily_word`, `tool_discovery` |
| success | boolean | Did the call succeed |
| latency_ms | integer | Response time in milliseconds |
| tokens_in | integer | Input/prompt tokens (nullable — not all providers return this) |
| tokens_out | integer | Output/completion tokens (nullable) |
| error_type | text | null on success; error class on failure |
| is_fallback | boolean | Was this a fallback call (not the first-choice provider) |

**Indexes:**
- `idx_llm_usage_created_at` on `created_at` (range queries)
- `idx_llm_usage_provider` on `provider` (filtering)

**RLS:**
- No public access (service_role only for INSERT)
- Read via admin API endpoint (authenticated + is_admin check)

**Cleanup:**
- pg_cron job or app-level cron: `DELETE FROM llm_usage_logs WHERE created_at < now() - interval '30 days'`

**Table: `profiles`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK, references auth.users(id) |
| is_admin | boolean | default false |
| created_at | timestamptz | default now() |

**RLS:**
- Users can read their own profile
- No public write access

### Auth Flow

```
User visits /admin/*
  → Next.js middleware checks Supabase session cookie
  → No session? → Redirect to /admin/login
  → Has session? → API checks profiles.is_admin
  → Not admin? → 403 page
  → Admin? → Render dashboard
```

### API Endpoint

**`GET /api/admin/llm-usage?range=today|7d|30d`**

Protected: requires authenticated Supabase user with `is_admin = true`.

Returns:
```json
{
  "summary": {
    "totalCalls": 847,
    "successRate": 98.2,
    "avgLatencyMs": 1200,
    "totalTokensIn": 124000,
    "totalTokensOut": 89000
  },
  "byProvider": [
    { "provider": "gemini", "calls": 720, "successRate": 99.1, "avgLatencyMs": 980 },
    { "provider": "minimax", "calls": 90, "successRate": 95.5, "avgLatencyMs": 2100 },
    { "provider": "groq", "calls": 37, "successRate": 97.3, "avgLatencyMs": 450 }
  ],
  "byFeature": [
    { "feature": "summarise", "calls": 420 },
    { "feature": "digest", "calls": 180 }
  ],
  "timeline": [
    { "hour": "2026-03-04T00:00:00Z", "gemini": 12, "minimax": 2, "groq": 1 }
  ],
  "fallbackEvents": [
    { "time": "2026-03-04T10:23:00Z", "from": "gemini", "to": "groq", "feature": "summarise", "error": "timeout" }
  ],
  "recentCalls": [
    { "created_at": "...", "provider": "gemini", "feature": "summarise", "success": true, "latency_ms": 890, "tokens_in": 150, "tokens_out": 200 }
  ]
}
```

### Dashboard UI Layout

```
┌──────────────────────────────────────────────────────────┐
│  LLM Usage Monitor                 [Today] [7D] [30D]   │
├────────────┬────────────┬────────────┬───────────────────┤
│ Total      │ Success    │ Avg        │ Tokens            │
│ Calls      │ Rate       │ Latency    │ Used              │
│ 847        │ 98.2%      │ 1.2s       │ 124K in / 89K out │
├────────────┴────────────┴────────────┴───────────────────┤
│                                                          │
│  Calls Over Time (stacked area chart)                    │
│  ┌──────────────────────────────────────────┐            │
│  │  ████ Gemini  ████ MiniMax  ████ Groq    │            │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │            │
│  └──────────────────────────────────────────┘            │
│                                                          │
├────────────────────────┬─────────────────────────────────┤
│                        │                                 │
│  Calls by Provider     │  Latency by Provider            │
│  (pie/donut chart)     │  (bar chart, avg + p95)         │
│                        │                                 │
├────────────────────────┴─────────────────────────────────┤
│                                                          │
│  Calls by Feature (horizontal bar chart)                 │
│  summarise ████████████████████  420                      │
│  digest    ████████  180                                  │
│  workflow  ████  90                                       │
│  daily_word ██  45                                        │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Fallback Events (timeline / event list)                 │
│  10:23 — gemini → groq (summarise: timeout)              │
│  14:05 — minimax → gemini (workflow: rate_limit)         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Recent Calls (table, last 50)                           │
│  Time | Provider | Feature | Latency | Tokens | Status   │
│  ...                                                     │
└──────────────────────────────────────────────────────────┘
```

### Color Scheme

| Provider | Color |
|----------|-------|
| Gemini | `#4285F4` (Google blue) |
| MiniMax | `#FF6B35` (orange) |
| Groq | `#10B981` (green) |

---

## Files to Create/Modify

### New Files (8)

| File | Purpose |
|------|---------|
| `supabase/migrations/011_llm_usage_logs.sql` | `llm_usage_logs` + `profiles` tables, indexes, RLS, cleanup function |
| `src/lib/llm-logger.ts` | `logLLMUsage()` — async non-blocking INSERT |
| `src/app/api/admin/llm-usage/route.ts` | GET endpoint with aggregated stats |
| `src/app/admin/login/page.tsx` | Supabase email/password login form |
| `src/app/admin/llm-usage/page.tsx` | Dashboard page with Recharts |
| `src/app/admin/llm-usage/components.tsx` | Chart components (MetricCards, TimelineChart, ProviderPie, LatencyBar, FeatureBar, FallbackEvents, RecentCallsTable) |
| `src/middleware.ts` | Protect `/admin/*` routes (redirect to login if no session) |
| `src/lib/__tests__/llm-logger.test.ts` | Tests for logging utility |

### Modified Files (7)

| File | Change |
|------|--------|
| `src/lib/llm-client.ts` | Add `feature` to options, capture timing + tokens, call `logLLMUsage()` |
| `src/lib/summariser.ts` | Add `feature: 'summarise'` to `generateText()` options |
| `src/lib/digest-generator.ts` | Add `feature: 'digest'` to `generateText()` options |
| `src/lib/daily-word-generator.ts` | Add `feature: 'daily_word'` to `generateText()` options |
| `src/lib/tool-discovery.ts` | Add `feature: 'tool_discovery'` to `generateText()` options |
| `src/app/api/workflows/suggest/route.ts` | Add `feature: 'workflow'` to `generateText()` options |
| `package.json` | Add `recharts` dependency |

---

## Design Decisions

1. **Async fire-and-forget logging** — `logLLMUsage()` never awaits, never blocks LLM responses. If INSERT fails, it logs to console.
2. **Feature tagging via options** — Each caller passes `feature: 'summarise'` etc. to `generateText()`. Centralized in the dispatcher.
3. **Token extraction** — OpenAI SDK returns `usage.prompt_tokens` and `usage.completion_tokens`. Currently discarded; we'll capture them.
4. **Server-side aggregation** — The API does SQL aggregation (GROUP BY, AVG, COUNT), not the client. Keeps response small.
5. **No SSR for dashboard** — Dashboard is a client component with `useEffect` polling. No SEO needed for admin pages.
6. **30-day auto-cleanup** — SQL function callable via app-level cron or pg_cron extension.
7. **Middleware auth** — Next.js middleware checks Supabase session for all `/admin/*` routes. Fast, no DB query per page load. Admin check happens at the API level.

---

## Verification

1. Run migration in Supabase
2. Set `is_admin = true` for your user in profiles table
3. `npm test` — all tests pass
4. Login at `/admin/login` → redirected to `/admin/llm-usage`
5. Trigger a summarise/digest job → see calls appear in dashboard
6. Verify auto-refresh updates every 15s
7. Deploy to Cloud Run and verify in production
