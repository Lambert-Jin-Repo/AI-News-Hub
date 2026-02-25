import { verifyCronAuth, unauthorizedResponse, successResponse, errorResponse } from '@/lib/auth';
import { runToolDiscovery } from '@/lib/tool-discovery';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Discovery + categorisation may need multiple LLM calls

export async function POST(request: Request) {
    if (!verifyCronAuth(request)) {
        return unauthorizedResponse();
    }

    try {
        logger.info('Tool discovery job started');

        const result = await runToolDiscovery();

        if (result.errors.length > 0) {
            logger.warn('Tool discovery completed with errors', {
                errors: result.errors,
                discovered: result.discovered,
                inserted: result.inserted,
            });
        }

        logger.info('Tool discovery job completed', {
            discovered: result.discovered,
            inserted: result.inserted,
            updated: result.updated,
            deactivated: result.deactivated,
        });

        return successResponse({
            message: `Discovery complete: ${result.discovered} found, ${result.inserted} inserted, ${result.updated} updated, ${result.deactivated} deactivated`,
            ...result,
        });
    } catch (err) {
        logger.error('Tool discovery job failed', err instanceof Error ? err : null);
        return errorResponse(
            err instanceof Error ? err.message : 'Internal error',
        );
    }
}
