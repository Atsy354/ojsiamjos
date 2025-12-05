import { Skeleton } from "@/components/ui/skeleton"

export default function JournalDashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 p-3 space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </header>
        <main className="p-6 space-y-6">
          {/* Journal header skeleton */}
          <Skeleton className="h-20 w-full rounded-lg" />

          {/* Stats cards skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>

          {/* Recent submissions skeleton */}
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </div>
    </div>
  )
}
