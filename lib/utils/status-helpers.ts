/**
 * Status Helper Utilities
 * Provides functions to handle OJS integer status and legacy string status
 */

import {
  STATUS_QUEUED,
  STATUS_PUBLISHED,
  STATUS_DECLINED,
  STATUS_SCHEDULED,
  getStatusLabel,
  mapStringStatusToOJS,
  getStageName,
  WORKFLOW_STAGE_ID_SUBMISSION,
  WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
  WORKFLOW_STAGE_ID_EDITING,
  WORKFLOW_STAGE_ID_PRODUCTION,
} from "@/lib/workflow/ojs-constants"

export type StatusValue = number | string

/**
 * Get status display label
 * Handles both integer (OJS) and string (legacy) status
 */
export function getStatusDisplayLabel(status: StatusValue): string {
  if (typeof status === "number") {
    return getStatusLabel(status)
  }
  
  // Legacy string status mapping
  const stringLabels: Record<string, string> = {
    incomplete: "Incomplete",
    submitted: "Submitted",
    under_review: "Under Review",
    revision_required: "Revision Required",
    accepted: "Accepted",
    declined: "Declined",
    published: "Published",
    copyediting: "Copyediting",
    proofreading: "Proofreading",
    production: "Production",
    scheduled: "Scheduled",
  }
  
  return stringLabels[status] || String(status)
}

/**
 * Get status badge variant for UI
 */
export function getStatusBadgeVariant(status: StatusValue): "default" | "secondary" | "destructive" | "outline" {
  const ojsStatus = typeof status === "number" ? status : mapStringStatusToOJS(status)
  
  switch (ojsStatus) {
    case STATUS_PUBLISHED:
      return "default"
    case STATUS_DECLINED:
      return "destructive"
    case STATUS_SCHEDULED:
      return "secondary"
    case STATUS_QUEUED:
    default:
      return "outline"
  }
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: StatusValue): string {
  const ojsStatus = typeof status === "number" ? status : mapStringStatusToOJS(status)
  
  switch (ojsStatus) {
    case STATUS_PUBLISHED:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case STATUS_DECLINED:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    case STATUS_SCHEDULED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case STATUS_QUEUED:
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}

/**
 * Check if submission is in workflow (not published/declined)
 */
export function isInWorkflowStatus(status: StatusValue): boolean {
  const ojsStatus = typeof status === "number" ? status : mapStringStatusToOJS(status)
  return ojsStatus === STATUS_QUEUED || ojsStatus === STATUS_SCHEDULED
}

/**
 * Check if submission is published
 */
export function isPublishedStatus(status: StatusValue): boolean {
  const ojsStatus = typeof status === "number" ? status : mapStringStatusToOJS(status)
  return ojsStatus === STATUS_PUBLISHED
}

/**
 * Check if submission is declined
 */
export function isDeclinedStatus(status: StatusValue): boolean {
  const ojsStatus = typeof status === "number" ? status : mapStringStatusToOJS(status)
  return ojsStatus === STATUS_DECLINED
}

/**
 * Get stage display name
 */
export function getStageDisplayName(stageId: number): string {
  return getStageName(stageId)
}

/**
 * Get status config for UI components
 * Returns icon, label, and color information
 */
export function getStatusConfig(status: StatusValue, stageId?: number) {
  const label = getStatusDisplayLabel(status)
  const variant = getStatusBadgeVariant(status)
  const color = getStatusColor(status)
  
  // If status is QUEUED, show stage info
  const ojsStatus = typeof status === "number" ? status : mapStringStatusToOJS(status)
  let displayLabel = label
  
  if (ojsStatus === STATUS_QUEUED && stageId) {
    const stageName = getStageDisplayName(stageId)
    displayLabel = `${stageName} - ${label}`
  }
  
  return {
    label: displayLabel,
    variant,
    color,
    isInWorkflow: isInWorkflowStatus(status),
    isPublished: isPublishedStatus(status),
    isDeclined: isDeclinedStatus(status),
  }
}

