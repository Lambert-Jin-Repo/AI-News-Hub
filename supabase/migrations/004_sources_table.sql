-- 004: Sources table
-- Configuration for news sources (RSS feeds, APIs)

CREATE TABLE IF NOT EXISTS sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL
    CHECK (type IN ('rss', 'api')),
  config          JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  last_error      TEXT
);

-- Row-Level Security
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "sources_public_read" ON sources
  FOR SELECT USING (true);

-- Write access restricted to service role
CREATE POLICY "sources_service_write" ON sources
  FOR ALL USING (auth.role() = 'service_role');
