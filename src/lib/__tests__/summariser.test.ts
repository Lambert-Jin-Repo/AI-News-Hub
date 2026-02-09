import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
const mockGenerateText = vi.fn();
vi.mock('../llm-client', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  LLMError: class LLMError extends Error {
    provider = 'gemini';
    isSafetyBlock = false;
  },
}));

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

vi.mock('../supabase', () => ({
  getAdminClient: () => ({
    from: (table: string) => {
      if (table === 'articles') {
        return {
          select: (...args: unknown[]) => {
            mockSelect(...args);
            return {
              eq: (...eqArgs: unknown[]) => {
                mockEq(...eqArgs);
                return {
                  order: (...orderArgs: unknown[]) => {
                    mockOrder(...orderArgs);
                    return {
                      limit: (n: number) => {
                        mockLimit(n);
                        return { data: mockArticlesData, error: null };
                      },
                    };
                  },
                };
              },
            };
          },
          update: (data: Record<string, string>) => {
            mockUpdate(data);
            return {
              eq: () => ({ error: null }),
            };
          },
        };
      }
      return {};
    },
  }),
}));

// Shared mock data (overridden per test)
let mockArticlesData: Array<{
  id: string;
  title: string;
  raw_excerpt: string | null;
  source: string | null;
}> | null = null;

describe('summarisePendingArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockArticlesData = null;
  });

  it('returns early when no pending articles', async () => {
    mockArticlesData = [];

    const { summarisePendingArticles } = await import('../summariser');
    const result = await summarisePendingArticles();

    expect(result.processed).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.results).toEqual([]);
  });

  it('calls generateText for each article', async () => {
    mockArticlesData = [
      { id: '1', title: 'Article A', raw_excerpt: 'Excerpt A', source: 'Source A' },
      { id: '2', title: 'Article B', raw_excerpt: 'Excerpt B', source: 'Source B' },
    ];

    mockGenerateText.mockResolvedValue({ text: 'AI summary', provider: 'gemini' });

    const { summarisePendingArticles } = await import('../summariser');
    const result = await summarisePendingArticles();

    expect(mockGenerateText).toHaveBeenCalledTimes(2);
    expect(result.processed).toBe(2);
    expect(result.completed).toBe(2);
    expect(result.failed).toBe(0);
  });

  it('maps safety block errors to failed_safety', async () => {
    mockArticlesData = [
      { id: '1', title: 'Bad Article', raw_excerpt: 'Bad content', source: null },
    ];

    const safetyError = { isSafetyBlock: true, provider: 'gemini', message: 'blocked' };
    mockGenerateText.mockRejectedValue(safetyError);

    const { summarisePendingArticles } = await import('../summariser');
    const result = await summarisePendingArticles();

    expect(result.results[0].status).toBe('failed_safety');
    expect(result.failed).toBe(1);
  });

  it('maps quota errors to failed_quota', async () => {
    mockArticlesData = [
      { id: '1', title: 'Article', raw_excerpt: null, source: null },
    ];

    mockGenerateText.mockRejectedValue(new Error('API quota exceeded'));

    const { summarisePendingArticles } = await import('../summariser');
    const result = await summarisePendingArticles();

    expect(result.results[0].status).toBe('failed_quota');
  });

  it('maps rate limit errors to failed_quota', async () => {
    mockArticlesData = [
      { id: '1', title: 'Article', raw_excerpt: null, source: null },
    ];

    mockGenerateText.mockRejectedValue(new Error('rate limit reached'));

    const { summarisePendingArticles } = await import('../summariser');
    const result = await summarisePendingArticles();

    expect(result.results[0].status).toBe('failed_quota');
  });

  it('maps generic errors to skipped', async () => {
    mockArticlesData = [
      { id: '1', title: 'Article', raw_excerpt: null, source: null },
    ];

    mockGenerateText.mockRejectedValue(new Error('Network timeout'));

    const { summarisePendingArticles } = await import('../summariser');
    const result = await summarisePendingArticles();

    expect(result.results[0].status).toBe('skipped');
  });

  it('updates database with results', async () => {
    mockArticlesData = [
      { id: 'abc', title: 'Article', raw_excerpt: 'Excerpt', source: 'Src' },
    ];

    mockGenerateText.mockResolvedValue({ text: 'Generated summary', provider: 'gemini' });

    const { summarisePendingArticles } = await import('../summariser');
    await summarisePendingArticles();

    expect(mockUpdate).toHaveBeenCalledWith({
      summary_status: 'completed',
      ai_summary: 'Generated summary',
    });
  });
});
