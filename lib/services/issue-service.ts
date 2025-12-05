// Issue Service - Handles journal issue CRUD operations
import type { Issue } from "@/lib/types"
import { STORAGE_KEYS } from "@/lib/constants"
import { getStorage, setStorage, generateId } from "./base"

export const issueService = {
  getAll: (): Issue[] => getStorage<Issue>(STORAGE_KEYS.ISSUES),

  getById: (id: string): Issue | undefined => {
    return getStorage<Issue>(STORAGE_KEYS.ISSUES).find((i) => i.id === id)
  },

  getByJournal: (journalId: string): Issue[] => {
    return getStorage<Issue>(STORAGE_KEYS.ISSUES)
      .filter((i) => i.journalId === journalId)
      .sort((a, b) => {
        // Sort by year desc, then volume desc, then number desc
        if (b.year !== a.year) return b.year - a.year
        if (b.volume !== a.volume) return b.volume - a.volume
        return b.number - a.number
      })
  },

  getPublished: (journalId?: string): Issue[] => {
    let issues = getStorage<Issue>(STORAGE_KEYS.ISSUES).filter((i) => i.isPublished)
    if (journalId) {
      issues = issues.filter((i) => i.journalId === journalId)
    }
    return issues.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year
      if (b.volume !== a.volume) return b.volume - a.volume
      return b.number - a.number
    })
  },

  getCurrent: (journalId: string): Issue | undefined => {
    return getStorage<Issue>(STORAGE_KEYS.ISSUES).find((i) => i.journalId === journalId && i.isCurrent)
  },

  create: (data: Omit<Issue, "id">): Issue => {
    const issues = getStorage<Issue>(STORAGE_KEYS.ISSUES)
    const newIssue: Issue = {
      ...data,
      id: generateId("issue"),
    }
    setStorage(STORAGE_KEYS.ISSUES, [...issues, newIssue])
    return newIssue
  },

  update: (id: string, data: Partial<Issue>): Issue | undefined => {
    const issues = getStorage<Issue>(STORAGE_KEYS.ISSUES)
    const index = issues.findIndex((i) => i.id === id)
    if (index === -1) return undefined

    const updated = { ...issues[index], ...data }
    issues[index] = updated
    setStorage(STORAGE_KEYS.ISSUES, issues)
    return updated
  },

  delete: (id: string): boolean => {
    const issues = getStorage<Issue>(STORAGE_KEYS.ISSUES)
    const filtered = issues.filter((i) => i.id !== id)
    if (filtered.length === issues.length) return false
    setStorage(STORAGE_KEYS.ISSUES, filtered)
    return true
  },

  publish: (id: string): Issue | undefined => {
    return issueService.update(id, {
      isPublished: true,
      datePublished: new Date().toISOString(),
    })
  },

  unpublish: (id: string): Issue | undefined => {
    return issueService.update(id, {
      isPublished: false,
      datePublished: undefined,
    })
  },

  setCurrent: (id: string, journalId: string): Issue | undefined => {
    const issues = getStorage<Issue>(STORAGE_KEYS.ISSUES)

    // Remove current flag from all issues of this journal
    const updated = issues.map((i) => {
      if (i.journalId === journalId) {
        return { ...i, isCurrent: i.id === id }
      }
      return i
    })

    setStorage(STORAGE_KEYS.ISSUES, updated)
    return updated.find((i) => i.id === id)
  },

  getNextVolumeNumber: (journalId: string): { volume: number; number: number } => {
    const issues = issueService.getByJournal(journalId)
    if (issues.length === 0) {
      return { volume: 1, number: 1 }
    }

    const latestIssue = issues[0] // Already sorted desc
    const currentYear = new Date().getFullYear()

    // If latest issue is from current year, increment number
    if (latestIssue.year === currentYear) {
      return { volume: latestIssue.volume, number: latestIssue.number + 1 }
    }

    // New year means new volume
    return { volume: latestIssue.volume + 1, number: 1 }
  },
}
