import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mocks are available when vi.mock factory runs
const { mockInsert, mockFrom, mockGetAdminClient } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
  const mockGetAdminClient = vi.fn().mockReturnValue({ from: mockFrom });
  return { mockInsert, mockFrom, mockGetAdminClient };
});

vi.mock('../supabase', () => ({
  getAdminClient: mockGetAdminClient,
}));

import { logLLMUsage } from '../llm-logger';

describe('logLLMUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockGetAdminClient.mockReturnValue({ from: mockFrom });
  });

  it('inserts a log entry into llm_usage_logs', async () => {
    const entry = {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      feature: 'summarise',
      success: true,
      latency_ms: 1200,
      tokens_in: 100,
      tokens_out: 200,
      is_fallback: false,
    };

    logLLMUsage(entry);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockFrom).toHaveBeenCalledWith('llm_usage_logs');
    expect(mockInsert).toHaveBeenCalledWith(entry);
  });

  it('does not throw on insert failure', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'connection error' } });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const entry = {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      feature: 'digest',
      success: false,
      latency_ms: 0,
      error_type: 'timeout',
      is_fallback: true,
    };

    expect(() => logLLMUsage(entry)).not.toThrow();

    await new Promise((r) => setTimeout(r, 10));

    expect(consoleSpy).toHaveBeenCalledWith(
      '[llm-logger] Failed to log usage:',
      'connection error'
    );
    consoleSpy.mockRestore();
  });

  it('does not throw when getAdminClient throws', () => {
    mockGetAdminClient.mockImplementationOnce(() => {
      throw new Error('ENV missing');
    });

    expect(() =>
      logLLMUsage({
        provider: 'gemini',
        model: 'test',
        feature: 'test',
        success: true,
        latency_ms: 0,
        is_fallback: false,
      })
    ).not.toThrow();
  });
});
