"use client"

import type React from "react"

import { formatDistanceToNow } from "date-fns"
import { FileText, CheckCircle, Clock, AlertTriangle, Send } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Submission } from "@/lib/types"

interface RecentActivityProps {
  submissions: Submission[]
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  submitted: Send,
  under_review: Clock,
  revision_required: AlertTriangle,
  accepted: CheckCircle,
  published: FileText,
}

export function RecentActivity({ submissions }: RecentActivityProps) {
  const recentSubmissions = submissions
    .filter((s) => s.dateSubmitted)
    .sort((a, b) => new Date(b.dateSubmitted!).getTime() - new Date(a.dateSubmitted!).getTime())
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest submission updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentSubmissions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">No recent activity</p>
        ) : (
          recentSubmissions.map((submission) => {
            const Icon = activityIcons[submission.status] || FileText
            const author = (submission.authors && submission.authors.length > 0) ? submission.authors[0] : null

            return (
              <div key={submission.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-tight line-clamp-1">{submission.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {author && (
                      <>
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[8px]">
                            {author.firstName?.[0] || 'A'}
                            {author.lastName?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {author.firstName} {author.lastName}
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span>{formatDistanceToNow(new Date(submission.dateSubmitted!), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
