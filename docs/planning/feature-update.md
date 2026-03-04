# Feature Update — MiniMax M2.5 Migration & AI Automation

> **Date:** 2026-02-25 (updated 2026-03-04)
> **Status:** Phase 1 Complete
> **Goal:** Migrate LLM from Gemini to MiniMax M2.5 (Coding Plan), keep Google Cloud TTS, and add AI-powered automation features.

---

## Architecture Decision

| Function | Provider | Cost | Reason |
|----------|----------|------|--------|
| Article summarization | MiniMax M2.5 | Free (Coding Plan) | Unlimited tokens, resets every 5hr |
| Tool/workflow recommendations | MiniMax M2.5 | Free (Coding Plan) | Best-in-class function calling (76.8% BFCL) |
| Content enrichment & automation | MiniMax M2.5 | Free (Coding Plan) | Unlimited calls enable aggressive automation |
| Audio digest (TTS) | Google Cloud TTS | Free (4M chars/mo) | Only using ~66K chars/mo, well within free tier |
| LLM fallback | Groq (Llama 3.3) | Free | Redundancy if MiniMax is unavailable |

---

## Fallback & Backup Plan

> **Principle:** If MiniMax API is unavailable, the site continues to function normally. All AI-enhanced features degrade gracefully — no feature should break the core experience.

### Tier 1: Automatic LLM Fallback

```
MiniMax M2.5 (primary) → Groq Llama 3.3 (fallback) → Skip & Queue (last resort)
```

| Scenario | Automatic Action |
|----------|-----------------|
| MiniMax API timeout/error | Retry once → fall back to Groq |
| MiniMax + Groq both down | Queue articles as `pending`, retry next CRON cycle |
| MiniMax quota exceeded (unlikely on Coding Plan) | Route to Groq for remainder of window |
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

If MiniMax is permanently discontinued, rollback to Gemini-based architecture:

1. Swap `callMiniMax()` → `callGemini()` in `llm-client.ts` (single function change)
2. Re-enable Gemini usage tracking in `llm-usage.ts`
3. All prompts in `prompts.ts` are provider-agnostic — no changes needed
4. New AI features (recommendations, trends) can use any OpenAI-compatible provider

**Rollback time: ~30 minutes** — the architecture is provider-agnostic by design.

---

## Phase 1: Core Migration

> **Priority:** 🔴 Urgent — Gemini 2.0 Flash sunsets March 31, 2026

### Changes

| File | Change | Status |
|------|--------|--------|
| `src/lib/llm-client.ts` | Replace `callGemini()` with `callMiniMax()` using OpenAI-compatible API | ✅ Done |
| `src/lib/llm-client.ts` | Configurable `baseURL` via `MINIMAX_BASE_URL` (China default) | ✅ Done (2026-03-04) |
| `src/lib/llm-usage.ts` | Simplify — remove Gemini RPD tracking, add basic MiniMax health check | ✅ Done |
| `.env.example` / `.env.local` | Add `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, keep `GEMINI_API_KEY` as optional | ✅ Done |
| `.github/workflows/deploy.yml` | Add MiniMax env vars to Cloud Run deployment | ✅ Done (2026-03-04) |
| `src/app/api/workflows/suggest/route.ts` | Increase `maxTokens` to 4096 for reasoning model | ✅ Done (2026-03-04) |
| `src/lib/constants.ts` | Remove `MAX_ARTICLES_PER_DAY` cap (no longer cost-constrained) | ✅ Done |

### No Changes Required

- `src/lib/summariser.ts` — calls abstracted `generateText()`
- `src/lib/digest-generator.ts` — calls abstracted `generateText()`
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

## Database Migrations Required

| Phase | Table | Change |
|-------|-------|--------|
| 1 | `articles` | Remove daily cap enforcement |
| 2 | `articles` | Expand `ai_metadata` JSON schema (difficulty, takeaways, social posts, content_type) |
| 2 | `articles` | Add `is_duplicate` boolean |
| 3 | New: `weekly_reports` | `id`, `week_start`, `week_end`, `report_text`, `created_at` |
| 3 | `articles` | Add `related_article_ids` UUID array |
| 4 | New: `newsletter_subscribers` | `id`, `email`, `subscribed_at`, `is_active` |

---

## Environment Variables

```env
# MiniMax (primary LLM)
MINIMAX_API_KEY=your-minimax-api-key
MINIMAX_BASE_URL=https://api.minimaxi.com/v1   # China (default) or https://api.minimax.io/v1 (Global)
MINIMAX_MODEL=MiniMax-M2.5

# Google Cloud TTS (free tier audio)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Groq (LLM fallback)
GROQ_API_KEY=your-groq-api-key

# OPTIONAL — Gemini (additional fallback, can remove after migration)
GEMINI_API_KEY=your-gemini-api-key
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
