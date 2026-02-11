import { getSupabaseClient } from "@/lib/supabase";
import { DigestTimeline } from "./digest-timeline";

export const revalidate = 3600; // 1 hour

export const metadata = {
  title: "Daily Digests — AI News Hub",
  description:
    "Browse historical daily AI news digests with summaries and audio briefings.",
};

interface DigestRow {
  id: string;
  digest_date: string;
  summary_text: string | null;
  audio_url: string | null;
  audio_status: "pending" | "completed" | "failed";
  article_ids: string[] | null;
}

async function getInitialDigests(): Promise<{
  digests: DigestRow[];
  nextCursor: string | null;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { digests: [], nextCursor: null };

  const limit = 30;
  const { data } = await supabase
    .from("daily_digests")
    .select("id, digest_date, summary_text, audio_url, audio_status, article_ids")
    .order("digest_date", { ascending: false })
    .limit(limit + 1);

  const digests = data || [];
  const hasMore = digests.length > limit;
  const page = hasMore ? digests.slice(0, limit) : digests;
  const nextCursor =
    hasMore && page[page.length - 1]?.digest_date
      ? page[page.length - 1].digest_date
      : null;

  return { digests: page, nextCursor };
}

export default async function DigestsPage() {
  const { digests, nextCursor } = await getInitialDigests();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#0d1b1a] dark:text-white mb-6">
        Daily Digests
      </h1>
      <DigestTimeline
        initialDigests={digests}
        initialNextCursor={nextCursor}
      />
    </main>
  );
}
