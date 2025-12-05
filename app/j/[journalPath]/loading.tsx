import { Skeleton } from "@/components/ui/skeleton"

export default function PublicJournalLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header Skeleton */}
      <header className="bg-[#006798] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-lg bg-white/20" />
              <div>
                <Skeleton className="h-7 w-64 bg-white/20 mb-2" />
                <Skeleton className="h-4 w-48 bg-white/20" />
              </div>
            </div>
            <Skeleton className="h-10 w-36 bg-white/20" />
          </div>
        </div>
      </header>

      {/* Navigation Skeleton */}
      <nav className="bg-[#005580] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 py-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-20 bg-white/20" />
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  )
}
