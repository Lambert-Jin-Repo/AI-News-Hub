import pLimit from 'p-limit';
import { generateText } from './llm-client';
import { ARTICLE_SUMMARY_PROMPT, buildArticleSummaryInput } from './prompts';
import { getAdminClient, type ArticleMetadata } from './supabase';
import { RELEVANCE_THRESHOLD } from './constants';
import { AppError } from './errors';

// Minimal article fields needed for summarisation
type ArticleForSummary = {
    id: string;
    title: string;
    raw_excerpt: string | null;
    source: string | null;
};

export type SummarisationResult = {
    id: string;
    status: 'completed' | 'failed_safety' | 'failed_quota' | 'skipped';
    summary?: string;
    category?: string;
    metadata?: ArticleMetadata;
    error?: string;
};

// Structured response from the LLM
export interface ArticleLLMResponse {
    classification: string;
    relevance_score: number;
    tldr: string;
    key_points: string[];
    tech_stack: string[];
    why_it_matters: string;
}

/**
 * Parse the JSON response from the LLM.
 * Returns null if the response is not valid JSON or missing required fields.
 */
export function parseLLMResponse(text: string): ArticleLLMResponse | null {
    try {
        // Strip markdown code fences if present
        const cleaned = text.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
        const parsed = JSON.parse(cleaned);

        // Validate required fields
        if (!parsed.classification || typeof parsed.relevance_score !== 'number') {
            return null;
        }
        return parsed as ArticleLLMResponse;
    } catch {
        return null;
    }
}

/**
 * Format a parsed LLM response into readable markdown for ai_summary.
 */
function formatSummaryMarkdown(parsed: ArticleLLMResponse): string {
    const lines: string[] = [];
    lines.push(parsed.tldr);
    lines.push('');
    if (parsed.key_points.length > 0) {
        parsed.key_points.forEach((point: string) => lines.push(`- ${point}`));
        lines.push('');
    }
    if (parsed.why_it_matters) {
        lines.push(`**Why it matters:** ${parsed.why_it_matters}`);
    }
    return lines.join('\n');
}

/**
 * Summarise a single article using the LLM client.
 * Parses JSON response to extract classification, relevance, and structured summary.
 */
async function summariseArticle(article: ArticleForSummary): Promise<SummarisationResult> {
    try {
        const input = buildArticleSummaryInput({
            title: article.title,
            excerpt: article.raw_excerpt,
            source: article.source,
        });

        const response = await generateText(ARTICLE_SUMMARY_PROMPT, input);
        const parsed = parseLLMResponse(response.text);

        if (parsed) {
            // Check relevance threshold
            if (parsed.relevance_score < RELEVANCE_THRESHOLD) {
                return {
                    id: article.id,
                    status: 'skipped',
                    category: parsed.classification,
                    metadata: {
                        relevance_score: parsed.relevance_score,
                        tech_stack: parsed.tech_stack,
                    },
                    error: `Low relevance score: ${parsed.relevance_score}/${RELEVANCE_THRESHOLD}`,
                };
            }

            return {
                id: article.id,
                status: 'completed',
                summary: formatSummaryMarkdown(parsed),
                category: parsed.classification,
                metadata: {
                    relevance_score: parsed.relevance_score,
                    tech_stack: parsed.tech_stack,
                },
            };
        }

        // Fallback: JSON parse failed, store raw text
        return {
            id: article.id,
            status: 'completed',
            summary: response.text,
        };
    } catch (error) {
        if (AppError.isSafetyBlock(error)) {
            return {
                id: article.id,
                status: 'failed_safety',
                error: 'Content blocked by safety filters',
            };
        }

        if (AppError.isQuotaOrRateLimit(error)) {
            return {
                id: article.id,
                status: 'failed_quota',
                error: error instanceof Error ? error.message : String(error),
            };
        }

        return {
            id: article.id,
            status: 'skipped',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Fetch pending articles and summarise them in batches.
 * Uses rate-limited concurrency to avoid hitting API limits.
 */
export async function summarisePendingArticles(batchSize = 10): Promise<{
    processed: number;
    completed: number;
    failed: number;
    results: SummarisationResult[];
}> {
    const supabase = getAdminClient();

    // Fetch pending articles - only columns we need
    const { data: articles, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, raw_excerpt, source')
        .eq('summary_status', 'pending')
        .order('fetched_at', { ascending: true })
        .limit(batchSize);

    if (fetchError) {
        throw new Error(`Failed to fetch pending articles: ${fetchError.message}`);
    }

    if (!articles || articles.length === 0) {
        return { processed: 0, completed: 0, failed: 0, results: [] };
    }

    // Rate-limited concurrency (3 at a time)
    const limit = pLimit(3);
    const results = await Promise.all(
        articles.map((article) => limit(() => summariseArticle(article)))
    );

    // Update database with results
    for (const result of results) {
        const updateData: Record<string, unknown> = {
            summary_status: result.status,
        };

        if (result.summary) updateData.ai_summary = result.summary;
        if (result.category) updateData.category = result.category;
        if (result.metadata) updateData.ai_metadata = result.metadata;

        await supabase.from('articles').update(updateData).eq('id', result.id);
    }

    const completed = results.filter((r) => r.status === 'completed').length;
    const failed = results.filter((r) => r.status !== 'completed').length;

    return {
        processed: results.length,
        completed,
        failed,
        results,
    };
}
