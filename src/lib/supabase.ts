import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// TypeScript interfaces matching the database schema
// ---------------------------------------------------------------------------

export interface ArticleMetadata {
  relevance_score?: number;
  tech_stack?: string[];
  key_points?: string[];
  provider?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string | null;
  url: string;
  source: string | null;
  published_at: string | null;
  fetched_at: string;
  thumbnail_url: string | null;
  raw_excerpt: string | null;
  ai_summary: string | null;
  summary_status: 'pending' | 'completed' | 'failed_safety' | 'failed_quota' | 'skipped';
  is_featured: boolean;
  is_archived: boolean;
  category: string | null;
  ai_metadata: ArticleMetadata | null;
}

export interface DailyDigest {
  id: string;
  digest_date: string;
  summary_text: string | null;
  audio_url: string | null;
  audio_status: 'pending' | 'completed' | 'failed';
  article_ids: string[] | null;
  created_at: string;
}

export interface Tool {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  url: string | null;
  category: string | null;
  pricing_model: 'free' | 'freemium' | 'paid';
  tags: string[] | null;
  logo_url: string | null;
  date_added: string;
  is_active: boolean;
  needs_review: boolean;
  last_checked_at: string | null;
  check_fail_count: number;
}

export interface Source {
  id: string;
  name: string;
  type: 'rss' | 'api';
  config: Record<string, unknown>;
  is_active: boolean;
  last_fetched_at: string | null;
  last_error: string | null;
}

// ---------------------------------------------------------------------------
// Database type map (used for generic Supabase client typing)
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      articles: { Row: Article; Insert: Partial<Article> & Pick<Article, 'title' | 'url'>; Update: Partial<Article> };
      daily_digests: { Row: DailyDigest; Insert: Partial<DailyDigest> & Pick<DailyDigest, 'digest_date'>; Update: Partial<DailyDigest> };
      tools: { Row: Tool; Insert: Partial<Tool> & Pick<Tool, 'name'>; Update: Partial<Tool> };
      sources: { Row: Source; Insert: Partial<Source> & Pick<Source, 'name' | 'type'>; Update: Partial<Source> };
    };
  };
}

// ---------------------------------------------------------------------------
// Supabase clients (lazy initialization to handle build-time missing env vars)
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// New key format (2025+): sb_publishable_... replaces legacy anon key
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let _supabaseClient: SupabaseClient | null = null;

/**
 * Get the public Supabase client — respects RLS policies.
 * Returns null if env vars are missing (e.g., during CI build).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }
  if (!_supabaseClient) {
    _supabaseClient = createClient(supabaseUrl, supabasePublishableKey);
  }
  return _supabaseClient;
}

/**
 * Public Supabase client — respects RLS policies.
 * Use for read operations from the frontend or public API routes.
 * @deprecated Use getSupabaseClient() for null-safety during builds
 */
export const supabase: SupabaseClient = (() => {
  if (!supabaseUrl || !supabasePublishableKey) {
    // Return a dummy client that will fail at runtime but not at build time
    // This allows Next.js to complete static analysis
    return {} as SupabaseClient;
  }
  return createClient(supabaseUrl, supabasePublishableKey);
})();

/**
 * Admin Supabase client — bypasses RLS.
 * Use only in server-side cron jobs and admin operations.
 * Only available when SUPABASE_SECRET_KEY is set.
 */
export function getAdminClient(): SupabaseClient {
  // New key format (2025+): sb_secret_... replaces legacy service_role key
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey || !supabaseUrl) {
    throw new Error('SUPABASE_SECRET_KEY or SUPABASE_URL is not set — admin client unavailable');
  }
  return createClient(supabaseUrl, secretKey);
}
