import { verifyCronAuth, unauthorizedResponse, successResponse, errorResponse } from '@/lib/auth';
import { generateDailyWord } from '@/lib/daily-word-generator';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/jobs/generate-daily-word
 *
 * CRON endpoint to pre-generate today's daily word.
 * Protected by CRON_SECRET.
 *
 * Schedule: Daily at 6 AM AWST (0 22 * * * UTC)
 */
export async function POST(request: Request) {
    if (!verifyCronAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        logger.info('Daily word generation job started');

        const result = await generateDailyWord();

        logger.info('Daily word generation job completed', {
            term: result.term,
            provider: result.provider,
            isExisting: result.isExisting,
        });

        return successResponse({
            message: result.isExisting
                ? `Word already exists for today: "${result.term}"`
                : `Generated word: "${result.term}"`,
            term: result.term,
            provider: result.provider,
            display_date: result.display_date,
            isExisting: result.isExisting,
        });
    } catch (err) {
        logger.error('Daily word generation job failed', err instanceof Error ? err : null);
        return errorResponse(
            err instanceof Error ? err.message : 'Internal error',
        );
    }
}
