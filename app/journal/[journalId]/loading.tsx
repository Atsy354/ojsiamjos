import { Skeleton, SkeletonStats, SkeletonCard } from "@/components/ui/skeleton-card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b bg-card p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Journal header skeleton */}
      <div className="border-b bg-card p-6">
        <div className="max-w-7xl mx-auto flex gap-6">
          <Skeleton className="h-32 w-32 rounded-lg shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="border-b bg-muted/30 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <SkeletonStats />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-md" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
}
