import { NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/auth';
import { generateDailyDigest } from '@/lib/digest-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minute timeout for TTS generation

/**
 * POST /api/jobs/daily-digest
 * 
 * CRON endpoint to generate daily "Today in AI" digest.
 * Protected by CRON_SECRET.
 * 
 * Schedule: Daily at 6 AM AWST (0 22 * * * UTC)
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
        console.error('Daily digest generation failed:', error);

        // Check if digest already exists
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('already exists')) {
            return NextResponse.json(
                { error: 'Digest already exists for today', skipped: true },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                error: 'Daily digest generation failed',
                message: errorMessage,
            },
            { status: 500 }
        );
    }
}

// Also support GET for manual testing
export async function GET(request: Request) {
    return POST(request);
}
