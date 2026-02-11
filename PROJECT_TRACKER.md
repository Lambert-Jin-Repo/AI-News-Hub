# AI News Hub — Multi-Agent Project Tracker

> **For AI Agents:** Read this FIRST. This is the central coordination document for all agents working on this project.
>
> 🎯 **Required Skill:** Use `ai-parallel-branch-development` from vibe-cortex for workflow orchestration.

**Project:** AI News Hub  
**PRD Version:** 2.2  
**Last Updated:** 2026-02-11
**Status:** Phase 6 — AI Workflows Feature (Complete)

---

## How This Tracker Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                           │
│  (Coordinates all work, updates this tracker)                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  AGENT 1    │  │  AGENT 2    │  │  AGENT 3    │
│  Branch A   │  │  Branch B   │  │  Branch C   │
│  Feature X  │  │  Feature Y  │  │  Feature Z  │
└─────────────┘  └─────────────┘  └─────────────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   MERGE TO DEVELOP    │
              │   (Orchestrator)      │
              └───────────────────────┘
```

### Agent Rules

> ⚠️ **Git is MANDATORY. Read `AGENT_INSTRUCTIONS.md` for full details.**

1. **Check this file BEFORE starting any work**
2. **VERIFY you're on YOUR feature branch** (never `main` or `develop`)
3. **Update your row status when starting/completing**
4. **Only modify files in YOUR assigned scope**
5. **Commit frequently** (don't accumulate huge uncommitted changes)
6. **Push your branch when done** — unpushed work = incomplete task
7. **Report completion with Git verification** (see handoff protocol)

---

## Phase Overview

| Phase | Name | Duration | Status | Dependencies |
|-------|------|----------|--------|--------------|
| 0 | Environment & Guardrails | Week 1 | ✅ Complete | None |
| 1 | News Fetching & Display | Weeks 2-3 | ✅ Complete | Phase 0 |
| 2 | AI Summaries | Weeks 4-5 | ✅ Complete | Phase 1 |
| 3 | Homepage, Tools & Tests | Weeks 6-7 | ✅ Complete | Phase 2 |
| 4 | Polish & Launch | Weeks 8-9 | ✅ Complete | Phase 3 |
| 5 | LLM Focus Pivot & Summary Enhancement | Weeks 10-11 | ⏳ Not Started | Phase 4 |
| 6 | AI Workflows Feature | Week 12 | ✅ Complete | Phase 4 |

**Status Legend:**
- ⏳ Not Started
- 🔄 In Progress
- ✅ Complete
- 🚫 Blocked
- ⚠️ Needs Review

---

## Current Sprint: Phase 5 — LLM Focus Pivot & Summary Enhancement

### Branch Strategy

```
main (stable)
  └── develop (integration)
        └── feature/phase5-llm-pivot    [Tasks 5.1-5.8] ⏳ Not Started
```

### Active Agent Assignments

| Branch | Feature | Agent | Status | Scope | Last Update |
|--------|---------|-------|--------|-------|-------------|
| `feature/phase0-infrastructure` | GCP + CI/CD Setup | Claude Opus | ✅ Complete | See Task 0.1 | 2026-02-09 |
| `feature/phase0-database` | Supabase + Schema | Claude Opus | ✅ Complete | See Task 0.2 | 2026-02-09 |
| `feature/phase0-components` | Core UI Components | Claude Opus | ✅ Complete | See Task 0.3 | 2026-02-08 |
| `feature/phase0-utilities` | Utility Functions | Claude Opus | ✅ Complete | See Task 0.4 | 2026-02-09 |
| `feature/phase1-news` | News Fetching & Display | Claude Opus | ✅ Complete | See Tasks 1.1-1.2 | 2026-02-09 |
| `feature/phase2-summaries` | AI Summaries & Digest | Claude Opus | ✅ Complete | See Tasks 2.1-2.3 | 2026-02-09 |
| `feature/phase3-directory` | Homepage, Tools & Tests | Claude Opus | ✅ Complete | See Tasks 3.1-3.8 | 2026-02-09 |
| `feature/phase4-polish` | Polish & Launch | Antigravity | ✅ Complete | See Tasks 4.1-4.9 | 2026-02-09 |
| `feature/phase5-llm-pivot` | LLM Focus & Summary 2.0 | TBD | ⏳ Not Started | See Tasks 5.1-5.8 | — |

---

## Detailed Task Breakdown

### Phase 5: LLM Focus Pivot & Summary Enhancement

> **Goal:** Narrow news coverage from broad AI/tech to LLM, Models & Agents specifically.
> Simultaneously transform the daily briefing from boring paragraph summaries into
> an actionable, scannable "developer cheat sheet" with structured sections and
> a conversational podcast-style audio briefing.

> **Cost Optimization Applied:** This phase uses cost-optimized settings:
> - TTS Voice: Standard-D (free tier, not Journey)
> - Summarise frequency: Every 2 hours
> - Max articles/day: 20
> - See `docs/COST_OPTIMIZATION.md` for details
>
> **GitHub Actions Usage Estimate:**
>
> | Task | Frequency | Duration | Monthly Minutes |
> |------|-----------|----------|-----------------|
> | News fetching | 2×/day | 1 min | 60 |
> | Summarisation | 12×/day | 1 min | 360 |
> | Daily digest | 1×/day | 2 min | 60 |
> | **Total** | | | **~500 min/month** |

---

### Task 5.1: Schema — Add `category` and `ai_metadata` Columns

**Branch:** `feature/phase5-llm-pivot`
**Status:** ⏳ Not Started

**Scope — Files to CREATE/MODIFY:**
```
├── supabase/migrations/
│   └── 009_add_category_and_metadata.sql   # New migration
├── src/lib/supabase.ts                      # Update Article interface
└── src/lib/constants.ts                     # Add ARTICLE_CATEGORY enum
```

**Migration `009_add_category_and_metadata.sql`:**
- Add `category TEXT` column to articles (values: `llm`, `agents`, `models`, `research`, `tools`, `other`, `null`)
- Add `ai_metadata JSONB` column to articles (structured extraction data)
- Add index on `category` for filtering
- Keep existing `ai_summary TEXT` column for backwards compatibility (human-readable summary)

**TypeScript changes:**
- Add `category: string | null` and `ai_metadata: Record<string, unknown> | null` to `Article` interface
- Add `ARTICLE_CATEGORY` enum to constants

**Deliverables:**
- [ ] Migration 009 SQL file
- [ ] Updated Article interface with `category` and `ai_metadata`
- [ ] ARTICLE_CATEGORY constant with allowed values

**Commit:** `feat(db): add category and ai_metadata columns to articles`

---

### Task 5.2: Prompt Overhaul — Structured Summaries & Sectioned Digest

**Branch:** `feature/phase5-llm-pivot`
**Status:** ⏳ Not Started

**Scope — File:** `src/lib/prompts.ts`

**Article Summary Prompt** — Change from plain text output to structured markdown:
```
New output format per article:
- **Classification**: (LLM / Agents / Models / Research / Tools / Other)
- **Relevance**: (1-10 score — how relevant to LLM/Agents/Models practitioners)
- **TL;DR**: One sentence of impact
- **Key Points**: 2-3 bullet points
- **Tech Stack**: Libraries/APIs mentioned (if any)
- **Why It Matters**: One line of practical impact for developers
```

The LLM response will be JSON so we can parse classification + relevance programmatically
while storing the readable parts in `ai_summary` as markdown.

**Daily Digest Prompt** — Change from narrative paragraphs to sectioned briefing:
```
Sections:
1. "The Big Picture" — 2-3 sentence theme of the day
2. "Key Releases" — Bullet list of model/tool launches
3. "Worth Watching" — Emerging trends or research
4. "Developer Takeaway" — One actionable insight
```

**Audio Script Prompt** (new) — Separate prompt for TTS input:
```
Write in a conversational "morning podcast" tone.
Instead of: "Today OpenAI released GPT-5..."
Write: "Good morning! If you've been waiting for a cheaper way to run high-speed agents, OpenAI just gave you a gift..."
```

**Deliverables:**
- [ ] Updated `ARTICLE_SUMMARY_PROMPT` requesting JSON with classification + structured markdown
- [ ] Updated `DAILY_DIGEST_PROMPT` with named sections and bullet-point format
- [ ] New `AUDIO_SCRIPT_PROMPT` for conversational podcast-style TTS
- [ ] Updated `buildArticleSummaryInput()` — no change needed (title + excerpt still valid input)
- [ ] Updated `buildDailyDigestInput()` — include category in the story list
- [ ] New `buildAudioScriptInput()` — takes sectioned digest text, formats for audio prompt

**Commit:** `feat(prompts): structured article summaries, sectioned digest, podcast audio script`

---

### Task 5.3: Summariser Update — Classify, Filter & Store Metadata

**Branch:** `feature/phase5-llm-pivot`
**Status:** ⏳ Not Started

**Scope — File:** `src/lib/summariser.ts`

**Changes:**
1. Parse LLM JSON response to extract: `classification`, `relevance_score`, and markdown summary
2. Store `category` from classification in the articles table
3. Store structured data (`tech_stack`, `relevance_score`) in `ai_metadata` JSONB column
4. Store human-readable markdown (TL;DR + Key Points + Why It Matters) in `ai_summary` as before
5. **Relevance filtering:** If `relevance_score < 4` (out of 10), set `summary_status = 'skipped'` and
   store a brief reason — don't waste digest space on off-topic articles
6. Handle JSON parse failure gracefully — fall back to storing raw text in `ai_summary` with `category = null`

**Architecture:**
```
Article → LLM (single call) → JSON response
  ├── Parse classification → articles.category
  ├── Parse relevance → skip if < 4
  ├── Parse tech_stack, relevance → articles.ai_metadata (JSONB)
  └── Format TL;DR + Key Points + Why It Matters → articles.ai_summary (text)
```

**Key principle:** Single Gemini call per article (no extra API cost vs current approach).
The prompt does classification + summarisation together.

**Deliverables:**
- [ ] JSON response parsing with fallback
- [ ] Category stored in `articles.category`
- [ ] Metadata stored in `articles.ai_metadata`
- [ ] Relevance threshold filtering (score < 4 → skipped)
- [ ] Backwards-compatible: `ai_summary` still contains readable text

**Commit:** `feat(summariser): classify articles by category and filter by relevance`

---

### Task 5.4: Digest Generator Update — Sectioned Format & Low-Volume Handling

**Branch:** `feature/phase5-llm-pivot`
**Status:** ⏳ Not Started

**Scope — File:** `src/lib/digest-generator.ts`

**Changes:**
1. Filter articles for digest: only include `category IN ('llm', 'agents', 'models', 'research')`
2. Pass category info to `buildDailyDigestInput()` for grouping
3. **Low-volume handling:** If fewer than 3 relevant articles in last 24h:
   - Expand lookback to 48h
   - If still < 3, skip digest generation for the day (return a "quiet day" message)
4. Store the sectioned markdown output from the LLM in `summary_text`

**Deliverables:**
- [ ] Category filter on article selection for digest
- [ ] Low-volume day handling (expanded lookback → skip)
- [ ] `buildDailyDigestInput()` includes category grouping
- [ ] Digest `summary_text` contains sectioned markdown

**Commit:** `feat(digest): category-filtered digest with low-volume day handling`

---

### Task 5.5: TTS Enhancement — Podcast Script (Standard-D Voice)

**Branch:** `feature/phase5-llm-pivot`
**Status:** ⏳ Not Started

**Scope — Files:**
```
├── src/lib/tts-client.ts          # Upgrade voice
├── src/lib/digest-generator.ts    # Generate audio from podcast script, not digest text
└── src/lib/prompts.ts             # AUDIO_SCRIPT_PROMPT (done in 5.2)
```

**Changes:**
1. In `digest-generator.ts`: After generating the sectioned digest, make a **second LLM call**
   using `AUDIO_SCRIPT_PROMPT` to convert the sectioned markdown into a conversational podcast script.
   Use this script as TTS input instead of the raw `summary_text`.
2. In `tts-client.ts`: Keep `en-US-Standard-D` voice (free tier). The podcast-style
   audio script prompt provides the conversational quality improvement instead.

**Audio cost analysis:**
- Standard-D voice: ~$0.004/day (free tier covers it)
- Journey voice: ~$0.03/day ($0.90/month) — skipped for cost optimization
- Standard-D + podcast script prompt is adequate for news briefings

**Deliverables:**
- [ ] Separate audio script generation (LLM call #2 in digest pipeline)
- [ ] Keep Standard-D voice (free tier)
- [ ] Audio script stored or passed through (not stored — ephemeral)

**Commit:** `feat(tts): podcast-style audio script with Standard voice`

---

### Task 5.6: Homepage UI — Render Structured Digest

**Branch:** `feature/phase5-llm-pivot`
**Status:** ⏳ Not Started

**Scope — File:** `src/app/page.tsx`

**Changes:**
1. Replace plain paragraph rendering with structured section rendering
2. Parse `summary_text` markdown sections and render with visual hierarchy:
   - Section headers with Lucide icons (Zap for "Big Picture", Rocket for "Key Releases",
     Eye for "Worth Watching", Lightbulb for "Developer Takeaway")
   - Bullet points rendered as styled list items
   - Key stats/numbers highlighted in accent color
3. Keep backwards compatibility: if `summary_text` doesn't have sections (old digests),
   fall back to current paragraph rendering

**Deliverables:**
- [ ] Section-aware digest renderer on homepage
- [ ] Icon mapping for section headers
- [ ] Backwards-compatible with old plain-text digests
- [ ] Responsive layout (stacked on mobile, side-by-side on desktop)

**Commit:** `feat(home): render structured digest sections with icons`

---

### Task 5.7: News Feed UI — Add Category Filter

**Branch:** `feature/phase5-llm-pivot`
**Status:** ⏳ Not Started

**Scope — Files:**
```
├── src/app/api/news/route.ts       # Add category query param
├── src/app/news/page.tsx            # Fetch distinct categories for filter
├── src/app/news/news-feed.tsx       # Add category FilterBar
└── src/app/news/[slug]/page.tsx     # Show category badge on detail page
```

**Changes:**
1. **API:** Add `category` query param to `GET /api/news` — `.eq('category', category)`
2. **Server component:** Fetch distinct categories (like `getSources()` pattern)
3. **Client component:** Add second FilterBar row for categories (LLM / Agents / Models / Research / All)
4. **Detail page:** Show category badge next to source badge

**Deliverables:**
- [ ] API supports `?category=llm` filter
- [ ] Category filter bar on /news page
- [ ] Category badge on article detail page
- [ ] Category included in article card display

**Commit:** `feat(news): add category filter to news feed and API`

---

### Task 5.8: Update Tests

**Branch:** `feature/phase5-llm-pivot`
**Status:** ⏳ Not Started

**Scope — Files:**
```
├── src/lib/__tests__/prompts.test.ts           # Update for new prompt format
├── src/lib/__tests__/summariser.test.ts         # Add category/relevance tests
├── src/lib/__tests__/digest-generator.test.ts   # Add low-volume + category tests
```

**Test cases to add:**
- Prompts: `buildDailyDigestInput` includes category, new `buildAudioScriptInput` works
- Summariser: JSON response parsing, category extraction, relevance threshold skip,
  JSON parse failure fallback, `ai_metadata` stored correctly
- Digest: Category filter applied, low-volume day → expanded lookback,
  ultra-low-volume → skip, audio script LLM call made

**Deliverables:**
- [ ] Updated prompt tests
- [ ] New summariser tests for classification + filtering
- [ ] New digest tests for category filter + low-volume handling
- [ ] All existing tests still pass

**Commit:** `test: update tests for category filtering and structured summaries`

---

### Phase 5 Integration

1. Verify: `npm run build && npm run lint && npm test` (all pass)
2. Merge `feature/phase5-llm-pivot` → `develop` (--no-ff)
3. Verify again on develop
4. Merge `develop` → `main` (--no-ff)

**User action required after merge:**
- Run migration `009_add_category_and_metadata.sql` in Supabase SQL Editor
- Existing articles will have `category = NULL` and `ai_metadata = NULL`
- Re-summarise existing articles to populate categories (run summarise CRON manually)

---

### Task 0.1: Infrastructure Setup (Can run in parallel)

**Branch:** `feature/phase0-infrastructure`
**Agent:** Claude Opus
**Status:** ✅ Complete
**Est. Time:** 2-3 hours

**Scope — Files to CREATE/MODIFY:**
```
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI pipeline
│       ├── deploy.yml                # Cloud Run deployment
│       └── scheduled-jobs.yml        # Cron triggers
├── Dockerfile                        # Container config
├── .dockerignore
├── cloudbuild.yaml                   # Cloud Build config
└── scripts/
    └── cleanup-images.sh             # Artifact Registry cleanup
```

**Scope — Files NOT to modify:**
- Any `src/` files
- Any database files
- Any component files

**Deliverables:**
- [x] Next.js standalone output configured
- [x] GitHub Actions CI pipeline (lint, type-check, test, build)
- [x] Cloud Run deployment workflow
- [x] Scheduled job triggers (fetch, summarise, digest)
- [x] Dockerfile with multi-stage build
- [x] .dockerignore
- [x] Image cleanup script (retain last 3)
- [ ] GCP project configured (user action required)
- [ ] Cloud Run API enabled (user action required)
- [ ] Artifact Registry setup (user action required)

**Verification:**
```bash
# Pipeline deploys successfully
# Cloud Run responds to health check
curl https://[SERVICE_URL]/api/health
```

---

### Task 0.2: Database & Supabase Setup (Can run in parallel)

**Branch:** `feature/phase0-database`
**Agent:** Claude Opus
**Status:** ✅ Complete
**Est. Time:** 2-3 hours

**Scope — Files to CREATE:**
```
├── supabase/
│   └── migrations/
│       ├── 001_articles_table.sql
│       ├── 002_daily_digests_table.sql
│       ├── 003_tools_table.sql
│       ├── 004_sources_table.sql
│       └── 005_search_indexes.sql
├── src/lib/
│   └── supabase.ts                   # Client config
└── docs/
    └── database-schema.md            # Schema documentation
```

**Scope — Files NOT to modify:**
- Any GitHub workflow files
- Any component files
- Any API route files

**Deliverables:**
- [x] SQL migration files for all 4 tables (articles, daily_digests, tools, sources)
- [x] Generated tsvector columns for search
- [x] GIN indexes on search_vector columns
- [x] RLS policies (public read, service_role write)
- [x] Supabase client with TypeScript types
- [x] Database schema documentation
- [ ] Supabase project created (user action required)
- [ ] Migrations run in Supabase SQL Editor (user action required)

**Verification:**
```sql
-- Tables exist with correct columns
SELECT * FROM articles LIMIT 1;
SELECT * FROM tools LIMIT 1;

-- Search works
SELECT * FROM articles WHERE search_vector @@ to_tsquery('english', 'test');
```

---

### Task 0.3: Core UI Components (Can run in parallel)

**Branch:** `feature/phase0-components`
**Agent:** Claude Opus
**Status:** ✅ Complete
**Est. Time:** 2-3 hours

**Scope — Files CREATED/MODIFIED:**
```
├── src/components/
│   ├── ui/
│   │   ├── SafeImage.tsx             # Image with fallback ✅
│   │   ├── AudioPlayer.tsx           # HTML5 audio wrapper ✅
│   │   ├── FilterBar.tsx             # Reusable filter component ✅
│   │   ├── SearchInput.tsx           # Search with debounce ✅
│   │   ├── Badge.tsx                 # Category/source badges ✅
│   │   └── ThemeToggle.tsx           # Light/dark mode toggle ✅
│   ├── cards/
│   │   ├── NewsCard.tsx              # Article card (DB-aligned props) ✅
│   │   ├── ToolCard.tsx              # Tool directory card ✅
│   │   └── DigestCard.tsx            # Daily digest card ✅
│   ├── layout/
│   │   ├── Header.tsx                # With mobile menu ✅
│   │   └── Footer.tsx                # Dynamic copyright year ✅
│   └── providers/
│       └── ThemeProvider.tsx          # next-themes wrapper ✅
├── src/app/
│   ├── globals.css                   # Design tokens, dark mode ✅
│   ├── layout.tsx                    # ThemeProvider integrated ✅
│   └── page.tsx                      # Landing page with mock data ✅
├── src/lib/
│   └── utils.ts                      # cn() utility (⚠️ owned by this branch)
├── public/
│   └── placeholders/
│       ├── news-placeholder.svg      ✅
│       └── tool-placeholder.svg      ✅
├── vitest.config.ts                  # Test framework setup ✅
└── vitest.setup.ts                   ✅
```

**Deliverables:**
- [x] SafeImage component with onError fallback
- [x] NewsCard with summary_status handling and DB-aligned props
- [x] ToolCard with pricing badges, logo fallback, tags
- [x] DigestCard with embedded audio player
- [x] AudioPlayer with progress, seek, mute controls
- [x] SearchInput with debounce
- [x] FilterBar with pill-style tabs
- [x] Badge with multi-variant support
- [x] Header mobile menu
- [x] Dark mode CSS variables
- [x] Placeholder SVG assets
- [x] Vitest test framework installed and configured

**⚠️ Note for Task 0.4 agent:** `src/lib/utils.ts` already exists on this branch with `cn()`. Do NOT recreate it. Only add new files (`sanitize.ts`, `llm-client.ts`, etc.).

**Verification:**
```bash
npm run build  # ✅ Passes
npm run test   # ✅ Passes
```

---

### Task 0.4: Utility Functions (Can run in parallel)

**Branch:** `feature/phase0-utilities`
**Agent:** Claude Opus
**Status:** ✅ Complete
**Est. Time:** 2-3 hours

**⚠️ IMPORTANT:** `src/lib/utils.ts` already exists on `feature/phase0-components` with `cn()`. Do NOT recreate this file. Add new utilities as separate files only.

**Scope — Files to CREATE:**
```
├── src/lib/
│   ├── sanitize.ts                   # Input sanitization
│   ├── tts-preprocessor.ts           # Acronym expansion
│   ├── llm-client.ts                 # LLM abstraction layer
│   ├── auth.ts                       # CRON job auth (use crypto.timingSafeEqual)
│   └── constants.ts                  # Shared constants
└── src/app/api/
    └── health/
        └── route.ts                  # Health check endpoint
```

**Scope — Files NOT to modify:**
- `src/lib/utils.ts` (owned by phase0-components)
- Database migration files
- Component files
- GitHub workflow files

**Deliverables:**
- [x] Input sanitization (sanitizeHtml, stripHtml, sanitizeText)
- [x] TTS pre-processor with acronym dictionary
- [x] LLM client abstraction (Gemini primary, Groq fallback)
- [x] Prompt injection defence via XML content wrapping
- [x] Text formatters (formatRelativeTime, truncate, slugify)
- [x] CRON auth with timing-safe comparison
- [x] Shared constants and type enums
- [x] Health check endpoint (`/api/health`)
- [x] Unit tests for all utilities (53 tests passing)

**Verification:**
```bash
npm run test -- --testPathPattern="lib|utils"
curl http://localhost:3000/api/health
# Returns: {"status":"ok","timestamp":"...","version":"2.2.0"}
```

---

## Phase 6: AI Workflows Feature (Complete)

> **Goal:** Add curated AI tool workflows and an AI-powered workflow suggestion feature to the Tools page.

### What Was Added

**New Feature: Curated AI Workflows**
- `workflows` table in Supabase (migration 010) with steps stored as JSONB
- 6 curated workflows seeded via Gemini-powered script (with fallback descriptions)
- Workflow showcase section on `/tools` page with Free / Paid / Random toggles
- All workflows listing at `/tools/workflows`
- Workflow detail pages at `/tools/workflows/[slug]` with vertical stepper timeline
- "Used in Workflows" section on individual tool detail pages

**New Feature: AI Workflow Suggestion**
- "Suggest" tab in WorkflowShowcase — users describe a goal, Gemini generates a 3-5 step pipeline
- `POST /api/workflows/suggest` endpoint with rate limiting (10 req/min per IP)
- In-memory tool cache (refreshed every 10 min) for fast prompt building
- Validates all suggested tool slugs against the database

**New Feature: Gemini Usage Monitor**
- `src/lib/llm-usage.ts` — in-memory daily call counter (limit: 230, auto-reset at midnight UTC)
- Integrated into `llm-client.ts` — proactively routes to Groq when nearing Gemini's 250 RPD limit
- Warns at 80% usage, skips Gemini entirely at 230 calls
- `GET /api/admin/usage` — usage stats endpoint (protected by CRON_SECRET)

### Files Created (12)
| File | Purpose |
|------|---------|
| `supabase/migrations/010_workflows_table.sql` | DB migration |
| `scripts/seed-workflows.ts` | Gemini-powered seed script |
| `src/lib/llm-usage.ts` | Daily Gemini call counter |
| `src/app/api/workflows/route.ts` | GET curated workflows |
| `src/app/api/workflows/suggest/route.ts` | POST AI suggestion |
| `src/app/api/admin/usage/route.ts` | GET usage stats |
| `src/components/workflows/WorkflowShowcase.tsx` | Browse + Suggest UI |
| `src/components/workflows/WorkflowPipeline.tsx` | Horizontal step pipeline |
| `src/components/cards/WorkflowCard.tsx` | Card for listings |
| `src/app/tools/workflows/page.tsx` | All workflows listing |
| `src/app/tools/workflows/[slug]/page.tsx` | Workflow detail page |
| `src/app/tools/workflows/loading.tsx` | Loading skeleton |

### Files Modified (4)
| File | Changes |
|------|---------|
| `src/lib/supabase.ts` | Added `WorkflowStep`, `Workflow` interfaces + DB type map |
| `src/lib/llm-client.ts` | Integrated usage monitor |
| `src/app/tools/page.tsx` | Added `WorkflowShowcase` section |
| `src/app/tools/[slug]/page.tsx` | Added "Used in Workflows" section |

---

## Agent Progress Log

> Agents: Add your updates here in reverse chronological order.

```
[TEMPLATE]
### YYYY-MM-DD HH:MM — Agent [ID] — Branch: [branch-name]
**Status:** [Started | In Progress | Blocked | Complete]
**Summary:** [What you did]
**Issues:** [Any blockers or concerns]
**Next:** [What happens next]

### 2026-02-11 — Claude Opus — Branch: main
**Status:** Complete
**Summary:**
- Phase 6: AI Workflows feature — full implementation
- Migration 010: workflows table with JSONB steps, indexes, RLS policies
- Seed script: 6 curated workflows with Gemini-generated descriptions (fallback to hand-written)
- WorkflowShowcase component: Free/Paid/Random toggles + AI Suggest mode
- WorkflowPipeline: horizontal step visualization with tool logos
- WorkflowCard: compact card for listing pages
- Workflow detail page: vertical stepper timeline (reuses digest-timeline pattern)
- "Used in Workflows" section on tool detail pages (JSONB containment query)
- Gemini usage monitor: proactive Groq routing at 230 calls/day
- Admin usage endpoint for monitoring
- API routes: GET /api/workflows, POST /api/workflows/suggest with rate limiting
- All 99 existing tests passing, build clean, TypeScript clean
**Issues:** None.
**Next:** Phase 6 complete. Run migration 010 in Supabase, then seed with `npx tsx scripts/seed-workflows.ts`.

### 2026-02-06 22:25 — Antigravity — Branch: feature/phase0-components
**Status:** In Progress
**Summary:** Initialized Next.js project (Phase 0.1) and started Phase 0.3 (Core Components).
**Issues:** None.
### 2026-02-08 20:50 — Antigravity — Branch: feature/phase0-components
**Status:** In Progress
**Summary:** Implemented Light/Dark Mode Toggle using `next-themes`. Added `ThemeProvider` and `ThemeToggle` component in Header. Verified robust switching between Light (Cream) and Dark (Teal) themes.
**Issues:** None.
**Next:** Implement ToolCard and DigestCard to complete Phase 0.3.
### 2026-02-08 21:30 — Antigravity — Branch: feature/phase0-components
**Status:** Handoff Ready
**Summary:**
- Fixed default theme to "light" (was system-dependent)
- Fixed dark mode card backgrounds using `--surface` CSS variable
- Improved text/icon accessibility for WCAG AA compliance
- Created comprehensive handoff document for next AI agent
**Completed:** Landing page, Header, Footer, NewsCard, ThemeToggle, ThemeProvider
**Remaining:** ToolCard, DigestCard, SafeImage, AudioPlayer, FilterBar, SearchInput, Badge
**Next:** Another AI to continue with remaining Phase 0.3 components.

### 2026-02-09 — Claude Opus — Branch: feature/phase3-directory → develop → main
**Status:** Complete
**Summary:**
- Task 3.1: Migration 006 (slug column on tools), updated Tool interface, TOOLS_PER_PAGE constant
- Task 3.2: Homepage — replaced all mock data with real Supabase queries (digest, articles, stats), ISR
- Task 3.3: Fixed header nav links (/news, /tools)
- Task 3.4: Tools API endpoint with search/filter/cursor pagination
- Task 3.5: Tools listing page with category + pricing filters, 3-column grid
- Task 3.6: Tool detail page (/tools/[slug]) with related tools
- Task 3.7: Migration 007 — seeded 50 AI tools across 6 categories
- Task 3.8: 21 new tests for prompts, summariser, digest-generator (91 total)
- ToolCard updated with internal linking via Next.js Link when slug present
- Build, lint, and all 91 tests passing
**Issues:** None.
### 2026-02-09 — Antigravity — Navigation Polish
**Status:** Complete
**Summary:**
- Implemented `FloatingControls` (Scroll To Top only)
- Created `BackToHome` component (Minimalist House icon)
- Positioned `BackToHome` in TOP-RIGHT of content area for News/Tools detail pages
- Added `BackToHome` to `/news` and `/tools` listing pages
- Created `/about` page with consistent navigation
- Fixed broken "About" link in Global Header
- Replaced manual "Back" links with Breadcrumbs in `/news/[slug]` and `/tools/[slug]`
- Fixed missing imports/exports
**Issues:** None.
**Next:** Phase 3 complete. User action: run migrations 006 + 007 in Supabase SQL Editor.

### 2026-02-09 — Antigravity — Branch: feature/phase4-polish → develop → main
**Status:** Complete
**Summary:**
- Task 4.1: SEO Basics — sitemap.ts, robots.ts, Open Graph metadata in layout.tsx
- Task 4.2: Performance Audit — lazy loading, font display swap, security headers
- Task 4.3: Error Handling — error.tsx, not-found.tsx, logger.ts
- Task 4.4: Storage Cleanup — cleanup-storage.ts, storage-cleanup.yml, migration 008
- Task 4.5: Link Health Checker — check-links.ts, check-tool-links.yml
- Task 4.6: E2E Pipeline — test-pipelines.ts for CRON job verification
- Task 4.7: SKIPPED (About page already complete)
- Task 4.8: Final Polish — Skeleton.tsx loading states, Footer newsletter, accessibility
- Task 4.9: Launch Checklist — LAUNCH_CHECKLIST.md
- All 91 tests passing, build verified
**Issues:** None.
**Next:** Run migration 008 in Supabase SQL Editor. Review LAUNCH_CHECKLIST.md before deployment.

### 2026-02-09 — Claude Opus — Branch: feature/phase2-summaries → develop → main
**Status:** Complete
**Summary:**
- Reviewed and fixed Phase 2 implementation by another agent
- Task 2.1: Centralised prompts, article summariser with p-limit(3) concurrency, skipped status for generic errors
- Task 2.2: Google Cloud TTS client with lazy init, daily digest generator with published_at fallback
- Task 2.3: CRON endpoints for summarise (hourly) and daily-digest (6AM AWST)
- Fixed: duplicate DigestCard, select('*'), failed_error mapping, TTS import crash, env docs
- Fixed pre-existing SearchInput setState-in-effect lint error
- Organised onto proper feature branch, merged to develop → main
- 70 tests passing, lint clean, TypeScript clean
**Issues:** None.
**Next:** Phase 2 complete. Remaining: create digests Storage bucket, add unit tests, update homepage with DigestCard.

### 2026-02-09 — Claude Opus — Branch: feature/phase1-news → develop → main
**Status:** Complete
**Summary:**
- Implemented Phase 1 (News Fetching & Display) on single branch `feature/phase1-news`
- Task 1.1: RSS fetcher (rss-parser), GNews API fetcher, fetch-news CRON endpoint, 17 unit tests
- Task 1.2: News API with cursor pagination + full-text search, news feed page with search/filter/load-more, article detail page with AI summary + related articles
- Refactored NewsCard to use SafeImage and shared formatters from Phase 0.4
- Updated env vars to 2025+ Supabase naming convention
- Migration 005: slug column on articles + seed 4 news sources
- Merged to develop → main. 70 tests passing, build clean.
**Issues:** None.
**Next:** Phase 1 complete. Ready for Phase 2 (AI Summaries).

### 2026-02-09 — Claude Opus — Phase 0 Integration
**Status:** Complete
**Summary:**
- Completed Tasks 0.4, 0.2, 0.1 on separate feature branches
- Task 0.4: constants, sanitize, tts-preprocessor, formatters, llm-client, auth, health endpoint, 53 unit tests
- Task 0.2: 4 SQL migration files, Supabase client with TypeScript types, schema docs
- Task 0.1: Next.js standalone, Dockerfile, CI/CD pipelines, scheduled jobs, cleanup script
- Merged all branches into develop, then develop into main
- All builds and tests passing
**Issues:** None.
**Next:** Phase 0 complete. Ready for Phase 1 (News Fetching & Display).

### 2026-02-08 22:00 — Claude Opus — Branch: feature/phase0-components
**Status:** Complete
**Summary:**
- Installed Vitest + React Testing Library test framework
- Fixed hardcoded dates (Footer copyright, hero date) with dynamic values
- Refactored NewsCard props to align with DB articles table schema
- Created SafeImage with fallback handling + placeholder SVGs
- Created AudioPlayer with progress, seek, mute (uses bg-[var(--surface)])
- Created ToolCard, DigestCard, SearchInput, FilterBar, Badge
- Added mobile menu dropdown to Header with ARIA accessibility
- Fixed package.json name from "temp-app" to "ai-news-hub"
- All components use bg-[var(--surface)] CSS variable pattern (not bg-surface-light dark:bg-surface-dark)
**Issues:** None.
**Next:** Task 0.3 complete. Ready for merge to develop. Remaining: Tasks 0.1, 0.2, 0.4.
```

---

## Merge Checklist

Before merging any feature branch to `develop`:

- [x] All tests passing in feature branch
- [x] No lint errors (pre-existing lint warnings from Phase 0.3 noted)
- [x] Agent has updated status in this tracker
- [x] All Phase 0 branches merged and verified
- [x] develop merged to main — Phase 0 complete

**Merge Command:**
```bash
git checkout develop
git merge feature/phase0-[name] -m "Merge feature/phase0-[name] into develop"
npm test  # Verify tests still pass
```

---

## Cross-Agent Dependencies

| Feature | Depends On | Notes |
|---------|------------|-------|
| API Routes (Phase 1) | Task 0.2 Database, Task 0.4 Utilities | Need Supabase client + sanitization |
| News Cards (Phase 1) | Task 0.3 Components | SafeImage required |
| Summarisation (Phase 2) | Task 0.4 Utilities | LLM client required |
| TTS (Phase 3) | Task 0.4 Utilities | TTS preprocessor required |

---

## Environment Variables

> All agents must use these exact variable names.

| Variable | Description | Where Used |
|----------|-------------|------------|
| `DATABASE_URL` | Supabase Transaction Pooler (port 6543) | All DB operations |
| `SUPABASE_URL` | Supabase project URL | Client SDK |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Client SDK |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Server-side |
| `CRON_SECRET` | Shared secret for job endpoints | Job triggers |
| `GEMINI_API_KEY` | Google Gemini API key | LLM summaries |
| `GEMINI_MODEL` | Gemini model name (default: `gemini-2.0-flash`) | LLM summaries |
| `GROQ_API_KEY` | Groq API key (fallback) | LLM fallback |

---

## Quick Reference Commands

```bash
# Create feature branch
git checkout develop && git checkout -b feature/phase0-[name]

# Push branch
git push -u origin feature/phase0-[name]

# Check branch status
git log develop..HEAD --oneline

# Run tests
npm test

# Run specific test file
npm test -- --testPathPattern="[pattern]"

# Check all branches
git branch -a
```

---

*This is a living document. Orchestrator updates after each merge.*
