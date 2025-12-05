// Revision Service - Handles author revision submissions and responses
import type { SubmissionFile } from "@/lib/types"
import { generateId } from "./base"
import { submissionService } from "./submission-service"

const REVISIONS_KEY = "ojs_revisions"

export interface RevisionRequest {
  id: string
  submissionId: string
  reviewRoundId: string
  editorId: string
  decision: "minor_revisions" | "major_revisions" | "resubmit"
  comments: string
  reviewerComments: ReviewerComment[]
  dueDate: string
  dateRequested: string
  status: "pending" | "submitted" | "under_review" | "completed"
}

export interface RevisionSubmission {
  id: string
  revisionRequestId: string
  submissionId: string
  authorId: string
  responseToEditor: string
  responseToReviewers: AuthorResponse[]
  files: SubmissionFile[]
  dateSubmitted: string
  status: "draft" | "submitted"
}

export interface ReviewerComment {
  reviewerId: string
  reviewerName: string
  recommendation: string
  commentsToAuthor: string
  dateCompleted: string
}

export interface AuthorResponse {
  reviewerId: string
  response: string
  addressed: boolean
}

export const revisionService = {
  // Revision Requests
  getAllRequests: (): RevisionRequest[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(REVISIONS_KEY + "_requests")
    return stored ? JSON.parse(stored) : []
  },

  getRequestBySubmissionId: (submissionId: string): RevisionRequest | undefined => {
    return revisionService.getAllRequests().find((r) => r.submissionId === submissionId && r.status !== "completed")
  },

  getRequestById: (id: string): RevisionRequest | undefined => {
    return revisionService.getAllRequests().find((r) => r.id === id)
  },

  createRequest: (request: Omit<RevisionRequest, "id" | "dateRequested" | "status">): RevisionRequest => {
    const requests = revisionService.getAllRequests()
    const newRequest: RevisionRequest = {
      ...request,
      id: generateId(),
      dateRequested: new Date().toISOString(),
      status: "pending",
    }
    requests.push(newRequest)
    localStorage.setItem(REVISIONS_KEY + "_requests", JSON.stringify(requests))

    // Update submission status
    submissionService.update(request.submissionId, { status: "revision_required" })

    return newRequest
  },

  updateRequest: (id: string, updates: Partial<RevisionRequest>): RevisionRequest | undefined => {
    const requests = revisionService.getAllRequests()
    const index = requests.findIndex((r) => r.id === id)
    if (index === -1) return undefined

    requests[index] = { ...requests[index], ...updates }
    localStorage.setItem(REVISIONS_KEY + "_requests", JSON.stringify(requests))
    return requests[index]
  },

  // Revision Submissions (Author Responses)
  getAllSubmissions: (): RevisionSubmission[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(REVISIONS_KEY + "_submissions")
    return stored ? JSON.parse(stored) : []
  },

  getSubmissionByRequestId: (requestId: string): RevisionSubmission | undefined => {
    return revisionService.getAllSubmissions().find((s) => s.revisionRequestId === requestId)
  },

  getSubmissionsByAuthor: (authorId: string): RevisionSubmission[] => {
    return revisionService.getAllSubmissions().filter((s) => s.authorId === authorId)
  },

  createSubmission: (submission: Omit<RevisionSubmission, "id" | "dateSubmitted">): RevisionSubmission => {
    const submissions = revisionService.getAllSubmissions()
    const newSubmission: RevisionSubmission = {
      ...submission,
      id: generateId(),
      dateSubmitted: new Date().toISOString(),
    }
    submissions.push(newSubmission)
    localStorage.setItem(REVISIONS_KEY + "_submissions", JSON.stringify(submissions))
    return newSubmission
  },

  updateSubmission: (id: string, updates: Partial<RevisionSubmission>): RevisionSubmission | undefined => {
    const submissions = revisionService.getAllSubmissions()
    const index = submissions.findIndex((s) => s.id === id)
    if (index === -1) return undefined

    submissions[index] = { ...submissions[index], ...updates }
    localStorage.setItem(REVISIONS_KEY + "_submissions", JSON.stringify(submissions))
    return submissions[index]
  },

  submitRevision: (
    revisionSubmissionId: string,
  ): { request: RevisionRequest | undefined; submission: RevisionSubmission | undefined } => {
    const submission = revisionService.getAllSubmissions().find((s) => s.id === revisionSubmissionId)
    if (!submission) return { request: undefined, submission: undefined }

    // Update submission status
    const updatedSubmission = revisionService.updateSubmission(revisionSubmissionId, { status: "submitted" })

    // Update revision request status
    const updatedRequest = revisionService.updateRequest(submission.revisionRequestId, { status: "submitted" })

    // Update main submission status back to under_review
    if (updatedRequest) {
      submissionService.update(updatedRequest.submissionId, {
        status: "under_review",
        currentRound: (submissionService.getById(updatedRequest.submissionId)?.currentRound || 1) + 1,
      })
    }

    return { request: updatedRequest, submission: updatedSubmission }
  },
}
