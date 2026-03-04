import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wrapUserContent } from '../llm-client';

vi.mock('openai', () => {
  class MockOpenAI {
    private baseURL: string;
    constructor(opts: { baseURL?: string }) {
      this.baseURL = opts.baseURL || '';
    }
    chat = {
      completions: {
        create: vi.fn().mockImplementation(() => {
          // Gemini endpoint
          if (this.baseURL.includes('generativelanguage.googleapis.com')) {
            return Promise.resolve({
              choices: [{ message: { content: 'Gemini response' } }],
            });
          }
          // MiniMax endpoint
          return Promise.resolve({
            choices: [{ message: { content: 'MiniMax response' } }],
          });
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

  it('uses Gemini as default provider', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');
    const { generateText } = await import('../llm-client');
    const result = await generateText('Summarise this', 'Some content');
    expect(result.text).toBe('Gemini response');
    expect(result.provider).toBe('gemini');
  });

  it('falls back to Groq when Gemini fails (default chain)', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', 'test-groq-key');

    const { generateText } = await import('../llm-client');
    const result = await generateText('Summarise this', 'Some content');
    expect(result.text).toBe('Groq response');
    expect(result.provider).toBe('groq');
  });

  it('uses MiniMax when provider is explicitly set to minimax', async () => {
    vi.stubEnv('MINIMAX_API_KEY', 'test-minimax-key');
    const { generateText } = await import('../llm-client');
    const result = await generateText('Generate workflow', 'Some content', { provider: 'minimax' });
    expect(result.text).toBe('MiniMax response');
    expect(result.provider).toBe('minimax');
  });

  it('falls back through MiniMax → Gemini → Groq chain', async () => {
    vi.stubEnv('MINIMAX_API_KEY', '');
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', 'test-groq-key');

    const { generateText } = await import('../llm-client');
    const result = await generateText('Generate workflow', 'Some content', { provider: 'minimax' });
    expect(result.text).toBe('Groq response');
    expect(result.provider).toBe('groq');
  });
});
