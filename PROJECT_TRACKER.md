# AI News Hub — Multi-Agent Project Tracker

> **For AI Agents:** Read this FIRST. This is the central coordination document for all agents working on this project.
>
> 🎯 **Required Skill:** Use `ai-parallel-branch-development` from vibe-cortex for workflow orchestration.

**Project:** AI News Hub  
**PRD Version:** 2.2  
**Last Updated:** 2026-02-06  
**Status:** 🟡 Planning

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
| 0 | Environment & Guardrails | Week 1 | 🔄 In Progress | None |
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
| `feature/phase0-infrastructure` | GCP + CI/CD Setup | Antigravity | 🔄 In Progress | See Task 0.1 | Today |
| `feature/phase0-database` | Supabase + Schema | Unassigned | ⏳ Pending | See Task 0.2 | - |
| `feature/phase0-components` | Core UI Components | Antigravity | 🔄 In Progress | See Task 0.3 | Today |
| `feature/phase0-utilities` | Utility Functions | Unassigned | ⏳ Pending | See Task 0.4 | - |

---

## Detailed Task Breakdown

### Task 0.1: Infrastructure Setup (Can run in parallel)

**Branch:** `feature/phase0-infrastructure`  
**Agent:** Unassigned  
**Status:** ⏳ Not Started  
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
- [ ] GCP project configured with billing alerts ($5, $10)
- [ ] Cloud Run API enabled
- [ ] Artifact Registry setup
- [ ] GitHub Actions CI/CD pipeline
- [ ] Dockerfile with multi-stage build
- [ ] Image cleanup script (retain last 3)
- [ ] Environment variable documentation

**Verification:**
```bash
# Pipeline deploys successfully
# Cloud Run responds to health check
curl https://[SERVICE_URL]/api/health
```

---

### Task 0.2: Database & Supabase Setup (Can run in parallel)

**Branch:** `feature/phase0-database`  
**Agent:** Unassigned  
**Status:** ⏳ Not Started  
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
- [ ] Supabase project created
- [ ] Transaction Pooler connection string (port 6543) documented
- [ ] All 4 tables created (articles, daily_digests, tools, sources)
- [ ] Generated tsvector columns for search
- [ ] GIN indexes on search_vector columns
- [ ] RLS policies (public read, admin write)
- [ ] Supabase client configured

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
**Agent:** Unassigned  
**Status:** ⏳ Not Started  
**Est. Time:** 2-3 hours

**Scope — Files to CREATE:**
```
├── src/components/
│   ├── ui/
│   │   ├── SafeImage.tsx             # Image with fallback
│   │   ├── AudioPlayer.tsx           # HTML5 audio wrapper
│   │   ├── FilterBar.tsx             # Reusable filter component
│   │   ├── SearchInput.tsx           # Search with debounce
│   │   └── Badge.tsx                 # Category/source badges
│   ├── cards/
│   │   ├── NewsCard.tsx              # Article card
│   │   ├── ToolCard.tsx              # Tool directory card
│   │   └── DigestCard.tsx            # Daily digest card
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Layout.tsx
├── src/styles/
│   └── globals.css                   # Design tokens, dark mode
└── public/
    └── placeholders/
        ├── news-placeholder.svg
        ├── tool-placeholder.svg
        └── ai-hub-logo.svg
```

**Scope — Files NOT to modify:**
- Database files
- API route files
- GitHub workflow files

**Deliverables:**
- [ ] SafeImage component with onError fallback
- [ ] NewsCard with summary_status handling
- [ ] ToolCard with needs_review/is_active filtering
- [ ] DigestCard with embedded audio player
- [ ] Dark mode CSS variables
- [ ] Placeholder SVG assets
- [ ] Component tests

**Verification:**
```bash
npm run test -- --testPathPattern="components"
npm run storybook  # If using Storybook
```

---

### Task 0.4: Utility Functions (Can run in parallel)

**Branch:** `feature/phase0-utilities`  
**Agent:** Unassigned  
**Status:** ⏳ Not Started  
**Est. Time:** 2-3 hours

**Scope — Files to CREATE:**
```
├── src/lib/
│   ├── sanitize.ts                   # Input sanitization
│   ├── tts-preprocessor.ts           # Acronym expansion
│   ├── llm-client.ts                 # LLM abstraction layer
│   └── constants.ts                  # Shared constants
├── src/utils/
│   ├── date-format.ts
│   └── debounce.ts
└── src/app/api/
    └── health/
        └── route.ts                  # Health check endpoint
```

**Scope — Files NOT to modify:**
- Database migration files
- Component files
- GitHub workflow files

**Deliverables:**
- [ ] Input sanitization (strip HTML, enforce limits)
- [ ] TTS pre-processor with acronym dictionary
- [ ] LLM client abstraction (Gemini primary, Groq fallback)
- [ ] Prompt injection defence template
- [ ] Health check endpoint (`/api/health`)
- [ ] Unit tests for all utilities

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
```

---

## Merge Checklist

Before merging any feature branch to `develop`:

- [ ] All tests passing in feature branch
- [ ] No lint errors
- [ ] Agent has updated status in this tracker
- [ ] Orchestrator has reviewed changes
- [ ] No file conflicts with other branches

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
