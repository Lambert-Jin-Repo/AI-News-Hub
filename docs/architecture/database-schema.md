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
| is_featured | BOOLEAN | default false | |
| search_vector | TSVECTOR | generated, stored | Full-text search on title + excerpt + summary |

**Indexes:** GIN on search_vector, B-tree on fetched_at, summary_status, source

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

## Row-Level Security

All tables have RLS enabled:
- **Read:** Public (no auth required) — visitors can browse content
- **Write:** Restricted to `service_role` — used by cron jobs via the admin Supabase client

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
3. Run the migration files in order in the Supabase SQL Editor:
   - `supabase/migrations/001_articles_table.sql`
   - `supabase/migrations/002_daily_digests_table.sql`
   - `supabase/migrations/003_tools_table.sql`
   - `supabase/migrations/004_sources_table.sql`
