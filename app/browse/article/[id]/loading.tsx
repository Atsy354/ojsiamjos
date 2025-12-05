import { Skeleton } from "@/components/ui/skeleton-card"

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
          <Skeleton className="h-6 w-32 bg-white/20" />
        </div>
      </header>

      {/* Article content skeleton */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <article className="rounded-lg border bg-white p-8 space-y-6">
          {/* Title */}
          <Skeleton className="h-10 w-3/4" />

          {/* Authors */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-36" />
          </div>

          {/* Meta info */}
          <div className="flex gap-4 border-y py-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-28" />
          </div>

          {/* Abstract */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Keywords */}
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>

          {/* Download button */}
          <Skeleton className="h-10 w-40 rounded-md" />
        </article>
      </main>
    </div>
  )
}
