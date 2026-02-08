-- 001: Articles table
-- Stores fetched AI news articles with AI-generated summaries

CREATE TABLE IF NOT EXISTS articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  url           TEXT UNIQUE NOT NULL,
  source        TEXT,
  published_at  TIMESTAMPTZ,
  fetched_at    TIMESTAMPTZ DEFAULT now(),
  thumbnail_url TEXT,
  raw_excerpt   TEXT,
  ai_summary    TEXT,
  summary_status TEXT DEFAULT 'pending'
    CHECK (summary_status IN ('pending', 'completed', 'failed_safety', 'failed_quota', 'skipped')),
  is_featured   BOOLEAN DEFAULT false,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(raw_excerpt, '') || ' ' ||
      coalesce(ai_summary, '')
    )
  ) STORED
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN (search_vector);

-- Common query patterns
CREATE INDEX IF NOT EXISTS idx_articles_fetched_at ON articles (fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_summary_status ON articles (summary_status);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles (source);

-- Row-Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required for visitors)
CREATE POLICY "articles_public_read" ON articles
  FOR SELECT USING (true);

-- Write access restricted to service role (used by cron jobs)
CREATE POLICY "articles_service_write" ON articles
  FOR ALL USING (auth.role() = 'service_role');
