import { Skeleton } from "@/components/ui/skeleton-card"

export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar skeleton */}
      <div className="bg-primary">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4">
          <Skeleton className="h-3 w-48 bg-white/20" />
          <Skeleton className="h-3 w-32 bg-white/20" />
        </div>
      </div>

      {/* Header skeleton */}
      <header className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded bg-white/20" />
              <Skeleton className="h-6 w-24 bg-white/20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-80 rounded bg-white/20" />
              <Skeleton className="h-10 w-10 rounded bg-white/20" />
            </div>
          </div>
        </div>
      </header>

      {/* Page Title skeleton */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Skeleton className="h-8 w-72" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-4 py-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>

      {/* Alphabet Bar skeleton */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4">
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-24 mr-2" />
            {Array.from({ length: 26 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-6 rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Results Bar skeleton */}
      <div className="border-b bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar Filters skeleton */}
          <aside className="w-64 flex-shrink-0">
            <div className="rounded border bg-white">
              {/* Show Filter */}
              <div className="border-b p-4 space-y-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>

              {/* Content Type Filter */}
              <div className="border-b p-4 space-y-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>

              {/* Year Filter */}
              <div className="border-b p-4 space-y-3">
                <Skeleton className="h-5 w-12" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>

              {/* Publisher Filter */}
              <div className="border-b p-4 space-y-3">
                <Skeleton className="h-5 w-20" />
              </div>

              {/* Topic Filter */}
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-14" />
              </div>
            </div>
          </aside>

          {/* Journal List skeleton */}
          <main className="flex-1">
            <div className="rounded border bg-white divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>

            {/* Pagination skeleton */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <Skeleton className="h-8 w-20" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-8" />
              ))}
              <Skeleton className="h-8 w-16" />
            </div>
          </main>
        </div>
      </div>

      {/* Footer skeleton */}
      <footer className="bg-primary py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-24 bg-white/20" />
                <Skeleton className="h-3 w-20 bg-white/10" />
                <Skeleton className="h-3 w-16 bg-white/10" />
                <Skeleton className="h-3 w-24 bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
