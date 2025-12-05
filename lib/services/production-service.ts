// Production Service - Handles production workflow and galleys
import type { ProductionAssignment, ProductionStatus, Galley } from "@/lib/types"
import { getStorage, setStorage, generateId } from "./base"

const STORAGE_KEY = "iamjos_production_assignments"
const GALLEY_KEY = "iamjos_galleys"

export const productionService = {
  getAll: (): ProductionAssignment[] => getStorage<ProductionAssignment>(STORAGE_KEY),

  getById: (id: string): ProductionAssignment | undefined => {
    return getStorage<ProductionAssignment>(STORAGE_KEY).find((p) => p.id === id)
  },

  getBySubmission: (submissionId: string): ProductionAssignment | undefined => {
    return getStorage<ProductionAssignment>(STORAGE_KEY).find((p) => p.submissionId === submissionId)
  },

  getByLayoutEditor: (layoutEditorId: string): ProductionAssignment[] => {
    return getStorage<ProductionAssignment>(STORAGE_KEY).filter((p) => p.layoutEditorId === layoutEditorId)
  },

  getByStatus: (status: ProductionStatus): ProductionAssignment[] => {
    return getStorage<ProductionAssignment>(STORAGE_KEY).filter((p) => p.status === status)
  },

  create: (assignment: Omit<ProductionAssignment, "id" | "galleys">): ProductionAssignment => {
    const assignments = getStorage<ProductionAssignment>(STORAGE_KEY)
    const newAssignment: ProductionAssignment = { ...assignment, id: generateId(), galleys: [] }
    assignments.push(newAssignment)
    setStorage(STORAGE_KEY, assignments)
    return newAssignment
  },

  update: (id: string, updates: Partial<ProductionAssignment>): ProductionAssignment | undefined => {
    const assignments = getStorage<ProductionAssignment>(STORAGE_KEY)
    const index = assignments.findIndex((p) => p.id === id)
    if (index === -1) return undefined
    assignments[index] = { ...assignments[index], ...updates }
    setStorage(STORAGE_KEY, assignments)
    return assignments[index]
  },

  delete: (id: string): boolean => {
    const assignments = getStorage<ProductionAssignment>(STORAGE_KEY)
    const filtered = assignments.filter((p) => p.id !== id)
    if (filtered.length === assignments.length) return false
    setStorage(STORAGE_KEY, filtered)
    return true
  },

  // Galley management
  addGalley: (productionId: string, galley: Omit<Galley, "id">): Galley | undefined => {
    const assignment = productionService.getById(productionId)
    if (!assignment) return undefined

    const newGalley: Galley = { ...galley, id: generateId() }
    const updatedGalleys = [...(assignment.galleys || []), newGalley]
    productionService.update(productionId, { galleys: updatedGalleys })
    return newGalley
  },

  updateGalley: (productionId: string, galleyId: string, updates: Partial<Galley>): Galley | undefined => {
    const assignment = productionService.getById(productionId)
    if (!assignment) return undefined

    const galleyIndex = assignment.galleys.findIndex((g) => g.id === galleyId)
    if (galleyIndex === -1) return undefined

    assignment.galleys[galleyIndex] = { ...assignment.galleys[galleyIndex], ...updates }
    productionService.update(productionId, { galleys: assignment.galleys })
    return assignment.galleys[galleyIndex]
  },

  deleteGalley: (productionId: string, galleyId: string): boolean => {
    const assignment = productionService.getById(productionId)
    if (!assignment) return false

    const filteredGalleys = assignment.galleys.filter((g) => g.id !== galleyId)
    if (filteredGalleys.length === assignment.galleys.length) return false

    productionService.update(productionId, { galleys: filteredGalleys })
    return true
  },

  moveToLayout: (id: string): ProductionAssignment | undefined => {
    return productionService.update(id, { status: "layout" })
  },

  galleysReady: (id: string): ProductionAssignment | undefined => {
    return productionService.update(id, { status: "galleys_ready" })
  },

  schedule: (id: string): ProductionAssignment | undefined => {
    return productionService.update(id, { status: "scheduled" })
  },

  publish: (id: string): ProductionAssignment | undefined => {
    return productionService.update(id, {
      status: "published",
      dateCompleted: new Date().toISOString(),
    })
  },
}
