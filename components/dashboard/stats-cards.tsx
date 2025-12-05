"use client"

import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardsProps {
  stats: {
    total: number
    byStatus: Record<string, number>
    thisMonth: number
    thisYear: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Submissions",
      value: stats.total,
      description: `${stats.thisMonth} this month`,
      icon: FileText,
      trend: "+12%",
    },
    {
      title: "Under Review",
      value: stats.byStatus["under_review"] || 0,
      description: "Active reviews",
      icon: Clock,
      trend: null,
    },
    {
      title: "Accepted",
      value: stats.byStatus["accepted"] || 0,
      description: "Ready for publication",
      icon: CheckCircle,
      trend: "+8%",
    },
    {
      title: "Pending Action",
      value: (stats.byStatus["submitted"] || 0) + (stats.byStatus["revision_required"] || 0),
      description: "Requires attention",
      icon: AlertCircle,
      trend: null,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{card.value}</span>
              {card.trend && (
                <span className="flex items-center text-xs text-success">
                  <TrendingUp className="mr-0.5 h-3 w-3" />
                  {card.trend}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
