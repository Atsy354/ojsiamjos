// Submission Service - Handles submission CRUD and statistics
import type { Submission, SubmissionStatus } from "@/lib/types"
import { STORAGE_KEYS } from "@/lib/constants"
import { getStorage, setStorage, generateId } from "./base"

export const submissionService = {
  getAll: (): Submission[] => getStorage<Submission>(STORAGE_KEYS.SUBMISSIONS),

  getById: (id: string): Submission | undefined => {
    return getStorage<Submission>(STORAGE_KEYS.SUBMISSIONS).find((s) => s.id === id)
  },

  getByJournal: (journalId: string): Submission[] => {
    return getStorage<Submission>(STORAGE_KEYS.SUBMISSIONS).filter((s) => s.journalId === journalId)
  },

  getByJournalId: (journalId: string): Submission[] => {
    return submissionService.getByJournal(journalId)
  },

  getBySubmitter: (userId: string): Submission[] => {
    return getStorage<Submission>(STORAGE_KEYS.SUBMISSIONS).filter((s) => s.submitterId === userId)
  },

  getByStatus: (status: SubmissionStatus): Submission[] => {
    return getStorage<Submission>(STORAGE_KEYS.SUBMISSIONS).filter((s) => s.status === status)
  },

  create: (submission: Omit<Submission, "id">): Submission => {
    const submissions = getStorage<Submission>(STORAGE_KEYS.SUBMISSIONS)
    const newSubmission: Submission = { ...submission, id: generateId() }
    submissions.push(newSubmission)
    setStorage(STORAGE_KEYS.SUBMISSIONS, submissions)
    return newSubmission
  },

  update: (id: string, updates: Partial<Submission>): Submission | undefined => {
    const submissions = getStorage<Submission>(STORAGE_KEYS.SUBMISSIONS)
    const index = submissions.findIndex((s) => s.id === id)
    if (index === -1) return undefined
    submissions[index] = {
      ...submissions[index],
      ...updates,
      dateStatusModified: new Date().toISOString(),
    }
    setStorage(STORAGE_KEYS.SUBMISSIONS, submissions)
    return submissions[index]
  },

  delete: (id: string): boolean => {
    const submissions = getStorage<Submission>(STORAGE_KEYS.SUBMISSIONS)
    const filtered = submissions.filter((s) => s.id !== id)
    if (filtered.length === submissions.length) return false
    setStorage(STORAGE_KEYS.SUBMISSIONS, filtered)
    return true
  },

  getStatistics: () => {
    const submissions = getStorage<Submission>(STORAGE_KEYS.SUBMISSIONS)
    const now = new Date()

    const thisMonth = submissions.filter((s) => {
      const date = new Date(s.dateSubmitted || "")
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })

    const thisYear = submissions.filter((s) => {
      const date = new Date(s.dateSubmitted || "")
      return date.getFullYear() === now.getFullYear()
    })

    const byStatus = submissions.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total: submissions.length,
      byStatus,
      thisMonth: thisMonth.length,
      thisYear: thisYear.length,
    }
  },
}
