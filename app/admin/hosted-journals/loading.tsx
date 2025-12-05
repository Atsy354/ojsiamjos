import { Skeleton, SkeletonTable } from "@/components/ui/skeleton-card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#d8d8d8]">
      <div className="flex">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block w-64 min-h-screen bg-[#e8e8e8] border-r p-4 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
          <SkeletonTable rows={5} />
        </main>
      </div>
    </div>
  )
}
