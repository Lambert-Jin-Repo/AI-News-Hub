#!/usr/bin/env npx tsx
/**
 * E2E Pipeline Testing Script
 * 
 * Verifies all 3 CRON job pipelines work correctly:
 * 1. fetch-news: Fetches news from sources → articles in DB
 * 2. summarise: Generates AI summaries for pending articles
 * 3. daily-digest: Creates digest with audio
 * 
 * Usage:
 *   Local: npx tsx scripts/test-pipelines.ts
 *   With custom base URL: BASE_URL=http://localhost:3000 npx tsx scripts/test-pipelines.ts
 */

interface PipelineResult {
    name: string;
    status: 'success' | 'failed' | 'skipped';
    duration: number;
    message: string;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

async function testPipeline(
    name: string,
    endpoint: string,
    validator: (response: Response, data: unknown) => Promise<{ valid: boolean; message: string }>
): Promise<PipelineResult> {
    const startTime = Date.now();

    try {
        console.log(`\n  Testing ${name}...`);

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (CRON_SECRET) {
            headers['x-cron-secret'] = CRON_SECRET;
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
        });

        const data = await response.json().catch(() => null);
        const duration = Date.now() - startTime;

        if (!response.ok) {
            return {
                name,
                status: 'failed',
                duration,
                message: `HTTP ${response.status}: ${JSON.stringify(data)}`,
            };
        }

        const validation = await validator(response, data);

        return {
            name,
            status: validation.valid ? 'success' : 'failed',
            duration,
            message: validation.message,
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        return {
            name,
            status: 'failed',
            duration,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

async function main(): Promise<void> {
    console.log('='.repeat(60));
    console.log('E2E Pipeline Testing');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    if (!CRON_SECRET) {
        console.log('\n⚠ CRON_SECRET not set - endpoints may reject requests');
    }

    const results: PipelineResult[] = [];

    // 1. Test fetch-news pipeline
    results.push(
        await testPipeline(
            'fetch-news',
            '/api/jobs/fetch-news',
            async (_response, data) => {
                const result = data as { fetched?: number; errors?: string[] };
                if (typeof result?.fetched === 'number') {
                    return {
                        valid: true,
                        message: `Fetched ${result.fetched} articles`,
                    };
                }
                return {
                    valid: false,
                    message: 'Unexpected response format',
                };
            }
        )
    );

    // 2. Test summarise pipeline
    results.push(
        await testPipeline(
            'summarise',
            '/api/jobs/summarise',
            async (_response, data) => {
                const result = data as { processed?: number; skipped?: number };
                if (typeof result?.processed === 'number') {
                    return {
                        valid: true,
                        message: `Processed ${result.processed}, skipped ${result.skipped || 0}`,
                    };
                }
                return {
                    valid: false,
                    message: 'Unexpected response format',
                };
            }
        )
    );

    // 3. Test daily-digest pipeline
    results.push(
        await testPipeline(
            'daily-digest',
            '/api/jobs/daily-digest',
            async (_response, data) => {
                const result = data as { digest_id?: string; audio_status?: string };
                if (result?.digest_id) {
                    return {
                        valid: true,
                        message: `Digest created: ${result.digest_id}, audio: ${result.audio_status || 'N/A'}`,
                    };
                }
                // May return message if already exists for today
                if ((data as { message?: string })?.message) {
                    return {
                        valid: true,
                        message: (data as { message: string }).message,
                    };
                }
                return {
                    valid: false,
                    message: 'Unexpected response format',
                };
            }
        )
    );

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Results:');
    console.log('='.repeat(60));

    let hasFailure = false;
    for (const result of results) {
        const icon = result.status === 'success' ? '✓' : result.status === 'skipped' ? '○' : '✗';
        const color = result.status === 'success' ? '' : result.status === 'skipped' ? '' : '!';
        console.log(`\n${icon} ${result.name} (${result.duration}ms)${color}`);
        console.log(`   ${result.message}`);
        if (result.status === 'failed') hasFailure = true;
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${successCount}/${results.length} passed in ${totalDuration}ms`);

    if (hasFailure) {
        console.log('\n⚠ Some pipelines failed - check logs above');
        process.exit(1);
    } else {
        console.log('\n✓ All pipelines passed');
        process.exit(0);
    }
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
