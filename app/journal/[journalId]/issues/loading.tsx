import { Skeleton } from "@/components/ui/skeleton"

export default function JournalIssuesLoading() {
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
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>

        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-40 w-full" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
