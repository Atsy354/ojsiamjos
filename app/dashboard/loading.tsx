import { Skeleton, SkeletonStats, SkeletonTable, SkeletonSidebar } from "@/components/ui/skeleton-card"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-64 border-r bg-card min-h-screen">
          <SkeletonSidebar />
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>

          {/* Stats */}
          <SkeletonStats />

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>

          {/* Table */}
          <SkeletonTable rows={5} />
        </div>
      </div>
    </div>
  )
}
