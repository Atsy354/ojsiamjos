"use client"

import { useState, useEffect, useCallback } from "react"
import { submissionService } from "@/lib/services/submission-service"
import { reviewAssignmentService, reviewRoundService } from "@/lib/services/review-service"
import type { Submission, ReviewAssignment, ReviewRound, SubmissionStatus } from "@/lib/types"

export function useSubmissions(userId?: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSubmissions = useCallback(() => {
    setIsLoading(true)
    const data = userId ? submissionService.getBySubmitter(userId) : submissionService.getAll()
    setSubmissions(data)
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const createSubmission = useCallback((submission: Omit<Submission, "id">) => {
    const newSubmission = submissionService.create(submission)
    setSubmissions((prev) => [...prev, newSubmission])
    return newSubmission
  }, [])

  const updateSubmission = useCallback((id: string, updates: Partial<Submission>) => {
    const updated = submissionService.update(id, updates)
    if (updated) {
      setSubmissions((prev) => prev.map((s) => (s.id === id ? updated : s)))
    }
    return updated
  }, [])

  const updateStatus = useCallback(
    (id: string, status: SubmissionStatus) => {
      return updateSubmission(id, { status })
    },
    [updateSubmission],
  )

  const deleteSubmission = useCallback((id: string) => {
    const success = submissionService.delete(id)
    if (success) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
    }
    return success
  }, [])

  const getByStatus = useCallback(
    (status: SubmissionStatus) => {
      return submissions.filter((s) => s.status === status)
    },
    [submissions],
  )

  const statistics = submissionService.getStatistics()

  return {
    submissions,
    isLoading,
    createSubmission,
    updateSubmission,
    updateStatus,
    deleteSubmission,
    getByStatus,
    statistics,
    refetch: fetchSubmissions,
  }
}

export function useSubmission(id: string) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [reviews, setReviews] = useState<ReviewAssignment[]>([])
  const [rounds, setRounds] = useState<ReviewRound[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const sub = submissionService.getById(id)
    setSubmission(sub || null)

    if (sub) {
      setReviews(reviewAssignmentService.getBySubmission(id))
      setRounds(reviewRoundService.getBySubmission(id))
    }
    setIsLoading(false)
  }, [id])

  const update = useCallback(
    (updates: Partial<Submission>) => {
      const updated = submissionService.update(id, updates)
      if (updated) setSubmission(updated)
      return updated
    },
    [id],
  )

  return {
    submission,
    reviews,
    rounds,
    isLoading,
    update,
  }
}
