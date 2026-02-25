import { Skeleton } from "@/components/ui/Skeleton";
import { ToolCardSkeleton } from "@/components/cards/ToolCardSkeleton";

export default function ToolsLoading() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <Skeleton className="h-9 w-48 mb-6" />
      {/* Search and filters */}
      <div className="space-y-4 mb-8">
        <Skeleton className="h-11 w-full rounded-lg" />
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>
      {/* Tool grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ToolCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
