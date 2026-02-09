import { NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/auth';
import { generateDailyDigest } from '@/lib/digest-generator';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minute timeout for TTS generation

/**
 * POST /api/jobs/daily-digest
 * 
 * CRON endpoint to generate daily "Today in AI" digest.
 * Protected by CRON_SECRET.
 * 
 * Schedule: Daily at 7 AM AWST (0 23 * * * UTC)
 */
export async function POST(request: Request) {
    // Verify CRON secret
    if (!verifyCronAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await generateDailyDigest();

        return NextResponse.json({
            success: true,
            digestId: result.digestId,
            articleCount: result.articleCount,
            audioGenerated: result.audioUrl !== null,
            message: `Generated digest with ${result.articleCount} articles`,
        });
    } catch (error) {
        if (AppError.isDigestExists(error)) {
            return NextResponse.json(
                { error: 'Digest already exists for today', skipped: true },
                { status: 200 }
            );
        }

        const { logger } = await import('@/lib/logger');
        logger.error('Daily digest generation failed', error instanceof Error ? error : null);
        return NextResponse.json(
            {
                error: 'Daily digest generation failed',
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

// GET removed — CRON jobs must use POST to prevent accidental triggering by browsers/crawlers
