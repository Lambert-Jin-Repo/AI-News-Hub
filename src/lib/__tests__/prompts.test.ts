import { describe, it, expect } from 'vitest';
import {
  buildArticleSummaryInput,
  buildDailyDigestInput,
  buildAudioScriptInput,
  buildToolDiscoveryInput,
  buildWorkflowSuggestInput,
} from '../prompts';

describe('buildArticleSummaryInput', () => {
  it('includes title, source, and excerpt', () => {
    const result = buildArticleSummaryInput({
      title: 'OpenAI releases GPT-5',
      source: 'TechCrunch',
      excerpt: 'The new model shows significant improvements.',
    });

    expect(result).toContain('Title: OpenAI releases GPT-5');
    expect(result).toContain('Source: TechCrunch');
    expect(result).toContain('Excerpt: The new model shows significant improvements.');
  });

  it('handles null source gracefully', () => {
    const result = buildArticleSummaryInput({
      title: 'New AI breakthrough',
      source: null,
      excerpt: 'Details here.',
    });

    expect(result).toContain('Title: New AI breakthrough');
    expect(result).not.toContain('Source:');
    expect(result).toContain('Excerpt: Details here.');
  });

  it('handles null excerpt gracefully', () => {
    const result = buildArticleSummaryInput({
      title: 'Breaking news',
      source: 'Reuters',
      excerpt: null,
    });

    expect(result).toContain('Title: Breaking news');
    expect(result).toContain('Source: Reuters');
    expect(result).not.toContain('Excerpt:');
  });

  it('handles both source and excerpt null', () => {
    const result = buildArticleSummaryInput({
      title: 'Title only',
      source: null,
      excerpt: null,
    });

    expect(result).toBe('Title: Title only');
  });
});

describe('buildDailyDigestInput', () => {
  it('formats articles as a numbered list with category prefix', () => {
    const result = buildDailyDigestInput([
      { title: 'Story A', ai_summary: 'Summary of A', source: 'TechCrunch', category: 'llm' },
      { title: 'Story B', ai_summary: 'Summary of B', source: 'Wired', category: 'agents' },
    ]);

    expect(result).toContain("Today's top AI news stories:");
    expect(result).toContain('1. [LLM] [TechCrunch] Story A');
    expect(result).toContain('   Summary of A');
    expect(result).toContain('2. [AGENTS] [Wired] Story B');
    expect(result).toContain('   Summary of B');
  });

  it('uses "Unknown" when source is null', () => {
    const result = buildDailyDigestInput([
      { title: 'Story C', ai_summary: 'Summary of C', source: null, category: 'models' },
    ]);

    expect(result).toContain('1. [MODELS] [Unknown] Story C');
  });

  it('shows fallback when ai_summary is null', () => {
    const result = buildDailyDigestInput([
      { title: 'Story D', ai_summary: null, source: 'Reuters', category: 'llm' },
    ]);

    expect(result).toContain('(no summary available)');
  });

  it('handles null category gracefully', () => {
    const result = buildDailyDigestInput([
      { title: 'Story E', ai_summary: 'Summary', source: 'BBC', category: null },
    ]);

    expect(result).toContain('1.  [BBC] Story E');
    expect(result).not.toContain('[NULL]');
  });

  it('handles empty array', () => {
    const result = buildDailyDigestInput([]);

    expect(result).toContain("Today's top AI news stories:");
    // Should just have the header with no numbered items
    expect(result).not.toContain('1.');
  });
});

describe('buildAudioScriptInput', () => {
  it('wraps digest text with instruction prefix', () => {
    const result = buildAudioScriptInput('## The Big Picture\nSome content here.');

    expect(result).toContain('Written briefing to convert to podcast script:');
    expect(result).toContain('## The Big Picture');
    expect(result).toContain('Some content here.');
  });

  it('handles empty digest text', () => {
    const result = buildAudioScriptInput('');

    expect(result).toContain('Written briefing to convert to podcast script:');
  });
});

describe('buildToolDiscoveryInput', () => {
  it('includes existing tool names for deduplication', () => {
    const result = buildToolDiscoveryInput(['ChatGPT', 'Midjourney', 'Cursor']);

    expect(result).toContain('do NOT include these');
    expect(result).toContain('- ChatGPT');
    expect(result).toContain('- Midjourney');
    expect(result).toContain('- Cursor');
  });

  it('handles empty existing tools', () => {
    const result = buildToolDiscoveryInput([]);

    expect(result).toContain('trending AI tools');
    expect(result).not.toContain('do NOT include these');
  });

  it('includes focus on recent traction', () => {
    const result = buildToolDiscoveryInput([]);

    expect(result).toContain('last 30 days');
  });
});

describe('buildWorkflowSuggestInput', () => {
  it('includes goal and tool list', () => {
    const result = buildWorkflowSuggestInput('Build a chatbot', 'Tool A\nTool B', true);

    expect(result).toContain('Goal: "Build a chatbot"');
    expect(result).toContain('Tool A');
    expect(result).toContain('Tool B');
  });

  it('includes external tool permission when allowed', () => {
    const result = buildWorkflowSuggestInput('Build an app', 'Tool A', true);

    expect(result).toContain('suggest external tools');
    expect(result).not.toContain('Do NOT suggest external');
  });

  it('excludes external tools when not allowed', () => {
    const result = buildWorkflowSuggestInput('Build an app', 'Tool A', false);

    expect(result).toContain('Do NOT suggest external tools');
    expect(result).not.toContain('significantly improve');
  });
});

