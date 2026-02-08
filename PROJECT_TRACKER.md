# AI News Hub — Multi-Agent Project Tracker

> **For AI Agents:** Read this FIRST. This is the central coordination document for all agents working on this project.
>
> 🎯 **Required Skill:** Use `ai-parallel-branch-development` from vibe-cortex for workflow orchestration.

**Project:** AI News Hub  
**PRD Version:** 2.2  
**Last Updated:** 2026-02-09
**Status:** ✅ Phase 0 Complete

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
| 1 | News Fetching & Display | Weeks 2-3 | ⏳ Not Started | Phase 0 |
| 2 | AI Summaries | Weeks 4-5 | ⏳ Not Started | Phase 1 |
| 3 | Audio & Directory | Weeks 6-7 | ⏳ Not Started | Phase 2 |
| 4 | Polish & Launch | Weeks 8-9 | ⏳ Not Started | Phase 3 |

**Status Legend:**
- ⏳ Not Started
- 🔄 In Progress
- ✅ Complete
- 🚫 Blocked
- ⚠️ Needs Review

---

## Current Sprint: Phase 0 — Environment & Guardrails

### Branch Strategy

```
main (stable)
  └── develop (integration)
        ├── feature/phase0-infrastructure    [Agent 1]
        ├── feature/phase0-database          [Agent 2]
        ├── feature/phase0-components        [Agent 3]
        └── feature/phase0-utilities         [Agent 4]
```

### Active Agent Assignments

| Branch | Feature | Agent | Status | Scope | Last Update |
|--------|---------|-------|--------|-------|-------------|
| `feature/phase0-infrastructure` | GCP + CI/CD Setup | Claude Opus | ✅ Complete | See Task 0.1 | 2026-02-09 |
| `feature/phase0-database` | Supabase + Schema | Claude Opus | ✅ Complete | See Task 0.2 | 2026-02-09 |
| `feature/phase0-components` | Core UI Components | Claude Opus | ✅ Complete | See Task 0.3 | 2026-02-08 |
| `feature/phase0-utilities` | Utility Functions | Claude Opus | ✅ Complete | See Task 0.4 | 2026-02-09 |

---

## Detailed Task Breakdown

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

## Agent Progress Log

> Agents: Add your updates here in reverse chronological order.

```
[TEMPLATE]
### YYYY-MM-DD HH:MM — Agent [ID] — Branch: [branch-name]
**Status:** [Started | In Progress | Blocked | Complete]
**Summary:** [What you did]
**Issues:** [Any blockers or concerns]
**Next:** [What happens next]

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
