-- Migration 008: Add archived column to articles table
-- This column supports the weekly cleanup automation

ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_articles_is_archived ON articles (is_archived);

-- Drop the actual policy from migration 001 and recreate with archived filter
DROP POLICY IF EXISTS "articles_public_read" ON articles;
CREATE POLICY "articles_public_read" ON articles
  FOR SELECT USING (is_archived = false);

COMMENT ON COLUMN articles.is_archived IS 'Soft delete flag - archived articles are excluded from public queries';
