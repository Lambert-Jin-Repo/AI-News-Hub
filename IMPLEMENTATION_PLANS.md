# AI News Hub — Implementation Plans

> **For AI Agents:** Pick a task from PROJECT_TRACKER.md, read the relevant plan section here, then execute using `executing-plans` skill.

**Project:** AI News Hub  
**PRD Version:** 2.2  
**Last Updated:** 2026-02-06

---

## Plan Index

| Phase | Plan | Status | Link |
|-------|------|--------|------|
| 0.1 | Infrastructure Setup | Ready | [Jump](#phase-01-infrastructure-setup) |
| 0.2 | Database & Supabase | Ready | [Jump](#phase-02-database--supabase-setup) |
| 0.3 | Core UI Components | Ready | [Jump](#phase-03-core-ui-components) |
| 0.4 | Utility Functions | Ready | [Jump](#phase-04-utility-functions) |
| 1.1 | News Fetching Pipeline | Pending Phase 0 | [Jump](#phase-11-news-fetching-pipeline) |
| 1.2 | News Display Pages | Pending Phase 0 | [Jump](#phase-12-news-display-pages) |
| 2.1 | LLM Summarisation | Pending Phase 1 | [Jump](#phase-21-llm-summarisation) |
| 2.2 | Daily Digest | Pending Phase 1 | [Jump](#phase-22-daily-digest) |
| 3.1 | TTS Audio Generation | Pending Phase 2 | [Jump](#phase-31-tts-audio-generation) |
| 3.2 | Tools Directory | Pending Phase 2 | [Jump](#phase-32-tools-directory) |
| 4.1 | Polish & SEO | Pending Phase 3 | [Jump](#phase-41-polish--seo) |
| 4.2 | Launch Checklist | Pending Phase 3 | [Jump](#phase-42-launch-checklist) |

---

# Phase 0: Environment & Guardrails

## Phase 0.1: Infrastructure Setup

**Branch:** `feature/phase0-infrastructure`  
**Estimated Time:** 2-3 hours  
**Prerequisites:** GCP account, GitHub repository

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`

**Step 1: Initialize project**
```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: Verify project runs**
```bash
npm run dev
# Expected: Server starts on http://localhost:3000
```

**Step 3: Commit**
```bash
git add .
git commit -m "chore: initialize Next.js project with TypeScript"
```

---

### Task 2: Create Dockerfile

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

**Step 1: Create Dockerfile**
```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Step 2: Create .dockerignore**
```
# .dockerignore
node_modules
.next
.git
.gitignore
*.md
.env*
```

**Step 3: Update next.config.js for standalone output**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
}

module.exports = nextConfig
```

**Step 4: Build and test Docker image locally**
```bash
docker build -t ai-news-hub:test .
docker run -p 8080:8080 ai-news-hub:test
# Visit http://localhost:8080
```

**Step 5: Commit**
```bash
git add Dockerfile .dockerignore next.config.js
git commit -m "chore: add Dockerfile for Cloud Run deployment"
```

---

### Task 3: Create GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`

**Step 1: Create CI workflow**
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Test
        run: npm test -- --passWithNoTests
      
      - name: Build
        run: npm run build
```

**Step 2: Create Deploy workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE: ai-news-hub
  REGION: australia-southeast1

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build and Push
        run: |
          docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/ai-news-hub/${{ env.SERVICE }}:${{ github.sha }} .
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/ai-news-hub/${{ env.SERVICE }}:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE }} \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/ai-news-hub/${{ env.SERVICE }}:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --min-instances 0 \
            --max-instances 2 \
            --memory 512Mi \
            --cpu 1 \
            --set-env-vars "NODE_ENV=production"

      - name: Cleanup old images
        run: |
          # Keep only last 3 images
          gcloud artifacts docker images list \
            ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/ai-news-hub/${{ env.SERVICE }} \
            --format="get(DIGEST)" \
            --sort-by="~CREATE_TIME" \
            | tail -n +4 \
            | xargs -I {} gcloud artifacts docker images delete \
              ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/ai-news-hub/${{ env.SERVICE }}@{} \
              --quiet || true
```

**Step 3: Commit**
```bash
git add .github/
git commit -m "ci: add GitHub Actions for CI/CD and Cloud Run deployment"
```

---

### Task 4: Create Scheduled Jobs Workflow

**Files:**
- Create: `.github/workflows/scheduled-jobs.yml`

**Step 1: Create scheduled jobs workflow**
```yaml
# .github/workflows/scheduled-jobs.yml
name: Scheduled Jobs

on:
  schedule:
    # Fetch news every 6 hours
    - cron: '0 */6 * * *'
    # Summarise every 30 minutes
    - cron: '*/30 * * * *'
    # Daily digest at 6:00 AM AWST (22:00 UTC previous day)
    - cron: '0 22 * * *'
  workflow_dispatch:
    inputs:
      job_type:
        description: 'Job to run'
        required: true
        type: choice
        options:
          - fetch-news
          - summarise
          - daily-digest
          - cleanup

env:
  SERVICE_URL: ${{ secrets.CLOUD_RUN_URL }}
  CRON_SECRET: ${{ secrets.CRON_SECRET }}

jobs:
  fetch-news:
    if: github.event.schedule == '0 */6 * * *' || github.event.inputs.job_type == 'fetch-news'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger fetch-news job
        run: |
          curl -X POST "${{ env.SERVICE_URL }}/api/jobs/fetch-news" \
            -H "Authorization: Bearer ${{ env.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            --fail

  summarise:
    if: github.event.schedule == '*/30 * * * *' || github.event.inputs.job_type == 'summarise'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger summarise job
        run: |
          curl -X POST "${{ env.SERVICE_URL }}/api/jobs/summarise" \
            -H "Authorization: Bearer ${{ env.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            --fail

  daily-digest:
    if: github.event.schedule == '0 22 * * *' || github.event.inputs.job_type == 'daily-digest'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger daily-digest job
        run: |
          curl -X POST "${{ env.SERVICE_URL }}/api/jobs/daily-digest" \
            -H "Authorization: Bearer ${{ env.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            --fail
```

**Step 2: Commit**
```bash
git add .github/workflows/scheduled-jobs.yml
git commit -m "ci: add scheduled job triggers for news pipeline"
```

**Step 3: Push branch and verify**
```bash
git push -u origin feature/phase0-infrastructure
```

---

## Phase 0.2: Database & Supabase Setup

**Branch:** `feature/phase0-database`  
**Estimated Time:** 2-3 hours  
**Prerequisites:** Supabase account

### Task 1: Create Supabase Project & Get Credentials

**Step 1: Create project in Supabase Dashboard**
- Go to https://supabase.com/dashboard
- Create new project: "ai-news-hub"
- Wait for project to be provisioned

**Step 2: Get connection strings**
- Go to Settings → Database
- Copy "Transaction Pooler" connection string (port 6543)
- Document in `.env.local`:
```env
# .env.local (DO NOT COMMIT)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_KEY=[service-role-key]
```

**Step 3: Create .env.example**
```env
# .env.example
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
CRON_SECRET=generate-a-secret
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
```

---

### Task 2: Create Articles Table Migration

**Files:**
- Create: `supabase/migrations/001_articles_table.sql`

**Step 1: Write migration**
```sql
-- supabase/migrations/001_articles_table.sql

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  thumbnail_url TEXT,
  raw_excerpt TEXT,
  ai_summary TEXT,
  summary_status TEXT DEFAULT 'pending' CHECK (summary_status IN ('pending', 'completed', 'failed_safety', 'failed_quota', 'skipped')),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add search vector column
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(title, '') || ' ' ||
      COALESCE(raw_excerpt, '') || ' ' ||
      COALESCE(ai_summary, '')
    )
  ) STORED;

-- Create search index
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN (search_vector);

-- Create other useful indexes
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_summary_status ON articles (summary_status);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles (source);

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read articles" ON articles
  FOR SELECT USING (true);

-- Service role can insert/update/delete
CREATE POLICY "Service role can manage articles" ON articles
  FOR ALL USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Apply migration via Supabase SQL Editor**
- Go to SQL Editor in Supabase Dashboard
- Paste and run the migration

**Step 3: Verify table exists**
```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'articles';
```

---

### Task 3: Create Remaining Tables

**Files:**
- Create: `supabase/migrations/002_daily_digests_table.sql`
- Create: `supabase/migrations/003_tools_table.sql`
- Create: `supabase/migrations/004_sources_table.sql`

**Step 1: Create daily_digests migration**
```sql
-- supabase/migrations/002_daily_digests_table.sql

CREATE TABLE IF NOT EXISTS daily_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date DATE UNIQUE NOT NULL,
  summary_text TEXT NOT NULL,
  audio_url TEXT,
  audio_status TEXT DEFAULT 'pending' CHECK (audio_status IN ('pending', 'completed', 'failed')),
  article_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_digests_date ON daily_digests (digest_date DESC);

ALTER TABLE daily_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read digests" ON daily_digests
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage digests" ON daily_digests
  FOR ALL USING (auth.role() = 'service_role');

CREATE TRIGGER update_daily_digests_updated_at
  BEFORE UPDATE ON daily_digests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Create tools migration**
```sql
-- supabase/migrations/003_tools_table.sql

CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  pricing_model TEXT DEFAULT 'free' CHECK (pricing_model IN ('free', 'freemium', 'paid')),
  tags TEXT[] DEFAULT '{}',
  logo_url TEXT,
  date_added TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  needs_review BOOLEAN DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ,
  check_fail_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add search vector
ALTER TABLE tools ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(name, '') || ' ' ||
      COALESCE(description, '') || ' ' ||
      COALESCE(array_to_string(tags, ' '), '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_tools_search ON tools USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools (category);
CREATE INDEX IF NOT EXISTS idx_tools_is_active ON tools (is_active);

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active tools" ON tools
  FOR SELECT USING (is_active = true AND needs_review = false);

CREATE POLICY "Service role can manage tools" ON tools
  FOR ALL USING (auth.role() = 'service_role');

CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Step 3: Create sources migration**
```sql
-- supabase/migrations/004_sources_table.sql

CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rss', 'api')),
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_is_active ON sources (is_active);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage sources" ON sources
  FOR ALL USING (auth.role() = 'service_role');

CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Step 4: Apply all migrations and verify**
```sql
-- Verify all tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

---

### Task 4: Create Supabase Client

**Files:**
- Create: `src/lib/supabase.ts`

**Step 1: Install Supabase client**
```bash
npm install @supabase/supabase-js
```

**Step 2: Create client file**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Client for browser/public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server client for admin operations (use in API routes only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Types
export interface Article {
  id: string
  title: string
  url: string
  source: string
  published_at: string | null
  fetched_at: string
  thumbnail_url: string | null
  raw_excerpt: string | null
  ai_summary: string | null
  summary_status: 'pending' | 'completed' | 'failed_safety' | 'failed_quota' | 'skipped'
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface DailyDigest {
  id: string
  digest_date: string
  summary_text: string
  audio_url: string | null
  audio_status: 'pending' | 'completed' | 'failed'
  article_ids: string[]
  created_at: string
  updated_at: string
}

export interface Tool {
  id: string
  name: string
  description: string | null
  url: string
  category: string
  pricing_model: 'free' | 'freemium' | 'paid'
  tags: string[]
  logo_url: string | null
  date_added: string
  is_active: boolean
  needs_review: boolean
  last_checked_at: string | null
  check_fail_count: number
}

export interface Source {
  id: string
  name: string
  type: 'rss' | 'api'
  config: Record<string, unknown>
  is_active: boolean
  last_fetched_at: string | null
  last_error: string | null
}
```

**Step 3: Create database schema documentation**
```markdown
# docs/database-schema.md

# AI News Hub — Database Schema

## Tables

### articles
Stores AI news articles fetched from various sources.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Article title |
| url | TEXT | Original article URL (unique) |
| source | TEXT | Source name (e.g., "TechCrunch") |
| published_at | TIMESTAMPTZ | Original publish date |
| fetched_at | TIMESTAMPTZ | When we ingested it |
| thumbnail_url | TEXT | Image URL (may hotlink fail) |
| raw_excerpt | TEXT | Original excerpt |
| ai_summary | TEXT | AI-generated summary |
| summary_status | TEXT | pending/completed/failed_* |
| is_featured | BOOLEAN | Featured on homepage |
| search_vector | TSVECTOR | Full-text search (generated) |

### daily_digests
Daily "Today in AI" summaries with audio.

### tools
AI tools directory entries.

### sources
News source configurations.

## Connection

Use Transaction Pooler (port 6543) for all connections:
```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Never use direct connection (port 5432)** — this will exhaust connection limits on Cloud Run.
```

**Step 4: Commit**
```bash
git add supabase/ src/lib/supabase.ts docs/database-schema.md
git commit -m "feat: add Supabase setup with tables and TypeScript client"
```

---

## Phase 0.3: Core UI Components

**Branch:** `feature/phase0-components`  
**Estimated Time:** 2-3 hours  
**Prerequisites:** Next.js project initialized

*(Detailed implementation steps continue...)*

---

## Phase 0.4: Utility Functions

**Branch:** `feature/phase0-utilities`  
**Estimated Time:** 2-3 hours  
**Prerequisites:** Next.js project initialized

*(Detailed implementation steps continue...)*

---

# Phase 1: News Fetching & Display

*(Plans to be detailed after Phase 0 completion)*

## Phase 1.1: News Fetching Pipeline
## Phase 1.2: News Display Pages

---

# Phase 2: AI Summaries

*(Plans to be detailed after Phase 1 completion)*

## Phase 2.1: LLM Summarisation
## Phase 2.2: Daily Digest

---

# Phase 3: Audio & Directory

*(Plans to be detailed after Phase 2 completion)*

## Phase 3.1: TTS Audio Generation
## Phase 3.2: Tools Directory

---

# Phase 4: Polish & Launch

*(Plans to be detailed after Phase 3 completion)*

## Phase 4.1: Polish & SEO
## Phase 4.2: Launch Checklist

---

*This document is updated as phases complete. Each agent reads only their assigned section.*
