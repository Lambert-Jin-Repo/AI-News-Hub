# AI News Hub — Implementation Plans

> **For AI Agents:** Pick a task from PROJECT_TRACKER.md, read the relevant plan section here, then execute using `executing-plans` skill.

**Project:** AI News Hub  
**PRD Version:** 2.2  
**Last Updated:** 2026-02-11

---

## Plan Index

| Phase | Plan | Status | Link |
|-------|------|--------|------|
| 0.1 | Infrastructure Setup | ✅ Complete | [Jump](#phase-01-infrastructure-setup) |
| 0.2 | Database & Supabase | ✅ Complete | [Jump](#phase-02-database--supabase-setup) |
| 0.3 | Core UI Components | ✅ Complete | [Jump](#phase-03-core-ui-components) |
| 0.4 | Utility Functions | ✅ Complete | [Jump](#phase-04-utility-functions) |
| 1.1 | News Fetching Pipeline | ✅ Complete | [Jump](#phase-11-news-fetching-pipeline) |
| 1.2 | News Display Pages | ✅ Complete | [Jump](#phase-12-news-display-pages) |
| 2.1 | LLM Summarisation | ✅ Complete | [Jump](#phase-21-llm-summarisation) |
| 2.2 | Daily Digest | ✅ Complete | [Jump](#phase-22-daily-digest) |
| 3.1 | Homepage, Tools & Tests | ✅ Complete | [Jump](#phase-31-tts-audio-generation) |
| 4.1 | Polish & Launch | ✅ Complete | [Jump](#phase-41-polish--seo) |
| 5.1 | Schema: Category & Metadata | Ready | [Jump](#phase-51-schema--category--metadata-columns) |
| 5.2 | Prompt Overhaul | Ready | [Jump](#phase-52-prompt-overhaul) |
| 5.3 | Summariser: Classify & Filter | Ready | [Jump](#phase-53-summariser--classify-filter--store) |
| 5.4 | Digest: Sectioned Format | Ready | [Jump](#phase-54-digest-generator--sectioned-format) |
| 5.5 | TTS: Podcast Script & Voice | Ready | [Jump](#phase-55-tts-enhancement) |
| 5.6 | Homepage: Structured Digest UI | Ready | [Jump](#phase-56-homepage-ui--structured-digest) |
| 5.7 | News Feed: Category Filter | Ready | [Jump](#phase-57-news-feed-ui--category-filter) |
| 5.8 | Tests: Update & Expand | Ready | [Jump](#phase-58-update-tests) |
| 6.1 | AI Workflows Feature | ✅ Complete | [Jump](#phase-6-ai-workflows-feature) |

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
**Current Status:** ✅ Complete

### Completed Components

| Component | File | Notes |
|-----------|------|-------|
| Header | `src/components/layout/Header.tsx` | With mobile menu, ARIA labels |
| Footer | `src/components/layout/Footer.tsx` | Dynamic copyright year |
| NewsCard | `src/components/cards/NewsCard.tsx` | Props aligned with DB `articles` table |
| ToolCard | `src/components/cards/ToolCard.tsx` | Pricing badges, SafeImage fallback |
| DigestCard | `src/components/cards/DigestCard.tsx` | Embedded AudioPlayer |
| SafeImage | `src/components/ui/SafeImage.tsx` | next/image with fallback |
| AudioPlayer | `src/components/ui/AudioPlayer.tsx` | HTML5 audio, progress, seek, mute |
| SearchInput | `src/components/ui/SearchInput.tsx` | Debounced with clear button |
| FilterBar | `src/components/ui/FilterBar.tsx` | Pill-style tabs with active state |
| Badge | `src/components/ui/Badge.tsx` | 5 variants: default/primary/success/warning/danger |
| ThemeToggle | `src/components/ui/ThemeToggle.tsx` | Light/dark switch, hydration-safe |
| ThemeProvider | `src/components/providers/ThemeProvider.tsx` | next-themes wrapper |

### Key Decisions Made

1. **CSS Variable Pattern:** All components use `bg-[var(--surface)]` which auto-switches with `.dark` class. NOT `bg-surface-light dark:bg-surface-dark`.
2. **NewsCard Props:** Aligned with `articles` DB table — takes `url`, `publishedAt`, `thumbnailUrl`, `summaryStatus` instead of `icon`/`iconBgInfo`/`timeAgo`.
3. **Test Framework:** Vitest + React Testing Library (not Jest).
4. **`utils.ts` Ownership:** `src/lib/utils.ts` with `cn()` lives on this branch. Task 0.4 must NOT recreate it.

---

### Task 1: Fix Next.js Hydration Warning

**Priority:** 🔴 High (blocks testing)

**Step 1: Check browser console for error**
```bash
# Open http://localhost:3000, inspect the "1 Issue" badge
# Look for hydration mismatch errors
```

**Step 2: Common fixes**
- Ensure no `Date.now()` or `Math.random()` in render
- Wrap client-only code in `useEffect` or use `'use client'` directive
- Check for browser-only APIs used during SSR

**Step 3: Verify fix**
```bash
npm run build
# Should complete with no errors
```

---

### Task 2: Create SafeImage Component

**Files:**
- Create: `src/components/ui/SafeImage.tsx`

**Step 1: Create component**
```typescript
// src/components/ui/SafeImage.tsx
'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string
  fallbackClassName?: string
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = '/placeholders/news-placeholder.svg',
  fallbackClassName,
  className,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-100 dark:bg-gray-800",
        fallbackClassName || className
      )}>
        <Image
          src={fallbackSrc}
          alt={alt}
          className="opacity-50"
          {...props}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      {!loaded && (
        <div className={cn(
          "absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse",
          className
        )} />
      )}
      <Image
        src={src}
        alt={alt}
        className={cn(className, !loaded && 'opacity-0')}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        {...props}
      />
    </div>
  )
}
```

**Step 2: Create placeholder SVG**
```bash
mkdir -p public/placeholders
```

Create `public/placeholders/news-placeholder.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none">
  <rect width="400" height="300" fill="#F3F4F6"/>
  <path d="M160 120h80v60h-80z" fill="#D1D5DB"/>
  <circle cx="180" cy="140" r="12" fill="#9CA3AF"/>
  <path d="M200 160l30 20H170l30-20z" fill="#9CA3AF"/>
</svg>
```

**Step 3: Commit**
```bash
git add src/components/ui/SafeImage.tsx public/placeholders/
git commit -m "feat(components): add SafeImage with fallback handling"
```

---

### Task 3: Create AudioPlayer Component

**Files:**
- Create: `src/components/ui/AudioPlayer.tsx`

**Step 1: Create component**
```typescript
// src/components/ui/AudioPlayer.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  src: string
  title?: string
  duration?: string
  className?: string
}

export function AudioPlayer({ src, title, duration, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('0:00')

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      const percent = (audio.currentTime / audio.duration) * 100
      setProgress(isNaN(percent) ? 0 : percent)
      
      const mins = Math.floor(audio.currentTime / 60)
      const secs = Math.floor(audio.currentTime % 60)
      setCurrentTime(`${mins}:${secs.toString().padStart(2, '0')}`)
    }

    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audio.currentTime = percent * audio.duration
  }

  return (
    <div className={cn("flex items-center gap-4 p-4 bg-surface-light dark:bg-surface-dark rounded-xl", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="size-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>

      {/* Info & Progress */}
      <div className="flex-1">
        {title && (
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{title}</p>
        )}
        
        {/* Progress Bar */}
        <div 
          className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
          onClick={seek}
        >
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Time */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{currentTime}</span>
          <span>{duration || '--:--'}</span>
        </div>
      </div>

      {/* Mute Button */}
      <button
        onClick={toggleMute}
        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add src/components/ui/AudioPlayer.tsx
git commit -m "feat(components): add AudioPlayer with progress and controls"
```

---

### Task 4: Create ToolCard Component

**Files:**
- Create: `src/components/cards/ToolCard.tsx`

**Step 1: Create component**
```typescript
// src/components/cards/ToolCard.tsx
import { ExternalLink } from 'lucide-react'
import { SafeImage } from '@/components/ui/SafeImage'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  name: string
  description: string | null
  url: string
  category: string
  pricingModel: 'free' | 'freemium' | 'paid'
  tags: string[]
  logoUrl: string | null
  className?: string
}

const pricingBadgeColors = {
  free: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  freemium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export function ToolCard({
  name,
  description,
  url,
  category,
  pricingModel,
  tags,
  logoUrl,
  className,
}: ToolCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-soft hover:shadow-soft-hover transition-all duration-300 border border-transparent hover:border-primary/20 group",
        className
      )}
    >
      <div className="flex gap-4">
        {/* Logo */}
        <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          {logoUrl ? (
            <SafeImage
              src={logoUrl}
              alt={`${name} logo`}
              width={64}
              height={64}
              className="object-cover"
              fallbackSrc="/placeholders/tool-placeholder.svg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
              {name.charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
              {name}
            </h3>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary shrink-0" />
          </div>
          
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
              {description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {category}
            </span>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full uppercase",
              pricingBadgeColors[pricingModel]
            )}>
              {pricingModel}
            </span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-gray-400">+{tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </a>
  )
}
```

**Step 2: Create tool placeholder SVG**

Create `public/placeholders/tool-placeholder.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#F3F4F6"/>
  <path d="M32 20v24M44 32H20" stroke="#9CA3AF" stroke-width="3" stroke-linecap="round"/>
</svg>
```

**Step 3: Commit**
```bash
git add src/components/cards/ToolCard.tsx public/placeholders/tool-placeholder.svg
git commit -m "feat(components): add ToolCard for tools directory"
```

---

### Task 5: Create DigestCard Component

**Files:**
- Create: `src/components/cards/DigestCard.tsx`

**Step 1: Create component**
```typescript
// src/components/cards/DigestCard.tsx
import { Calendar, Headphones, FileText } from 'lucide-react'
import { AudioPlayer } from '@/components/ui/AudioPlayer'
import { cn } from '@/lib/utils'

interface DigestCardProps {
  digestDate: string
  summaryText: string
  audioUrl: string | null
  audioStatus: 'pending' | 'completed' | 'failed'
  articleCount: number
  className?: string
  expanded?: boolean
}

export function DigestCard({
  digestDate,
  summaryText,
  audioUrl,
  audioStatus,
  articleCount,
  className,
  expanded = false,
}: DigestCardProps) {
  const formattedDate = new Date(digestDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className={cn(
      "bg-surface-light dark:bg-surface-dark rounded-2xl shadow-soft overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              Daily Digest
            </h3>
            <p className="text-sm text-gray-500">{formattedDate}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span>{articleCount} articles</span>
          </div>
          {audioUrl && audioStatus === 'completed' && (
            <div className="flex items-center gap-1.5 text-sm text-primary">
              <Headphones className="w-4 h-4" />
              <span>Audio available</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="p-5">
        <p className={cn(
          "text-gray-600 dark:text-gray-300 leading-relaxed",
          !expanded && "line-clamp-4"
        )}>
          {summaryText}
        </p>
      </div>

      {/* Audio Player (if available) */}
      {audioUrl && audioStatus === 'completed' && (
        <div className="px-5 pb-5">
          <AudioPlayer
            src={audioUrl}
            title="Listen to today's digest"
          />
        </div>
      )}

      {/* Audio Pending State */}
      {audioStatus === 'pending' && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Audio is being generated...</span>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add src/components/cards/DigestCard.tsx
git commit -m "feat(components): add DigestCard with embedded audio player"
```

---

### Task 6: Create SearchInput Component

**Files:**
- Create: `src/components/ui/SearchInput.tsx`

**Step 1: Create component**
```typescript
// src/components/ui/SearchInput.tsx
'use client'

import { Search, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange: (value: string) => void
  debounceMs?: number
  className?: string
}

export function SearchInput({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '')

  // Debounced onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(internalValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [internalValue, debounceMs, onChange])

  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  const handleClear = useCallback(() => {
    setInternalValue('')
    onChange('')
  }, [onChange])

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
      />
      {internalValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add src/components/ui/SearchInput.tsx
git commit -m "feat(components): add SearchInput with debounce"
```

---

### Task 7: Final Verification

**Step 1: Run build to verify all components compile**
```bash
npm run build
```

**Step 2: Run lint**
```bash
npm run lint
```

**Step 3: Push branch**
```bash
git push -u origin feature/phase0-components
```

**Step 4: Update PROJECT_TRACKER.md**
```markdown
### [timestamp] — Agent [ID] — Branch: feature/phase0-components
**Status:** Complete
**Summary:** Created SafeImage, AudioPlayer, ToolCard, DigestCard, SearchInput components. Fixed hydration warning.
**Issues:** None
**Next:** Ready for merge to develop
```

---


## Phase 0.4: Utility Functions

**Branch:** `feature/phase0-utilities`
**Estimated Time:** 2-3 hours
**Prerequisites:** Next.js project initialized

### Overview

**⚠️ IMPORTANT:** `src/lib/utils.ts` with `cn()` already exists on `feature/phase0-components`. Do NOT recreate it. `clsx` and `tailwind-merge` are already installed. Skip Task 1 below.

Utility functions provide shared functionality across the codebase:

| Utility | Purpose | File |
|---------|---------|------|
| `cn` | Tailwind class merging | `src/lib/utils.ts` (**already exists**) |
| `sanitize` | HTML sanitization (XSS protection) | `src/lib/sanitize.ts` |
| `llm` | LLM client with fallback | `src/lib/llm.ts` |
| `auth` | CRON job auth (timing-safe) | `src/lib/auth.ts` |
| Health API | System health endpoint | `src/app/api/health/route.ts` |

---

### Task 1: Class Merge Utility — ~~SKIP~~ (already done)

**Status:** ✅ Already implemented on `feature/phase0-components`
**File:** `src/lib/utils.ts` contains `cn()` function
**Packages:** `clsx` and `tailwind-merge` already in `package.json`

~~**Files:**~~
~~- Create: `src/lib/utils.ts`~~

The code below is already in place — do not recreate:
```typescript
// src/lib/utils.ts — ALREADY EXISTS
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format relative time (e.g., "2h ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return then.toLocaleDateString('en-AU', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Generate a slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
```

**Step 3: Commit**
```bash
git add src/lib/utils.ts package*.json
git commit -m "feat(lib): add utility functions (cn, formatRelativeTime, truncate, slugify)"
```

---

### Task 2: Create HTML Sanitizer

**Files:**
- Create: `src/lib/sanitize.ts`

**Step 1: Install DOMPurify**
```bash
npm install isomorphic-dompurify
```

**Step 2: Create sanitizer**
```typescript
// src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML to prevent XSS attacks
 * Allows only safe tags for content display
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'li', 'ol'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Strip all HTML tags, returning plain text
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize for safe text display (no HTML)
 */
export function sanitizeText(dirty: string): string {
  const stripped = stripHtml(dirty)
  // Also escape any remaining special characters
  return stripped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
```

**Step 3: Commit**
```bash
git add src/lib/sanitize.ts package*.json
git commit -m "feat(lib): add HTML sanitizer for XSS protection"
```

---

### Task 3: Create LLM Client with Fallback

**Files:**
- Create: `src/lib/llm.ts`

**Step 1: Install AI SDKs**
```bash
npm install @google/generative-ai groq-sdk
```

**Step 2: Create LLM client with fallback**
```typescript
// src/lib/llm.ts

interface LLMResponse {
  text: string
  model: string
  tokensUsed?: number
}

interface LLMOptions {
  maxTokens?: number
  temperature?: number
}

/**
 * Attempt Gemini first, fallback to Groq if quota exceeded
 * Returns null on safety block or unrecoverable error
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string,
  options: LLMOptions = {}
): Promise<LLMResponse | null> {
  const { maxTokens = 512, temperature = 0.7 } = options

  // Try Gemini first
  try {
    const result = await callGemini(prompt, systemPrompt, { maxTokens, temperature })
    return result
  } catch (error: any) {
    console.warn('[LLM] Gemini failed:', error.message)
    
    // If quota exceeded, try Groq
    if (error.message?.includes('quota') || error.message?.includes('429')) {
      console.log('[LLM] Falling back to Groq...')
      try {
        const result = await callGroq(prompt, systemPrompt, { maxTokens, temperature })
        return result
      } catch (groqError: any) {
        console.error('[LLM] Groq fallback failed:', groqError.message)
        return null
      }
    }

    // If safety filter, return null
    if (error.message?.includes('safety') || error.message?.includes('blocked')) {
      console.warn('[LLM] Content blocked by safety filter')
      return null
    }

    throw error
  }
}

async function callGemini(
  prompt: string,
  systemPrompt: string | undefined,
  options: LLMOptions
): Promise<LLMResponse> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: options.maxTokens,
      temperature: options.temperature,
    },
  })

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
  const result = await model.generateContent(fullPrompt)
  const response = result.response

  return {
    text: response.text(),
    model: modelName,
  }
}

async function callGroq(
  prompt: string,
  systemPrompt: string | undefined,
  options: LLMOptions
): Promise<LLMResponse> {
  const Groq = (await import('groq-sdk')).default
  
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
  
  const messages: Array<{ role: 'system' | 'user'; content: string }> = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: prompt })

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
    max_tokens: options.maxTokens,
    temperature: options.temperature,
  })

  return {
    text: completion.choices[0]?.message?.content || '',
    model: 'llama-3.1-8b-instant',
    tokensUsed: completion.usage?.total_tokens,
  }
}

/**
 * System prompts for different use cases
 */
export const SYSTEM_PROMPTS = {
  summarize: `You are a concise AI news summarizer. 
Summarize the article in 2-3 sentences, focusing on:
1. The main news/announcement
2. Why it matters to AI professionals
3. Key numbers or facts

Keep it factual, no hype. Write in active voice.`,

  dailyDigest: `You are the editor of an AI news briefing.
Write a 3-paragraph executive summary of today's top AI news:
1. Lead story and why it matters
2. 2-3 other notable developments  
3. Emerging trend or theme

Tone: Professional but accessible. No jargon without explanation.`,
}
```

**Step 3: Commit**
```bash
git add src/lib/llm.ts package*.json
git commit -m "feat(lib): add LLM client with Gemini/Groq fallback"
```

---

### Task 4: Create Health Check API

**Files:**
- Create: `src/app/api/health/route.ts`

**Step 1: Create health endpoint**
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    name: string
    status: 'pass' | 'fail'
    message?: string
    latency_ms?: number
  }[]
}

export async function GET() {
  const startTime = Date.now()
  const checks: HealthCheck['checks'] = []

  // Check environment variables
  const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v])
  
  checks.push({
    name: 'environment',
    status: missingEnvVars.length === 0 ? 'pass' : 'fail',
    message: missingEnvVars.length > 0 
      ? `Missing: ${missingEnvVars.join(', ')}` 
      : 'All required env vars present',
  })

  // Check database connection (if Supabase is configured)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    const dbStart = Date.now()
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      const { error } = await supabaseAdmin.from('articles').select('id').limit(1)
      
      checks.push({
        name: 'database',
        status: error ? 'fail' : 'pass',
        message: error ? error.message : 'Connected to Supabase',
        latency_ms: Date.now() - dbStart,
      })
    } catch (e: any) {
      checks.push({
        name: 'database',
        status: 'fail',
        message: e.message,
        latency_ms: Date.now() - dbStart,
      })
    }
  }

  // Determine overall status
  const failedChecks = checks.filter(c => c.status === 'fail')
  let status: HealthCheck['status'] = 'healthy'
  if (failedChecks.length > 0) {
    status = failedChecks.some(c => c.name === 'database') ? 'unhealthy' : 'degraded'
  }

  const response: HealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.0',
    checks,
  }

  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

  return NextResponse.json(response, { 
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store',
    }
  })
}
```

**Step 2: Commit**
```bash
git add src/app/api/health/route.ts
git commit -m "feat(api): add health check endpoint"
```

---

### Task 5: Create CRON Job Authorization Middleware

**Files:**
- Create: `src/lib/auth.ts`

**Step 1: Create auth helper (uses timing-safe comparison)**
```typescript
// src/lib/auth.ts
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

/**
 * Verify CRON_SECRET for job endpoints
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 * Use in API routes: if (!verifyCronAuth(request)) return unauthorized()
 */
export function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    console.error('[Auth] CRON_SECRET not configured')
    return false
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.slice(7)

  // Use timing-safe comparison to prevent timing attacks
  const tokenBuf = Buffer.from(token)
  const secretBuf = Buffer.from(expectedSecret)
  if (tokenBuf.length !== secretBuf.length) return false
  return timingSafeEqual(tokenBuf, secretBuf)
}

/**
 * Standard unauthorized response for job endpoints
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized', message: 'Invalid or missing Bearer token' },
    { status: 401 }
  )
}

/**
 * Standard error response
 */
export function errorResponse(message: string, status = 500): NextResponse {
  return NextResponse.json(
    { error: 'Error', message },
    { status }
  )
}

/**
 * Standard success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}
```

**Step 2: Commit**
```bash
git add src/lib/auth.ts
git commit -m "feat(lib): add CRON job authorization helper"
```

---

### Task 6: Final Verification

**Step 1: Run build to verify all utilities compile**
```bash
npm run build
```

**Step 2: Test health endpoint**
```bash
curl http://localhost:3000/api/health | jq
```

Expected output (before database setup):
```json
{
  "status": "degraded",
  "timestamp": "...",
  "version": "0.0.0",
  "checks": [
    { "name": "environment", "status": "fail", "message": "Missing: ..." }
  ]
}
```

**Step 3: Push branch**
```bash
git push -u origin feature/phase0-utilities
```

**Step 4: Update PROJECT_TRACKER.md**
```markdown
### [timestamp] — Agent [ID] — Branch: feature/phase0-utilities
**Status:** Complete
**Summary:** Created cn utility, sanitizeHtml, LLM client with fallback, health API, and CRON auth middleware.
**Issues:** None
**Next:** Ready for merge to develop
```

---

# Phase 1: News Fetching & Display

**Branch:** `feature/phase1-news`
**Estimated Time:** 6-8 hours
**Prerequisites:** Phase 0 complete, Supabase project created, `.env.local` configured

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| RSS library | `rss-parser` | Most popular, TypeScript types, RSS 2.0 + Atom |
| API source | GNews (free tier) | 100 req/day, good coverage, simple API |
| Pagination | Cursor-based (`published_at`) | Industry standard for feeds, no duplicates on insert |
| Env var naming | 2025+ (`PUBLISHABLE_KEY` / `SECRET_KEY`) | Forward-compatible with Supabase |
| Homepage | Leave for Phase 2 | Needs daily digest data |
| Slug strategy | Stored column, generated on insert | Indexed for fast lookups, SEO-friendly |

## Phase 1.1: News Fetching Pipeline

**Branch:** `feature/phase1-news`
**Prerequisites:** Phase 0 complete

### Overview

Build the automated news ingestion pipeline. GitHub Actions triggers `POST /api/jobs/fetch-news` every 6 hours. The endpoint queries the `sources` table, fetches from each active source (RSS or GNews API), sanitises content, deduplicates by URL, and inserts articles with `summary_status = 'pending'`.

### Dependencies to install

```bash
npm install rss-parser
```

### Database migration

**File:** `supabase/migrations/005_add_slug_and_seed_sources.sql`

Changes:
1. Add `slug TEXT UNIQUE` column to `articles` table
2. Add B-tree index on `slug`
3. Seed initial sources into `sources` table (3 RSS + 1 GNews API)

**User action:** Run this SQL in Supabase SQL Editor after code is committed.

### Env var changes

**Files to update:** `.env.example`, `src/app/api/health/route.ts`

Reconcile all env vars to 2025+ Supabase naming:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_KEY` → `SUPABASE_SECRET_KEY`
- Add `GNEWS_API_KEY=your-gnews-api-key-here`

### Files to create

| File | Purpose |
|------|---------|
| `supabase/migrations/005_add_slug_and_seed_sources.sql` | Slug column + source seeds |
| `src/lib/fetchers/rss-fetcher.ts` | Parse RSS feeds, return normalised articles |
| `src/lib/fetchers/gnews-fetcher.ts` | GNews API client, return normalised articles |
| `src/app/api/jobs/fetch-news/route.ts` | POST endpoint: auth, fetch all sources, deduplicate, insert |
| `src/lib/__tests__/rss-fetcher.test.ts` | Unit tests with mocked XML |
| `src/lib/__tests__/gnews-fetcher.test.ts` | Unit tests with mocked API responses |

### Files to modify

| File | Change |
|------|--------|
| `.env.example` | Add `GNEWS_API_KEY`, fix Supabase key names |
| `src/app/api/health/route.ts` | Fix env var name to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

### Architecture

```
GitHub Actions (every 6h)
  │
  ▼
POST /api/jobs/fetch-news
  │
  ├── verifyCronAuth(request)
  │
  ├── SELECT * FROM sources WHERE is_active = TRUE
  │
  ├── For each source:
  │   ├── type = 'rss' → rssFetcher(config.url)
  │   └── type = 'api' → gnewsFetcher(config)
  │
  ├── Sanitise all fields (sanitizeText)
  ├── Generate slug from title (slugify)
  │
  ├── INSERT INTO articles ... ON CONFLICT (url) DO NOTHING
  │   (deduplication via UNIQUE constraint)
  │
  └── Return { inserted, skipped, errors }
```

### Normalised article shape (internal)

```typescript
interface FetchedArticle {
  title: string;
  url: string;
  source: string;
  published_at: string | null;
  thumbnail_url: string | null;
  raw_excerpt: string | null;
  slug: string;
}
```

### GNews API budget

- Free tier: 100 requests/day
- Fetch frequency: 4 cycles/day (every 6 hours)
- Requests per cycle: 1 (search endpoint, max 10 results)
- Daily usage: **4 requests/day** (4% of limit)
- Endpoint: `GET https://gnews.io/api/v4/search?q=artificial+intelligence&lang=en&max=10&token=KEY`

### RSS feed sources (seeded)

| Source | Feed URL | Notes |
|--------|----------|-------|
| TechCrunch AI | `https://techcrunch.com/category/artificial-intelligence/feed/` | No thumbnails in feed |
| The Verge AI | `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml` | Atom format |
| Ars Technica | `https://feeds.arstechnica.com/arstechnica/technology-lab` | General tech, includes AI |

### Error handling

- RSS feed unreachable → log error, update `sources.last_error`, continue to next source
- GNews API error/rate limit → log error, continue
- DB insert conflict (duplicate URL) → skip silently (expected behaviour)
- Any source failure does NOT block other sources

### Commits (atomic)

1. `fix: reconcile env vars to 2025+ Supabase naming`
2. `feat(db): add slug column and seed news sources`
3. `feat(lib): add RSS feed fetcher`
4. `feat(lib): add GNews API fetcher`
5. `feat(api): add fetch-news job endpoint`
6. `test(lib): add tests for RSS and GNews fetchers`

---

## Phase 1.2: News Display Pages

**Branch:** `feature/phase1-news` (continues from 1.1)
**Prerequisites:** Phase 1.1 complete

### Overview

Build the public-facing news pages: `/news` (feed listing with search and filter), `/news/[slug]` (article detail), and the `/api/news` search endpoint. Update existing components to use Phase 0 utilities properly.

### Files to create

| File | Purpose |
|------|---------|
| `src/app/news/page.tsx` | News feed: article list, search, filter, cursor pagination |
| `src/app/news/[slug]/page.tsx` | Article detail: full content, link to original, related articles |
| `src/app/api/news/route.ts` | GET: search/filter/paginate articles |

### Files to modify

| File | Change |
|------|--------|
| `src/components/cards/NewsCard.tsx` | Use SafeImage instead of raw `<img>`, import `formatRelativeTime` from `formatters.ts` |

### API endpoint: `GET /api/news`

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Full-text search query |
| `source` | string | — | Filter by source name |
| `cursor` | ISO string | — | Articles before this `published_at` value |
| `limit` | number | 20 | Results per page (max 50) |

**Response:**

```json
{
  "articles": [...],
  "nextCursor": "2026-02-08T10:00:00Z" | null
}
```

**Cursor pagination flow:**
1. First request: `GET /api/news?limit=20` → returns articles + `nextCursor`
2. Next page: `GET /api/news?limit=20&cursor=2026-02-08T10:00:00Z`
3. When `nextCursor` is `null`, no more pages

**Full-text search:**
```typescript
// Supabase textSearch on tsvector column
query.textSearch('search_vector', searchQuery, { type: 'websearch' })
```

**Cache:** `Cache-Control: s-maxage=300` (5 minutes)

### Page: `/news`

- Server component that fetches initial 20 articles
- Client-side search/filter bar updates via API calls
- FilterBar with source tabs (populated from distinct sources in data)
- SearchInput with debounce → `/api/news?q=...`
- "Load more" button for cursor pagination
- Cache: `s-maxage=3600`

### Page: `/news/[slug]`

- Server component, fetches article by slug
- Full article display: title, source, date, thumbnail (SafeImage), excerpt/summary
- "Read Original Article" link → external URL
- "Related Articles" section: 3 articles from same source
- 404 if slug not found
- Cache: `s-maxage=3600`

### NewsCard improvements

- Replace raw `<img>` (line 66) with SafeImage component
- Delete local `formatRelativeTime` function (lines 22-38), import from `@/lib/formatters`
- Delete local `SummaryStatus` type, import from `@/lib/constants`

### Commits (atomic)

7. `refactor(NewsCard): use SafeImage and shared formatters`
8. `feat(api): add news search and filter endpoint`
9. `feat(pages): add news feed page with search and pagination`
10. `feat(pages): add article detail page`

---

# Phase 2: AI Summaries — ✅ Complete

## Phase 2.1: LLM Summarisation — ✅ Complete
## Phase 2.2: Daily Digest — ✅ Complete

---

# Phase 3: Homepage, Tools & Tests — ✅ Complete

---

# Phase 4: Polish & Launch — ✅ Complete

---

# Phase 5: LLM Focus Pivot & Summary Enhancement

**Branch:** `feature/phase5-llm-pivot`
**Estimated Time:** 8-12 hours
**Prerequisites:** Phase 4 complete (all merged to main)

## Context & Motivation

The app currently fetches **all** AI/tech news indiscriminately. The daily briefing is a
wall of narrative paragraphs — boring to scan, not actionable. The audio summary reads
like a Wikipedia article.

Phase 5 makes two major shifts:
1. **News filtering** — Narrow to LLM, Models & Agents. Classify articles during summarisation and skip off-topic content.
2. **Summary enhancement** — Transform from passive reporting to actionable developer cheat sheets with structured sections and a conversational podcast-style audio briefing.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Filtering approach | Classify + filter at summarise time | Single LLM call, no extra API cost |
| Summary storage | `ai_summary` (text) + `ai_metadata` (JSONB) | Backwards-compatible, structured data queryable |
| Category values | `llm`, `agents`, `models`, `research`, `tools`, `other` | Covers the focus area + escape hatch |
| Relevance threshold | Score < 5 out of 10 → skip (configurable via env) | Balanced filtering, configurable via RELEVANCE_THRESHOLD env var |
| Digest format | Sectioned markdown (not Mermaid/images) | Zero new dependencies, SEO-friendly, accessible |
| Audio approach | Separate podcast script prompt + Standard-D voice | Conversational style via prompt, free tier TTS keeps cost near $0 |
| Low-volume days | Expand lookback to 48h, then skip | Better no digest than a padded one |

---

## Phase 5.1: Schema — Category & Metadata Columns

**File:** `supabase/migrations/009_add_category_and_metadata.sql`

### Step 1: Write migration

```sql
-- Migration 009: Add category and ai_metadata columns to articles
-- Supports LLM-focus filtering and structured summary data

ALTER TABLE articles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);

-- Add constraint for allowed values (loose — allows NULL for unclassified)
ALTER TABLE articles ADD CONSTRAINT articles_category_check
  CHECK (category IS NULL OR category IN ('llm', 'agents', 'models', 'research', 'tools', 'other'));

COMMENT ON COLUMN articles.category IS 'Article classification: llm, agents, models, research, tools, other';
COMMENT ON COLUMN articles.ai_metadata IS 'Structured extraction data from LLM (tech_stack, relevance_score, etc.)';
```

### Step 2: Update TypeScript interface

**File:** `src/lib/supabase.ts`

Add to `Article` interface:
```typescript
category: string | null;
ai_metadata: Record<string, unknown> | null;
```

### Step 3: Add ARTICLE_CATEGORY constant

**File:** `src/lib/constants.ts`

```typescript
export const ARTICLE_CATEGORY = {
  LLM: 'llm',
  AGENTS: 'agents',
  MODELS: 'models',
  RESEARCH: 'research',
  TOOLS: 'tools',
  OTHER: 'other',
} as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORY)[keyof typeof ARTICLE_CATEGORY];

// Categories considered "on-topic" for the LLM-focused site
export const ON_TOPIC_CATEGORIES: ArticleCategory[] = ['llm', 'agents', 'models', 'research'];

// Minimum relevance score (1-10) to keep an article — configurable via env var
export const RELEVANCE_THRESHOLD = parseInt(process.env.RELEVANCE_THRESHOLD || '5', 10);
```

### Step 4: Commit
```bash
git add supabase/migrations/009_add_category_and_metadata.sql src/lib/supabase.ts src/lib/constants.ts
git commit -m "feat(db): add category and ai_metadata columns to articles"
```

---

## Phase 5.2: Prompt Overhaul

**File:** `src/lib/prompts.ts`

### Step 1: Update ARTICLE_SUMMARY_PROMPT

Replace the current simple prompt with one that requests JSON output:

```typescript
export const ARTICLE_SUMMARY_PROMPT = `You are a Senior AI Engineer classifying and summarising news articles for a developer-focused AI news site.

Instructions:
1. Classify the article into one category: llm, agents, models, research, tools, other
2. Rate relevance to LLM/AI practitioners on a 1-10 scale (10 = directly about new LLM/agent/model releases)
3. Extract a structured summary

Respond with ONLY valid JSON in this exact format:
{
  "classification": "llm|agents|models|research|tools|other",
  "relevance_score": 1-10,
  "tldr": "One sentence of impact",
  "key_points": ["Point 1", "Point 2"],
  "tech_stack": ["Library or API mentioned, if any"],
  "why_it_matters": "One line of practical impact for developers"
}

Rules:
- classification must be exactly one of: llm, agents, models, research, tools, other
- relevance_score must be an integer 1-10
- key_points should have 2-3 items
- tech_stack can be empty array if no specific tech mentioned
- Be concise and factual, no hype`;
```

### Step 2: Update DAILY_DIGEST_PROMPT

Replace narrative style with sectioned format:

```typescript
export const DAILY_DIGEST_PROMPT = `You are the editor of a developer-focused AI briefing called "Today in AI".

Write a structured daily briefing using EXACTLY these sections with markdown headers:

## The Big Picture
2-3 sentences summarising the day's overarching theme or most important development.

## Key Releases
- Bullet list of model launches, tool updates, or major announcements
- Each bullet: **Name** — what it does and why it matters
- 3-6 items

## Worth Watching
- Bullet list of emerging trends, research papers, or early-stage developments
- 2-4 items

## Developer Takeaway
One actionable insight or recommendation based on today's news. What should a developer do differently after reading this?

Rules:
- Use bullet points (not numbered lists) in Key Releases and Worth Watching
- Bold the name/title of each item
- Keep total length 300-500 words
- Be specific with numbers, model names, and benchmarks when available
- Output ONLY the markdown sections, no preamble`;
```

### Step 3: Add AUDIO_SCRIPT_PROMPT (new)

```typescript
export const AUDIO_SCRIPT_PROMPT = `You are a podcast host for a 2-minute daily AI briefing called "Today in AI".

Convert the following written briefing into a natural, conversational audio script.

Rules:
- Write as if speaking to a friend who's a developer
- Start with "Good morning!" or a similar greeting
- Use casual transitions: "Now here's the interesting part...", "Speaking of which...", "And finally..."
- Pronounce acronyms naturally (say "GPT" not "G-P-T", say "llama" not "L-L-A-M-A")
- Replace markdown formatting with spoken equivalents (no bullet points, no headers)
- End with a brief sign-off like "That's your AI briefing for today. Have a great one!"
- Keep the same information but make it flow as natural speech
- 300-450 words
- Output ONLY the script text, no stage directions`;
```

### Step 4: Add buildAudioScriptInput helper

```typescript
export function buildAudioScriptInput(digestText: string): string {
    return `Written briefing to convert to podcast script:\n\n${digestText}`;
}
```

### Step 5: Update buildDailyDigestInput to include category

```typescript
export function buildDailyDigestInput(
    articles: Array<{ title: string; ai_summary: string | null; source: string | null; category: string | null }>
): string {
    const stories = articles
        .map((a, i) => {
            const summary = a.ai_summary || '(no summary available)';
            const cat = a.category ? `[${a.category.toUpperCase()}]` : '';
            return `${i + 1}. ${cat} [${a.source || 'Unknown'}] ${a.title}\n   ${summary}`;
        })
        .join('\n\n');

    return `Today's top AI news stories:\n\n${stories}`;
}
```

### Step 6: Commit
```bash
git add src/lib/prompts.ts
git commit -m "feat(prompts): structured article summaries, sectioned digest, podcast audio script"
```

---

## Phase 5.3: Summariser — Classify, Filter & Store

**File:** `src/lib/summariser.ts`

### Step 1: Add JSON response parser

```typescript
interface ArticleLLMResponse {
    classification: string;
    relevance_score: number;
    tldr: string;
    key_points: string[];
    tech_stack: string[];
    why_it_matters: string;
}

function parseLLMResponse(text: string): ArticleLLMResponse | null {
    try {
        // Strip markdown code fences if present
        const cleaned = text.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
        const parsed = JSON.parse(cleaned);

        // Validate required fields
        if (!parsed.classification || typeof parsed.relevance_score !== 'number') {
            return null;
        }
        return parsed as ArticleLLMResponse;
    } catch {
        return null;
    }
}
```

### Step 2: Format parsed response into readable markdown

```typescript
function formatSummaryMarkdown(parsed: ArticleLLMResponse): string {
    const lines: string[] = [];
    lines.push(parsed.tldr);
    lines.push('');
    if (parsed.key_points.length > 0) {
        parsed.key_points.forEach(point => lines.push(`- ${point}`));
        lines.push('');
    }
    if (parsed.why_it_matters) {
        lines.push(`**Why it matters:** ${parsed.why_it_matters}`);
    }
    return lines.join('\n');
}
```

### Step 3: Update summariseArticle to parse and store metadata

Update the `summariseArticle` function:
- Call LLM as before
- Parse JSON response
- If parsed successfully: store `category`, `ai_metadata`, and formatted `ai_summary`
- If relevance_score < RELEVANCE_THRESHOLD: set `summary_status = 'skipped'`
- If JSON parse fails: fall back to storing raw text in `ai_summary` with `category = null`

### Step 4: Update database write

```typescript
const updateData: Record<string, unknown> = {
    summary_status: result.status,
};

if (result.summary) updateData.ai_summary = result.summary;
if (result.category) updateData.category = result.category;
if (result.metadata) updateData.ai_metadata = result.metadata;
```

### Step 5: Commit
```bash
git add src/lib/summariser.ts
git commit -m "feat(summariser): classify articles by category and filter by relevance"
```

---

## Phase 5.4: Digest Generator — Sectioned Format

**File:** `src/lib/digest-generator.ts`

### Step 1: Filter articles by on-topic categories

```typescript
import { ON_TOPIC_CATEGORIES } from './constants';

// Replace current article query with category filter
const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('id, title, ai_summary, source, published_at, category')
    .eq('summary_status', 'completed')
    .in('category', ON_TOPIC_CATEGORIES)
    .or(`published_at.gte.${yesterday},and(published_at.is.null,fetched_at.gte.${yesterday})`)
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(10);
```

### Step 2: Add low-volume day handling

```typescript
// If fewer than 3 articles in 24h, expand lookback to 48h
if (!articles || articles.length < 3) {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: expandedArticles } = await supabase
        .from('articles')
        .select('id, title, ai_summary, source, published_at, category')
        .eq('summary_status', 'completed')
        .in('category', ON_TOPIC_CATEGORIES)
        .or(`published_at.gte.${twoDaysAgo},and(published_at.is.null,fetched_at.gte.${twoDaysAgo})`)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(10);

    if (!expandedArticles || expandedArticles.length < 3) {
        // Skip digest for today — not enough content
        return { digestId: null, summaryText: null, audioUrl: null, articleCount: 0, skipped: true };
    }
    articles = expandedArticles;
}
```

### Step 3: Update buildDailyDigestInput call

Pass `category` field through to the prompt helper.

### Step 4: Commit
```bash
git add src/lib/digest-generator.ts
git commit -m "feat(digest): category-filtered digest with low-volume day handling"
```

---

## Phase 5.5: TTS Enhancement

**Files:** `src/lib/tts-client.ts`, `src/lib/digest-generator.ts`

### Step 1: Add podcast script generation to digest pipeline

In `digest-generator.ts`, after generating the sectioned digest:

```typescript
import { AUDIO_SCRIPT_PROMPT, buildAudioScriptInput } from './prompts';

// Generate conversational podcast script for TTS (separate from written digest)
const audioScriptInput = buildAudioScriptInput(summaryText);
const audioScriptResponse = await generateText(AUDIO_SCRIPT_PROMPT, audioScriptInput);
const audioScript = audioScriptResponse.text;

// Use audioScript (not summaryText) for TTS
const { audioBuffer, contentType } = await generateSpeech(audioScript);
```

### Step 2: TTS Voice (Cost-Optimized)

Keep the free-tier Standard-D voice instead of upgrading to Journey:

```typescript
voice: {
    languageCode: 'en-US',
    name: 'en-US-Standard-D',  // Keep free tier voice
    ssmlGender: 'MALE',
},
```

Rationale: Journey voice costs ~$2/month. Standard-D is adequate for news briefings and keeps monthly cost under $1.

### Step 3: Commit
```bash
git add src/lib/tts-client.ts src/lib/digest-generator.ts
git commit -m "feat(tts): podcast-style audio script with Standard voice"
```

---

## Phase 5.6: Homepage UI — Structured Digest

**File:** `src/app/page.tsx`

### Step 1: Create section parser

```typescript
interface DigestSection {
    title: string;
    icon: string; // lucide icon name
    content: string; // markdown content for this section
}

function parseDigestSections(text: string): DigestSection[] | null {
    const sections: DigestSection[] = [];
    const sectionMap: Record<string, string> = {
        'The Big Picture': 'zap',
        'Key Releases': 'rocket',
        'Worth Watching': 'eye',
        'Developer Takeaway': 'lightbulb',
    };

    const parts = text.split(/^## /m).filter(Boolean);
    for (const part of parts) {
        const [titleLine, ...rest] = part.split('\n');
        const title = titleLine.trim();
        const icon = sectionMap[title] || 'file-text';
        sections.push({ title, icon, content: rest.join('\n').trim() });
    }

    return sections.length > 0 ? sections : null;
}
```

### Step 2: Render sections with icons

Replace the current paragraph-rendering block with:
- If `parseDigestSections()` returns sections → render with icons, headers, styled bullets
- If returns null (old plain-text digest) → fall back to current paragraph rendering

### Step 3: Style bullet points

```jsx
{section.content.split('\n').filter(Boolean).map((line, i) => {
    if (line.startsWith('- ')) {
        return (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: renderMarkdownInline(line.slice(2)) }} />
            </li>
        );
    }
    return <p key={i} className="text-sm text-gray-600 dark:text-gray-300">{line}</p>;
})}
```

Note: `renderMarkdownInline` handles bold (`**text**` → `<strong>text</strong>`) only.
No external markdown library needed — simple regex replacement for bold text.

### Step 4: Commit
```bash
git add src/app/page.tsx
git commit -m "feat(home): render structured digest sections with icons"
```

---

## Phase 5.7: News Feed UI — Category Filter

### Step 1: Update API

**File:** `src/app/api/news/route.ts`

Add `category` query param handling:
```typescript
const category = searchParams.get('category')?.trim() || '';

if (category) {
    query = query.eq('category', category);
}
```

Also add `category` to the select columns list.

### Step 2: Update server component

**File:** `src/app/news/page.tsx`

Add `getCategories()` function:
```typescript
async function getCategories(): Promise<string[]> {
    const { data } = await supabase
        .from('articles')
        .select('category')
        .not('category', 'is', null)
        .order('category');

    if (!data) return [];
    return [...new Set(data.map(d => d.category).filter(Boolean))];
}
```

Pass `categories` prop to `NewsFeed`.

### Step 3: Update client component

**File:** `src/app/news/news-feed.tsx`

- Add `categories` to props interface
- Add `selectedCategory` state
- Add second `FilterBar` for categories (All / LLM / Agents / Models / Research)
- Pass `category` param to `fetchArticles()`

### Step 4: Update article detail page

**File:** `src/app/news/[slug]/page.tsx`

Show category badge:
```jsx
{article.category && (
    <Badge variant="primary">{article.category.toUpperCase()}</Badge>
)}
```

### Step 5: Commit
```bash
git add src/app/api/news/route.ts src/app/news/page.tsx src/app/news/news-feed.tsx src/app/news/[slug]/page.tsx
git commit -m "feat(news): add category filter to news feed and API"
```

---

## Phase 5.8: Update Tests

### Step 1: Update prompts tests

**File:** `src/lib/__tests__/prompts.test.ts`

- Test `buildDailyDigestInput` includes `[LLM]` category prefix
- Test new `buildAudioScriptInput` formats correctly

### Step 2: Update summariser tests

**File:** `src/lib/__tests__/summariser.test.ts`

New test cases:
- `parseLLMResponse` handles valid JSON
- `parseLLMResponse` handles markdown code fences
- `parseLLMResponse` returns null on invalid JSON
- Relevance score < 4 → article skipped
- Category stored in database update
- `ai_metadata` stored in database update
- JSON parse failure → falls back to raw text in ai_summary

### Step 3: Update digest tests

**File:** `src/lib/__tests__/digest-generator.test.ts`

New test cases:
- Article query includes `.in('category', ON_TOPIC_CATEGORIES)` filter
- Low volume (< 3 articles in 24h) → expands lookback to 48h
- Ultra-low volume (< 3 articles in 48h) → returns skipped result
- Audio script LLM call made with AUDIO_SCRIPT_PROMPT

### Step 4: Commit
```bash
git add src/lib/__tests__/prompts.test.ts src/lib/__tests__/summariser.test.ts src/lib/__tests__/digest-generator.test.ts
git commit -m "test: update tests for category filtering and structured summaries"
```

---

## Phase 5 Commit Summary (8 atomic commits)

| # | Message | Files |
|---|---------|-------|
| 1 | `feat(db): add category and ai_metadata columns to articles` | migration 009, supabase.ts, constants.ts |
| 2 | `feat(prompts): structured article summaries, sectioned digest, podcast audio script` | prompts.ts |
| 3 | `feat(summariser): classify articles by category and filter by relevance` | summariser.ts |
| 4 | `feat(digest): category-filtered digest with low-volume day handling` | digest-generator.ts |
| 5 | `feat(tts): podcast-style audio script with Standard voice` | tts-client.ts, digest-generator.ts |
| 6 | `feat(home): render structured digest sections with icons` | page.tsx |
| 7 | `feat(news): add category filter to news feed and API` | api/news/route.ts, news pages |
| 8 | `test: update tests for category filtering and structured summaries` | 3 test files |

## Phase 5 Verification

After implementation:
- `npm run build` — passes with no errors
- `npm run lint` — 0 errors
- `npm test` — all tests pass (91 existing + ~10-15 new ≈ 100-106 total)
- Homepage renders sectioned digest (or falls back for old digests)
- `/news` page has category filter bar
- `/news/[slug]` shows category badge
- Article summaries include category classification
- Low-relevance articles are skipped during summarisation
- Audio uses podcast-style script with Standard-D voice (free tier)
- Existing articles with `category = NULL` still display correctly

### User action required after merge:
- Run migration `009_add_category_and_metadata.sql` in Supabase SQL Editor
- Manually trigger summarise CRON to re-classify existing articles (optional)
- Standard-D voice is used (free tier, no additional setup needed)

---

---

# Phase 6: AI Workflows Feature — ✅ Complete

**Branch:** `main` (direct)
**Completed:** 2026-02-11
**Prerequisites:** Phase 4 complete

## What Was Built

### 1. Database — `workflows` table (Migration 010)
- UUID primary key, slug (unique), title, description, cost_category, difficulty, estimated_minutes
- `steps` JSONB array: `{ order, toolSlug, label, description, isOptional }`
- Indexes on `is_active` and `cost_category`
- RLS: public read, service_role write

### 2. Seed Script — `scripts/seed-workflows.ts`
- 6 curated workflows seeded via Gemini API (with hand-written fallbacks)
- Uses existing `generateText()` from `llm-client.ts`
- Upsert pattern: updates existing rows, inserts new ones

### 3. API Routes
- `GET /api/workflows?cost_category=free|paid` — cached 1 hour
- `POST /api/workflows/suggest` — AI workflow generation with rate limiting (10/min/IP)
- `GET /api/admin/usage` — Gemini usage stats (protected by CRON_SECRET)

### 4. Components
- `WorkflowShowcase` — client component with Free/Paid/Random toggles + AI Suggest mode
- `WorkflowPipeline` — horizontal step visualization with tool logos and arrow connectors
- `WorkflowCard` — compact card for listing pages with tool logo row and badges

### 5. Pages
- `/tools` — WorkflowShowcase inserted between heading and ToolsFeed
- `/tools/workflows` — all workflows grid (static, 1h revalidate)
- `/tools/workflows/[slug]` — workflow detail with vertical stepper timeline
- `/tools/[slug]` — "Used in Workflows" section added (JSONB containment query)

### 6. Gemini Usage Monitor
- `src/lib/llm-usage.ts` — in-memory daily counter (limit 230, resets at midnight UTC)
- Integrated into `llm-client.ts` — proactive Groq routing when nearing 250 RPD limit
- Warns at 80% usage in structured logs

### Files Summary

| File | Status |
|------|--------|
| `supabase/migrations/010_workflows_table.sql` | NEW |
| `scripts/seed-workflows.ts` | NEW |
| `src/lib/llm-usage.ts` | NEW |
| `src/app/api/workflows/route.ts` | NEW |
| `src/app/api/workflows/suggest/route.ts` | NEW |
| `src/app/api/admin/usage/route.ts` | NEW |
| `src/components/workflows/WorkflowShowcase.tsx` | NEW |
| `src/components/workflows/WorkflowPipeline.tsx` | NEW |
| `src/components/cards/WorkflowCard.tsx` | NEW |
| `src/app/tools/workflows/page.tsx` | NEW |
| `src/app/tools/workflows/[slug]/page.tsx` | NEW |
| `src/app/tools/workflows/loading.tsx` | NEW |
| `src/lib/supabase.ts` | MODIFIED — WorkflowStep, Workflow types |
| `src/lib/llm-client.ts` | MODIFIED — usage monitor integration |
| `src/app/tools/page.tsx` | MODIFIED — WorkflowShowcase section |
| `src/app/tools/[slug]/page.tsx` | MODIFIED — "Used in Workflows" section |

### Verification
- `npx tsc --noEmit` — no errors
- `npm test` — 99/99 tests pass
- `npm run build` — successful, all routes registered

---

*This document is updated as phases complete. Each agent reads only their assigned section.*
