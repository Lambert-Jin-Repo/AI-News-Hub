import { Skeleton } from "@/components/ui/Skeleton";
import { NewsCardSkeleton } from "@/components/cards/NewsCardSkeleton";

export default function NewsLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Skeleton className="h-9 w-32 mb-6" />
      {/* Search bar */}
      <div className="space-y-4 mb-8">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-9 w-64 rounded-lg" />
      </div>
      {/* Article list */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
