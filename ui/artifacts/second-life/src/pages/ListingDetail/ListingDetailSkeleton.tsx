import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ListingDetailSkeleton() {
  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-background to-muted/25 pb-20 dark:to-muted/15")}>
      <div className="border-b border-border/70 bg-card/80 py-4 dark:bg-card/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="aspect-square rounded-3xl ring-1 ring-border/40 dark:ring-border/30" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-xl ring-1 ring-border/30" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-10 w-3/4 rounded-lg" />
            <Skeleton className="h-6 w-1/4 rounded-lg" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
