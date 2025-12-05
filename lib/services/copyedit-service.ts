// Copyediting Service - Handles copyediting workflow
import type { CopyeditingAssignment, CopyeditingStatus, SubmissionFile } from "@/lib/types"
import { getStorage, setStorage, generateId } from "./base"

const STORAGE_KEY = "iamjos_copyediting_assignments"

export const copyeditService = {
  getAll: (): CopyeditingAssignment[] => getStorage<CopyeditingAssignment>(STORAGE_KEY),

  getById: (id: string): CopyeditingAssignment | undefined => {
    return getStorage<CopyeditingAssignment>(STORAGE_KEY).find((c) => c.id === id)
  },

  getBySubmission: (submissionId: string): CopyeditingAssignment[] => {
    return getStorage<CopyeditingAssignment>(STORAGE_KEY).filter((c) => c.submissionId === submissionId)
  },

  getByCopyeditor: (copyeditorId: string): CopyeditingAssignment[] => {
    return getStorage<CopyeditingAssignment>(STORAGE_KEY).filter((c) => c.copyeditorId === copyeditorId)
  },

  getByStatus: (status: CopyeditingStatus): CopyeditingAssignment[] => {
    return getStorage<CopyeditingAssignment>(STORAGE_KEY).filter((c) => c.status === status)
  },

  create: (assignment: Omit<CopyeditingAssignment, "id">): CopyeditingAssignment => {
    const assignments = getStorage<CopyeditingAssignment>(STORAGE_KEY)
    const newAssignment: CopyeditingAssignment = { ...assignment, id: generateId() }
    assignments.push(newAssignment)
    setStorage(STORAGE_KEY, assignments)
    return newAssignment
  },

  update: (id: string, updates: Partial<CopyeditingAssignment>): CopyeditingAssignment | undefined => {
    const assignments = getStorage<CopyeditingAssignment>(STORAGE_KEY)
    const index = assignments.findIndex((c) => c.id === id)
    if (index === -1) return undefined
    assignments[index] = { ...assignments[index], ...updates }
    setStorage(STORAGE_KEY, assignments)
    return assignments[index]
  },

  delete: (id: string): boolean => {
    const assignments = getStorage<CopyeditingAssignment>(STORAGE_KEY)
    const filtered = assignments.filter((c) => c.id !== id)
    if (filtered.length === assignments.length) return false
    setStorage(STORAGE_KEY, filtered)
    return true
  },

  addFile: (id: string, file: SubmissionFile): CopyeditingAssignment | undefined => {
    const assignment = copyeditService.getById(id)
    if (!assignment) return undefined
    const updatedFiles = [...(assignment.files || []), file]
    return copyeditService.update(id, { files: updatedFiles })
  },

  requestAuthorReview: (id: string): CopyeditingAssignment | undefined => {
    return copyeditService.update(id, { status: "author_review" })
  },

  complete: (id: string): CopyeditingAssignment | undefined => {
    return copyeditService.update(id, {
      status: "completed",
      dateCompleted: new Date().toISOString(),
    })
  },
}
