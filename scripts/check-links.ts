#!/usr/bin/env npx tsx
/**
 * Link Health Checker Script
 * 
 * Checks all tool URLs for availability:
 * - HEAD request with timeout to each URL
 * - On failure: increment check_fail_count
 * - If check_fail_count >= 3: set needs_review = true
 * - On success: reset check_fail_count, update last_checked_at
 * 
 * Run: npx tsx scripts/check-links.ts
 */

import { createClient } from '@supabase/supabase-js';

// Environment validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SECRET_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const REQUEST_TIMEOUT_MS = 10000; // 10 seconds
const MAX_FAIL_COUNT = 3;
const CONCURRENCY_LIMIT = 5;

interface Tool {
    id: string;
    name: string;
    url: string | null;
    check_fail_count: number;
    needs_review: boolean;
}

interface CheckResult {
    toolId: string;
    toolName: string;
    url: string;
    status: 'ok' | 'failed';
    error?: string;
}

async function checkUrl(url: string): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'User-Agent': 'AI-News-Hub-Link-Checker/1.0',
            },
        });
        clearTimeout(timeoutId);
        // Consider 2xx and 3xx as success
        return response.ok || (response.status >= 300 && response.status < 400);
    } catch {
        clearTimeout(timeoutId);
        return false;
    }
}

async function checkTool(tool: Tool): Promise<CheckResult> {
    if (!tool.url) {
        return {
            toolId: tool.id,
            toolName: tool.name,
            url: '',
            status: 'failed',
            error: 'No URL provided',
        };
    }

    const isAccessible = await checkUrl(tool.url);

    if (isAccessible) {
        // Reset fail count on success
        await supabase
            .from('tools')
            .update({
                check_fail_count: 0,
                last_checked_at: new Date().toISOString(),
                needs_review: false,
            })
            .eq('id', tool.id);

        return {
            toolId: tool.id,
            toolName: tool.name,
            url: tool.url,
            status: 'ok',
        };
    } else {
        // Increment fail count on failure
        const newFailCount = tool.check_fail_count + 1;
        const needsReview = newFailCount >= MAX_FAIL_COUNT;

        await supabase
            .from('tools')
            .update({
                check_fail_count: newFailCount,
                last_checked_at: new Date().toISOString(),
                needs_review: needsReview,
            })
            .eq('id', tool.id);

        return {
            toolId: tool.id,
            toolName: tool.name,
            url: tool.url,
            status: 'failed',
            error: needsReview ? `Failed ${newFailCount} times - marked for review` : `Fail count: ${newFailCount}`,
        };
    }
}

async function processInBatches<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);

        // Progress indicator
        console.log(`  Checked ${Math.min(i + batchSize, items.length)}/${items.length} tools...`);
    }

    return results;
}

async function main(): Promise<void> {
    console.log('='.repeat(60));
    console.log('Link Health Checker');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    // Fetch all active tools with URLs
    const { data: tools, error } = await supabase
        .from('tools')
        .select('id, name, url, check_fail_count, needs_review')
        .eq('is_active', true)
        .not('url', 'is', null);

    if (error) {
        console.error('Failed to fetch tools:', error.message);
        process.exit(1);
    }

    if (!tools || tools.length === 0) {
        console.log('No active tools with URLs to check');
        process.exit(0);
    }

    console.log(`\nChecking ${tools.length} tools...`);

    // Check all tools with concurrency limit
    const results = await processInBatches(tools as Tool[], checkTool, CONCURRENCY_LIMIT);

    // Summarize results
    const okCount = results.filter((r) => r.status === 'ok').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;
    const markedForReview = results.filter((r) => r.error?.includes('marked for review')).length;

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`  ✓ Accessible: ${okCount}`);
    console.log(`  ✗ Failed: ${failedCount}`);
    console.log(`  ⚠ Marked for review: ${markedForReview}`);

    // List failed tools
    const failedTools = results.filter((r) => r.status === 'failed');
    if (failedTools.length > 0) {
        console.log('\nFailed tools:');
        failedTools.forEach((tool) => {
            console.log(`  - ${tool.toolName}: ${tool.error}`);
        });
    }

    console.log('\n✓ Link check completed');
    process.exit(0);
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
