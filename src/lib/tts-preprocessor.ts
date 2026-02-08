/**
 * TTS Pre-processor
 *
 * Transforms text so that text-to-speech engines pronounce it naturally.
 * Handles acronyms, abbreviations, markdown, and special characters.
 */

const ACRONYMS: Record<string, string> = {
  AI: 'A.I.',
  API: 'A.P.I.',
  APIs: 'A.P.I.s',
  AWS: 'A.W.S.',
  CEO: 'C.E.O.',
  CLI: 'C.L.I.',
  CPU: 'C.P.U.',
  CSS: 'C.S.S.',
  CTO: 'C.T.O.',
  DB: 'D.B.',
  DL: 'D.L.',
  FAQ: 'F.A.Q.',
  GCP: 'G.C.P.',
  GPU: 'G.P.U.',
  HTML: 'H.T.M.L.',
  HTTP: 'H.T.T.P.',
  HTTPS: 'H.T.T.P.S.',
  IDE: 'I.D.E.',
  IoT: 'I.o.T.',
  JSON: 'J.S.O.N.',
  LLM: 'L.L.M.',
  LLMs: 'L.L.M.s',
  ML: 'M.L.',
  NLP: 'N.L.P.',
  OSS: 'O.S.S.',
  RAG: 'R.A.G.',
  REST: 'R.E.S.T.',
  SDK: 'S.D.K.',
  SQL: 'S.Q.L.',
  SaaS: 'S.a.a.S.',
  SSH: 'S.S.H.',
  SSL: 'S.S.L.',
  TTS: 'T.T.S.',
  UI: 'U.I.',
  URL: 'U.R.L.',
  URLs: 'U.R.L.s',
  USB: 'U.S.B.',
  UX: 'U.X.',
  VPN: 'V.P.N.',
  XSS: 'X.S.S.',
};

const ABBREVIATIONS: Record<string, string> = {
  'vs.': 'versus',
  'e.g.': 'for example',
  'i.e.': 'that is',
  'etc.': 'etcetera',
  'approx.': 'approximately',
};

/**
 * Expand known acronyms to dotted form so TTS spells them out.
 * Only matches whole words (word-boundary aware).
 */
export function expandAcronyms(text: string): string {
  let result = text;
  for (const [acronym, expansion] of Object.entries(ACRONYMS)) {
    const pattern = new RegExp(`\\b${acronym}\\b`, 'g');
    result = result.replace(pattern, expansion);
  }
  return result;
}

/**
 * Expand common abbreviations to full words.
 */
export function expandAbbreviations(text: string): string {
  let result = text;
  for (const [abbr, expansion] of Object.entries(ABBREVIATIONS)) {
    result = result.replaceAll(abbr, expansion);
  }
  return result;
}

/**
 * Strip markdown formatting (headers, bold, italic, links, images, code).
 */
export function stripMarkdown(text: string): string {
  return (
    text
      // Remove images: ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Convert links: [text](url) → text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove headers: ## Header → Header
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic: **text** or __text__ → text
      .replace(/(\*{1,3}|_{1,3})([^*_]+)\1/g, '$2')
      // Remove inline code: `code` → code
      .replace(/`([^`]+)`/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove blockquotes: > text → text
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Remove list markers: - item or * item or 1. item
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Collapse multiple blank lines
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Full pre-processing pipeline for TTS input.
 * Strips markdown, expands acronyms and abbreviations, cleans whitespace.
 */
export function preprocessForTTS(text: string): string {
  let result = stripMarkdown(text);
  result = expandAcronyms(result);
  result = expandAbbreviations(result);
  // Normalise whitespace
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}
