import { Skeleton } from "@/components/ui/Skeleton";

export default function WorkflowsLoading() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <Skeleton className="h-4 w-32 mb-8" />
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-80 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] rounded-2xl p-5 shadow-soft space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="w-7 h-7 rounded-lg" />
              ))}
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
