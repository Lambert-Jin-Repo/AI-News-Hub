# Database Schema

AI News Hub uses Supabase (PostgreSQL) for data storage. All tables use UUID primary keys and have Row-Level Security (RLS) enabled.

## Tables

### `articles`

Stores fetched AI news articles with AI-generated summaries.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| title | TEXT | NOT NULL | |
| url | TEXT | UNIQUE, NOT NULL | Deduplication key |
| source | TEXT | | e.g., "TechCrunch" |
| published_at | TIMESTAMPTZ | | Original publish date |
| fetched_at | TIMESTAMPTZ | default now() | When we ingested it |
| thumbnail_url | TEXT | nullable | Subject to hotlink failure |
| raw_excerpt | TEXT | nullable | Original snippet |
| ai_summary | TEXT | nullable | AI-generated summary |
| summary_status | TEXT | default 'pending' | pending / completed / failed_safety / failed_quota / skipped |
| category | TEXT | nullable | llm / agents / models / research / tools / other |
| ai_metadata | JSONB | nullable | Structured extraction data (tech_stack, relevance, etc.) |
| is_featured | BOOLEAN | default false | |
| is_archived | BOOLEAN | default false | For retention cleanup |
| search_vector | TSVECTOR | generated, stored | Full-text search on title + excerpt + summary |

**Indexes:** GIN on search_vector, B-tree on fetched_at, summary_status, source, category

### `daily_digests`

Stores daily "Today in AI" narrative summaries and audio URLs.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| digest_date | DATE | UNIQUE, NOT NULL | One digest per day |
| summary_text | TEXT | nullable | Generated narrative |
| audio_url | TEXT | nullable | Supabase Storage URL |
| audio_status | TEXT | default 'pending' | pending / completed / failed |
| article_ids | UUID[] | nullable | Featured article references |
| created_at | TIMESTAMPTZ | default now() | |

### `tools`

AI tools directory with search, categories, and link health tracking.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | TEXT | NOT NULL | |
| slug | TEXT | UNIQUE | URL-safe identifier |
| description | TEXT | nullable | |
| url | TEXT | nullable | Tool website |
| category | TEXT | nullable | |
| pricing_model | TEXT | default 'free' | free / freemium / paid |
| tags | TEXT[] | nullable | e.g., {"beginner-friendly"} |
| logo_url | TEXT | nullable | |
| date_added | TIMESTAMPTZ | default now() | |
| is_active | BOOLEAN | default true | |
| needs_review | BOOLEAN | default false | Set by link checker |
| last_checked_at | TIMESTAMPTZ | nullable | Last health check |
| check_fail_count | INTEGER | default 0 | Auto-deactivate at 2 |
| search_vector | TSVECTOR | generated, stored | Full-text search on name + description + tags |

**Indexes:** GIN on search_vector, B-tree on category, is_active

### `workflows`

Curated AI tool workflows with multi-step pipelines.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| slug | TEXT | UNIQUE, NOT NULL | URL-safe identifier |
| title | TEXT | NOT NULL | |
| description | TEXT | nullable | |
| cost_category | TEXT | default 'free' | free / paid |
| difficulty | TEXT | default 'beginner' | beginner / intermediate / advanced |
| estimated_minutes | INTEGER | nullable | |
| steps | JSONB | NOT NULL, default '[]' | Array of step objects with tool_slug, action, etc. |
| is_active | BOOLEAN | default true | |
| created_at | TIMESTAMPTZ | default now() | |

**Indexes:** B-tree on is_active, cost_category

### `daily_words`

Daily AI/tech vocabulary with LLM-generated explanations.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| term | TEXT | NOT NULL | The vocabulary term |
| content | TEXT | NOT NULL | LLM-generated explanation |
| provider | TEXT | nullable | Which LLM generated it |
| display_date | DATE | NOT NULL | Scheduled display date |
| generated_at | TIMESTAMPTZ | default now() | |
| cycle_id | INT | NOT NULL, default 1 | Allows term reuse across cycles |

**Unique:** (term, cycle_id)
**Indexes:** B-tree on display_date DESC

### `sources`

Configuration for news sources (RSS feeds, APIs).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | TEXT | NOT NULL | |
| type | TEXT | NOT NULL | rss / api |
| config | JSONB | default '{}' | URL, API key ref, params |
| is_active | BOOLEAN | default true | |
| last_fetched_at | TIMESTAMPTZ | nullable | |
| last_error | TEXT | nullable | Last fetch error |

### `llm_usage_logs`

Tracks every LLM API call for monitoring and debugging.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| provider | TEXT | NOT NULL | gemini / minimax / groq |
| model | TEXT | NOT NULL | e.g., gemini-2.5-flash |
| feature | TEXT | NOT NULL | summarise / digest / workflow / daily_word / tool_discovery |
| success | BOOLEAN | NOT NULL, default true | |
| latency_ms | INTEGER | nullable | Response time in ms |
| tokens_in | INTEGER | nullable | Prompt tokens |
| tokens_out | INTEGER | nullable | Completion tokens |
| error_type | TEXT | nullable | Error classification |
| is_fallback | BOOLEAN | NOT NULL, default false | Whether this was a fallback attempt |

**Indexes:** B-tree on created_at, provider
**Retention:** 30-day auto-cleanup via `cleanup_old_llm_logs()` function

### `profiles`

Admin user profiles linked to Supabase Auth.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, FK → auth.users(id) ON DELETE CASCADE | |
| is_admin | BOOLEAN | NOT NULL, default false | |
| created_at | TIMESTAMPTZ | default now() | |

## Row-Level Security

All tables have RLS enabled:
- **Read:** Public (no auth required) — visitors can browse content
- **Write:** Restricted to `service_role` — used by cron jobs via the admin Supabase client
- **`llm_usage_logs`:** No public read — only accessible via `service_role` (admin API)
- **`profiles`:** Users can read their own profile

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
3. Run the migration files in order in the Supabase SQL Editor:
   - `supabase/migrations/001_articles_table.sql`
   - `supabase/migrations/002_daily_digests_table.sql`
   - `supabase/migrations/003_tools_table.sql`
   - `supabase/migrations/004_sources_table.sql`
   - `supabase/migrations/005_add_slug_and_seed_sources.sql`
   - `supabase/migrations/006_tools_add_slug.sql`
   - `supabase/migrations/007_seed_tools.sql`
   - `supabase/migrations/008_add_archived_column.sql`
   - `supabase/migrations/009_add_category_and_metadata.sql`
   - `supabase/migrations/010_workflows_table.sql`
   - `supabase/migrations/011_daily_words_table.sql`
   - `supabase/migrations/012_llm_usage_logs.sql`
