-- Curated AI workflows: multi-tool pipelines users can follow
CREATE TABLE workflows (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  cost_category    TEXT DEFAULT 'free' CHECK (cost_category IN ('free', 'paid')),
  difficulty       TEXT DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER,
  steps            JSONB NOT NULL DEFAULT '[]',
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workflows_active ON workflows (is_active);
CREATE INDEX idx_workflows_cost ON workflows (cost_category);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflows_public_read" ON workflows FOR SELECT USING (true);
CREATE POLICY "workflows_service_write" ON workflows FOR ALL
  USING (auth.role() = 'service_role');
