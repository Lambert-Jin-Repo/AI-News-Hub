-- 005: Add slug column to articles + seed initial news sources

-- Add slug column for SEO-friendly URLs (/news/[slug])
ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);

-- Seed initial news sources
INSERT INTO sources (name, type, config, is_active) VALUES
  (
    'TechCrunch AI',
    'rss',
    '{"url": "https://techcrunch.com/category/artificial-intelligence/feed/"}',
    true
  ),
  (
    'The Verge AI',
    'rss',
    '{"url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"}',
    true
  ),
  (
    'Ars Technica',
    'rss',
    '{"url": "https://feeds.arstechnica.com/arstechnica/technology-lab"}',
    true
  ),
  (
    'GNews',
    'api',
    '{"provider": "gnews", "query": "artificial intelligence", "lang": "en", "max": 10}',
    true
  )
ON CONFLICT DO NOTHING;
