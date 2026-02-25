import { verifyCronAuth, unauthorizedResponse, successResponse, errorResponse } from '@/lib/auth';
import { refreshAllDailyWords } from '@/lib/daily-word-generator';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minute timeout — generating 30 words sequentially

/**
 * POST /api/jobs/refresh-daily-words
 *
 * CRON endpoint to bulk-regenerate all daily words for the current cycle.
 * Protected by CRON_SECRET.
 *
 * Schedule: 1st and 16th of each month (0 0 1,16 * * UTC)
 * This ensures content is refreshed every ~15 days.
 */
export async function POST(request: Request) {
    if (!verifyCronAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        logger.info('Daily words bulk refresh job started');

        const result = await refreshAllDailyWords();

        logger.info('Daily words bulk refresh job completed', {
            generated: result.generated,
            failed: result.failed,
        });

        return successResponse({
            message: `Refresh complete: ${result.generated} generated, ${result.failed} failed`,
            ...result,
        });
    } catch (err) {
        logger.error('Daily words bulk refresh job failed', err instanceof Error ? err : null);
        return errorResponse(
            err instanceof Error ? err.message : 'Internal error',
        );
    }
}
