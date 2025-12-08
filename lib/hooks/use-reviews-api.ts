// lib/hooks/use-reviews-api.ts
// API-based hooks for reviews

"use client"

import { useState, useEffect, useCallback } from "react"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api/client"
import type { ReviewAssignment, ReviewRecommendation } from "@/lib/types"

export function useReviewsAPI(reviewerId?: string) {
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = reviewerId ? `?reviewerId=${reviewerId}` : ""
      const data = await apiGet<ReviewAssignment[]>(`/api/reviews${params}`)
      setAssignments(data)
    } catch (err: any) {
      setError(err.message)
      console.error("Failed to fetch reviews:", err)
    } finally {
      setIsLoading(false)
    }
  }, [reviewerId])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const assignReviewer = useCallback(async (data: {
    submissionId: string
    reviewerId: string
    reviewRoundId?: string
    dateDue?: string
  }) => {
    try {
      const assignment = await apiPost<ReviewAssignment>("/api/reviews", data)
      setAssignments((prev) => [...prev, assignment as any])
      return assignment
    } catch (err: any) {
      throw new Error(err.message || "Failed to assign reviewer")
    }
  }, [])

  const updateAssignment = useCallback(async (id: string, updates: Partial<ReviewAssignment>) => {
    try {
      const updated = await apiPut<ReviewAssignment>(`/api/reviews/${id}`, updates)
      setAssignments((prev) => prev.map((a) => (a.id === id ? (updated as any) : a)))
      return updated
    } catch (err: any) {
      throw new Error(err.message || "Failed to update review assignment")
    }
  }, [])

  const acceptReview = useCallback(
    async (id: string) => {
      return updateAssignment(id, { status: "accepted" })
    },
    [updateAssignment],
  )

  const declineReview = useCallback(
    async (id: string) => {
      return updateAssignment(id, { status: "declined" })
    },
    [updateAssignment],
  )

  const submitReview = useCallback(
    async (
      id: string,
      recommendation: ReviewRecommendation,
      comments: string,
      commentsToEditor?: string
    ) => {
      return updateAssignment(id, {
        status: "completed",
        recommendation,
        comments,
        commentsToEditor,
      })
    },
    [updateAssignment],
  )

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
    error,
    assignReviewer,
    updateAssignment,
    acceptReview,
    declineReview,
    submitReview,
    getPending,
    getActive,
    getCompleted,
    refetch: fetchAssignments,
  }
}

export function useReviewRoundsAPI(submissionId: string) {
  const [rounds, setRounds] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchRounds = useCallback(async () => {
    if (!submissionId) return
    setIsLoading(true)
    try {
      const data = await apiGet<any[]>(`/api/reviews/rounds?submissionId=${submissionId}`)
      setRounds(data)
    } catch (err: any) {
      console.error("Failed to fetch review rounds:", err)
    } finally {
      setIsLoading(false)
    }
  }, [submissionId])

  useEffect(() => {
    fetchRounds()
  }, [fetchRounds])

  return {
    rounds,
    isLoading,
    refetch: fetchRounds,
  }
}

