/**
 * Prompts for LLM operations.
 * Centralised for easy tuning and version control.
 */

// =============================================================================
// Article Summarisation
// =============================================================================

export const ARTICLE_SUMMARY_PROMPT = `You are a Senior AI Engineer classifying and summarising news articles for a developer-focused AI news site.

Instructions:
1. Classify the article into one category: llm, agents, models, research, tools, other
2. Rate relevance to LLM/AI practitioners on a 1-10 scale (10 = directly about new LLM/agent/model releases)
3. Extract a structured summary

Respond with ONLY valid JSON in this exact format:
{
  "classification": "llm|agents|models|research|tools|other",
  "relevance_score": 1-10,
  "tldr": "One sentence of impact",
  "key_points": ["Point 1", "Point 2"],
  "tech_stack": ["Library or API mentioned, if any"],
  "why_it_matters": "One line of practical impact for developers"
}

Rules:
- classification must be exactly one of: llm, agents, models, research, tools, other
- relevance_score must be an integer 1-10
- key_points should have 2-3 items
- tech_stack can be empty array if no specific tech mentioned
- Be concise and factual, no hype`;

// =============================================================================
// Daily Digest
// =============================================================================

export const DAILY_DIGEST_PROMPT = `You are the editor of a developer-focused AI briefing called "Today in AI".

Write a structured daily briefing using EXACTLY these sections with markdown headers:

## The Big Picture
2-3 sentences summarising the day's overarching theme or most important development.

## Key Releases
- Bullet list of model launches, tool updates, or major announcements
- Each bullet: **Name** — what it does and why it matters
- 3-6 items

## Worth Watching
- Bullet list of emerging trends, research papers, or early-stage developments
- 2-4 items

## Developer Takeaway
One actionable insight or recommendation based on today's news. What should a developer do differently after reading this?

Rules:
- Use bullet points (not numbered lists) in Key Releases and Worth Watching
- Bold the name/title of each item
- Keep total length 300-500 words
- Be specific with numbers, model names, and benchmarks when available
- Output ONLY the markdown sections, no preamble`;

// =============================================================================
// Audio Script (TTS)
// =============================================================================

export const AUDIO_SCRIPT_PROMPT = `You are a podcast host for a 2-minute daily AI briefing called "Today in AI".

Convert the following written briefing into a natural, conversational audio script.

Rules:
- Write as if speaking to a friend who's a developer
- Start with "Good morning!" or a similar greeting
- Use casual transitions: "Now here's the interesting part...", "Speaking of which...", "And finally..."
- Pronounce acronyms naturally (say "GPT" not "G-P-T", say "llama" not "L-L-A-M-A")
- Replace markdown formatting with spoken equivalents (no bullet points, no headers)
- End with a brief sign-off like "That's your AI briefing for today. Have a great one!"
- Keep the same information but make it flow as natural speech
- 300-450 words
- Output ONLY the script text, no stage directions`;

// =============================================================================
// Prompt Helpers
// =============================================================================

/**
 * Build the article summarisation user prompt.
 */
export function buildArticleSummaryInput(article: {
    title: string;
    excerpt: string | null;
    source: string | null;
}): string {
    const parts = [`Title: ${article.title}`];
    if (article.source) parts.push(`Source: ${article.source}`);
    if (article.excerpt) parts.push(`Excerpt: ${article.excerpt}`);
    return parts.join('\n\n');
}

/**
 * Build the daily digest user prompt with category grouping.
 */
export function buildDailyDigestInput(
    articles: Array<{ title: string; ai_summary: string | null; source: string | null; category: string | null }>
): string {
    const stories = articles
        .map((a: { title: string; ai_summary: string | null; source: string | null; category: string | null }, i: number) => {
            const summary = a.ai_summary || '(no summary available)';
            const cat = a.category ? `[${a.category.toUpperCase()}]` : '';
            return `${i + 1}. ${cat} [${a.source || 'Unknown'}] ${a.title}\n   ${summary}`;
        })
        .join('\n\n');

    return `Today's top AI news stories:\n\n${stories}`;
}

/**
 * Build the audio script user prompt from a written digest.
 */
export function buildAudioScriptInput(digestText: string): string {
    return `Written briefing to convert to podcast script:\n\n${digestText}`;
}
