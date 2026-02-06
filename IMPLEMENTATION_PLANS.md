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
**Current Status:** 🔄 Partial — Landing page done, missing reusable components

### What's Already Done ✅

The following have been implemented on the landing page:
- `Header.tsx` — Navigation with logo
- `Footer.tsx` — Footer links
- `NewsCard.tsx` — Basic news card (needs props refinement)
- `globals.css` — Design system with Tailwind theme

### What's Still Needed ⏳

| Component | Purpose | Priority |
|-----------|---------|----------|
| `SafeImage` | Image with fallback on error | High |
| `AudioPlayer` | HTML5 audio with controls | High |
| `ToolCard` | Card for /tools directory | Medium |
| `DigestCard` | Card for daily digest archives | Medium |
| `SearchInput` | Debounced search field | Medium |
| `FilterBar` | Category/source filters | Low |
| `Badge` | Tag/category badges | Low |

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

Utility functions provide shared functionality across the codebase:

| Utility | Purpose | File |
|---------|---------|------|
| `cn` | Tailwind class merging | `src/lib/utils.ts` |
| `sanitize` | HTML sanitization (XSS protection) | `src/lib/sanitize.ts` |
| `llm` | LLM client with fallback | `src/lib/llm.ts` |
| Health API | System health endpoint | `src/app/api/health/route.ts` |

---

### Task 1: Create Class Merge Utility

**Files:**
- Create: `src/lib/utils.ts`

**Step 1: Install dependencies**
```bash
npm install clsx tailwind-merge
```

**Step 2: Create utility**
```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with proper precedence
 * Handles conflicts like 'p-4' vs 'p-2' 
 */
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
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
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
    model: 'gemini-1.5-flash',
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

**Step 1: Create auth helper**
```typescript
// src/lib/auth.ts
import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify CRON_SECRET for job endpoints
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
  return token === expectedSecret
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
