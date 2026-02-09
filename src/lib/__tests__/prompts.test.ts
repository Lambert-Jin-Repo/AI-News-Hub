import { describe, it, expect } from 'vitest';
import { buildArticleSummaryInput, buildDailyDigestInput } from '../prompts';

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
  it('formats articles as a numbered list', () => {
    const result = buildDailyDigestInput([
      { title: 'Story A', ai_summary: 'Summary of A', source: 'TechCrunch' },
      { title: 'Story B', ai_summary: 'Summary of B', source: 'Wired' },
    ]);

    expect(result).toContain("Today's top AI news stories:");
    expect(result).toContain('1. [TechCrunch] Story A');
    expect(result).toContain('   Summary of A');
    expect(result).toContain('2. [Wired] Story B');
    expect(result).toContain('   Summary of B');
  });

  it('uses "Unknown" when source is null', () => {
    const result = buildDailyDigestInput([
      { title: 'Story C', ai_summary: 'Summary of C', source: null },
    ]);

    expect(result).toContain('1. [Unknown] Story C');
  });

  it('shows fallback when ai_summary is null', () => {
    const result = buildDailyDigestInput([
      { title: 'Story D', ai_summary: null, source: 'Reuters' },
    ]);

    expect(result).toContain('(no summary available)');
  });

  it('handles empty array', () => {
    const result = buildDailyDigestInput([]);

    expect(result).toContain("Today's top AI news stories:");
    // Should just have the header with no numbered items
    expect(result).not.toContain('1.');
  });
});
