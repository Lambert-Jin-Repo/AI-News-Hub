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

// State for controlling mock DB responses
let mockExistingDigest: { id: string } | null = null;
let mockArticles: Array<{ id: string; title: string; ai_summary: string | null; source: string | null; published_at: string }> | null = null;
let mockInsertedDigest: { id: string } | null = null;
let mockRetryDigest: { digest_date: string; summary_text: string | null; audio_status: string } | null = null;
const mockDbUpdate = vi.fn();
const mockStorageUpload = vi.fn();

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
              or: () => ({
                order: () => ({
                  order: () => ({
                    limit: () => ({ data: mockArticles, error: null }),
                  }),
                }),
              }),
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
    mockInsertedDigest = null;
    mockRetryDigest = null;
  });

  it('throws if digest already exists for today', async () => {
    mockExistingDigest = { id: 'existing-id' };

    const { generateDailyDigest } = await import('../digest-generator');
    await expect(generateDailyDigest()).rejects.toThrow('Digest already exists');
  });

  it('throws if no summarised articles found', async () => {
    mockExistingDigest = null;
    mockArticles = [];

    const { generateDailyDigest } = await import('../digest-generator');
    await expect(generateDailyDigest()).rejects.toThrow('No summarised articles');
  });

  it('generates summary text via LLM', async () => {
    mockExistingDigest = null;
    mockArticles = [
      { id: 'a1', title: 'Story 1', ai_summary: 'Summary 1', source: 'TC', published_at: new Date().toISOString() },
    ];
    mockInsertedDigest = { id: 'digest-1' };
    mockGenerateText.mockResolvedValue({ text: 'Today in AI...', provider: 'gemini' });
    mockGenerateSpeech.mockRejectedValue(new Error('TTS unavailable'));

    const { generateDailyDigest } = await import('../digest-generator');
    const result = await generateDailyDigest();

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    expect(result.summaryText).toBe('Today in AI...');
    expect(result.articleCount).toBe(1);
  });

  it('handles TTS success — uploads audio and updates status', async () => {
    mockExistingDigest = null;
    mockArticles = [
      { id: 'a1', title: 'Story 1', ai_summary: 'Summary', source: 'TC', published_at: new Date().toISOString() },
    ];
    mockInsertedDigest = { id: 'digest-1' };
    mockGenerateText.mockResolvedValue({ text: 'Digest text', provider: 'gemini' });
    mockGenerateSpeech.mockResolvedValue({
      audioBuffer: Buffer.from('audio-data'),
      contentType: 'audio/mpeg',
    });

    const { generateDailyDigest } = await import('../digest-generator');
    const result = await generateDailyDigest();

    expect(mockStorageUpload).toHaveBeenCalledTimes(1);
    expect(mockDbUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        audio_url: 'https://storage.example.com/digest.mp3',
        audio_status: 'completed',
      })
    );
    expect(result.audioUrl).toBe('https://storage.example.com/digest.mp3');
  });

  it('handles TTS failure — sets audio_status to failed but still returns digest', async () => {
    mockExistingDigest = null;
    mockArticles = [
      { id: 'a1', title: 'Story 1', ai_summary: 'Summary', source: 'TC', published_at: new Date().toISOString() },
    ];
    mockInsertedDigest = { id: 'digest-1' };
    mockGenerateText.mockResolvedValue({ text: 'Digest text', provider: 'gemini' });
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
    mockInsertedDigest = null;
    mockRetryDigest = null;
  });

  it('generates audio and returns URL on success', async () => {
    mockRetryDigest = {
      digest_date: '2026-01-15',
      summary_text: 'Summary to speak',
      audio_status: 'failed',
    };
    mockGenerateSpeech.mockResolvedValue({
      audioBuffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
    });

    const { retryDigestAudio } = await import('../digest-generator');
    const url = await retryDigestAudio('digest-retry');

    expect(mockGenerateSpeech).toHaveBeenCalledWith('Summary to speak');
    expect(mockStorageUpload).toHaveBeenCalledTimes(1);
    expect(url).toBe('https://storage.example.com/digest.mp3');
  });
});
