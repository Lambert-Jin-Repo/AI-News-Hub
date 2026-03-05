# Feature Update — Split LLM Providers & AI Automation

> **Date:** 2026-02-25 (updated 2026-03-05)
> **Status:** Phase 1 Complete, Phase 6 Implementation Complete (Workflow Advisor v2)
> **Goal:** Use Gemini 2.5 Flash as default LLM, MiniMax M2.5 for workflow generation only, keep Google Cloud TTS, and add AI-powered automation features.

---

## Architecture Decision

| Function | Provider | Cost | Reason |
|----------|----------|------|--------|
| Article summarization | Gemini 2.5 Flash | Free (250 RPD) | Default for most tasks, fast, reliable |
| Daily digest & audio | Gemini 2.5 Flash | Free (250 RPD) | Handles summarisation well |
| Tool discovery & daily word | Gemini 2.5 Flash | Free (250 RPD) | General-purpose tasks |
| Workflow generation | MiniMax M2.5 | Free (Coding Plan) | Best function-calling (76.8% BFCL) |
| Audio digest (TTS) | Google Cloud TTS | Free (4M chars/mo) | Only using ~66K chars/mo, well within free tier |
| LLM fallback (all chains) | Groq (Llama 3.3) | Free | Last-resort redundancy |

---

## Fallback & Backup Plan

> **Principle:** If any LLM provider is unavailable, the site continues to function normally. All AI-enhanced features degrade gracefully — no feature should break the core experience.

### Tier 1: Automatic LLM Fallback (Dual Chain)

```
Default chain (most tasks):  Gemini 2.5 Flash (retry 1x) → Groq → fail
MiniMax chain (workflow):    MiniMax M2.5 (retry 1x) → Gemini 2.5 Flash → Groq → error
```

| Scenario | Automatic Action |
|----------|-----------------|
| Gemini API timeout/error | Retry once → fall back to Groq |
| MiniMax API timeout/error (workflow) | Retry once → fall back to Gemini → then Groq |
| All providers down | Queue articles as `pending`, retry next CRON cycle |
| Gemini quota exceeded (250 RPD) | Route to Groq automatically |
| Network outage | All jobs fail gracefully, log errors, retry next cycle |

### Tier 2: Feature Degradation

If LLM is unavailable for an extended period, features degrade but the site remains fully functional:

| Feature | Normal State | Degraded State |
|---------|-------------|----------------|
| Article summaries | AI-generated summary | Shows `raw_excerpt` (original snippet) |
| Tool recommendations | AI-powered natural language | Falls back to existing text search + filters |
| Weekly trend report | Auto-generated | Skipped for the week |
| Related articles | AI-matched | Not shown |
| Content quality scoring | AI-rated | Default score applied |
| Daily digest | AI-written narrative | Skipped, shows individual articles instead |
| Audio digest | TTS of AI narrative | Not generated (no dependency on MiniMax) |
| Social post generation | Auto-generated | Not generated |
| Duplicate detection | Semantic matching | URL-only deduplication (existing) |

### Tier 3: Full Rollback

If MiniMax is permanently discontinued:
1. Remove `provider: 'minimax'` from workflow suggest route — it automatically uses the default (Gemini) chain
2. All prompts in `prompts.ts` are provider-agnostic — no changes needed
3. New AI features (recommendations, trends) can use any OpenAI-compatible provider

If Gemini is permanently discontinued:
1. Set all callers to `provider: 'minimax'` or add a new default provider to `llm-client.ts`
2. The architecture supports any OpenAI-compatible provider

**Rollback time: ~10 minutes** — the architecture is provider-agnostic by design with dual chains.

---

## Phase 1: Core Migration → Split Provider Architecture

> **Priority:** 🔴 Urgent — Gemini 2.0 Flash sunsets March 31, 2026
> **Updated 2026-03-04:** Split providers — Gemini 2.5 Flash default, MiniMax for workflow only

### Changes

| File | Change | Status |
|------|--------|--------|
| `src/lib/llm-client.ts` | Added `callGemini()` via OpenAI-compatible endpoint | ✅ Done (2026-03-04) |
| `src/lib/llm-client.ts` | Dual chain: `generateWithDefaultChain()` (Gemini→Groq) + `generateWithMiniMaxChain()` (MiniMax→Gemini→Groq) | ✅ Done (2026-03-04) |
| `src/lib/llm-client.ts` | `generateText()` dispatcher with `provider` option (`'default'` or `'minimax'`) | ✅ Done (2026-03-04) |
| `src/lib/llm-client.ts` | Configurable `baseURL` via `MINIMAX_BASE_URL` (China default) | ✅ Done (2026-03-04) |
| `src/lib/llm-usage.ts` | Default provider → `gemini`, added `isGeminiConfigured()`, widened types | ✅ Done (2026-03-04) |
| `src/app/api/workflows/suggest/route.ts` | `provider: 'minimax'`, rate limit 10→3 (Phase 1); `maxTokens: 2048`, quality gates, new schema (Phase 6) | ✅ Done (2026-03-04, updated 2026-03-05) |
| `.env.local` | `GEMINI_MODEL=gemini-2.5-flash` | ✅ Done (2026-03-04) |
| `.env.example` | Rewritten: Gemini primary, MiniMax workflow-only, Groq fallback | ✅ Done (2026-03-04) |
| `.github/workflows/deploy.yml` | Added `GEMINI_MODEL=gemini-2.5-flash` to Cloud Run env vars | ✅ Done (2026-03-04) |
| `src/lib/__tests__/llm-client.test.ts` | Updated for dual chain tests (6 tests) | ✅ Done (2026-03-04) |
| `src/lib/constants.ts` | Remove `MAX_ARTICLES_PER_DAY` cap (no longer cost-constrained) | ✅ Done |

### No Changes Required (automatic via default provider)

- `src/lib/summariser.ts` — calls `generateText()` without `provider` → uses Gemini chain
- `src/lib/digest-generator.ts` — calls `generateText()` without `provider` → uses Gemini chain
- `src/lib/tool-discovery.ts` — calls `generateText()` without `provider` → uses Gemini chain
- `src/lib/daily-word-generator.ts` — calls `generateText()` without `provider` → uses Gemini chain
- `scripts/seed-workflows.ts` — calls `generateText()` without `provider` → uses Gemini chain
- `src/lib/prompts.ts` — provider-agnostic prompts
- `src/lib/tts-client.ts` — stays on Google Cloud TTS
- All components — UI layer is fully decoupled

---

## Phase 2: Quick-Win Automation

> **Priority:** 🟡 High — low effort, high impact, all free

### 2a. Enhanced Article Enrichment

Extend the summarisation prompt to return richer metadata per article:

- Multi-label tags (e.g., `["llm", "tools"]` instead of one category)
- Difficulty level (`beginner` / `intermediate` / `advanced`)
- Reading time estimate
- 3 key takeaways
- 3 "questions this article answers"
- Action items for developers
- Content type classification (`original_reporting` / `press_release` / `opinion` / `tutorial`)

**Files:** `src/lib/prompts.ts`, `src/lib/summariser.ts`, `supabase/migrations/` (expand `ai_metadata`)

### 2b. AI Tool Recommendations

New endpoint: `POST /api/tools/recommend`

Users describe their need in natural language → M2.5 matches against tool catalog → returns ranked recommendations with explanations.

**Files:** New `src/app/api/tools/recommend/route.ts`, new UI component

### 2c. Smart Duplicate Detection

During `fetch-news` job, pass new article titles + existing recent titles to M2.5 → detect semantic duplicates beyond URL matching.

**Files:** `src/app/api/jobs/fetch-news/route.ts`, add `is_duplicate` column

### 2d. Auto-Generated SEO & Social Posts

During summarisation, generate per article:
- Optimized meta title + description
- Twitter/X post (280 chars)  
- LinkedIn post (with hashtags)

Store in `ai_metadata`. Surface in share buttons with pre-filled text.

**Files:** `src/lib/prompts.ts`, `src/lib/summariser.ts`, `src/components/ui/ShareButton.tsx`

---

## Phase 3: New Content Features

> **Priority:** 🟢 Medium — new capabilities, moderate effort

### 3a. Weekly Trend Report

New CRON job running every Sunday. M2.5 analyses all articles from the past 7 days and generates:
- Dominant themes
- Emerging trends
- Fading topics
- Key numbers/stats

**Files:** New `src/lib/trend-generator.ts`, new `src/app/api/jobs/weekly-trends/route.ts`, new `weekly_reports` table, new `/trends` page

### 3b. Auto-Discover Tools from Articles

During summarisation, M2.5 extracts AI tool mentions → checks against `tools` table → inserts new tools with `needs_review: true`.

**Files:** `src/lib/summariser.ts` (extend), `src/lib/prompts.ts`

### 3c. Related Article Linking

After summarisation, M2.5 compares each new article against recent articles and identifies top 3 related ones. Creates internal link network.

**Files:** New post-summarisation job, add `related_article_ids` column, update article detail page

### 3d. "Explain Like I'm..." Mode

Generate two summary variants per article:
- Beginner-friendly (no jargon, analogies)
- Technical deep-dive (specific APIs, benchmarks)

Store both in `ai_metadata`. Toggle on article detail page.

**Files:** `src/lib/prompts.ts`, `src/lib/summariser.ts`, article detail page UI

### 3e. Auto-Compare Similar Tools

For each tool category, M2.5 generates comparison tables. E.g., "Cursor vs Copilot vs Windsurf."

**Files:** New `src/lib/tool-comparator.ts`, new UI on tool detail pages

### 3f. Monthly "State of AI" Report

End-of-month CRON generates a comprehensive analysis across all categories.

**Files:** New CRON job, new page `/reports`

---

## Phase 4: Advanced Features

> **Priority:** 🔵 Low — high effort or stretch goals

### 4a. AI News Chat

Interactive chat widget where users ask questions about recent AI news. M2.5 searches your article database and synthesizes answers with citations.

**Files:** New `POST /api/chat`, streaming UI component, prompt engineering

### 4b. Auto-Generate Weekly Newsletter

Curate top articles, write editorial intro, format for email, send via Resend/SendGrid.

**Files:** New CRON, new `newsletter_subscribers` table, email template

### 4c. Auto-Translate Digests

Generate digests in Chinese, Japanese, Spanish for global reach.

**Files:** `src/lib/digest-generator.ts` (extend), add `locale` to digests table

### 4d. Pricing Change Detector

Weekly scan of tool homepages → M2.5 detects pricing model changes → flags or auto-generates article.

### 4e. Intelligent Auto-Archive

M2.5 reviews articles approaching archive date → keeps important ones (foundational papers, major releases), aggressively archives low-value content.

---

## Phase 6: Workflow Advisor v2 — Agent Team Blueprint ✅ Implementation Complete

> **Priority:** 🟡 High — improves core user-facing feature quality
> **Design Doc:** `docs/plans/2026-03-05-workflow-advisor-v2-design.md`
> **Status:** ✅ Implementation complete (2026-03-05)

### Problem

Current workflow advisor output is often generic — vague steps, mediocre prompt templates, token-heavy with filler (tips + pitfalls). No quality validation before showing to users.

### Solution: Agent Team Blueprint

Reframe AI workflow answers around the **2026 multi-agent team pattern**:

| Current | New | Why |
|---|---|---|
| `tools[]` with name/role | `agentTeam[]` with role/tool/brief | Tools as specialist team members |
| `steps[]` with title/desc | `scaffold[]` with phase/action/**output** | Every step names a concrete deliverable |
| `promptTemplates[]` (1-3) | `starterPrompt` (1 best, with `[PLACEHOLDERS]`) | Quality over quantity |
| `tips[]` + `pitfalls[]` | `keywords[]` + `levelUp` | Learning vocabulary + one next step |
| — | `difficulty` badge | beginner/intermediate/advanced |

### Quality Gates

3-tier validation before showing any result to users:

1. **Schema completeness** — all fields present, correct counts, `[PLACEHOLDER]` in prompt
2. **Content heuristics** — no duplicate text, goal relevance check, min lengths
3. **Retry strategy** — retry same provider → fallback provider → honest error

### Token Efficiency

- Output: ~790 → ~432 tokens (**45% reduction**)
- Input: ~1,173 tokens (0.6% of MiniMax M2.5 context, safe to 500+ tools)
- 1-shot example added for quality anchoring (+150 input tokens, negligible cost)

### Files Modified

| File | Change | Status |
|---|---|---|
| `src/lib/prompts.ts` | New "AI workflow architect" prompt + 1-shot landing page example | ✅ Done |
| `src/app/api/workflows/suggest/route.ts` | Tier 1-3 quality gates, new response shape, `maxTokens: 2048`, retry chain | ✅ Done |
| `src/components/workflows/AdvisorResult.tsx` | New types (`AdvisorAgent`, `AdvisorScaffoldStep`, `AdvisorData`) + full UI rebuild | ✅ Done |
| `src/components/workflows/WorkflowShowcase.tsx` | No changes needed — `AdvisorData` type name unchanged | ✅ N/A |

---

## Phase 5: LLM Usage Monitor Dashboard ✅ Complete

> **Priority:** 🔴 Urgent — Need visibility into LLM API usage and costs
> **Design Doc:** `docs/plans/2026-03-04-llm-dashboard-design.md`
> **Implementation Doc:** `docs/plans/2026-03-04-llm-dashboard-implementation.md`
> **Status:** ✅ Complete (2026-03-04) — 110 tests passing, deployed to Cloud Run

### 5a. Usage Logging Infrastructure ✅

Instrumented `generateText()` to log every LLM call to `llm_usage_logs` table. Async, non-blocking.

**Tracks:** provider, model, feature, latency, tokens in/out, success/failure, fallback events.

**Files:** `src/lib/llm-logger.ts`, `src/lib/llm-client.ts`, migration 012

### 5b. Admin Auth & Middleware ✅

Supabase Auth login page + `profiles` table with `is_admin` flag. Next.js proxy (middleware) protects `/admin/*`.

**Files:** `src/proxy.ts`, `src/lib/supabase-middleware.ts`, `src/lib/supabase-server.ts`, `src/app/admin/login/page.tsx`, migration 012

**Note:** Next.js 16 uses `proxy.ts` instead of deprecated `middleware.ts`. Login uses `createBrowserClient` from `@supabase/ssr` for cookie-based sessions (not `createClient` from `@supabase/supabase-js` which uses localStorage).

### 5c. Dashboard UI ✅

Live dashboard at `/admin/llm-usage` with Recharts. Auto-refresh every 15s.

**Charts:** Calls over time (stacked area), provider distribution (pie), latency by provider (bar), feature breakdown (horizontal bar), fallback event timeline, recent calls table.

**Files:** `src/app/admin/llm-usage/page.tsx`, `components.tsx`, `src/app/api/admin/llm-usage/route.ts`

### 5d. Data Retention ✅

30-day auto-cleanup via SQL function `cleanup_old_llm_logs()`. Callable from app-level cron or pg_cron.

---

## Database Migrations Required

| Phase | Table | Change |
|-------|-------|--------|
| 1 | `articles` | Remove daily cap enforcement |
| 2 | `articles` | Expand `ai_metadata` JSON schema (difficulty, takeaways, social posts, content_type) |
| 2 | `articles` | Add `is_duplicate` boolean |
| 3 | New: `weekly_reports` | `id`, `week_start`, `week_end`, `report_text`, `created_at` |
| 3 | `articles` | Add `related_article_ids` UUID array |
| 4 | New: `newsletter_subscribers` | `id`, `email`, `subscribed_at`, `is_active` |
| 5 | New: `llm_usage_logs` | `id`, `created_at`, `provider`, `model`, `feature`, `success`, `latency_ms`, `tokens_in`, `tokens_out`, `error_type`, `is_fallback` |
| 5 | New: `profiles` | `id` (FK auth.users), `is_admin`, `created_at` |

---

## Environment Variables

```env
# Gemini (default LLM for most tasks)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# MiniMax (workflow suggest only)
MINIMAX_API_KEY=your-minimax-api-key
MINIMAX_BASE_URL=https://api.minimaxi.com/v1   # China (default) or https://api.minimax.io/v1 (Global)
MINIMAX_MODEL=MiniMax-M2.5

# Google Cloud TTS (free tier audio)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Groq (fallback for all chains)
GROQ_API_KEY=your-groq-api-key
```

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Articles processed/day | 20 (capped) | 50-100+ |
| Summary quality | Basic TLDR + category | Multi-label, difficulty, takeaways, action items |
| Tool discovery | Manual only | Auto-discovered from articles |
| Duplicate rate | URL-only dedup | Semantic dedup |
| Content types | News only | News + Weekly Trends + Monthly Reports |
| User engagement | Browse + search | AI recommendations, chat, personalized |
| Monthly cost | ~$0.03 | ~$0 (all free tiers) |
