import { describe, it, expect } from 'vitest';
import {
  expandAcronyms,
  expandAbbreviations,
  stripMarkdown,
  preprocessForTTS,
} from '../tts-preprocessor';

describe('expandAcronyms', () => {
  it('expands AI to A.I.', () => {
    expect(expandAcronyms('AI is transforming the world')).toBe(
      'A.I. is transforming the world',
    );
  });

  it('expands multiple acronyms', () => {
    expect(expandAcronyms('LLM and NLP and API')).toBe(
      'L.L.M. and N.L.P. and A.P.I.',
    );
  });

  it('does not expand partial matches', () => {
    expect(expandAcronyms('FAIR and MAIN')).toBe('FAIR and MAIN');
  });

  it('handles LLMs plural', () => {
    expect(expandAcronyms('LLMs are popular')).toBe('L.L.M.s are popular');
  });
});

describe('expandAbbreviations', () => {
  it('expands e.g. to for example', () => {
    expect(expandAbbreviations('e.g. Python')).toBe('for example Python');
  });

  it('expands etc.', () => {
    expect(expandAbbreviations('Python, Java, etc.')).toBe(
      'Python, Java, etcetera',
    );
  });
});

describe('stripMarkdown', () => {
  it('removes headers', () => {
    expect(stripMarkdown('## Hello World')).toBe('Hello World');
  });

  it('converts links to text', () => {
    expect(stripMarkdown('[click here](https://example.com)')).toBe(
      'click here',
    );
  });

  it('removes bold and italic', () => {
    expect(stripMarkdown('**bold** and *italic*')).toBe('bold and italic');
  });

  it('removes inline code', () => {
    expect(stripMarkdown('run `npm test`')).toBe('run npm test');
  });

  it('removes images but keeps alt text', () => {
    expect(stripMarkdown('![alt text](image.png)')).toBe('alt text');
  });

  it('removes blockquotes', () => {
    expect(stripMarkdown('> quoted text')).toBe('quoted text');
  });
});

describe('preprocessForTTS', () => {
  it('applies full pipeline', () => {
    const input = '## AI News\n\n**OpenAI** released a new API, e.g. GPT.';
    const result = preprocessForTTS(input);
    expect(result).toContain('A.I.');
    expect(result).toContain('A.P.I.');
    expect(result).toContain('for example');
    expect(result).not.toContain('##');
    expect(result).not.toContain('**');
  });

  it('normalises whitespace', () => {
    const input = 'Hello   \n\n  world';
    expect(preprocessForTTS(input)).toBe('Hello world');
  });
});
