-- Migration 008: Add archived column to articles table
-- This column supports the weekly cleanup automation

-- Add is_archived column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Create index for efficient filtering of non-archived articles
CREATE INDEX IF NOT EXISTS idx_articles_is_archived ON articles (is_archived);

-- Update RLS policy to exclude archived articles from public reads
-- (Recreate the policy to include the is_archived filter)
DROP POLICY IF EXISTS "Public can read articles" ON articles;
CREATE POLICY "Public can read articles" ON articles
  FOR SELECT
  USING (is_archived = false);

-- Admin can still read all articles including archived ones
DROP POLICY IF EXISTS "Service role can manage articles" ON articles;
CREATE POLICY "Service role can manage articles" ON articles
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON COLUMN articles.is_archived IS 'Soft delete flag - archived articles are excluded from public queries';
