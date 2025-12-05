// Review Service - Handles review assignments and rounds
import type { ReviewAssignment, ReviewRound, EditorialDecision } from "@/lib/types"
import { STORAGE_KEYS } from "@/lib/constants"
import { getStorage, setStorage, generateId } from "./base"

export const reviewAssignmentService = {
  getAll: (): ReviewAssignment[] => getStorage<ReviewAssignment>(STORAGE_KEYS.REVIEW_ASSIGNMENTS),

  getById: (id: string): ReviewAssignment | undefined => {
    return getStorage<ReviewAssignment>(STORAGE_KEYS.REVIEW_ASSIGNMENTS).find((r) => r.id === id)
  },

  getBySubmission: (submissionId: string): ReviewAssignment[] => {
    return getStorage<ReviewAssignment>(STORAGE_KEYS.REVIEW_ASSIGNMENTS).filter((r) => r.submissionId === submissionId)
  },

  getByReviewer: (reviewerId: string): ReviewAssignment[] => {
    return getStorage<ReviewAssignment>(STORAGE_KEYS.REVIEW_ASSIGNMENTS).filter((r) => r.reviewerId === reviewerId)
  },

  create: (assignment: Omit<ReviewAssignment, "id">): ReviewAssignment => {
    const assignments = getStorage<ReviewAssignment>(STORAGE_KEYS.REVIEW_ASSIGNMENTS)
    const newAssignment: ReviewAssignment = { ...assignment, id: generateId() }
    assignments.push(newAssignment)
    setStorage(STORAGE_KEYS.REVIEW_ASSIGNMENTS, assignments)
    return newAssignment
  },

  update: (id: string, updates: Partial<ReviewAssignment>): ReviewAssignment | undefined => {
    const assignments = getStorage<ReviewAssignment>(STORAGE_KEYS.REVIEW_ASSIGNMENTS)
    const index = assignments.findIndex((r) => r.id === id)
    if (index === -1) return undefined
    assignments[index] = { ...assignments[index], ...updates }
    setStorage(STORAGE_KEYS.REVIEW_ASSIGNMENTS, assignments)
    return assignments[index]
  },
}

export const reviewRoundService = {
  getAll: (): ReviewRound[] => getStorage<ReviewRound>(STORAGE_KEYS.REVIEW_ROUNDS),

  getBySubmission: (submissionId: string): ReviewRound[] => {
    return getStorage<ReviewRound>(STORAGE_KEYS.REVIEW_ROUNDS)
      .filter((r) => r.submissionId === submissionId)
      .sort((a, b) => a.round - b.round)
  },

  create: (round: Omit<ReviewRound, "id">): ReviewRound => {
    const rounds = getStorage<ReviewRound>(STORAGE_KEYS.REVIEW_ROUNDS)
    const newRound: ReviewRound = { ...round, id: generateId() }
    rounds.push(newRound)
    setStorage(STORAGE_KEYS.REVIEW_ROUNDS, rounds)
    return newRound
  },

  update: (id: string, updates: Partial<ReviewRound>): ReviewRound | undefined => {
    const rounds = getStorage<ReviewRound>(STORAGE_KEYS.REVIEW_ROUNDS)
    const index = rounds.findIndex((r) => r.id === id)
    if (index === -1) return undefined
    rounds[index] = { ...rounds[index], ...updates }
    setStorage(STORAGE_KEYS.REVIEW_ROUNDS, rounds)
    return rounds[index]
  },
}

export const editorialDecisionService = {
  getAll: (): EditorialDecision[] => getStorage<EditorialDecision>(STORAGE_KEYS.EDITORIAL_DECISIONS),

  getBySubmission: (submissionId: string): EditorialDecision[] => {
    return getStorage<EditorialDecision>(STORAGE_KEYS.EDITORIAL_DECISIONS).filter(
      (d) => d.submissionId === submissionId,
    )
  },

  create: (decision: Omit<EditorialDecision, "id">): EditorialDecision => {
    const decisions = getStorage<EditorialDecision>(STORAGE_KEYS.EDITORIAL_DECISIONS)
    const newDecision: EditorialDecision = { ...decision, id: generateId() }
    decisions.push(newDecision)
    setStorage(STORAGE_KEYS.EDITORIAL_DECISIONS, decisions)
    return newDecision
  },
}
