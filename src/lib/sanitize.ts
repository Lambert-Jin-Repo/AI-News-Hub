import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML — removes XSS vectors while keeping safe markup.
 * Allows basic formatting tags only.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Strip all HTML tags, returning plain text.
 * Useful for preparing content for LLM prompts or display.
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize plain text — strip HTML and enforce a max length.
 * Suitable for titles, excerpts, and other short text fields.
 */
export function sanitizeText(dirty: string, maxLength = 2000): string {
  const clean = stripHtml(dirty).trim();
  if (clean.length <= maxLength) return clean;
  // Break on word boundary to avoid cutting mid-word
  const truncated = clean.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace);
  }
  return truncated;
}
