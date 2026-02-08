-- 002: Daily Digests table
-- Stores daily "Today in AI" narrative summaries and audio URLs

CREATE TABLE IF NOT EXISTS daily_digests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date   DATE UNIQUE NOT NULL,
  summary_text  TEXT,
  audio_url     TEXT,
  audio_status  TEXT DEFAULT 'pending'
    CHECK (audio_status IN ('pending', 'completed', 'failed')),
  article_ids   UUID[],
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Query by date
CREATE INDEX IF NOT EXISTS idx_digests_date ON daily_digests (digest_date DESC);

-- Row-Level Security
ALTER TABLE daily_digests ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "digests_public_read" ON daily_digests
  FOR SELECT USING (true);

-- Write access restricted to service role
CREATE POLICY "digests_service_write" ON daily_digests
  FOR ALL USING (auth.role() = 'service_role');
