# AI News Hub — Cost Optimization Guide

> **Target:** Reduce monthly operational costs to near $0 while maintaining core functionality.

**Last Updated:** 2026-02-09  
**Current Monthly Cost:** ~$2.70  
**Optimized Monthly Cost:** ~$0.70–$0.80

---

## Executive Summary

This guide provides strategies to reduce AI News Hub's operational costs from ~$5/month (with Phase 5 Journey voice) to **~$0.70–$0.80/month** through configuration changes, without sacrificing core functionality.

---

## Cost Breakdown

### Current Costs (Phases 0–4)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Google Cloud Run | ~$2.70 | CRON jobs + SSR compute |
| Supabase | $0 | Free tier (500 MB DB, 1 GB storage) |
| Gemini API | $0 | Free tier (~1.5M tokens/day) |
| Google Cloud TTS | $0 | Free tier (1M chars/month Standard) |
| GitHub Actions | $0 | Free tier (2,000 min/month) |
| Cloudflare | $0 | Unlimited (free plan) |
| **Total** | **~$2.70** | |

### Projected Costs (Phase 5 with Journey Voice)

| Service | Monthly Cost | Change |
|---------|--------------|--------|
| Google Cloud Run | ~$3.00 | +$0.30 (extra LLM call) |
| TTS Journey Voice | ~$2.00 | New expense |
| **Total** | **~$5.00** | |

---

## Optimization Strategies

### Strategy 1: Keep Standard TTS Voice

**Savings:** $2.00/month  
**Effort:** None (just don't upgrade)  
**Trade-off:** Slightly less natural audio quality

The `en-US-Standard-D` voice is adequate for news briefings. The Journey voice upgrade is a quality improvement, not a requirement.

```typescript
// src/lib/tts-client.ts — Keep current config
voice: {
    languageCode: 'en-US',
    name: 'en-US-Standard-D',  // FREE tier voice
    ssmlGender: 'MALE',
},
```

---

### Strategy 2: Reduce CRON Frequencies

**Savings:** ~$1.50/month  
**Effort:** Config change only

| Job | Current | Optimized | Impact |
|-----|---------|-----------|--------|
| Summarise | Every 30 min (48×/day) | Every 2 hours (12×/day) | -75% runs |
| Fetch news | Every 6 hours (4×/day) | Every 12 hours (2×/day) | -50% runs |
| Daily digest | 1×/day | 1×/day | No change |

**Updated `.github/workflows/scheduled-jobs.yml`:**

```yaml
on:
  schedule:
    # Optimized: Fetch 2×/day instead of 4×
    - cron: "0 0,12 * * *"
    
    # Optimized: Summarise every 2 hours instead of 30 min
    - cron: "0 */2 * * *"
    
    # Daily digest unchanged
    - cron: "0 0 * * *"
```

---

### Strategy 3: Limit Daily Article Ingestion

**Savings:** ~$0.20/month  
**Effort:** Minor code change

Add a daily cap in the fetch job to prevent runaway article ingestion:

```typescript
// src/app/api/jobs/fetch-news/route.ts
const MAX_ARTICLES_PER_DAY = 20;

// Before inserting, check today's count
const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .gte('fetched_at', new Date().toISOString().split('T')[0]);

if ((count ?? 0) >= MAX_ARTICLES_PER_DAY) {
    return { skipped: true, reason: 'Daily limit reached' };
}
```

---

### Strategy 4: Reduce Article Retention

**Savings:** Minimal direct cost, but improves performance  
**Effort:** Already implemented (90 days → 30 days recommended)

Update `src/lib/constants.ts`:

```typescript
export const ARTICLE_RETENTION_DAYS = 30;  // Was 90
export const AUDIO_RETENTION_DAYS = 14;    // Was 30
```

Benefits:
- Smaller database size
- Faster full-text search queries
- Lower Supabase storage usage

---

### Strategy 5: Skip Weekend Digests (Optional)

**Savings:** ~$0.10/month  
**Effort:** Minor code change

Skip digest generation on low-traffic days:

```typescript
// In daily-digest job
const dayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { skipped: true, reason: 'Weekend — no digest' };
}
```

---

## Recommended Configuration

### Near-Zero Cost Setup (~$0.70–$0.80/month)

| Setting | Value |
|---------|-------|
| TTS Voice | `en-US-Standard-D` (free) |
| Summarise frequency | Every 2 hours |
| Fetch frequency | Every 12 hours |
| Max articles/day | 20 |
| Article retention | 30 days |
| Audio retention | 14 days |
| Weekend digests | Optional (skip to save) |

### Environment Variables

```env
# .env.local additions for cost control
MAX_ARTICLES_PER_DAY=20
ARTICLE_RETENTION_DAYS=30
AUDIO_RETENTION_DAYS=14
```

---

## Cost Monitoring

### Weekly Checks

1. **GCP Billing Dashboard** — Verify Cloud Run under $1/week
2. **Supabase Dashboard** — Check DB size and egress
3. **GitHub Actions** — Monitor minutes usage (target: <500/week)

### Alerts

Set up GCP billing alerts at:
- $1 (early warning)
- $3 (investigate)
- $5 (action required)

---

## Future Zero-Cost Options

If you need **true $0/month**, consider these larger changes:

| Option | Effort | Result |
|--------|--------|--------|
| Migrate to Cloudflare Pages (SSG) | 4-6 hours | Eliminates Cloud Run |
| Use Cloudflare Workers for CRON | 2-3 hours | Free CRON execution |
| Self-host on Raspberry Pi | 8+ hours | $0 cloud costs |

These require significant refactoring and are out of scope for Phase 5.

---

## Summary Table

| Optimization | Savings | Effort | Recommended |
|--------------|---------|--------|-------------|
| Keep Standard voice | $2.00 | None | ✅ Yes |
| Summarise every 2h | $1.50 | Config | ✅ Yes |
| Fetch every 12h | $0.30 | Config | ✅ Yes |
| Max 20 articles/day | $0.20 | Code | ✅ Yes |
| 30-day retention | Perf | Code | ✅ Yes |
| Skip weekend digests | $0.10 | Code | Optional |
| **Total Savings** | **~$4.10** | | |

**Final cost: ~$0.70–$0.80/month**

---

*This document should be reviewed quarterly as service pricing changes.*
