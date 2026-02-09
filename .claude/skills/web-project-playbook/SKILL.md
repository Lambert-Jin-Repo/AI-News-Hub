---
name: web-project-playbook
description: This skill should be used when the user asks to "set up a new web project", "plan a web app", "scaffold a project", "deploy to Cloud Run", "deploy to Vercel", "deploy to AWS", "set up CI/CD", "plan database schema", "set up git workflow", "create a project plan", "write a tech spec", "set up testing", or mentions project architecture, deployment strategy, branching strategy, or infrastructure setup for a web application.
version: 1.0.0
---

# Web Project Playbook

A battle-tested playbook for building, shipping, and operating modern web applications. Distilled from real production projects covering Next.js, React, Supabase, multiple cloud platforms, and CI/CD pipelines.

## Core Principles

1. **Build in phases** — Decompose into infrastructure, data, features, polish, deploy. Each phase produces a working increment.
2. **Library modules first, pages second** — Write utilities, clients, and data layers before UI pages that consume them.
3. **One file, one concern** — Each library module (auth, formatters, constants, db client) lives in its own file under `src/lib/`.
4. **Server + Client split** — Server components fetch data. Client components handle interactivity. Never mix data fetching with `useState`/`useEffect` in the same component.
5. **Test as you build** — Write tests per phase, not at the end. Target library code and API routes, not UI markup.
6. **Atomic commits** — One logical change per commit. Prefix with `feat:`, `fix:`, `test:`, `ci:`, `docs:`, `chore:`.

## Project Structure (Framework-Agnostic)

```
project-root/
├── .github/workflows/          # CI/CD pipelines
├── scripts/                    # Operational scripts (cleanup, seed, diagnostics)
├── supabase/migrations/        # Sequential numbered migrations (or prisma/migrations/)
├── src/
│   ├── app/                    # Routes/pages (Next.js App Router or equivalent)
│   │   ├── api/                # API routes
│   │   │   ├── jobs/           # CRON/background job endpoints
│   │   │   └── [resource]/     # REST endpoints per resource
│   │   └── [resource]/         # Page routes per resource
│   │       ├── page.tsx        # Server component (data fetch)
│   │       ├── [slug]/page.tsx # Detail page
│   │       └── feed.tsx        # Client component (search/filter/paginate)
│   ├── components/
│   │   ├── ui/                 # Generic reusable (Button, Badge, Input)
│   │   ├── cards/              # Domain cards (NewsCard, ToolCard)
│   │   └── providers/          # Context providers (Theme, Auth)
│   ├── lib/                    # Library modules (one file per concern)
│   │   ├── constants.ts        # Enums, defaults, thresholds
│   │   ├── formatters.ts       # Date, string, slug utilities
│   │   ├── auth.ts             # Authentication helpers
│   │   ├── supabase.ts         # Database client (typed)
│   │   ├── [service]-client.ts # External service clients
│   │   ├── fetchers/           # Data source fetchers
│   │   └── __tests__/          # Unit tests co-located with lib
│   └── types/                  # Shared TypeScript interfaces
├── public/                     # Static assets
├── Dockerfile                  # Multi-stage production build
├── .dockerignore
└── .env.example                # Documented env var template
```

## Phase-Based Build Order

**Phase 0 — Foundation**: Constants, utilities, database client, auth, component library, test framework, Dockerfile, CI pipeline. No features yet — just the skeleton.

**Phase 1 — Data Layer**: Database migrations, data fetchers, API routes with pagination, seed scripts. The data pipeline works end-to-end but the UI is basic.

**Phase 2 — Core Features**: Business logic (summarization, processing, generation). Background jobs. The product does its core thing.

**Phase 3 — UI & Integration**: Full pages, search/filter, detail views, navigation. Connect everything to real data.

**Phase 4 — Production Polish**: SEO (sitemap, robots, OG tags), error boundaries, 404 pages, logging, accessibility, operational scripts (cleanup, health checks), launch checklist.

**Phase 5+ — Iteration**: Feature pivots, cost optimization, schema evolution. Always backwards-compatible.

## Git Workflow

Use a three-tier branch strategy: `main` <- `develop` <- `feature/*`.

- **Feature branches**: One per phase or sub-feature. Name as `feature/phase1-data-layer`.
- **Develop**: Integration branch. Merge features here with `--no-ff`. Run full test suite after merge.
- **Main**: Production. Merge develop with `--no-ff` only after verification (build + lint + test).
- **Never force-push main or develop.**

See `references/git-workflow.md` for detailed commit conventions and merge procedures.

## Database Patterns

- **Sequential numbered migrations**: `001_create_articles.sql`, `002_add_indexes.sql`. Never edit past migrations; create new ones.
- **Typed client**: Export typed query builders. Use separate clients for public (anon) and privileged (admin/service) operations.
- **Cursor pagination**: Use `created_at` or composite cursors, never `OFFSET`.
- **Slug-based lookups**: Generate URL-safe slugs from titles. Index the slug column.
- **JSONB for flexibility**: Use JSONB columns for metadata that varies per record (e.g., `ai_metadata`, `settings`).

See `references/database-patterns.md` for schema design, RLS policies, and migration strategies.

## Deployment

Support multiple targets. The Dockerfile is the same; only the deploy pipeline differs.

| Platform | Best For | Cost Model |
|----------|----------|------------|
| **Vercel** | Next.js apps, fast iteration | Per-request, generous free tier |
| **Cloud Run** | Docker containers, CRON jobs | Per-second, scale-to-zero |
| **AWS (ECS/Fargate)** | Enterprise, multi-service | Per-second, more config |
| **Azure Container Apps** | .NET-heavy orgs, hybrid | Per-second, scale-to-zero |
| **Self-hosted** | Full control, fixed cost | Server rental |

See `references/deployment-guide.md` for platform-specific workflows, secret management, and common pitfalls.

## Testing Strategy

- **Unit tests**: Library modules (`src/lib/__tests__/`). Mock external services.
- **Integration tests**: API routes with mocked DB.
- **No snapshot tests**: They break constantly and provide low signal.
- **Mock patterns**: Use `vi.mock()` with factory functions. Mock at the module boundary, not deep internals.
- **Lazy imports in tests**: Use `await import('../module')` after `vi.mock()` to ensure mocks are applied.

See `references/testing-strategy.md` for mock patterns and common pitfalls.

## CI/CD Pipeline

Minimum two workflows:
1. **CI** (on push/PR): Install -> Lint -> Type Check -> Test -> Build
2. **Deploy** (on push to main): Build Docker -> Push to Registry -> Deploy to Platform

Optional workflows:
3. **Scheduled Jobs**: CRON triggers via `curl` to deployed endpoints
4. **Maintenance**: Storage cleanup, link checking, dependency updates

See `references/cicd-pipelines.md` for workflow templates per platform.

## Key Anti-Patterns to Avoid

1. **Module-level side effects**: Never `new Client()` at file scope. Use lazy initialization (factory/getter pattern) so imports don't crash without credentials.
2. **`NEXT_PUBLIC_*` vars at runtime only**: These are baked at build time. Pass as `--build-arg` in Docker or set in Vercel env settings.
3. **Offset pagination**: Falls apart at scale. Use cursor-based.
4. **Secrets in env vars without Secret Manager**: Fine for development; use platform secret management in production.
5. **Editing old migrations**: Always create new ones. Past migrations may have already run.
6. **Over-permissioned service accounts**: Create dedicated accounts with minimum required roles.
7. **No health check**: Every deployed service needs `/api/health` or equivalent.
