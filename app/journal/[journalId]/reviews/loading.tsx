import { Skeleton } from "@/components/ui/skeleton"

export default function JournalReviewsLoading() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-64 border-r bg-muted/30 lg:block">
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        <Skeleton className="h-10 w-80" />

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
