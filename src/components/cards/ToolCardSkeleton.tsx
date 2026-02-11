import { Skeleton } from "@/components/ui/Skeleton";

export function ToolCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-2xl p-5 shadow-soft">
      <div className="flex gap-4">
        {/* Logo */}
        <Skeleton className="shrink-0 w-16 h-16 rounded-xl" />

        <div className="flex-1 min-w-0">
          {/* Name */}
          <Skeleton className="h-5 w-2/3 mb-2" />
          {/* Description */}
          <Skeleton className="h-4 w-full mt-1" />
          <Skeleton className="h-4 w-3/4 mt-1" />
          {/* Meta */}
          <div className="flex items-center gap-2 mt-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          {/* Tags */}
          <div className="flex gap-1.5 mt-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
