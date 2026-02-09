# Project Planning Reference

## Phase-Based Development

### Why Phases?

Phases enforce a build order that prevents cascading rework. Infrastructure before features. Data before UI. Tests alongside code, not after.

### Phase Template

Every project follows this skeleton. Adapt the specifics to your domain.

```
Phase 0 — Foundation (no features, just skeleton)
  0.1 Infrastructure: constants, utilities, auth, DB client, logging
  0.2 Database: migrations, typed client, seed data
  0.3 UI Components: design system primitives (Button, Card, Badge, Input)
  0.4 DevOps: Dockerfile, CI pipeline, env template
  0.5 Tests: framework setup, utility tests

Phase 1 — Data Pipeline
  1.1 Data sources: fetchers, importers, or API integrations
  1.2 API routes: REST/GraphQL endpoints with pagination
  1.3 Background jobs: CRON endpoints with auth
  1.4 Tests: fetcher tests, API tests

Phase 2 — Core Business Logic
  2.1 Processing: the thing that makes your app unique
  2.2 Storage: file uploads, media processing
  2.3 Notifications: email, push, webhooks
  2.4 Tests: business logic tests

Phase 3 — UI & Integration
  3.1 Listing pages: search, filter, pagination
  3.2 Detail pages: full content view, related items
  3.3 Navigation: breadcrumbs, mobile menu, back links
  3.4 Homepage: real data, featured content
  3.5 Tests: component tests (optional)

Phase 4 — Production Polish
  4.1 SEO: sitemap, robots.txt, OpenGraph, structured data
  4.2 Error handling: error boundaries, 404 page, logging
  4.3 Performance: image optimization, caching headers, lazy loading
  4.4 Accessibility: ARIA labels, keyboard nav, contrast
  4.5 Ops scripts: cleanup, health checks, diagnostics
  4.6 Launch checklist: final review

Phase 5+ — Iteration
  Feature pivots, cost optimization, analytics, A/B testing
```

### Sizing Phases

Each phase should be completable in **1-3 working sessions** (a few hours to a day). If a phase feels larger, split it. The goal is frequent, shippable increments.

### Tracking Progress

Use a simple markdown tracker:

```markdown
## Phase 1 — Data Pipeline
- [x] 1.1 RSS fetcher with rss-parser
- [x] 1.2 GNews API client
- [x] 1.3 News API with cursor pagination
- [ ] 1.4 Fetcher unit tests
```

Or a `PROJECT_TRACKER.md` with status per task and timestamps.

## Task Decomposition

### The Commit Rule

If a task produces more than one commit, it's too big. Decompose until each task = one commit = one reviewable change.

### Dependencies First

Before writing any feature code, ask: "What libraries, types, or data does this feature need?" Build those first.

```
Bad:  Write the news page (needs API, DB, components, types all at once)
Good: 1. Add Article type to constants
      2. Write news API route
      3. Write news page server component
      4. Write news feed client component
```

### Vertical Slices vs Horizontal Layers

**Vertical slice** (preferred for features): DB migration -> API route -> UI page for one resource.

**Horizontal layer** (preferred for infrastructure): All utilities, then all components, then all pages.

Start with horizontal layers in Phase 0, then switch to vertical slices for Phases 1+.

## Documentation Files

### Required (create at project start)

| File | Purpose |
|------|---------|
| `.env.example` | Every env var with descriptions. Never commit `.env.local`. |
| `README.md` | Setup instructions, architecture overview, local dev commands. |

### Recommended

| File | Purpose |
|------|---------|
| `PROJECT_TRACKER.md` | Phase progress, task status, timestamps. |
| `IMPLEMENTATION_PLANS.md` | Detailed technical specs per phase (code snippets, file lists). |
| `LAUNCH_CHECKLIST.md` | Pre-deploy verification list. |

### Anti-Pattern: Over-Documentation

Write docs that you'll actually reference. A 3000-word architecture doc nobody reads is worse than a 200-word README with the setup commands.

## Cost Awareness

Build cost estimates into planning, especially for:

- **Cloud hosting**: Cloud Run, Vercel, AWS — estimate monthly cost at expected traffic
- **External APIs**: LLM APIs, news APIs, email services — track per-call costs
- **Storage**: Database size, file storage, CDN bandwidth
- **CI/CD**: GitHub Actions minutes, build minutes

Add a cost section to your project tracker:

```markdown
## Monthly Cost Estimate
| Service           | Usage          | Cost     |
|-------------------|----------------|----------|
| Cloud Run         | ~100 req/day   | $0.80    |
| Supabase          | Free tier      | $0.00    |
| Gemini API        | ~600 calls/mo  | $0.05    |
| GitHub Actions    | ~30 min/day    | $0.00    |
| **Total**         |                | **$0.85** |
```
