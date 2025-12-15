/**
 * Consistent Status Color System
 * Centralized color definitions for all status indicators across the application
 */

import { STATUS_QUEUED, STATUS_PUBLISHED, STATUS_DECLINED, STATUS_SCHEDULED } from "@/lib/workflow/ojs-constants"
import { WORKFLOW_STAGE_ID_SUBMISSION, WORKFLOW_STAGE_ID_EXTERNAL_REVIEW, WORKFLOW_STAGE_ID_EDITING, WORKFLOW_STAGE_ID_PRODUCTION } from "@/lib/workflow/ojs-constants"

export type StatusValue = number | string

/**
 * OJS Status Colors (Primary - Integer Status)
 */
export const OJS_STATUS_COLORS: Record<number, {
  badge: string
  bg: string
  text: string
  border: string
  icon: string
}> = {
  [STATUS_QUEUED]: {
    badge: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
    bg: "bg-slate-50 dark:bg-slate-900/50",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    icon: "text-slate-600 dark:text-slate-400",
  },
  [STATUS_PUBLISHED]: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  [STATUS_DECLINED]: {
    badge: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    icon: "text-rose-600 dark:text-rose-400",
  },
  [STATUS_SCHEDULED]: {
    badge: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
  },
}

/**
 * Stage Colors (for QUEUED status with stage context)
 */
export const STAGE_COLORS: Record<number, {
  badge: string
  label: string
}> = {
  [WORKFLOW_STAGE_ID_SUBMISSION]: {
    badge: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
    label: "Submission",
  },
  [WORKFLOW_STAGE_ID_EXTERNAL_REVIEW]: {
    badge: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700",
    label: "Review",
  },
  [WORKFLOW_STAGE_ID_EDITING]: {
    badge: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700",
    label: "Copyediting",
  },
  [WORKFLOW_STAGE_ID_PRODUCTION]: {
    badge: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700",
    label: "Production",
  },
}

/**
 * Review Status Colors
 */
export const REVIEW_STATUS_COLORS: Record<string, {
  badge: string
  bg: string
  text: string
}> = {
  pending: {
    badge: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
  },
  accepted: {
    badge: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
  },
  declined: {
    badge: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-700 dark:text-rose-400",
  },
  completed: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
  },
}

/**
 * Recommendation Colors
 */
export const RECOMMENDATION_COLORS: Record<string, {
  badge: string
}> = {
  accept: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700",
  },
  minor_revisions: {
    badge: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700",
  },
  major_revisions: {
    badge: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700",
  },
  resubmit_elsewhere: {
    badge: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
  },
  decline: {
    badge: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700",
  },
}

/**
 * Get status colors for submission status
 * Handles both integer (OJS) and string (legacy) status
 */
export function getSubmissionStatusColors(status: StatusValue, stageId?: number) {
  // Handle integer status (OJS)
  if (typeof status === "number") {
    const colors = OJS_STATUS_COLORS[status]
    if (colors) {
      // If QUEUED, use stage-specific colors
      if (status === STATUS_QUEUED && stageId && STAGE_COLORS[stageId]) {
        return {
          badge: STAGE_COLORS[stageId].badge,
          bg: colors.bg,
          text: colors.text,
          border: colors.border,
          icon: colors.icon,
          label: STAGE_COLORS[stageId].label,
        }
      }
      return {
        ...colors,
        label: status === STATUS_QUEUED && stageId ? STAGE_COLORS[stageId]?.label || "In Workflow" : undefined,
      }
    }
  }
  
  // Handle string status (legacy) - map to OJS equivalent
  const statusMap: Record<string, number> = {
    incomplete: STATUS_QUEUED,
    submitted: STATUS_QUEUED,
    under_review: STATUS_QUEUED,
    revision_required: STATUS_QUEUED,
    copyediting: STATUS_QUEUED,
    proofreading: STATUS_QUEUED,
    production: STATUS_QUEUED,
    scheduled: STATUS_SCHEDULED,
    accepted: STATUS_QUEUED,
    declined: STATUS_DECLINED,
    published: STATUS_PUBLISHED,
  }
  
  const ojsStatus = statusMap[status as string] || STATUS_QUEUED
  const colors = OJS_STATUS_COLORS[ojsStatus]
  
  // For legacy string status, also check stage if provided
  if (ojsStatus === STATUS_QUEUED && stageId && STAGE_COLORS[stageId]) {
    return {
      badge: STAGE_COLORS[stageId].badge,
      bg: colors.bg,
      text: colors.text,
      border: colors.border,
      icon: colors.icon,
      label: STAGE_COLORS[stageId].label,
    }
  }
  
  return colors
}

/**
 * Get review status colors
 */
export function getReviewStatusColors(status: string) {
  return REVIEW_STATUS_COLORS[status] || REVIEW_STATUS_COLORS.pending
}

/**
 * Get recommendation colors
 */
export function getRecommendationColors(recommendation: string) {
  return RECOMMENDATION_COLORS[recommendation] || RECOMMENDATION_COLORS.decline
}

/**
 * Get badge variant for shadcn Badge component
 */
export function getStatusBadgeVariant(status: StatusValue): "default" | "secondary" | "destructive" | "outline" {
  if (typeof status === "number") {
    if (status === STATUS_PUBLISHED) return "default"
    if (status === STATUS_DECLINED) return "destructive"
    if (status === STATUS_SCHEDULED) return "secondary"
    return "outline"
  }
  
  // Legacy string status
  if (status === "published" || status === "accepted") return "default"
  if (status === "declined") return "destructive"
  return "outline"
}

