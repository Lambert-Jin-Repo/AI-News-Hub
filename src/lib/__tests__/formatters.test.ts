import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime, truncate, slugify } from '../formatters';

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for very recent dates', () => {
    expect(formatRelativeTime(new Date())).toBe('just now');
  });

  it('returns minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:10:00Z'));
    expect(formatRelativeTime('2026-01-15T12:05:00Z')).toBe('5 minutes ago');
    vi.useRealTimers();
  });

  it('returns singular minute', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:01:30Z'));
    expect(formatRelativeTime('2026-01-15T12:00:00Z')).toBe('1 minute ago');
    vi.useRealTimers();
  });

  it('returns hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T15:00:00Z'));
    expect(formatRelativeTime('2026-01-15T12:00:00Z')).toBe('3 hours ago');
    vi.useRealTimers();
  });

  it('returns days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-18T12:00:00Z'));
    expect(formatRelativeTime('2026-01-15T12:00:00Z')).toBe('3 days ago');
    vi.useRealTimers();
  });

  it('returns "just now" for future dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    expect(formatRelativeTime('2026-01-15T13:00:00Z')).toBe('just now');
    vi.useRealTimers();
  });

  it('accepts Date objects', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });
});

describe('truncate', () => {
  it('returns original if within limit', () => {
    expect(truncate('short', 100)).toBe('short');
  });

  it('truncates and adds ellipsis', () => {
    expect(truncate('Hello World', 8)).toBe('Hello W…');
  });

  it('uses custom suffix', () => {
    expect(truncate('Hello World', 9, '...')).toBe('Hello...');
  });

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

describe('slugify', () => {
  it('converts to lowercase with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips diacritics', () => {
    expect(slugify('café résumé')).toBe('cafe-resume');
  });

  it('removes special characters', () => {
    expect(slugify("Hello World! — It's 2026")).toBe('hello-world-it-s-2026');
  });

  it('collapses consecutive hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
  });
});
