# Framework Architecture Reference

## Next.js App Router Patterns

### Server + Client Component Split

The most important architectural decision in modern Next.js: separate data fetching (server) from interactivity (client).

```
src/app/news/
├── page.tsx          # Server component — fetches initial data, renders shell
├── news-feed.tsx     # Client component — search, filter, infinite scroll
└── [slug]/
    └── page.tsx      # Server component — fetches single article
```

**Server component (page.tsx):**

```tsx
// No "use client" — this is a server component by default
import { supabase } from '@/lib/supabase';
import { NewsFeed } from './news-feed';

export const revalidate = 3600; // ISR: revalidate every hour

async function getInitialArticles() {
    const { data } = await supabase
        .from('articles')
        .select('id, title, slug, source, published_at, thumbnail_url')
        .order('published_at', { ascending: false })
        .limit(20);
    return data || [];
}

async function getFilterOptions() {
    const { data } = await supabase
        .from('articles')
        .select('source')
        .not('source', 'is', null);
    return [...new Set(data?.map(a => a.source))];
}

export default async function NewsPage() {
    const [articles, sources] = await Promise.all([
        getInitialArticles(),
        getFilterOptions(),
    ]);

    return (
        <main>
            <h1>Latest News</h1>
            <NewsFeed initialArticles={articles} sources={sources} />
        </main>
    );
}
```

**Client component (news-feed.tsx):**

```tsx
"use client";

import { useState, useCallback } from 'react';

interface NewsFeedProps {
    initialArticles: Article[];
    sources: string[];
}

export function NewsFeed({ initialArticles, sources }: NewsFeedProps) {
    const [articles, setArticles] = useState(initialArticles);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const loadMore = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/news?cursor=${cursor}&limit=20`);
        const { items, nextCursor } = await res.json();
        setArticles(prev => [...prev, ...items]);
        setCursor(nextCursor);
        setLoading(false);
    }, [cursor]);

    return (
        <>
            <FilterBar sources={sources} onChange={handleFilter} />
            <ArticleList articles={articles} />
            {cursor && <LoadMoreButton onClick={loadMore} loading={loading} />}
        </>
    );
}
```

### Detail Page with Related Items

```tsx
// src/app/news/[slug]/page.tsx
interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const article = await getArticle(slug);
    return {
        title: article ? `${article.title} — My App` : 'Not Found',
        description: article?.summary || 'Read more on My App.',
    };
}

export default async function ArticlePage({ params }: PageProps) {
    const { slug } = await params;
    const article = await getArticle(slug);
    if (!article) notFound();

    const related = await getRelatedArticles(article.id, article.source);

    return (
        <main>
            <article>{/* article content */}</article>
            <aside>{/* related articles */}</aside>
        </main>
    );
}
```

### API Route Pattern

```typescript
// src/app/api/news/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';
    const source = searchParams.get('source')?.trim() || '';
    const cursor = searchParams.get('cursor') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    let query = supabase
        .from('articles')
        .select('id, title, slug, source, published_at')
        .order('published_at', { ascending: false })
        .limit(limit + 1);

    if (search) query = query.ilike('title', `%${search}%`);
    if (source) query = query.eq('source', source);
    if (cursor) query = query.lt('published_at', cursor);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? items[items.length - 1].published_at : null;

    return NextResponse.json({ items, nextCursor });
}
```

### CRON Job Endpoint

```typescript
// src/app/api/jobs/my-job/route.ts
import { verifyCronAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // seconds

export async function POST(request: Request) {
    if (!verifyCronAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await doWork();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error('Job failed:', error);
        return NextResponse.json(
            { error: 'Job failed', message: String(error) },
            { status: 500 }
        );
    }
}

// Support GET for manual browser testing
export async function GET(request: Request) {
    return POST(request);
}
```

### CRON Auth Pattern

```typescript
// src/lib/auth.ts
import { timingSafeEqual } from 'crypto';

export function verifyCronAuth(request: Request): boolean {
    const secret = request.headers.get('x-cron-secret');
    if (!secret || !process.env.CRON_SECRET) return false;

    const a = Buffer.from(secret);
    const b = Buffer.from(process.env.CRON_SECRET);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}
```

## Lazy Initialization Pattern

External clients that need credentials should never be instantiated at module scope. Module-level `new Client()` crashes on import if credentials are missing.

```typescript
// BAD — crashes if GOOGLE_APPLICATION_CREDENTIALS is unset
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
const ttsClient = new TextToSpeechClient(); // Crashes here

// GOOD — lazy init on first use
let _client: TextToSpeechClient | null = null;
function getClient(): TextToSpeechClient {
    if (!_client) {
        _client = new TextToSpeechClient();
    }
    return _client;
}

export async function generateSpeech(text: string) {
    const client = getClient();
    // ...
}
```

## Framework Selection Guide

| Framework | Best For | Server Components? | Deploy Target |
|-----------|----------|-------------------|---------------|
| **Next.js** | Full-stack, SSR/SSG/ISR, API routes | Yes (App Router) | Vercel, Cloud Run, any Docker |
| **Remix** | Data mutations, progressive enhancement | Yes (loaders/actions) | Vercel, Fly.io, any Node.js |
| **Nuxt** | Vue ecosystem, SSR | Yes (Nitro) | Vercel, any Node.js |
| **SvelteKit** | Performance-critical, small bundles | Yes (load functions) | Vercel, any Node.js |
| **Astro** | Content-heavy, multi-framework | Yes (islands) | Vercel, Netlify, static |

For most projects, **Next.js with App Router** provides the best balance of features, ecosystem, and deployment flexibility.

## Common Next.js Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',        // Required for Docker/Cloud Run
    compress: true,              // Gzip responses
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**' }, // Or restrict to known domains
        ],
    },
    async headers() {
        return [{
            source: '/:path*',
            headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            ],
        }];
    },
};

export default nextConfig;
```

## Hydration Pitfalls

**Date formatting mismatch:** Server renders a date, client re-renders with a different timezone.

```tsx
// Fix: suppress hydration warning on time elements
<time suppressHydrationWarning>{formatRelativeTime(date)}</time>
```

**Client-only content:** Content that depends on `window`, `localStorage`, or client state.

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return <Skeleton />;
return <ClientOnlyContent />;
```
