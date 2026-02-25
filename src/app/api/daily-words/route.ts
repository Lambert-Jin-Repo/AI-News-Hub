import { NextRequest, NextResponse } from 'next/server';
import { getDailyWordHistory } from '@/lib/daily-word-generator';
import { DAILY_WORDS_PER_PAGE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * GET /api/daily-words?page=1&limit=12
 *
 * Public paginated endpoint returning daily word history.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || String(DAILY_WORDS_PER_PAGE), 10)));

    try {
        const { data, total } = await getDailyWordHistory(page, limit);

        return NextResponse.json({
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Failed to fetch daily word history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch daily word history' },
            { status: 500 },
        );
    }
}
