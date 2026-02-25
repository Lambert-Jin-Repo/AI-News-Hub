import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DailyWordCard } from "@/components/cards/DailyWordCard";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Sparkles, ArrowRight } from "lucide-react";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ page?: string }>;
}

const ITEMS_PER_PAGE = 12;

async function getDailyWords(page: number) {
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, count } = await supabase
        .from('daily_words')
        .select('id, term, content, provider, display_date, generated_at', { count: 'exact' })
        .order('display_date', { ascending: false })
        .range(from, to);

    return {
        words: data || [],
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / ITEMS_PER_PAGE),
    };
}

export default async function DailyWordsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page || '1', 10));
    const { words, total, totalPages } = await getDailyWords(page);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Page Header */}
                <div className="flex flex-col gap-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary transition-colors no-underline w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-accent/10 rounded-full text-accent">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[#0d1b1a] dark:text-white">
                                Daily Word Archive
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {total} AI terminologies explained by MiniMax — refreshed every 15 days
                            </p>
                        </div>
                    </div>
                </div>

                {/* Word Grid */}
                {words.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {words.map((word) => (
                            <DailyWordCard
                                key={word.id}
                                term={word.term}
                                content={word.content}
                                displayDate={word.display_date}
                                provider={word.provider}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                            No words yet
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                            Daily AI terminology will appear here once the pipeline runs.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-4">
                        {page > 1 ? (
                            <Link
                                href={`/daily-words?page=${page - 1}`}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--surface)] rounded-full shadow-soft text-sm font-bold text-primary hover:bg-primary hover:text-white transition-all no-underline"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Previous
                            </Link>
                        ) : (
                            <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-300 dark:text-gray-600 cursor-not-allowed">
                                <ArrowLeft className="w-4 h-4" />
                                Previous
                            </span>
                        )}

                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </span>

                        {page < totalPages ? (
                            <Link
                                href={`/daily-words?page=${page + 1}`}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--surface)] rounded-full shadow-soft text-sm font-bold text-primary hover:bg-primary hover:text-white transition-all no-underline"
                            >
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-300 dark:text-gray-600 cursor-not-allowed">
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </span>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
