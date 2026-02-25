import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wrapUserContent } from '../llm-client';

vi.mock('openai', () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'MiniMax response' } }],
        }),
      },
    };
  }
  return { default: MockOpenAI };
});

vi.mock('groq-sdk', () => {
  class MockGroq {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Groq response' } }],
        }),
      },
    };
  }
  return { default: MockGroq };
});

describe('wrapUserContent', () => {
  it('wraps content with XML tags', () => {
    const result = wrapUserContent('test content');
    expect(result).toBe(
      '<user_provided_content>\ntest content\n</user_provided_content>',
    );
  });

  it('handles empty content', () => {
    const result = wrapUserContent('');
    expect(result).toBe(
      '<user_provided_content>\n\n</user_provided_content>',
    );
  });
});

describe('generateText', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses MiniMax when MINIMAX_API_KEY is set', async () => {
    vi.stubEnv('MINIMAX_API_KEY', 'test-minimax-key');
    const { generateText } = await import('../llm-client');
    const result = await generateText('Summarise this', 'Some content');
    expect(result.text).toBe('MiniMax response');
    expect(result.provider).toBe('minimax');
  });

  it('falls back to Groq when MiniMax fails', async () => {
    vi.stubEnv('MINIMAX_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', 'test-groq-key');

    const { generateText } = await import('../llm-client');
    const result = await generateText('Summarise this', 'Some content');
    expect(result.text).toBe('Groq response');
    expect(result.provider).toBe('groq');
  });
});
