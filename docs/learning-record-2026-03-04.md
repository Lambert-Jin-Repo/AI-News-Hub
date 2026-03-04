# Learning Record — 4 Mar 2026

> Session 1: MiniMax API endpoint migration (Global → China), Cloud Run deployment fix, and workflow generation reliability improvement.
> Session 2: Split LLM providers — Gemini 2.5 Flash as default, MiniMax M2.5 reserved for workflow suggest only.
> Session 3: Designed LLM Usage Monitor Dashboard — Supabase-backed logging, Recharts dashboard, admin auth.

---

## 📋 What Was Done

### Session 1 (4 commits)

| # | Commit | Category |
|---|--------|----------|
| 1 | `fix: switch MiniMax API to China endpoint (api.minimaxi.com)` | Infrastructure |
| 2 | `fix: add MiniMax env vars to Cloud Run deployment` | CI/CD |
| 3 | `ci: trigger redeploy with updated MiniMax secrets` | CI/CD |
| 4 | `fix: increase workflow suggest max_tokens to 4096` | Reliability |

**Scale**: ~15 lines changed across 5 files + 1 file deleted.

### Session 2 (pending commit)

| # | Change | Category |
|---|--------|----------|
| 1 | Split LLM into dual chain architecture | Architecture |
| 2 | Add `callGemini()` via OpenAI-compatible endpoint | Feature |
| 3 | Reduce workflow suggest rate limit 10→3 | Security |
| 4 | Update env files and deployment config | CI/CD |
| 5 | Update tests for dual chain coverage | Testing |

**Scale**: ~200 lines changed across 7 files.

---

## 🐛 Issues Diagnosed & Fixed

### 1. MiniMax API 401 — Wrong Endpoint for China API Key

**Symptom**: Workflow generation returning 503 in production.

**Root cause**: The MiniMax API key was obtained from the China platform (`platform.minimaxi.com`), but the code was hardcoded to the Global endpoint (`api.minimax.io`). China keys only authenticate against `api.minimaxi.com`.

**Diagnosis**:
```
curl → api.minimaxi.com/v1 → 200 OK ✅
curl → api.minimax.io/v1   → 401 invalid api key ✗
```

**Fix**: Made `baseURL` configurable via `MINIMAX_BASE_URL` env var, defaulting to the China endpoint.

**Key file**: `src/lib/llm-client.ts` line 61

### 2. Missing Env Vars in Cloud Run Deployment

**Symptom**: Even after fixing the code, production still failed.

**Root cause**: `.github/workflows/deploy.yml` never passed `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, or `MINIMAX_MODEL` to Cloud Run. The deployment had been working before because the old Gemini-based code didn't need MiniMax vars.

**Fix**: Added all 3 MiniMax env vars to the `--update-env-vars` block in `deploy.yml`.

**Lesson**: When migrating LLM providers, the deployment pipeline must be updated too — not just the application code and `.env.local`.

### 3. Intermittent Workflow Generation Failures — Token Truncation

**Symptom**: First workflow generation succeeds, subsequent attempts fail intermittently.

**Root cause**: `max_tokens` was set to 1024 (the default). MiniMax M2.5 is a reasoning model that emits `<think>` blocks before the actual response. Reasoning tokens count toward the `max_tokens` limit. For complex workflow JSON:
- `<think>` block: 500–1500 tokens (varies per request)
- JSON output: 600–1200 tokens
- Total needed: 1100–2700 tokens
- Budget: only 1024

When the model "thinks" more, the JSON gets truncated mid-way → `JSON.parse` fails → 500 error. This explains the **intermittent** nature — sometimes thinking is short enough to fit.

**Fix**: Increased `maxTokens` to 4096 for the workflow suggest endpoint.

**Key file**: `src/app/api/workflows/suggest/route.ts` line 90

---

## 🏗️ Architecture Decisions

### Configurable Base URL with Sensible Default

Rather than just switching the hardcoded URL, we made it configurable via `MINIMAX_BASE_URL` with a default:

```typescript
baseURL: process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1',
```

**Why**: If the project later needs to switch to the Global endpoint (different API key), it's a single env var change — no code change or redeployment needed.

---

## 📁 Files Changed

| File | Change |
|------|--------|
| `src/lib/llm-client.ts` | Configurable `baseURL` from env var |
| `src/app/api/workflows/suggest/route.ts` | `maxTokens: 4096` for workflow generation |
| `.env.local` | Added `MINIMAX_BASE_URL` |
| `.env.example` | Added `MINIMAX_BASE_URL` with China/Global docs |
| `.github/workflows/deploy.yml` | Added 3 MiniMax env vars to Cloud Run |
| `test-minimax.mjs` | Updated to use configurable baseURL |
| `test-minimax-api.cjs` | Deleted (redundant old test file) |

---

## 🔑 Key Takeaways

1. **MiniMax has separate China and Global endpoints**: `api.minimaxi.com` (China) vs `api.minimax.io` (Global). API keys are region-specific and won't cross-authenticate.

2. **Always update the deployment pipeline when changing env vars**: Local `.env.local` changes don't propagate to Cloud Run. The `deploy.yml` must explicitly pass every env var via `--update-env-vars`, and corresponding GitHub Secrets must be created.

3. **Reasoning models need higher token budgets**: Models like MiniMax M2.5 that emit `<think>` blocks consume tokens before the actual response. Set `max_tokens` to 3-4x the expected output size to account for variable reasoning length.

4. **Test both endpoints when debugging auth issues**: A simple `curl` test to each endpoint immediately revealed which one accepted the key — faster than reading docs or guessing.

5. **Intermittent failures often indicate resource limits**: When something works "sometimes", look for variable resource consumption (tokens, memory, timeouts) rather than logic bugs.

---

## Session 2: Split LLM Providers

### 🏗️ Architecture Decision — Why Split?

**Problem**: All LLM calls were routing through MiniMax M2.5 → Groq. MiniMax is excellent for function-calling (workflow generation) but overkill for simple summarisation tasks. Gemini 2.5 Flash offers free tier (250 RPD) and is well-suited for most tasks.

**Solution**: Dual chain architecture:
- **Default chain** (summarise, digest, audio, daily word, tool discovery): Gemini 2.5 Flash (retry 1x) → Groq
- **MiniMax chain** (workflow suggest only): MiniMax M2.5 (retry 1x) → Gemini → Groq

**Implementation**:
- Added `provider?: 'default' | 'minimax'` option to `GenerateTextOptions`
- `generateText()` dispatches to the appropriate chain based on `options.provider`
- `tryWithRetry()` helper extracts shared retry-once logic (DRY)
- `callGemini()` uses Gemini's OpenAI-compatible endpoint — reuses existing `openai` package, no new dependency

### 🔑 Key Takeaways (Session 2)

1. **Gemini has an OpenAI-compatible endpoint**: `https://generativelanguage.googleapis.com/v1beta/openai/` — uses `GEMINI_API_KEY` as the API key, works with the `openai` SDK directly.

2. **Provider-agnostic design pays off**: Because all callers use `generateText()`, switching the default from MiniMax to Gemini required zero changes to summariser, digest generator, tool discovery, or daily word generator.

3. **Rate limiting should match provider cost**: Workflow suggest uses the more expensive MiniMax provider, so rate limit was tightened from 10 → 3 per IP/minute.

4. **Test mocks can differentiate providers by baseURL**: The mock `OpenAI` constructor checks `opts.baseURL` to return different responses for Gemini vs MiniMax, enabling chain-specific test assertions.

---

## Session 3: LLM Usage Monitor Dashboard Design

### 🏗️ Architecture Decision — Why a Dashboard?

**Problem**: No visibility into LLM API usage. Can't see how many calls are made, which providers are failing, latency trends, or token consumption. Current `llm-usage.ts` is in-memory only — resets on every Cloud Run cold start.

**Solution**: Persistent logging to Supabase + admin dashboard with Recharts.

### Key Design Decisions

1. **Async fire-and-forget logging**: `logLLMUsage()` does `INSERT` without `await` — never blocks the LLM response path. If logging fails, it console.errors but doesn't affect the user.

2. **Feature tagging at the caller level**: Each feature passes `feature: 'summarise'` etc. to `generateText()`. This enables per-feature breakdown without parsing prompts.

3. **Server-side aggregation**: The API endpoint does `GROUP BY` / `AVG` / `COUNT` in SQL, not in JavaScript. Keeps payloads small and avoids sending raw rows to the client.

4. **Middleware + API dual auth**: Next.js middleware checks session existence (fast, no DB). API endpoint checks `profiles.is_admin` (accurate, DB query). This means unauthenticated users get redirected immediately, but the admin check happens at the data level.

5. **Auto-refresh polling over Realtime**: 15-second polling is simpler and sufficient for monitoring. Supabase Realtime would add websocket connections and complexity for minimal benefit on a single-user admin panel.

6. **30-day retention**: Prevents unbounded table growth. At ~100 calls/day, 30 days = ~3000 rows — trivial for Supabase.

### 🔑 Key Takeaways (Session 3)

1. **OpenAI SDK returns token usage**: `completion.usage.prompt_tokens` and `completion.usage.completion_tokens` — we were discarding this data. Capturing it is free.

2. **Recharts is lightweight for React**: ~45KB gzipped, declarative API, composes well with Tailwind. No need for heavier options like Tremor or Chart.js.

3. **profiles table is the standard Supabase auth pattern**: Rather than using user metadata, a `profiles` table with `is_admin` is queryable, indexable, and works with RLS policies.

4. **Middleware can't query Supabase DB directly**: It can only check if a session cookie exists. The actual admin role check must happen in the API route or server component.
