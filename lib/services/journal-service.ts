// Journal Service - Handles journal CRUD operations
import type { Journal } from "@/lib/types"
import { STORAGE_KEYS } from "@/lib/constants"
import { getStorage, setStorage, generateId } from "./base"

// Migration function to add path field to existing journals
function migrateJournalsWithPath(): void {
  if (typeof window === "undefined") return

  const journals = getStorage<Journal>(STORAGE_KEYS.JOURNALS)
  let needsMigration = false

  const migratedJournals = journals.map((journal) => {
    if (!journal.path) {
      needsMigration = true
      const generatedPath = journal.acronym
        ? journal.acronym.toLowerCase()
        : journal.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
      return { ...journal, path: generatedPath }
    }
    return journal
  })

  if (needsMigration) {
    setStorage(STORAGE_KEYS.JOURNALS, migratedJournals)
  }
}

export const journalService = {
  migrate: migrateJournalsWithPath,

  getAll: (): Journal[] => getStorage<Journal>(STORAGE_KEYS.JOURNALS),

  getById: (id: string): Journal | undefined => {
    return getStorage<Journal>(STORAGE_KEYS.JOURNALS).find((j) => j.id === id)
  },

  getByPath: (path: string): Journal | undefined => {
    return getStorage<Journal>(STORAGE_KEYS.JOURNALS).find((j) => j.path === path)
  },

  getByIdOrPath: (identifier: string): Journal | undefined => {
    const journals = getStorage<Journal>(STORAGE_KEYS.JOURNALS)
    const byPath = journals.find((j) => j.path === identifier)
    if (byPath) return byPath
    return journals.find((j) => j.id === identifier)
  },

  create: (journal: Omit<Journal, "id" | "createdAt">): Journal => {
    const journals = getStorage<Journal>(STORAGE_KEYS.JOURNALS)
    const newJournal: Journal = {
      ...journal,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    journals.push(newJournal)
    setStorage(STORAGE_KEYS.JOURNALS, journals)
    return newJournal
  },

  update: (id: string, updates: Partial<Journal>): Journal | undefined => {
    const journals = getStorage<Journal>(STORAGE_KEYS.JOURNALS)
    const index = journals.findIndex((j) => j.id === id)
    if (index === -1) return undefined
    journals[index] = { ...journals[index], ...updates }
    setStorage(STORAGE_KEYS.JOURNALS, journals)
    return journals[index]
  },

  delete: (id: string): boolean => {
    const journals = getStorage<Journal>(STORAGE_KEYS.JOURNALS)
    const filtered = journals.filter((j) => j.id !== id)
    if (filtered.length === journals.length) return false
    setStorage(STORAGE_KEYS.JOURNALS, filtered)
    return true
  },
}
