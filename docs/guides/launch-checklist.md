# AI News Hub — Launch Checklist

> **Version:** 1.0  
> **Last Updated:** 2026-02-09

This checklist ensures all systems are ready for production launch.

---

## Pre-Launch Verification

### Environment Configuration

| Check | Status | Notes |
|-------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` set in production | [ ] | Vercel/Cloud Run environment |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set | [ ] | Public client key |
| `SUPABASE_SECRET_KEY` set | [ ] | Service role key (server-side only) |
| `CRON_SECRET` configured (unique for prod) | [ ] | Different from development |
| `GEMINI_API_KEY` configured | [ ] | Check quota limits |
| `NEXT_PUBLIC_BASE_URL` set | [ ] | e.g., https://ainewshub.dev |

### Supabase Configuration

| Check | Status | Notes |
|-------|--------|-------|
| All migrations applied (001-008) | [ ] | Run in SQL Editor |
| RLS policies verified | [ ] | Anon can read, service_role can write |
| Storage bucket `digests` created | [ ] | For audio files |
| Storage bucket RLS configured | [ ] | Public read for audio |

### GitHub Configuration

| Check | Status | Notes |
|-------|--------|-------|
| `CRON_SECRET` secret added | [ ] | Actions → Secrets |
| `NEXT_PUBLIC_SUPABASE_URL` secret added | [ ] | For scheduled jobs |
| `SUPABASE_SECRET_KEY` secret added | [ ] | For cleanup/link check |
| `CLOUD_RUN_URL` secret added | [ ] | Production URL |

### Cloud Run / Hosting

| Check | Status | Notes |
|-------|--------|-------|
| Docker image builds successfully | [ ] | `docker build .` |
| Cloud Run service deployed | [ ] | Check health endpoint |
| Custom domain configured | [ ] | DNS settings |
| SSL certificate valid | [ ] | HTTPS working |
| Cloud Run min instances = 0 | [ ] | Cost optimization |
| Cloud Run max instances = 3 | [ ] | Prevent runaway costs |

---

## Functional Verification

### Core Features

| Check | Status | Notes |
|-------|--------|-------|
| Homepage loads with real data | [ ] | ISR revalidation working |
| `/news` shows articles | [ ] | Pagination working |
| `/news/[slug]` shows detail | [ ] | AI summary displayed |
| `/tools` shows directory | [ ] | Filters working |
| `/tools/[slug]` shows detail | [ ] | Related tools displayed |
| `/about` accessible | [ ] | — |
| Theme toggle works | [ ] | Light/Dark mode |

### Pipeline Testing

Run the E2E pipeline test:
```bash
CRON_SECRET=xxx BASE_URL=https://your-domain.com npx tsx scripts/test-pipelines.ts
```

| Pipeline | Status | Notes |
|----------|--------|-------|
| `fetch-news` | [ ] | Articles appear in DB |
| `summarise` | [ ] | AI summaries generated |
| `daily-digest` | [ ] | Digest + audio created |

### SEO Verification

| Check | Status | Notes |
|-------|--------|-------|
| `/sitemap.xml` accessible | [ ] | Contains all pages |
| `/robots.txt` accessible | [ ] | Allows crawling |
| Open Graph preview working | [ ] | Test with social debugger |
| Meta descriptions present | [ ] | View page source |

---

## Performance Verification

Run Lighthouse audit:
```bash
npx lighthouse https://your-domain.com --view
```

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Performance | > 90 | | [ ] |
| Accessibility | > 90 | | [ ] |
| Best Practices | > 90 | | [ ] |
| SEO | > 90 | | [ ] |

---

## Cost Review

### Expected Monthly Costs

| Resource | Expected | Limit | Notes |
|----------|----------|-------|-------|
| Cloud Run | $2-5 | $10 | Pay per request |
| Supabase | Free tier | 500 MB DB | Monitor storage |
| GitHub Actions | ~50 min | 2000 min | Free tier |
| Cloudflare | Free | Unlimited | CDN/proxy |
| Gemini API | ~$1-3 | $10 | Monitor usage |
| GCP TTS | ~$0.50 | $5 | Audio generation |

### Cost Alerts

- [ ] Set GCP budget alert at $10
- [ ] Set Gemini API quota limits
- [ ] Review Supabase storage weekly

---

## Post-Launch Monitoring

### First 24 Hours

- [ ] Check Cloud Run logs for errors
- [ ] Verify CRON jobs executed successfully
- [ ] Monitor Supabase query performance
- [ ] Check GitHub Actions workflow runs

### First Week

- [ ] Review error rates in logs
- [ ] Check storage bucket usage
- [ ] Verify cleanup scripts ran (Sunday)
- [ ] Review any `needs_review` tools

### Ongoing

- [ ] Monthly link health check review
- [ ] Weekly digest generation verification
- [ ] Monitor API rate limits
- [ ] Review and archive old articles

---

## Emergency Contacts & Resources

### Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/[PROJECT_ID]
- **GCP Console:** https://console.cloud.google.com/run
- **GitHub Actions:** https://github.com/[USER]/ai-news-hub/actions
- **Cloudflare Dashboard:** https://dash.cloudflare.com

### Rollback Procedure

If critical issues occur:
1. Revert to previous Cloud Run revision
2. Check GitHub for last known good commit
3. Disable CRON jobs if generating bad data
4. Restore database from Supabase backup if needed

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | [ ] |
| Reviewer | | | [ ] |

---

*Checklist complete. Ready for launch! 🚀*
