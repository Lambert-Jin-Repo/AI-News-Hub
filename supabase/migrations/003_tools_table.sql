-- 003: Tools table
-- AI tools directory with search, categories, and link health tracking

CREATE TABLE IF NOT EXISTS tools (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  url              TEXT,
  category         TEXT,
  pricing_model    TEXT DEFAULT 'free'
    CHECK (pricing_model IN ('free', 'freemium', 'paid')),
  tags             TEXT[],
  logo_url         TEXT,
  date_added       TIMESTAMPTZ DEFAULT now(),
  is_active        BOOLEAN DEFAULT true,
  needs_review     BOOLEAN DEFAULT false,
  last_checked_at  TIMESTAMPTZ,
  check_fail_count INTEGER DEFAULT 0,
  search_vector    TSVECTOR
);

-- Trigger function to update search_vector
CREATE OR REPLACE FUNCTION tools_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert/update
DROP TRIGGER IF EXISTS tools_search_vector_trigger ON tools;
CREATE TRIGGER tools_search_vector_trigger
  BEFORE INSERT OR UPDATE ON tools
  FOR EACH ROW EXECUTE FUNCTION tools_search_vector_update();

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_tools_search ON tools USING GIN (search_vector);

-- Common query patterns
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools (category);
CREATE INDEX IF NOT EXISTS idx_tools_is_active ON tools (is_active);

-- Row-Level Security
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- Public read access (only active tools)
CREATE POLICY "tools_public_read" ON tools
  FOR SELECT USING (true);

-- Write access restricted to service role
CREATE POLICY "tools_service_write" ON tools
  FOR ALL USING (auth.role() = 'service_role');
