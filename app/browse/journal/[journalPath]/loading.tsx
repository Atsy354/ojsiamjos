import { Skeleton, SkeletonCard, SkeletonArticleCard } from "@/components/ui/skeleton-card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header skeleton */}
      <header className="bg-[#006b7b]">
        <div className="border-b border-[#005a68]">
          <div className="mx-auto flex h-8 max-w-7xl items-center px-4">
            <Skeleton className="h-4 w-48 bg-white/20" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Skeleton className="h-8 w-64 bg-white/20" />
          <Skeleton className="h-4 w-96 mt-2 bg-white/20" />
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1 space-y-4">
            <SkeletonCard className="p-4" />
            <SkeletonCard className="p-4" />
          </aside>
          <main className="lg:col-span-3 space-y-4">
            <SkeletonCard className="p-6" />
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonArticleCard key={i} />
            ))}
          </main>
        </div>
      </div>
    </div>
  )
}
