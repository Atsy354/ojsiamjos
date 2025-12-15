// lib/hooks/use-submissions-api.ts
// API-based hooks for submissions (replacing localStorage-based hooks)

"use client"

import { useState, useEffect, useCallback } from "react"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api/client"
import type { Submission, SubmissionStatus } from "@/lib/types"

export function useSubmissionsAPI(userId?: string, statusFilter?: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    console.log('[useSubmissionsAPI] Starting fetch...', { userId, statusFilter })
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (userId) {
        params.append("submitterId", userId)
      }
      if (statusFilter) {
        params.append("status", statusFilter)
      }
      const queryString = params.toString()
      const url = `/api/submissions${queryString ? `?${queryString}` : ""}`

      console.log('[useSubmissionsAPI] Fetching from:', url)
      const data = await apiGet<Submission[]>(url)

      // Validate response
      if (!Array.isArray(data)) {
        console.error('[useSubmissionsAPI] Invalid response - not an array:', data)
        throw new Error('Invalid API response format')
      }

      console.log('[useSubmissionsAPI] Received submissions:', {
        count: data.length,
        sample: data[0],
        hasIds: data.every(s => s?.id)
      })

      setSubmissions(data)
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch submissions'
      setError(errorMsg)
      console.error("[useSubmissionsAPI] Error:", errorMsg, err)
      // Set empty array on error to prevent undefined issues
      setSubmissions([])
    } finally {
      setIsLoading(false)
    }
  }, [userId, statusFilter])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const createSubmission = useCallback(async (submission: Omit<Submission, "id">) => {
    try {
      const newSubmission = await apiPost<Submission>("/api/submissions", submission)
      setSubmissions((prev) => [...prev, newSubmission as any])
      return newSubmission
    } catch (err: any) {
      throw new Error(err.message || "Failed to create submission")
    }
  }, [])

  const updateSubmission = useCallback(async (id: string, updates: Partial<Submission>) => {
    try {
      const updated = await apiPut<Submission>(`/api/submissions/${id}`, updates)
      setSubmissions((prev) => prev.map((s) => (s.id === id ? (updated as any) : s)))
      return updated
    } catch (err: any) {
      throw new Error(err.message || "Failed to update submission")
    }
  }, [])

  const updateStatus = useCallback(
    async (id: string, status: SubmissionStatus) => {
      return updateSubmission(id, { status })
    },
    [updateSubmission],
  )

  const deleteSubmission = useCallback(async (id: string) => {
    try {
      await apiDelete(`/api/submissions/${id}`)
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
      return true
    } catch (err: any) {
      throw new Error(err.message || "Failed to delete submission")
    }
  }, [])

  const getByStatus = useCallback(
    (status: SubmissionStatus) => {
      return submissions.filter((s) => s.status === status)
    },
    [submissions],
  )

  const statistics = {
    total: submissions.length,
    byStatus: submissions.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
    thisMonth: submissions.filter((s) => {
      if (!s.dateSubmitted) return false
      const date = new Date(s.dateSubmitted)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length,
    thisYear: submissions.filter((s) => {
      if (!s.dateSubmitted) return false
      const date = new Date(s.dateSubmitted)
      const now = new Date()
      return date.getFullYear() === now.getFullYear()
    }).length,
  }

  return {
    submissions,
    isLoading,
    error,
    createSubmission,
    updateSubmission,
    updateStatus,
    deleteSubmission,
    getByStatus,
    statistics,
    refetch: fetchSubmissions,
  }
}

export function useSubmissionAPI(id: string) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmission = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiGet<any>(`/api/submissions/${id}`)
      setSubmission(data as any)
    } catch (err: any) {
      setError(err.message)
      console.error("Failed to fetch submission:", err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchSubmission()
    }
  }, [id, fetchSubmission])

  const update = useCallback(
    async (updates: Partial<Submission>) => {
      try {
        const updated = await apiPut<Submission>(`/api/submissions/${id}`, updates)
        setSubmission(updated as any)
        return updated
      } catch (err: any) {
        throw new Error(err.message || "Failed to update submission")
      }
    },
    [id],
  )

  return {
    submission,
    isLoading,
    error,
    update,
    refetch: fetchSubmission,
  }
}

