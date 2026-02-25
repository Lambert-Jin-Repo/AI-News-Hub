# CI/CD Pipeline Reference

## Minimum Viable CI

Every project needs at least this running on every push and PR:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  check:
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
        run: npm test

      - name: Build
        run: npm run build
```

**Order matters:** Lint and type check are fast and catch obvious issues. Tests catch logic errors. Build catches integration issues. Run them in this order so failures are caught early.

## Scheduled Jobs (CRON Triggers)

For apps with background jobs, use GitHub Actions to trigger endpoints on the deployed service.

```yaml
# .github/workflows/scheduled-jobs.yml
name: Scheduled Jobs

on:
  schedule:
    - cron: "0 0,12 * * *"     # Job A: every 12 hours
    - cron: "30 0,12 * * *"    # Job B: 30 min after Job A
    - cron: "0 22 * * *"       # Job C: daily at 22:00 UTC
  workflow_dispatch:
    inputs:
      job:
        description: "Job to run manually"
        required: true
        type: choice
        options:
          - job-a
          - job-b
          - job-c

jobs:
  job-a:
    if: >
      github.event_name == 'workflow_dispatch' && github.event.inputs.job == 'job-a' ||
      github.event_name == 'schedule' && github.event.schedule == '0 0,12 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger job-a
        run: |
          curl -sf --max-time 180 -X POST \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            "${{ secrets.APP_URL }}/api/jobs/job-a"

  job-b:
    if: >
      github.event_name == 'workflow_dispatch' && github.event.inputs.job == 'job-b' ||
      github.event_name == 'schedule' && github.event.schedule == '30 0,12 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger job-b
        run: |
          curl -sf --max-time 180 -X POST \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            "${{ secrets.APP_URL }}/api/jobs/job-b"

  job-c:
    if: >
      github.event_name == 'workflow_dispatch' && github.event.inputs.job == 'job-c' ||
      github.event_name == 'schedule' && github.event.schedule == '0 22 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger job-c
        run: |
          curl -sf --max-time 180 -X POST \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            "${{ secrets.APP_URL }}/api/jobs/job-c"
```

**Key details:**
- `--max-time 180` prevents hung jobs from consuming GitHub Actions minutes (default timeout is 6 hours)
- `-sf` means silent mode + fail on HTTP error codes
- `workflow_dispatch` allows manual triggering from the Actions tab
- The `if` condition matches schedule expressions to route to the correct job
- `secrets.APP_URL` points to the deployed service (e.g., `https://my-app-abc123.a.run.app`)

### CRON Schedule Cheat Sheet

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, Sun=0)
│ │ │ │ │
* * * * *

0 */2 * * *     Every 2 hours
0 0,12 * * *    Twice daily (midnight, noon UTC)
30 0,12 * * *   30 min after each 12-hour mark
0 22 * * *      Daily at 22:00 UTC
0 0 * * 0       Weekly on Sunday
0 0 1 * *       Monthly on the 1st
```

**UTC conversion:** GitHub Actions CRON runs in UTC. AWST = UTC+8, EST = UTC-5, PST = UTC-8.

## Maintenance Workflows

### Storage Cleanup (Weekly)

```yaml
name: Storage Cleanup

on:
  schedule:
    - cron: "0 3 * * 0"  # Weekly Sunday 3AM UTC
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Run cleanup
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}
        run: npx tsx scripts/cleanup-storage.ts
```

### Link Checker (Monthly)

```yaml
name: Check Links

on:
  schedule:
    - cron: "0 4 1 * *"  # 1st of every month
  workflow_dispatch:

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Check tool links
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}
        run: npx tsx scripts/check-links.ts
```

## GitHub Secrets Management

### Required Secrets (set in repo Settings > Secrets > Actions)

| Secret | Used By | Example |
|--------|---------|---------|
| `GCP_PROJECT_ID` | Deploy workflow | `my-project-123` |
| `GCP_SA_KEY` | Deploy workflow | `{"type":"service_account",...}` |
| `CRON_SECRET` | Scheduled jobs, Cleanup | `a1b2c3d4e5f6...` (hex, 32+ chars) |
| `APP_URL` | Scheduled jobs | `https://my-app-abc.a.run.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Build + Runtime | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Build + Runtime | `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | Runtime, Scripts | `sb_secret_...` |

### Environment-Specific Secrets

For multi-environment setups, use GitHub Environments:

```yaml
jobs:
  deploy-staging:
    environment: staging
    # Uses staging secrets

  deploy-production:
    environment: production
    needs: deploy-staging
    # Uses production secrets
```

## GitHub Actions Cost Awareness

| Item | Free Tier | Overage Cost |
|------|-----------|-------------|
| **Minutes** (public repos) | Unlimited | N/A |
| **Minutes** (private repos) | 2,000/month | $0.008/min (Linux) |
| **Storage** (artifacts, caches) | 500 MB | $0.25/GB |

### Minimizing Minutes

1. **Cache `npm ci`** via `actions/setup-node` with `cache: 'npm'` (~60% faster)
2. **Skip redundant builds** — don't run CI on documentation-only changes:
   ```yaml
   on:
     push:
       paths-ignore:
         - '**/*.md'
         - 'docs/**'
   ```
3. **Use `--max-time` on curl** — prevent runaway CRON jobs
4. **Consolidate CRON frequencies** — 2x/day is 60 min/month; hourly is 730 min/month

## Operational Scripts

Keep operational scripts in `scripts/` with clear naming:

```
scripts/
├── cleanup-storage.ts        # Remove old audio files, archived articles
├── cleanup-images.sh         # Remove old Docker images from registry
├── check-links.ts            # Verify external URLs haven't gone dead
├── check-supabase.ts         # Verify DB connectivity and schema
├── test-pipelines.ts         # E2E test of the data pipeline
└── seed-data.ts              # Populate development database
```

**Each script should:**
- Be runnable with `npx tsx scripts/script-name.ts`
- Accept env vars for configuration (never hardcode secrets)
- Output progress to stdout
- Exit with code 0 on success, non-zero on failure
- Be idempotent (safe to run multiple times)
