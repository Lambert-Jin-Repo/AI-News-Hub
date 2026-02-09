-- Migration 009: Add category and ai_metadata columns to articles
-- Supports LLM-focus filtering and structured summary data

ALTER TABLE articles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);

-- Add constraint for allowed values (loose — allows NULL for unclassified)
ALTER TABLE articles ADD CONSTRAINT articles_category_check
  CHECK (category IS NULL OR category IN ('llm', 'agents', 'models', 'research', 'tools', 'other'));

COMMENT ON COLUMN articles.category IS 'Article classification: llm, agents, models, research, tools, other';
COMMENT ON COLUMN articles.ai_metadata IS 'Structured extraction data from LLM (tech_stack, relevance_score, etc.)';
