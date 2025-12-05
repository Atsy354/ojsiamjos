"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface WorkflowOverviewProps {
  stats: {
    byStatus: Record<string, number>
    total: number
  }
}

export function WorkflowOverview({ stats }: WorkflowOverviewProps) {
  const stages = [
    { name: "Submitted", key: "submitted", color: "bg-chart-1" },
    { name: "Under Review", key: "under_review", color: "bg-chart-2" },
    { name: "Revision Required", key: "revision_required", color: "bg-chart-4" },
    { name: "Accepted", key: "accepted", color: "bg-chart-3" },
    { name: "Published", key: "published", color: "bg-primary" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Overview</CardTitle>
        <CardDescription>Submission pipeline status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage) => {
          const count = stats.byStatus[stage.key] || 0
          const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0

          return (
            <div key={stage.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{stage.name}</span>
                <span className="font-medium">{count}</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
