import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function SubscriptionsLoading() {
  return (
    <DashboardLayout title="Subscriptions" subtitle="Loading...">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96" />
      </div>
    </DashboardLayout>
  )
}
