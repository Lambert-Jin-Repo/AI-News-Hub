/**
 * Daily Word Generator
 *
 * Uses MiniMax M2.5 (via the existing LLM client) to generate
 * one AI terminology explanation per day, persisted in Supabase.
 *
 * Content is bulk-refreshed every 15 days with new explanations
 * for the same term list (overwriting previous content).
 */

import { generateText } from './llm-client';
import { DAILY_WORD_PROMPT, buildDailyWordInput } from './prompts';
import { getAdminClient, supabase } from './supabase';
import { DAILY_WORD_REFRESH_DAYS } from './constants';
import { logger } from './logger';

// ---------------------------------------------------------------------------
// Expanded AI term list (~30 terms for richer rotation)
// ---------------------------------------------------------------------------

export const AI_TERMS = [
    'AI Agent',
    'Retrieval-Augmented Generation (RAG)',
    'Mixture of Experts (MoE)',
    'Vibe Coding',
    'Zero-Shot Learning',
    'Few-Shot Prompting',
    'Vector Database',
    'Large Language Model (LLM)',
    'Chain of Thought (CoT)',
    'Constitutional AI',
    'Fine-Tuning',
    'Transformer Architecture',
    'Semantic Search',
    'Context Window',
    'Agentic Workflow',
    'Tool Use / Function Calling',
    'Prompt Engineering',
    'Model Weights',
    'Reinforcement Learning from Human Feedback (RLHF)',
    'Hallucination',
    'Embedding',
    'Tokenization',
    'Multi-Modal AI',
    'Knowledge Distillation',
    'Inference',
    'Quantization',
    'LoRA (Low-Rank Adaptation)',
    'Diffusion Models',
    'Agentic RAG',
    'Guardrails',
] as const;

// ---------------------------------------------------------------------------
// Cycle management
// ---------------------------------------------------------------------------

/**
 * Fixed epoch for cycle calculation: 2026-01-01.
 * Cycle increments every DAILY_WORD_REFRESH_DAYS days.
 */
const EPOCH = new Date('2026-01-01T00:00:00Z');

/**
 * Calculate the current cycle ID based on days since epoch.
 */
export function getCurrentCycleId(): number {
    const now = new Date();
    const diffMs = now.getTime() - EPOCH.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return Math.floor(diffDays / DAILY_WORD_REFRESH_DAYS) + 1;
}

/**
 * Get the term for today based on date rotation through the list.
 */
export function getTodayTermIndex(): number {
    const today = new Date();
    const seed = today.getFullYear() * 10000
        + (today.getMonth() + 1) * 100
        + today.getDate();
    return seed % AI_TERMS.length;
}

// ---------------------------------------------------------------------------
// Read operations (public client)
// ---------------------------------------------------------------------------

export interface DailyWordResult {
    term: string;
    content: string;
    provider: string | null;
    display_date: string;
}

/**
 * Get today's word from Supabase.
 * Returns null if no word exists for today.
 */
export async function getTodayWord(): Promise<DailyWordResult | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
        .from('daily_words')
        .select('term, content, provider, display_date')
        .eq('display_date', today)
        .single();

    return data;
}

/**
 * Get paginated history of all daily words.
 */
export async function getDailyWordHistory(page: number, limit: number) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count } = await supabase
        .from('daily_words')
        .select('id, term, content, provider, display_date, generated_at', { count: 'exact' })
        .order('display_date', { ascending: false })
        .range(from, to);

    return {
        data: data || [],
        total: count ?? 0,
    };
}

// ---------------------------------------------------------------------------
// Write operations (admin client, used by CRON jobs)
// ---------------------------------------------------------------------------

export interface GenerateWordResult {
    term: string;
    content: string;
    provider: string;
    display_date: string;
    isExisting: boolean;
}

/**
 * Generate today's daily word and save to Supabase.
 * If a word already exists for today, returns it without regenerating.
 */
export async function generateDailyWord(): Promise<GenerateWordResult> {
    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const cycleId = getCurrentCycleId();
    const termIndex = getTodayTermIndex();
    const term = AI_TERMS[termIndex];

    // Check if word already exists for today
    const { data: existing } = await supabase
        .from('daily_words')
        .select('term, content, provider, display_date')
        .eq('display_date', today)
        .single();

    if (existing) {
        logger.info('Daily word already exists for today', { term: existing.term, date: today });
        return {
            term: existing.term,
            content: existing.content,
            provider: existing.provider || 'unknown',
            display_date: existing.display_date,
            isExisting: true,
        };
    }

    // Generate with MiniMax (falls back to Groq)
    logger.info('Generating daily word', { term, date: today, cycleId });
    const userInput = buildDailyWordInput(term);
    const { text, provider } = await generateText(DAILY_WORD_PROMPT, userInput);

    // Upsert (overwrite if same term + cycle)
    const { error: insertError } = await supabase
        .from('daily_words')
        .upsert({
            term,
            content: text,
            provider,
            display_date: today,
            cycle_id: cycleId,
        }, { onConflict: 'term,cycle_id' });

    if (insertError) {
        throw new Error(`Failed to save daily word: ${insertError.message}`);
    }

    logger.info('Daily word generated and saved', { term, provider, date: today });

    return {
        term,
        content: text,
        provider,
        display_date: today,
        isExisting: false,
    };
}

/**
 * Bulk-refresh ALL daily words for the current cycle.
 * Regenerates content for every term in AI_TERMS and assigns
 * them display dates starting from today.
 *
 * This overwrites any existing words for the current cycle.
 */
export async function refreshAllDailyWords(): Promise<{
    generated: number;
    failed: number;
    errors: string[];
}> {
    const supabase = getAdminClient();
    const cycleId = getCurrentCycleId();
    const today = new Date();
    let generated = 0;
    let failed = 0;
    const errors: string[] = [];

    logger.info('Starting bulk daily word refresh', {
        cycleId,
        termCount: AI_TERMS.length,
        startDate: today.toISOString().split('T')[0],
    });

    for (let i = 0; i < AI_TERMS.length; i++) {
        const term = AI_TERMS[i];
        // Assign display dates: term 0 = today, term 1 = tomorrow, etc.
        const displayDate = new Date(today);
        displayDate.setDate(today.getDate() + i);
        const dateStr = displayDate.toISOString().split('T')[0];

        try {
            const userInput = buildDailyWordInput(term);
            const { text, provider } = await generateText(DAILY_WORD_PROMPT, userInput);

            await supabase
                .from('daily_words')
                .upsert({
                    term,
                    content: text,
                    provider,
                    display_date: dateStr,
                    cycle_id: cycleId,
                }, { onConflict: 'term,cycle_id' });

            generated++;
            logger.info(`Generated word ${i + 1}/${AI_TERMS.length}`, { term, provider, date: dateStr });
        } catch (err) {
            failed++;
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`${term}: ${msg}`);
            logger.error(`Failed to generate word for "${term}"`, err instanceof Error ? err : null);
        }
    }

    logger.info('Bulk daily word refresh complete', { generated, failed, cycleId });

    return { generated, failed, errors };
}
