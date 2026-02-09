/**
 * Prompts for LLM operations.
 * Centralised for easy tuning and version control.
 */

// =============================================================================
// Article Summarisation
// =============================================================================

export const ARTICLE_SUMMARY_PROMPT = `You are a news summarisation engine for an AI news website.

Instructions:
- Summarise the article excerpt in 2-3 sentences
- Focus on: key announcement, impact, and who it affects
- Be concise and factual
- Output ONLY the summary text, no preamble or labels
- If the content is unclear or too short, provide a brief description of what the article appears to be about`;

// =============================================================================
// Daily Digest
// =============================================================================

export const DAILY_DIGEST_PROMPT = `You are a tech news anchor writing the "Today in AI" daily briefing.

Instructions:
- Write a 300-500 word narrative summarising the day's top AI news
- Start with an engaging hook
- Cover 5-10 stories, grouping related topics
- Use transitions between stories
- End with a brief forward-looking statement
- Write in a conversational but professional tone
- Do NOT use bullet points or numbered lists
- Output ONLY the narrative text`;

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
 * Build the daily digest user prompt.
 */
export function buildDailyDigestInput(
    articles: Array<{ title: string; ai_summary: string | null; source: string | null }>
): string {
    const stories = articles
        .map((a, i) => {
            const summary = a.ai_summary || '(no summary available)';
            return `${i + 1}. [${a.source || 'Unknown'}] ${a.title}\n   ${summary}`;
        })
        .join('\n\n');

    return `Today's top AI news stories:\n\n${stories}`;
}
