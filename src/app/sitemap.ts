import { MetadataRoute } from 'next';
import { getSupabaseClient } from '@/lib/supabase';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ainewshub.dev';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/news`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/tools`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];

    // Get Supabase client (null during build if env vars missing)
    const supabase = getSupabaseClient();

    // If no Supabase client (during build), return only static pages
    if (!supabase) {
        return staticPages;
    }

    // Dynamic article pages
    const { data: articles } = await supabase
        .from('articles')
        .select('slug, published_at')
        .not('slug', 'is', null)
        .order('published_at', { ascending: false })
        .limit(500);

    const articlePages: MetadataRoute.Sitemap = (articles || [])
        .filter((article) => article.slug)
        .map((article) => ({
            url: `${BASE_URL}/news/${article.slug}`,
            lastModified: article.published_at ? new Date(article.published_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));

    // Dynamic tool pages
    const { data: tools } = await supabase
        .from('tools')
        .select('slug, date_added')
        .not('slug', 'is', null)
        .eq('is_active', true)
        .order('date_added', { ascending: false })
        .limit(500);

    const toolPages: MetadataRoute.Sitemap = (tools || [])
        .filter((tool) => tool.slug)
        .map((tool) => ({
            url: `${BASE_URL}/tools/${tool.slug}`,
            lastModified: tool.date_added ? new Date(tool.date_added) : new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));

    return [...staticPages, ...articlePages, ...toolPages];
}

