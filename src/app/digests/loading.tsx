import { Skeleton } from "@/components/ui/Skeleton";

export default function DigestsLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Skeleton className="h-9 w-48 mb-6" />
      {/* Date picker */}
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-44 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      {/* Timeline */}
      <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-4 pl-8 space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[41px] w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-5 w-40 mb-3" />
            <Skeleton className="rounded-2xl h-64" />
          </div>
        ))}
      </div>
    </main>
  );
}
