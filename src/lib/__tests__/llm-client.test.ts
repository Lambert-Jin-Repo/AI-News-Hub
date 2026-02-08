import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wrapUserContent } from '../llm-client';

vi.mock('@google/generative-ai', () => {
  class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => 'Gemini response',
            candidates: [{ finishReason: 'STOP' }],
          },
        }),
      };
    }
  }
  return { GoogleGenerativeAI: MockGoogleGenerativeAI };
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

  it('uses Gemini when GEMINI_API_KEY is set', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');
    const { generateText } = await import('../llm-client');
    const result = await generateText('Summarise this', 'Some content');
    expect(result.text).toBe('Gemini response');
    expect(result.provider).toBe('gemini');
  });

  it('falls back to Groq when Gemini fails', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', 'test-groq-key');

    const { generateText } = await import('../llm-client');
    const result = await generateText('Summarise this', 'Some content');
    expect(result.text).toBe('Groq response');
    expect(result.provider).toBe('groq');
  });
});
