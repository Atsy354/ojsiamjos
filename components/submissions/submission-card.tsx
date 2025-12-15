"use client"

import { formatDistanceToNow } from "date-fns"
import { FileText, Users, Calendar, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Submission } from "@/lib/types"
import Link from "next/link"
import { getSubmissionStatusColors, getStatusBadgeVariant } from "@/lib/ui/status-colors"
import { getStatusDisplayLabel } from "@/lib/utils/status-helpers"

interface SubmissionCardProps {
  submission: Submission
  onDelete?: (id: string) => void
}

export function SubmissionCard({ submission, onDelete }: SubmissionCardProps) {
  // Defensive: skip if no ID
  if (!submission?.id) {
    console.warn('[SubmissionCard] Skipping submission with no ID:', submission)
    return null
  }

  const statusColors = getSubmissionStatusColors(submission.status, submission.stageId)
  const statusLabel = statusColors.label || getStatusDisplayLabel(submission.status)
  const timeAgo = submission.dateSubmitted
    ? formatDistanceToNow(new Date(submission.dateSubmitted), { addSuffix: true })
    : "Not submitted"

  return (
    <Card className="group transition-shadow hover:shadow-md overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 gap-2">
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={getStatusBadgeVariant(submission.status)}
              className={statusColors.badge}
            >
              {statusLabel}
            </Badge>
            <span className="text-xs text-muted-foreground shrink-0">ID: {String(submission.id).slice(-6)}</span>
          </div>
          <Link href={`/submissions/${submission.id}`} className="block">
            <h3 className="line-clamp-2 text-sm sm:text-base font-semibold leading-tight text-foreground hover:text-primary">
              {submission.title}
            </h3>
          </Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/submissions/${submission.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/submissions/${submission.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(String(submission.id))}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{submission.abstract}</p>

        <div className="flex flex-wrap gap-1.5">
          {(submission.keywords || []).slice(0, 3).map((keyword) => (
            <Badge key={keyword} variant="outline" className="text-xs truncate max-w-[100px]">
              {keyword}
            </Badge>
          ))}
          {(submission.keywords?.length || 0) > 3 && (
            <Badge variant="outline" className="text-xs shrink-0">
              +{(submission.keywords?.length || 0) - 3}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {(submission.authors?.length || 0)} author{(submission.authors?.length || 0) !== 1 ? "s" : ""}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Round {submission.currentRound || 0}</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">{timeAgo}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
