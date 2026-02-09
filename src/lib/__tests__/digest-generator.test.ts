import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock generateText
const mockGenerateText = vi.fn();
vi.mock('../llm-client', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

// Mock generateSpeech
const mockGenerateSpeech = vi.fn();
vi.mock('../tts-client', () => ({
  generateSpeech: (...args: unknown[]) => mockGenerateSpeech(...args),
}));

// Mock constants
vi.mock('../constants', () => ({
  ON_TOPIC_CATEGORIES: ['llm', 'agents', 'models', 'research'],
}));

// State for controlling mock DB responses
let mockExistingDigest: { id: string } | null = null;
let mockArticles: Array<{ id: string; title: string; ai_summary: string | null; source: string | null; published_at: string; category: string | null }> | null = null;
let mockExpandedArticles: Array<{ id: string; title: string; ai_summary: string | null; source: string | null; published_at: string; category: string | null }> | null = null;
let mockInsertedDigest: { id: string } | null = null;
let mockRetryDigest: { digest_date: string; summary_text: string | null; audio_status: string } | null = null;
const mockDbUpdate = vi.fn();
const mockStorageUpload = vi.fn();
const mockIn = vi.fn();
let articleQueryCount = 0;

vi.mock('../supabase', () => ({
  getAdminClient: () => ({
    from: (table: string) => {
      if (table === 'daily_digests') {
        return {
          select: (cols: string) => {
            // For existing digest check (select('id'))
            if (cols === 'id') {
              return {
                eq: () => ({
                  single: () => ({ data: mockExistingDigest, error: null }),
                }),
              };
            }
            // For retryDigestAudio (select with digest_date, summary_text, audio_status)
            return {
              eq: () => ({
                single: () => ({
                  data: mockRetryDigest,
                  error: mockRetryDigest ? null : { message: 'not found' },
                }),
              }),
            };
          },
          insert: () => ({
            select: () => ({
              single: () => ({
                data: mockInsertedDigest,
                error: mockInsertedDigest ? null : { message: 'insert failed' },
              }),
            }),
          }),
          update: (data: Record<string, unknown>) => {
            mockDbUpdate(data);
            return { eq: () => ({ error: null }) };
          },
        };
      }
      if (table === 'articles') {
        return {
          select: () => ({
            eq: () => ({
              in: (...args: unknown[]) => {
                mockIn(...args);
                return {
                  or: () => ({
                    order: () => ({
                      order: () => ({
                        limit: () => {
                          articleQueryCount++;
                          // First call returns 24h articles (via .order().order().limit())
                          if (articleQueryCount <= 1) {
                            return { data: mockArticles, error: null };
                          }
                          return { data: mockExpandedArticles ?? mockArticles, error: null };
                        },
                      }),
                      // For expanded query: .or().order().limit() (single order, no is_featured)
                      limit: () => {
                        articleQueryCount++;
                        return { data: mockExpandedArticles ?? mockArticles, error: null };
                      },
                    }),
                  }),
                };
              },
            }),
          }),
        };
      }
      return {};
    },
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => {
          mockStorageUpload(...args);
          return { error: null };
        },
        getPublicUrl: () => ({
          data: { publicUrl: 'https://storage.example.com/digest.mp3' },
        }),
      }),
    },
  }),
}));

describe('generateDailyDigest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistingDigest = null;
    mockArticles = null;
    mockExpandedArticles = null;
    mockInsertedDigest = null;
    mockRetryDigest = null;
    articleQueryCount = 0;
  });

  it('throws if digest already exists for today', async () => {
    mockExistingDigest = { id: 'existing-id' };

    const { generateDailyDigest } = await import('../digest-generator');
    await expect(generateDailyDigest()).rejects.toThrow('Digest already exists');
  });

  it('filters articles by ON_TOPIC_CATEGORIES', async () => {
    mockExistingDigest = null;
    mockArticles = [
      { id: 'a1', title: 'Story 1', ai_summary: 'Summary 1', source: 'TC', published_at: new Date().toISOString(), category: 'llm' },
      { id: 'a2', title: 'Story 2', ai_summary: 'Summary 2', source: 'TC', published_at: new Date().toISOString(), category: 'agents' },
      { id: 'a3', title: 'Story 3', ai_summary: 'Summary 3', source: 'TC', published_at: new Date().toISOString(), category: 'models' },
    ];
    mockInsertedDigest = { id: 'digest-1' };
    mockGenerateText.mockResolvedValue({ text: 'Digest text...', provider: 'gemini' });
    mockGenerateSpeech.mockRejectedValue(new Error('TTS unavailable'));

    const { generateDailyDigest } = await import('../digest-generator');
    await generateDailyDigest();

    // Verify .in() was called with ON_TOPIC_CATEGORIES
    expect(mockIn).toHaveBeenCalledWith('category', ['llm', 'agents', 'models', 'research']);
  });

  it('generates summary text via LLM and podcast script for TTS', async () => {
    mockExistingDigest = null;
    mockArticles = [
      { id: 'a1', title: 'Story 1', ai_summary: 'Summary 1', source: 'TC', published_at: new Date().toISOString(), category: 'llm' },
      { id: 'a2', title: 'Story 2', ai_summary: 'Summary 2', source: 'TC', published_at: new Date().toISOString(), category: 'agents' },
      { id: 'a3', title: 'Story 3', ai_summary: 'Summary 3', source: 'TC', published_at: new Date().toISOString(), category: 'models' },
    ];
    mockInsertedDigest = { id: 'digest-1' };
    // First call: digest summary, second call: audio script
    mockGenerateText
      .mockResolvedValueOnce({ text: '## The Big Picture\nToday in AI...', provider: 'gemini' })
      .mockResolvedValueOnce({ text: 'Good morning! Today in AI...', provider: 'gemini' });
    mockGenerateSpeech.mockResolvedValue({
      audioBuffer: Buffer.from('audio-data'),
      contentType: 'audio/mpeg',
    });

    const { generateDailyDigest } = await import('../digest-generator');
    const result = await generateDailyDigest();

    // Two LLM calls: digest + audio script
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
    expect(result.summaryText).toBe('## The Big Picture\nToday in AI...');
    expect(result.articleCount).toBe(3);
    // TTS called with podcast script, not digest text
    expect(mockGenerateSpeech).toHaveBeenCalledWith('Good morning! Today in AI...');
  });

  it('skips digest when fewer than 3 articles in 48h', async () => {
    mockExistingDigest = null;
    // First query (24h): only 2 articles
    mockArticles = [
      { id: 'a1', title: 'Story 1', ai_summary: 'Summary', source: 'TC', published_at: new Date().toISOString(), category: 'llm' },
      { id: 'a2', title: 'Story 2', ai_summary: 'Summary', source: 'TC', published_at: new Date().toISOString(), category: 'agents' },
    ];
    // Second query (48h): still only 2
    mockExpandedArticles = [
      { id: 'a1', title: 'Story 1', ai_summary: 'Summary', source: 'TC', published_at: new Date().toISOString(), category: 'llm' },
      { id: 'a2', title: 'Story 2', ai_summary: 'Summary', source: 'TC', published_at: new Date().toISOString(), category: 'agents' },
    ];

    const { generateDailyDigest } = await import('../digest-generator');
    const result = await generateDailyDigest();

    expect(result.skipped).toBe(true);
    expect(result.digestId).toBeNull();
    expect(result.articleCount).toBe(0);
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it('handles TTS failure — sets audio_status to failed but still returns digest', async () => {
    mockExistingDigest = null;
    mockArticles = [
      { id: 'a1', title: 'Story 1', ai_summary: 'Summary', source: 'TC', published_at: new Date().toISOString(), category: 'llm' },
      { id: 'a2', title: 'Story 2', ai_summary: 'Summary', source: 'TC', published_at: new Date().toISOString(), category: 'agents' },
      { id: 'a3', title: 'Story 3', ai_summary: 'Summary', source: 'TC', published_at: new Date().toISOString(), category: 'models' },
    ];
    mockInsertedDigest = { id: 'digest-1' };
    mockGenerateText
      .mockResolvedValueOnce({ text: 'Digest text', provider: 'gemini' })
      .mockResolvedValueOnce({ text: 'Podcast script', provider: 'gemini' });
    mockGenerateSpeech.mockRejectedValue(new Error('TTS service down'));

    const { generateDailyDigest } = await import('../digest-generator');
    const result = await generateDailyDigest();

    expect(mockDbUpdate).toHaveBeenCalledWith({ audio_status: 'failed' });
    expect(result.audioUrl).toBeNull();
    expect(result.digestId).toBe('digest-1');
  });
});

describe('retryDigestAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistingDigest = null;
    mockArticles = null;
    mockExpandedArticles = null;
    mockInsertedDigest = null;
    mockRetryDigest = null;
    articleQueryCount = 0;
  });

  it('generates audio script and audio, returns URL on success', async () => {
    mockRetryDigest = {
      digest_date: '2026-01-15',
      summary_text: 'Summary to speak',
      audio_status: 'failed',
    };
    // Audio script LLM call
    mockGenerateText.mockResolvedValue({ text: 'Podcast script from retry', provider: 'gemini' });
    mockGenerateSpeech.mockResolvedValue({
      audioBuffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
    });

    const { retryDigestAudio } = await import('../digest-generator');
    const url = await retryDigestAudio('digest-retry');

    // Should call generateText for audio script
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    expect(mockGenerateSpeech).toHaveBeenCalledWith('Podcast script from retry');
    expect(mockStorageUpload).toHaveBeenCalledTimes(1);
    expect(url).toBe('https://storage.example.com/digest.mp3');
  });
});
