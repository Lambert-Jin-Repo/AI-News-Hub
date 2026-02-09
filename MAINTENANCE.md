# AI News Hub — Maintenance Guide

## Quick Start (New Computer)

```bash
# Clone
git clone https://github.com/Lambert-Jin-Repo/AI-News-Hub.git
cd AI-News-Hub

# Install
npm install

# Setup local env
cp .env.example .env.local
# Edit .env.local with your keys

# Run
npm run dev
```

---

## Deploy Changes

```bash
git add -A
git commit -m "feat: your change"
git push origin main
# GitHub Actions auto-deploys to Cloud Run
```

---

## Automated Jobs (No Action Needed)

| Job | Schedule (UTC) | Endpoint |
|-----|----------------|----------|
| Fetch news | 00:00, 12:00 | `/api/jobs/fetch-news` |
| Summarise | 00:30, 12:30 | `/api/jobs/summarise` |
| Daily digest | 00:00 | `/api/jobs/daily-digest` |

---

## Manual Job Triggers

```bash
# Replace YOUR_URL and YOUR_SECRET
curl -X POST -H "x-cron-secret: YOUR_SECRET" https://YOUR_URL/api/jobs/fetch-news
curl -X POST -H "x-cron-secret: YOUR_SECRET" https://YOUR_URL/api/jobs/summarise
curl -X POST -H "x-cron-secret: YOUR_SECRET" https://YOUR_URL/api/jobs/daily-digest
```

Or: **GitHub → Actions → Scheduled Jobs → Run workflow**

---

## Common Tasks

| Task | Location |
|------|----------|
| Add RSS source | Supabase → `sources` table |
| Add AI tool | Supabase → `tools` table |
| View logs | GCP Console → Cloud Run → Logs |
| Run migration | Supabase → SQL Editor |
| Force rebuild | `git commit --allow-empty -m "rebuild" && git push` |

---

## GitHub Secrets (Pre-configured)

- `GCP_SA_KEY` — Service account JSON
- `GCP_PROJECT_ID` — GCP project ID
- `CRON_SECRET` — Endpoint auth

---

## Local Development Keys

Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
CRON_SECRET=dev-secret-change-in-production
GEMINI_API_KEY=your-key
```

---

## Links

- **Live Site**: [Cloud Run URL]
- **GitHub**: https://github.com/Lambert-Jin-Repo/AI-News-Hub
- **Supabase**: https://supabase.com/dashboard
- **GCP Console**: https://console.cloud.google.com
