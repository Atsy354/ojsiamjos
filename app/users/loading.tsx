import { Skeleton, SkeletonTable } from "@/components/ui/skeleton-card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <SkeletonTable rows={8} />
    </div>
  )
}
