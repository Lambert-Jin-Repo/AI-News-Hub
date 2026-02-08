import { describe, it, expect } from 'vitest';
import { sanitizeHtml, stripHtml, sanitizeText } from '../sanitize';

describe('sanitizeHtml', () => {
  it('keeps allowed tags', () => {
    expect(sanitizeHtml('<b>bold</b> and <em>italic</em>')).toBe(
      '<b>bold</b> and <em>italic</em>',
    );
  });

  it('strips script tags', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>Hello')).toBe('Hello');
  });

  it('strips event handlers', () => {
    expect(sanitizeHtml('<img onerror="alert(1)" src="x">')).toBe('');
  });

  it('allows href on anchor tags', () => {
    const input = '<a href="https://example.com">link</a>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('strips disallowed attributes', () => {
    expect(sanitizeHtml('<b style="color:red">text</b>')).toBe('<b>text</b>');
  });

  it('strips iframe tags', () => {
    expect(sanitizeHtml('<iframe src="https://evil.com"></iframe>')).toBe('');
  });
});

describe('stripHtml', () => {
  it('removes all HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('handles nested tags', () => {
    expect(stripHtml('<div><p><span>text</span></p></div>')).toBe('text');
  });

  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('');
  });
});

describe('sanitizeText', () => {
  it('strips HTML and trims', () => {
    expect(sanitizeText('  <b>hello</b>  ')).toBe('hello');
  });

  it('truncates to maxLength', () => {
    const long = 'a'.repeat(3000);
    expect(sanitizeText(long, 100).length).toBe(100);
  });

  it('does not truncate short text', () => {
    expect(sanitizeText('short', 1000)).toBe('short');
  });

  it('uses default maxLength of 2000', () => {
    const long = 'b'.repeat(2500);
    expect(sanitizeText(long).length).toBe(2000);
  });
});
