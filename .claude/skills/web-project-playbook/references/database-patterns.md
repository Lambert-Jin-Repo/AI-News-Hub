# Database Patterns Reference

## Schema Design

### Migration Strategy

Use sequential numbered migrations. Never edit a migration that has been applied.

```
supabase/migrations/
├── 001_create_articles.sql
├── 002_create_daily_digests.sql
├── 003_create_tools.sql
├── 004_add_indexes.sql
├── 005_seed_sources.sql
├── 006_add_slug_column.sql
├── 007_seed_tools.sql
├── 008_add_archived_column.sql
└── 009_add_category_and_metadata.sql
```

**Rules:**
- One concern per migration (a table, a set of indexes, a column addition)
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Include both `UP` and `DOWN` logic if your framework supports it
- Add constraints and indexes in the same migration as the column they apply to

### Column Patterns

**Standard columns for every table:**

```sql
CREATE TABLE articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- domain columns here --
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

**Soft delete (prefer over hard delete):**

```sql
ALTER TABLE articles ADD COLUMN archived BOOLEAN DEFAULT false NOT NULL;
CREATE INDEX idx_articles_not_archived ON articles (id) WHERE archived = false;
```

**Flexible metadata (JSONB):**

```sql
ALTER TABLE articles ADD COLUMN ai_metadata JSONB;
-- Query: SELECT * FROM articles WHERE ai_metadata->>'relevance_score' > '5';
```

**Enum-like text columns with CHECK constraints:**

```sql
ALTER TABLE articles ADD COLUMN category TEXT;
ALTER TABLE articles ADD CONSTRAINT articles_category_check
    CHECK (category IS NULL OR category IN ('llm', 'agents', 'models', 'research', 'tools', 'other'));
CREATE INDEX idx_articles_category ON articles (category);
```

Prefer text + CHECK over PostgreSQL ENUM types — enums are painful to modify after creation.

### Slug Pattern

```sql
ALTER TABLE articles ADD COLUMN slug TEXT UNIQUE;
CREATE INDEX idx_articles_slug ON articles (slug);
```

Generate slugs in application code:

```typescript
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
}
```

Append a short hash or ID suffix to prevent collisions: `my-article-title-a1b2c3`.

## Client Patterns

### Typed Database Client

```typescript
// src/lib/supabase.ts (Supabase example)
import { createClient } from '@supabase/supabase-js';

// Public client (respects RLS)
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Admin client (bypasses RLS — for CRON jobs, server-side only)
export function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        { auth: { persistSession: false } }
    );
}
```

**Key principle:** Never expose the admin/secret client to the browser. Use it only in API routes, server components, or CRON jobs.

### Cursor-Based Pagination

Never use `OFFSET` — it rescans rows and gets slower as offset increases.

```typescript
// API route
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor'); // ISO date string
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    let query = supabase
        .from('articles')
        .select('id, title, slug, published_at')
        .order('published_at', { ascending: false })
        .limit(limit + 1); // Fetch one extra to detect "has more"

    if (cursor) {
        query = query.lt('published_at', cursor);
    }

    const { data, error } = await query;

    const hasMore = data && data.length > limit;
    const items = hasMore ? data.slice(0, limit) : (data || []);
    const nextCursor = hasMore ? items[items.length - 1].published_at : null;

    return Response.json({ items, nextCursor });
}
```

### Upsert with Deduplication

For data ingestion (e.g., RSS feeds, API imports):

```typescript
const { error } = await supabase
    .from('articles')
    .upsert(articles, {
        onConflict: 'url',           // Deduplicate by URL
        ignoreDuplicates: true,       // Skip existing, don't update
    });
```

## Row Level Security (RLS)

### Common Policies

```sql
-- Public read access (for published content)
CREATE POLICY "Public can read published articles"
    ON articles FOR SELECT
    USING (archived = false);

-- Service role full access (for CRON jobs)
-- No policy needed — admin client bypasses RLS

-- Authenticated user access (for user-specific data)
CREATE POLICY "Users can read own data"
    ON user_data FOR SELECT
    USING (auth.uid() = user_id);
```

### RLS Gotcha: Multiple SELECT Policies are OR'd

If you have two SELECT policies on the same table, a row is visible if *either* policy allows it. This means:

```sql
-- Policy 1: Public can read non-archived articles
-- Policy 2: Admin can read all articles
-- Result: Everyone can read ALL articles (Policy 2 matches for everyone via admin role)
```

**Fix:** Use a single policy with combined logic, or use role-based conditions.

## Supabase-Specific Patterns

### Count-Only Queries

```typescript
const { count, error } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
// count is a number, no data transferred
```

### Storage (File Uploads)

```typescript
const { error } = await supabase.storage
    .from('audio-bucket')
    .upload(`digests/${date}.mp3`, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
    });

const { data: { publicUrl } } = supabase.storage
    .from('audio-bucket')
    .getPublicUrl(`digests/${date}.mp3`);
```

## Prisma Alternative

For non-Supabase projects, Prisma provides typed database access:

```prisma
// prisma/schema.prisma
model Article {
    id          String   @id @default(uuid())
    title       String
    slug        String   @unique
    category    String?
    publishedAt DateTime @map("published_at")
    createdAt   DateTime @default(now()) @map("created_at")

    @@index([category])
    @@index([publishedAt])
    @@map("articles")
}
```

```typescript
// Usage
const articles = await prisma.article.findMany({
    where: { category: 'llm' },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    cursor: cursorId ? { id: cursorId } : undefined,
    skip: cursorId ? 1 : 0,
});
```

## Database Selection Guide

| Database | Best For | Managed Option |
|----------|----------|---------------|
| **Supabase** | Rapid prototyping, built-in auth/storage, real-time | Supabase Cloud (free tier) |
| **PostgreSQL** | Production apps, complex queries, JSONB | AWS RDS, Cloud SQL, Neon |
| **MySQL/PlanetScale** | High read throughput, branching migrations | PlanetScale (free tier) |
| **SQLite/Turso** | Edge computing, single-server apps | Turso (free tier) |
| **MongoDB** | Document-heavy, schema-flexible | MongoDB Atlas (free tier) |

For most web projects, **Supabase (PostgreSQL)** or **Prisma + PostgreSQL** covers 90% of use cases.
