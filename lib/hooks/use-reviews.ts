"use client"

import { useState, useEffect, useCallback } from "react"
import { reviewAssignmentService, reviewRoundService, submissionService } from "@/lib/storage"
import type { ReviewAssignment, ReviewRecommendation } from "@/lib/types"

export function useReviews(reviewerId?: string) {
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAssignments = useCallback(() => {
    setIsLoading(true)
    const data = reviewerId ? reviewAssignmentService.getByReviewer(reviewerId) : reviewAssignmentService.getAll()
    setAssignments(data)
    setIsLoading(false)
  }, [reviewerId])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const assignReviewer = useCallback((submissionId: string, reviewerId: string, roundId: string) => {
    const assignment = reviewAssignmentService.create({
      submissionId,
      reviewerId,
      reviewRoundId: roundId,
      status: "pending",
      dateAssigned: new Date().toISOString(),
      dateDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    setAssignments((prev) => [...prev, assignment])
    return assignment
  }, [])

  const updateAssignment = useCallback((id: string, updates: Partial<ReviewAssignment>) => {
    const updated = reviewAssignmentService.update(id, updates)
    if (updated) {
      setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)))
    }
    return updated
  }, [])

  const acceptReview = useCallback(
    (id: string) => {
      return updateAssignment(id, {
        status: "accepted",
        dateConfirmed: new Date().toISOString(),
      })
    },
    [updateAssignment],
  )

  const declineReview = useCallback(
    (id: string) => {
      return updateAssignment(id, { status: "declined" })
    },
    [updateAssignment],
  )

  const submitReview = useCallback(
    (id: string, recommendation: ReviewRecommendation, comments: string, commentsToEditor?: string) => {
      return updateAssignment(id, {
        status: "completed",
        recommendation,
        comments,
        commentsToEditor,
        dateCompleted: new Date().toISOString(),
      })
    },
    [updateAssignment],
  )

  const createRound = useCallback((submissionId: string) => {
    const existingRounds = reviewRoundService.getBySubmission(submissionId)
    const nextRound = existingRounds.length + 1

    const round = reviewRoundService.create({
      submissionId,
      round: nextRound,
      status: "pending",
      dateCreated: new Date().toISOString(),
    })

    // Update submission
    submissionService.update(submissionId, {
      status: "under_review",
      currentRound: nextRound,
      stageId: 3,
    })

    return round
  }, [])

  const getPending = useCallback(() => {
    return assignments.filter((a) => a.status === "pending")
  }, [assignments])

  const getActive = useCallback(() => {
    return assignments.filter((a) => a.status === "accepted")
  }, [assignments])

  const getCompleted = useCallback(() => {
    return assignments.filter((a) => a.status === "completed")
  }, [assignments])

  return {
    assignments,
    isLoading,
    assignReviewer,
    updateAssignment,
    acceptReview,
    declineReview,
    submitReview,
    createRound,
    getPending,
    getActive,
    getCompleted,
    refetch: fetchAssignments,
  }
}
