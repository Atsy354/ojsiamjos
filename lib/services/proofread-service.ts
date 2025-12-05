// Proofreading Service - Handles proofreading workflow
import type { ProofreadingAssignment, ProofreadingStatus, SubmissionFile } from "@/lib/types"
import { getStorage, setStorage, generateId } from "./base"

const STORAGE_KEY = "iamjos_proofreading_assignments"

export const proofreadService = {
  getAll: (): ProofreadingAssignment[] => getStorage<ProofreadingAssignment>(STORAGE_KEY),

  getById: (id: string): ProofreadingAssignment | undefined => {
    return getStorage<ProofreadingAssignment>(STORAGE_KEY).find((p) => p.id === id)
  },

  getBySubmission: (submissionId: string): ProofreadingAssignment[] => {
    return getStorage<ProofreadingAssignment>(STORAGE_KEY).filter((p) => p.submissionId === submissionId)
  },

  getByProofreader: (proofreaderId: string): ProofreadingAssignment[] => {
    return getStorage<ProofreadingAssignment>(STORAGE_KEY).filter((p) => p.proofreaderId === proofreaderId)
  },

  getByStatus: (status: ProofreadingStatus): ProofreadingAssignment[] => {
    return getStorage<ProofreadingAssignment>(STORAGE_KEY).filter((p) => p.status === status)
  },

  create: (assignment: Omit<ProofreadingAssignment, "id">): ProofreadingAssignment => {
    const assignments = getStorage<ProofreadingAssignment>(STORAGE_KEY)
    const newAssignment: ProofreadingAssignment = { ...assignment, id: generateId() }
    assignments.push(newAssignment)
    setStorage(STORAGE_KEY, assignments)
    return newAssignment
  },

  update: (id: string, updates: Partial<ProofreadingAssignment>): ProofreadingAssignment | undefined => {
    const assignments = getStorage<ProofreadingAssignment>(STORAGE_KEY)
    const index = assignments.findIndex((p) => p.id === id)
    if (index === -1) return undefined
    assignments[index] = { ...assignments[index], ...updates }
    setStorage(STORAGE_KEY, assignments)
    return assignments[index]
  },

  delete: (id: string): boolean => {
    const assignments = getStorage<ProofreadingAssignment>(STORAGE_KEY)
    const filtered = assignments.filter((p) => p.id !== id)
    if (filtered.length === assignments.length) return false
    setStorage(STORAGE_KEY, filtered)
    return true
  },

  addFile: (id: string, file: SubmissionFile): ProofreadingAssignment | undefined => {
    const assignment = proofreadService.getById(id)
    if (!assignment) return undefined
    const updatedFiles = [...(assignment.files || []), file]
    return proofreadService.update(id, { files: updatedFiles })
  },

  requestAuthorCorrections: (id: string): ProofreadingAssignment | undefined => {
    return proofreadService.update(id, { status: "author_corrections" })
  },

  complete: (id: string): ProofreadingAssignment | undefined => {
    return proofreadService.update(id, {
      status: "completed",
      dateCompleted: new Date().toISOString(),
    })
  },
}
