import { NextResponse } from 'next/server';
import { getTodayWord, generateDailyWord } from '@/lib/daily-word-generator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/terminology
 *
 * Returns today's word of the day.
 * Reads from Supabase first; if no word exists for today,
 * generates one on-the-fly using MiniMax and persists it.
 */
export async function GET() {
    try {
        // Try to read from Supabase first
        const cached = await getTodayWord();
        if (cached) {
            return NextResponse.json(cached);
        }

        // No word for today — generate and persist
        const result = await generateDailyWord();
        return NextResponse.json({
            term: result.term,
            content: result.content,
            provider: result.provider,
            display_date: result.display_date,
        });
    } catch (error) {
        console.error('Failed to get daily terminology:', error);
        return NextResponse.json(
            { error: 'Failed to get terminology' },
            { status: 500 },
        );
    }
}
