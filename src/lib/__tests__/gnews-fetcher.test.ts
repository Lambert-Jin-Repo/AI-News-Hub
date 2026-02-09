import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGNews } from '../fetchers/gnews-fetcher';

const mockResponse = {
  totalArticles: 2,
  articles: [
    {
      title: 'AI Research Update',
      description: 'New developments in AI research.',
      content: 'Full content here...',
      url: 'https://example.com/ai-research',
      image: 'https://example.com/image1.jpg',
      publishedAt: '2026-02-08T08:00:00Z',
      source: { name: 'AI Daily', url: 'https://aidaily.com' },
    },
    {
      title: 'Machine Learning Trends',
      description: 'Top ML trends for 2026.',
      content: 'Full content about ML...',
      url: 'https://example.com/ml-trends',
      image: null,
      publishedAt: '2026-02-08T06:00:00Z',
      source: { name: 'Tech News', url: 'https://technews.com' },
    },
  ],
};

describe('fetchGNews', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('GNEWS_API_KEY', 'test-api-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );
  });

  it('fetches and parses articles', async () => {
    const articles = await fetchGNews({ query: 'AI', lang: 'en', max: 10 });
    expect(articles).toHaveLength(2);
  });

  it('sanitises titles and generates slugs', async () => {
    const articles = await fetchGNews({ query: 'AI' });
    expect(articles[0].title).toBe('AI Research Update');
    expect(articles[0].slug).toBe('ai-research-update');
  });

  it('uses source name from GNews response', async () => {
    const articles = await fetchGNews({ query: 'AI' });
    expect(articles[0].source).toBe('AI Daily');
    expect(articles[1].source).toBe('Tech News');
  });

  it('maps image to thumbnail_url', async () => {
    const articles = await fetchGNews({ query: 'AI' });
    expect(articles[0].thumbnail_url).toBe('https://example.com/image1.jpg');
    expect(articles[1].thumbnail_url).toBeNull();
  });

  it('maps description to raw_excerpt', async () => {
    const articles = await fetchGNews({ query: 'AI' });
    expect(articles[0].raw_excerpt).toBe('New developments in AI research.');
  });

  it('throws when GNEWS_API_KEY is not set', async () => {
    vi.stubEnv('GNEWS_API_KEY', '');
    await expect(fetchGNews({ query: 'AI' })).rejects.toThrow('GNEWS_API_KEY is not set');
  });

  it('throws on API error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      }),
    );
    await expect(fetchGNews({ query: 'AI' })).rejects.toThrow('GNews API error 403');
  });

  it('constructs correct URL with query parameters', async () => {
    await fetchGNews({ query: 'machine learning', lang: 'en', max: 5 });
    const fetchMock = vi.mocked(fetch);
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('q=machine%20learning');
    expect(calledUrl).toContain('lang=en');
    expect(calledUrl).toContain('max=5');
    expect(calledUrl).toContain('token=test-api-key');
  });
});
