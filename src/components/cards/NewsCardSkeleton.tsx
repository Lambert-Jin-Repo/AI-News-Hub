import { Skeleton } from "@/components/ui/Skeleton";

export function NewsCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-[16px] p-5 shadow-soft flex gap-5">
      {/* Thumbnail */}
      <Skeleton className="shrink-0 w-24 h-24 rounded-xl" />

      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          {/* Source + time */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          {/* Title */}
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          {/* Description */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mt-1" />
        </div>
        {/* Read more */}
        <Skeleton className="h-4 w-20 mt-3" />
      </div>
    </div>
  );
}
