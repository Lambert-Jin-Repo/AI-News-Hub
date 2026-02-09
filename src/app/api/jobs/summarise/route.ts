import { NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/auth';
import { summarisePendingArticles } from '@/lib/summariser';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout for Cloud Run

/**
 * POST /api/jobs/summarise
 * 
 * CRON endpoint to summarise pending articles.
 * Protected by CRON_SECRET.
 * 
 * Schedule: Hourly (0 * * * *)
 */
export async function POST(request: Request) {
    // Verify CRON secret
    if (!verifyCronAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await summarisePendingArticles(10);

        return NextResponse.json({
            success: true,
            ...result,
            message: `Processed ${result.processed} articles: ${result.completed} completed, ${result.failed} failed`,
        });
    } catch (error) {
        console.error('Summarisation job failed:', error);
        return NextResponse.json(
            {
                error: 'Summarisation job failed',
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

// Also support GET for manual testing
export async function GET(request: Request) {
    return POST(request);
}
