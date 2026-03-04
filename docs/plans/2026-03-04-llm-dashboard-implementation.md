# Implementation Plan: LLM Usage Monitor Dashboard

> **Design Doc:** `docs/plans/2026-03-04-llm-dashboard-design.md`
> **Estimated Files:** 8 new + 7 modified
> **New Dependency:** `recharts`

---

## Step 1: Database Migration (011)

**File:** `supabase/migrations/011_llm_usage_logs.sql`

Create two tables:

```sql
-- llm_usage_logs: tracks every LLM API call
CREATE TABLE llm_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider TEXT NOT NULL,          -- 'gemini', 'minimax', 'groq'
  model TEXT NOT NULL,             -- 'gemini-2.5-flash', 'MiniMax-M2.5', etc.
  feature TEXT NOT NULL,           -- 'summarise', 'digest', 'workflow', 'daily_word', 'tool_discovery'
  success BOOLEAN NOT NULL DEFAULT true,
  latency_ms INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  error_type TEXT,
  is_fallback BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_llm_usage_created_at ON llm_usage_logs (created_at);
CREATE INDEX idx_llm_usage_provider ON llm_usage_logs (provider);

-- RLS: service_role only (no public access)
ALTER TABLE llm_usage_logs ENABLE ROW LEVEL SECURITY;

-- profiles: admin flag for auth
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Cleanup function: delete logs older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_llm_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM llm_usage_logs WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Verification:** Run in Supabase SQL Editor. Then manually INSERT your user ID into profiles with `is_admin = true`.

---

## Step 2: Install Recharts

```bash
npm install recharts
```

---

## Step 3: LLM Logger Utility

**File:** `src/lib/llm-logger.ts` (NEW)

```typescript
import { getAdminClient } from './supabase';

interface LLMLogEntry {
  provider: string;
  model: string;
  feature: string;
  success: boolean;
  latency_ms: number;
  tokens_in?: number;
  tokens_out?: number;
  error_type?: string;
  is_fallback: boolean;
}

export function logLLMUsage(entry: LLMLogEntry): void {
  // Fire-and-forget — never block the caller
  const supabase = getAdminClient();
  supabase
    .from('llm_usage_logs')
    .insert(entry)
    .then(({ error }) => {
      if (error) console.error('[llm-logger] Failed to log usage:', error.message);
    });
}
```

---

## Step 4: Instrument `llm-client.ts`

**File:** `src/lib/llm-client.ts` (MODIFY)

### 4a. Add `feature` to `GenerateTextOptions`

```typescript
export interface GenerateTextOptions {
  maxTokens?: number;
  provider?: 'default' | 'minimax';
  feature?: string;  // NEW: 'summarise', 'digest', 'workflow', 'daily_word', 'tool_discovery'
}
```

### 4b. Capture timing + tokens in each provider function

For `callGemini()`, `callMiniMax()`, `callGroq()`:
- Wrap the `client.chat.completions.create()` call with `Date.now()` before/after
- Extract `completion.usage?.prompt_tokens` and `completion.usage?.completion_tokens`
- Return them as part of `LLMResponse`

Update `LLMResponse`:
```typescript
export interface LLMResponse {
  text: string;
  provider: 'gemini' | 'minimax' | 'groq';
  latency_ms?: number;
  tokens_in?: number;
  tokens_out?: number;
}
```

### 4c. Add logging calls in chain functions

In `generateWithDefaultChain()` and `generateWithMiniMaxChain()`, after each provider call succeeds or fails, call `logLLMUsage()` with the appropriate data including `is_fallback: true/false` and the `feature` from options.

Pass `feature` through from `generateText()` dispatcher.

---

## Step 5: Tag all callers with `feature`

**Files to modify (1 line each):**

| File | Change |
|------|--------|
| `src/lib/summariser.ts` | `generateText(prompt, content, { feature: 'summarise' })` |
| `src/lib/digest-generator.ts` | `generateText(prompt, content, { feature: 'digest' })` |
| `src/lib/daily-word-generator.ts` | `generateText(prompt, content, { feature: 'daily_word' })` |
| `src/lib/tool-discovery.ts` | `generateText(prompt, content, { feature: 'tool_discovery' })` |
| `src/app/api/workflows/suggest/route.ts` | `generateText(prompt, content, { maxTokens: 4096, provider: 'minimax', feature: 'workflow' })` |

---

## Step 6: Next.js Middleware

**File:** `src/middleware.ts` (NEW)

- Match `/admin/:path*` routes (except `/admin/login`)
- Use `@supabase/ssr` to check for session in cookies
- No session → redirect to `/admin/login`
- Has session → allow through (admin check happens at API level)

Reference Supabase docs for Next.js middleware pattern with `createServerClient`.

---

## Step 7: Admin Login Page

**File:** `src/app/admin/login/page.tsx` (NEW)

- Simple email/password form
- Uses `@supabase/ssr` browser client for `signInWithPassword()`
- On success, redirect to `/admin/llm-usage`
- On error, show error message
- Styled with existing Tailwind design tokens

---

## Step 8: Admin API Endpoint

**File:** `src/app/api/admin/llm-usage/route.ts` (NEW)

- `GET ?range=today|7d|30d`
- Auth: check Supabase session → query `profiles.is_admin` → reject if not admin
- Queries:
  1. **Summary stats**: COUNT, AVG(latency_ms), SUM(tokens_in), SUM(tokens_out), success rate
  2. **By provider**: GROUP BY provider
  3. **By feature**: GROUP BY feature
  4. **Timeline**: GROUP BY date_trunc('hour', created_at) for today, date_trunc('day') for 7d/30d
  5. **Fallback events**: WHERE is_fallback = true ORDER BY created_at DESC LIMIT 20
  6. **Recent calls**: ORDER BY created_at DESC LIMIT 50

Use `getAdminClient()` to bypass RLS for reading logs.

---

## Step 9: Dashboard Page + Chart Components

**File:** `src/app/admin/llm-usage/page.tsx` (NEW)

- `'use client'` — client component
- Fetches `/api/admin/llm-usage?range=today` on mount
- Auto-refresh with `setInterval(15000)`
- Range selector: Today / 7D / 30D buttons
- Renders chart components

**File:** `src/app/admin/llm-usage/components.tsx` (NEW)

Chart components (all using Recharts):

1. **MetricCards** — 4 KPI cards (total calls, success rate, avg latency, tokens used)
2. **TimelineChart** — Stacked area chart (calls over time by provider)
3. **ProviderPieChart** — Donut/pie chart (call distribution by provider)
4. **LatencyBarChart** — Grouped bar chart (avg latency per provider)
5. **FeatureBarChart** — Horizontal bar chart (calls per feature)
6. **FallbackEvents** — Event list with timestamps and provider transitions
7. **RecentCallsTable** — Table with last 50 calls

Provider colors:
- Gemini: `#4285F4`
- MiniMax: `#FF6B35`
- Groq: `#10B981`

---

## Step 10: Tests

**File:** `src/lib/__tests__/llm-logger.test.ts` (NEW)

- Test `logLLMUsage()` calls Supabase insert
- Test it doesn't throw on insert failure (fire-and-forget)

**Update:** `src/lib/__tests__/llm-client.test.ts`

- Test that `feature` is passed through options
- Test that `LLMResponse` includes latency/tokens

---

## Step 11: Deploy Config

**File:** `.github/workflows/deploy.yml` (MODIFY — if any new env vars needed)

No new secrets needed — uses existing Supabase credentials.

---

## Step 12: Verification

1. Run migration 011 in Supabase SQL Editor
2. Insert your user into profiles: `INSERT INTO profiles (id, is_admin) VALUES ('your-auth-uid', true);`
3. `npm test` — all tests pass
4. `npm run build` — clean build
5. Start dev server → trigger summarise CRON → check `/admin/llm-usage`
6. Verify auto-refresh shows new data
7. Deploy to Cloud Run → verify in production

---

## Execution Order

```
Step 1 (migration) → Step 2 (recharts) → Step 3 (logger)
  → Step 4 (instrument llm-client) → Step 5 (tag callers)
  → Step 6 (middleware) + Step 7 (login page)     [parallel]
  → Step 8 (API endpoint)
  → Step 9 (dashboard UI)
  → Step 10 (tests)
  → Step 11 (deploy) → Step 12 (verify)
```
