import { Skeleton, SkeletonSidebar } from "@/components/ui/skeleton-card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 border-r bg-card min-h-[calc(100vh-57px)]">
          <SkeletonSidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 space-y-6">
          <Skeleton className="h-8 w-48" />

          <div className="rounded-lg border bg-card p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </main>
      </div>
    </div>
  )
}
