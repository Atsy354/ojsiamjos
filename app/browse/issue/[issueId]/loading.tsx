import { Skeleton } from "@/components/ui/skeleton"

export default function IssueLoading() {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header skeleton */}
      <div className="bg-[#006b7b] py-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded bg-white/20" />
            <Skeleton className="h-6 w-24 bg-white/20" />
          </div>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="bg-[#005a68] py-3">
        <div className="mx-auto max-w-7xl px-4">
          <Skeleton className="h-10 w-full bg-white/20" />
        </div>
      </div>

      {/* Breadcrumb skeleton */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Issue header skeleton */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex gap-6">
            <Skeleton className="hidden h-48 w-36 sm:block" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="rounded bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="hidden h-12 w-16 sm:block" />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-7 w-16" />
                        <Skeleton className="h-7 w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded bg-white p-4 shadow-sm">
              <Skeleton className="mb-3 h-5 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <div className="rounded bg-white p-4 shadow-sm">
              <Skeleton className="mb-3 h-5 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
