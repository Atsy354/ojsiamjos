// Content Service - Handles sections, issues, publications, announcements
import type { Section, Issue, Publication, Announcement, Notification } from "@/lib/types"
import { STORAGE_KEYS } from "@/lib/constants"
import { getStorage, setStorage, generateId } from "./base"

// Section Service
export const sectionService = {
  getAll: (): Section[] => getStorage<Section>(STORAGE_KEYS.SECTIONS),

  getByJournal: (journalId: string): Section[] => {
    return getStorage<Section>(STORAGE_KEYS.SECTIONS)
      .filter((s) => s.journalId === journalId)
      .sort((a, b) => a.sequence - b.sequence)
  },

  create: (section: Omit<Section, "id">): Section => {
    const sections = getStorage<Section>(STORAGE_KEYS.SECTIONS)
    const newSection: Section = { ...section, id: generateId() }
    sections.push(newSection)
    setStorage(STORAGE_KEYS.SECTIONS, sections)
    return newSection
  },

  update: (id: string, updates: Partial<Section>): Section | undefined => {
    const sections = getStorage<Section>(STORAGE_KEYS.SECTIONS)
    const index = sections.findIndex((s) => s.id === id)
    if (index === -1) return undefined
    sections[index] = { ...sections[index], ...updates }
    setStorage(STORAGE_KEYS.SECTIONS, sections)
    return sections[index]
  },
}

// Issue Service
export const issueService = {
  getAll: (): Issue[] => getStorage<Issue>(STORAGE_KEYS.ISSUES),

  getById: (id: string): Issue | undefined => {
    return getStorage<Issue>(STORAGE_KEYS.ISSUES).find((i) => i.id === id)
  },

  getByJournal: (journalId: string): Issue[] => {
    return getStorage<Issue>(STORAGE_KEYS.ISSUES)
      .filter((i) => i.journalId === journalId)
      .sort((a, b) => b.year - a.year || b.number - a.number)
  },

  getByJournalId: (journalId: string): Issue[] => {
    return issueService.getByJournal(journalId)
  },

  getPublished: (journalId: string): Issue[] => {
    return getStorage<Issue>(STORAGE_KEYS.ISSUES)
      .filter((i) => i.journalId === journalId && i.isPublished)
      .sort((a, b) => b.year - a.year || b.number - a.number)
  },

  getCurrent: (journalId: string): Issue | undefined => {
    return getStorage<Issue>(STORAGE_KEYS.ISSUES).find((i) => i.journalId === journalId && i.isCurrent)
  },

  create: (issue: Omit<Issue, "id">): Issue => {
    const issues = getStorage<Issue>(STORAGE_KEYS.ISSUES)
    const newIssue: Issue = { ...issue, id: generateId() }
    issues.push(newIssue)
    setStorage(STORAGE_KEYS.ISSUES, issues)
    return newIssue
  },

  update: (id: string, updates: Partial<Issue>): Issue | undefined => {
    const issues = getStorage<Issue>(STORAGE_KEYS.ISSUES)
    const index = issues.findIndex((i) => i.id === id)
    if (index === -1) return undefined
    issues[index] = { ...issues[index], ...updates }
    setStorage(STORAGE_KEYS.ISSUES, issues)
    return issues[index]
  },
}

// Publication Service
export const publicationService = {
  getAll: (): Publication[] => getStorage<Publication>(STORAGE_KEYS.PUBLICATIONS),

  getById: (id: string): Publication | undefined => {
    return getStorage<Publication>(STORAGE_KEYS.PUBLICATIONS).find((p) => p.id === id)
  },

  getBySubmission: (submissionId: string): Publication[] => {
    return getStorage<Publication>(STORAGE_KEYS.PUBLICATIONS)
      .filter((p) => p.submissionId === submissionId)
      .sort((a, b) => b.version - a.version)
  },

  getByIssue: (issueId: string): Publication[] => {
    return getStorage<Publication>(STORAGE_KEYS.PUBLICATIONS).filter((p) => p.issueId === issueId)
  },

  getPublished: (): Publication[] => {
    return getStorage<Publication>(STORAGE_KEYS.PUBLICATIONS).filter((p) => p.status === "published")
  },

  getByJournalId: (journalId: string): Publication[] => {
    const issues = issueService.getByJournal(journalId)
    const issueIds = new Set(issues.map((i) => i.id))
    return getStorage<Publication>(STORAGE_KEYS.PUBLICATIONS).filter((p) => p.issueId && issueIds.has(p.issueId))
  },

  create: (publication: Omit<Publication, "id">): Publication => {
    const publications = getStorage<Publication>(STORAGE_KEYS.PUBLICATIONS)
    const newPublication: Publication = { ...publication, id: generateId() }
    publications.push(newPublication)
    setStorage(STORAGE_KEYS.PUBLICATIONS, publications)
    return newPublication
  },

  update: (id: string, updates: Partial<Publication>): Publication | undefined => {
    const publications = getStorage<Publication>(STORAGE_KEYS.PUBLICATIONS)
    const index = publications.findIndex((p) => p.id === id)
    if (index === -1) return undefined
    publications[index] = { ...publications[index], ...updates }
    setStorage(STORAGE_KEYS.PUBLICATIONS, publications)
    return publications[index]
  },
}

// Announcement Service
export const announcementService = {
  getAll: (): Announcement[] => getStorage<Announcement>(STORAGE_KEYS.ANNOUNCEMENTS),

  getActive: (journalId: string): Announcement[] => {
    const now = new Date().toISOString()
    return getStorage<Announcement>(STORAGE_KEYS.ANNOUNCEMENTS)
      .filter((a) => a.journalId === journalId && a.isActive && (!a.dateExpire || a.dateExpire > now))
      .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
  },

  getByJournalId: (journalId: string): Announcement[] => {
    return getStorage<Announcement>(STORAGE_KEYS.ANNOUNCEMENTS)
      .filter((a) => a.journalId === journalId)
      .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
  },

  create: (announcement: Omit<Announcement, "id">): Announcement => {
    const announcements = getStorage<Announcement>(STORAGE_KEYS.ANNOUNCEMENTS)
    const newAnnouncement: Announcement = { ...announcement, id: generateId() }
    announcements.push(newAnnouncement)
    setStorage(STORAGE_KEYS.ANNOUNCEMENTS, announcements)
    return newAnnouncement
  },
}

// Notification Service
export const notificationService = {
  getByUser: (userId: string): Notification[] => {
    return getStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS)
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getUnread: (userId: string): Notification[] => {
    return getStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS).filter((n) => n.userId === userId && !n.isRead)
  },

  create: (notification: Omit<Notification, "id" | "createdAt">): Notification => {
    const notifications = getStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS)
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    notifications.push(newNotification)
    setStorage(STORAGE_KEYS.NOTIFICATIONS, notifications)
    return newNotification
  },

  markAsRead: (id: string): void => {
    const notifications = getStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS)
    const index = notifications.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications[index].isRead = true
      setStorage(STORAGE_KEYS.NOTIFICATIONS, notifications)
    }
  },

  markAllAsRead: (userId: string): void => {
    const notifications = getStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS)
    notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true
    })
    setStorage(STORAGE_KEYS.NOTIFICATIONS, notifications)
  },
}
