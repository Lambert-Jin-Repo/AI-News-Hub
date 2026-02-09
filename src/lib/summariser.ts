import pLimit from 'p-limit';
import { generateText, LLMError } from './llm-client';
import { ARTICLE_SUMMARY_PROMPT, buildArticleSummaryInput } from './prompts';
import { getAdminClient } from './supabase';

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
    error?: string;
};

/**
 * Summarise a single article using the LLM client.
 */
async function summariseArticle(article: ArticleForSummary): Promise<SummarisationResult> {
    try {
        const input = buildArticleSummaryInput({
            title: article.title,
            excerpt: article.raw_excerpt,
            source: article.source,
        });

        const response = await generateText(ARTICLE_SUMMARY_PROMPT, input);

        return {
            id: article.id,
            status: 'completed',
            summary: response.text,
        };
    } catch (error) {
        // Check for safety block
        if (
            typeof error === 'object' &&
            error !== null &&
            'isSafetyBlock' in error &&
            (error as LLMError).isSafetyBlock
        ) {
            return {
                id: article.id,
                status: 'failed_safety',
                error: 'Content blocked by safety filters',
            };
        }

        // Check for quota error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate')) {
            return {
                id: article.id,
                status: 'failed_quota',
                error: errorMessage,
            };
        }

        return {
            id: article.id,
            status: 'skipped',
            error: errorMessage,
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
        const updateData: Record<string, string> = {
            summary_status: result.status,
        };

        if (result.summary) {
            updateData.ai_summary = result.summary;
        }

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
