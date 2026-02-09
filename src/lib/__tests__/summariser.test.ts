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

vi.mock('../constants', () => ({
  RELEVANCE_THRESHOLD: 5,
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
          update: (data: Record<string, unknown>) => {
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

describe('parseLLMResponse', () => {
  it('parses valid JSON response', async () => {
    const { parseLLMResponse } = await import('../summariser');
    const result = parseLLMResponse(JSON.stringify({
      classification: 'llm',
      relevance_score: 8,
      tldr: 'A new LLM was released.',
      key_points: ['Point 1', 'Point 2'],
      tech_stack: ['PyTorch'],
      why_it_matters: 'Faster inference for developers.',
    }));

    expect(result).not.toBeNull();
    expect(result!.classification).toBe('llm');
    expect(result!.relevance_score).toBe(8);
    expect(result!.key_points).toHaveLength(2);
  });

  it('handles markdown code fences', async () => {
    const { parseLLMResponse } = await import('../summariser');
    const result = parseLLMResponse('```json\n{"classification":"agents","relevance_score":7,"tldr":"Test","key_points":[],"tech_stack":[],"why_it_matters":"Test"}\n```');

    expect(result).not.toBeNull();
    expect(result!.classification).toBe('agents');
  });

  it('returns null on invalid JSON', async () => {
    const { parseLLMResponse } = await import('../summariser');
    const result = parseLLMResponse('This is not JSON at all.');

    expect(result).toBeNull();
  });

  it('returns null when required fields are missing', async () => {
    const { parseLLMResponse } = await import('../summariser');
    const result = parseLLMResponse(JSON.stringify({
      tldr: 'Missing classification',
      key_points: [],
    }));

    expect(result).toBeNull();
  });
});

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

    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({
        classification: 'llm',
        relevance_score: 8,
        tldr: 'Summary',
        key_points: ['Point'],
        tech_stack: [],
        why_it_matters: 'Matters',
      }),
      provider: 'gemini',
    });

    const { summarisePendingArticles } = await import('../summariser');
    const result = await summarisePendingArticles();

    expect(mockGenerateText).toHaveBeenCalledTimes(2);
    expect(result.processed).toBe(2);
    expect(result.completed).toBe(2);
    expect(result.failed).toBe(0);
  });

  it('stores category and ai_metadata in database update', async () => {
    mockArticlesData = [
      { id: 'abc', title: 'Article', raw_excerpt: 'Excerpt', source: 'Src' },
    ];

    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({
        classification: 'models',
        relevance_score: 9,
        tldr: 'A new model.',
        key_points: ['Fast', 'Cheap'],
        tech_stack: ['TensorFlow'],
        why_it_matters: 'Cost reduction.',
      }),
      provider: 'gemini',
    });

    const { summarisePendingArticles } = await import('../summariser');
    await summarisePendingArticles();

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        summary_status: 'completed',
        category: 'models',
        ai_metadata: {
          relevance_score: 9,
          tech_stack: ['TensorFlow'],
        },
      })
    );
    // ai_summary should contain formatted markdown
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.ai_summary).toContain('A new model.');
    expect(updateArg.ai_summary).toContain('- Fast');
    expect(updateArg.ai_summary).toContain('**Why it matters:** Cost reduction.');
  });

  it('skips articles with low relevance score', async () => {
    mockArticlesData = [
      { id: '1', title: 'Off-topic', raw_excerpt: 'Not relevant', source: null },
    ];

    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({
        classification: 'other',
        relevance_score: 3,
        tldr: 'Not about AI.',
        key_points: ['Irrelevant'],
        tech_stack: [],
        why_it_matters: 'It does not.',
      }),
      provider: 'gemini',
    });

    const { summarisePendingArticles } = await import('../summariser');
    const result = await summarisePendingArticles();

    expect(result.results[0].status).toBe('skipped');
    expect(result.results[0].category).toBe('other');
    expect(result.failed).toBe(1);
  });

  it('falls back to raw text when JSON parse fails', async () => {
    mockArticlesData = [
      { id: '1', title: 'Article', raw_excerpt: 'Excerpt', source: null },
    ];

    mockGenerateText.mockResolvedValue({ text: 'Plain text summary, not JSON.', provider: 'gemini' });

    const { summarisePendingArticles } = await import('../summariser');
    const result = await summarisePendingArticles();

    expect(result.results[0].status).toBe('completed');
    expect(result.results[0].summary).toBe('Plain text summary, not JSON.');
    expect(result.results[0].category).toBeUndefined();
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

  it('maps generic errors to skipped', async () => {
    mockArticlesData = [
      { id: '1', title: 'Article', raw_excerpt: null, source: null },
    ];

    mockGenerateText.mockRejectedValue(new Error('Network timeout'));

    const { summarisePendingArticles } = await import('../summariser');
    const result = await summarisePendingArticles();

    expect(result.results[0].status).toBe('skipped');
  });
});
