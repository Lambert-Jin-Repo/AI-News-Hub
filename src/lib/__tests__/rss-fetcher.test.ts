import { describe, it, expect, vi } from 'vitest';

// Mock rss-parser
vi.mock('rss-parser', () => {
  class MockParser {
    async parseURL() {
      return {
        items: [
          {
            title: 'AI Breakthrough in 2026',
            link: 'https://example.com/ai-breakthrough',
            isoDate: '2026-02-08T10:00:00Z',
            contentSnippet: 'Researchers achieve new milestone in AI.',
          },
          {
            title: 'GPT-5 Released',
            link: 'https://example.com/gpt5',
            pubDate: 'Sat, 08 Feb 2026 12:00:00 GMT',
            content: '<p>OpenAI releases GPT-5 with major improvements.</p>',
            mediaThumbnail: { $: { url: 'https://example.com/thumb.jpg' } },
          },
          {
            // Item with no title — should be filtered out
            link: 'https://example.com/no-title',
          },
          {
            // Item with no link — should be filtered out
            title: 'No Link Article',
          },
        ],
      };
    }
  }
  return { default: MockParser };
});

import { fetchRSS } from '../fetchers/rss-fetcher';

describe('fetchRSS', () => {
  it('parses articles from RSS feed', async () => {
    const articles = await fetchRSS('https://example.com/feed', 'TestSource');
    expect(articles).toHaveLength(2);
  });

  it('sanitises titles and generates slugs', async () => {
    const articles = await fetchRSS('https://example.com/feed', 'TestSource');
    expect(articles[0].title).toBe('AI Breakthrough in 2026');
    expect(articles[0].slug).toBe('ai-breakthrough-in-2026');
  });

  it('sets source name from parameter', async () => {
    const articles = await fetchRSS('https://example.com/feed', 'TechCrunch');
    expect(articles[0].source).toBe('TechCrunch');
  });

  it('extracts published_at from isoDate', async () => {
    const articles = await fetchRSS('https://example.com/feed', 'TestSource');
    expect(articles[0].published_at).toBe('2026-02-08T10:00:00Z');
  });

  it('uses contentSnippet for raw_excerpt', async () => {
    const articles = await fetchRSS('https://example.com/feed', 'TestSource');
    expect(articles[0].raw_excerpt).toBe('Researchers achieve new milestone in AI.');
  });

  it('strips HTML from content when contentSnippet is absent', async () => {
    const articles = await fetchRSS('https://example.com/feed', 'TestSource');
    expect(articles[1].raw_excerpt).toBe('OpenAI releases GPT-5 with major improvements.');
  });

  it('extracts thumbnail from media:thumbnail', async () => {
    const articles = await fetchRSS('https://example.com/feed', 'TestSource');
    expect(articles[1].thumbnail_url).toBe('https://example.com/thumb.jpg');
  });

  it('filters out items without title or link', async () => {
    const articles = await fetchRSS('https://example.com/feed', 'TestSource');
    const urls = articles.map((a) => a.url);
    expect(urls).not.toContain('https://example.com/no-title');
    expect(articles.every((a) => a.title)).toBe(true);
  });

  it('deduplicates slugs within the same feed', async () => {
    const articles = await fetchRSS('https://example.com/feed', 'TestSource');
    const slugs = articles.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
