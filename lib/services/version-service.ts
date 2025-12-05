// Article Versioning Service - Handles article version management
import type { ArticleVersion, VersionChange, Submission, Galley } from "@/lib/types"
import { generateId } from "./base"
import { submissionService } from "./submission-service"

const VERSIONS_KEY = "ojs_article_versions"

export const versionService = {
  getAll: (): ArticleVersion[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(VERSIONS_KEY)
    return stored ? JSON.parse(stored) : []
  },

  getBySubmissionId: (submissionId: string): ArticleVersion[] => {
    return versionService
      .getAll()
      .filter((v) => v.submissionId === submissionId)
      .sort((a, b) => b.version - a.version)
  },

  getById: (id: string): ArticleVersion | undefined => {
    return versionService.getAll().find((v) => v.id === id)
  },

  getCurrentVersion: (submissionId: string): ArticleVersion | undefined => {
    return versionService.getAll().find((v) => v.submissionId === submissionId && v.isCurrentVersion)
  },

  getVersionByNumber: (submissionId: string, version: number): ArticleVersion | undefined => {
    return versionService.getAll().find((v) => v.submissionId === submissionId && v.version === version)
  },

  createInitialVersion: (submission: Submission, createdBy: string): ArticleVersion => {
    const versions = versionService.getAll()

    const newVersion: ArticleVersion = {
      id: generateId(),
      submissionId: submission.id,
      publicationId: generateId(),
      version: 1,
      title: submission.title,
      abstract: submission.abstract,
      keywords: submission.keywords,
      authors: submission.authors,
      dateCreated: new Date().toISOString(),
      status: "draft",
      changes: [
        {
          field: "initial",
          description: "Initial version created",
        },
      ],
      createdBy,
      galleys: [],
      isCurrentVersion: true,
    }

    versions.push(newVersion)
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))

    // Update submission with version info
    submissionService.update(submission.id, { version: 1 })

    return newVersion
  },

  createNewVersion: (
    submissionId: string,
    updates: Partial<Pick<ArticleVersion, "title" | "abstract" | "keywords" | "authors" | "galleys">>,
    versionNotes: string,
    createdBy: string,
  ): ArticleVersion | undefined => {
    const versions = versionService.getAll()
    const currentVersion = versionService.getCurrentVersion(submissionId)

    if (!currentVersion) return undefined

    // Calculate changes
    const changes: VersionChange[] = []

    if (updates.title && updates.title !== currentVersion.title) {
      changes.push({
        field: "title",
        oldValue: currentVersion.title,
        newValue: updates.title,
        description: "Title updated",
      })
    }

    if (updates.abstract && updates.abstract !== currentVersion.abstract) {
      changes.push({
        field: "abstract",
        oldValue: currentVersion.abstract.substring(0, 100) + "...",
        newValue: updates.abstract.substring(0, 100) + "...",
        description: "Abstract updated",
      })
    }

    if (updates.keywords && JSON.stringify(updates.keywords) !== JSON.stringify(currentVersion.keywords)) {
      changes.push({
        field: "keywords",
        oldValue: currentVersion.keywords.join(", "),
        newValue: updates.keywords.join(", "),
        description: "Keywords updated",
      })
    }

    if (updates.authors && JSON.stringify(updates.authors) !== JSON.stringify(currentVersion.authors)) {
      changes.push({
        field: "authors",
        description: "Author list updated",
      })
    }

    if (updates.galleys) {
      changes.push({
        field: "galleys",
        description: "Publication files updated",
      })
    }

    if (versionNotes) {
      changes.push({
        field: "notes",
        description: versionNotes,
      })
    }

    // Mark current version as not current
    const updatedVersions = versions.map((v) => (v.id === currentVersion.id ? { ...v, isCurrentVersion: false } : v))

    // Create new version
    const newVersion: ArticleVersion = {
      id: generateId(),
      submissionId,
      publicationId: generateId(),
      version: currentVersion.version + 1,
      title: updates.title || currentVersion.title,
      abstract: updates.abstract || currentVersion.abstract,
      keywords: updates.keywords || currentVersion.keywords,
      authors: updates.authors || currentVersion.authors,
      dateCreated: new Date().toISOString(),
      status: "draft",
      changes,
      createdBy,
      doi: currentVersion.doi,
      galleys: updates.galleys || currentVersion.galleys,
      isCurrentVersion: true,
    }

    updatedVersions.push(newVersion)
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(updatedVersions))

    // Update submission version
    submissionService.update(submissionId, { version: newVersion.version })

    return newVersion
  },

  publishVersion: (versionId: string): ArticleVersion | undefined => {
    const versions = versionService.getAll()
    const index = versions.findIndex((v) => v.id === versionId)

    if (index === -1) return undefined

    versions[index] = {
      ...versions[index],
      status: "published",
      datePublished: new Date().toISOString(),
    }

    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
    return versions[index]
  },

  unpublishVersion: (versionId: string): ArticleVersion | undefined => {
    const versions = versionService.getAll()
    const index = versions.findIndex((v) => v.id === versionId)

    if (index === -1) return undefined

    versions[index] = {
      ...versions[index],
      status: "unpublished",
    }

    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
    return versions[index]
  },

  revertToVersion: (submissionId: string, targetVersionId: string, createdBy: string): ArticleVersion | undefined => {
    const targetVersion = versionService.getById(targetVersionId)
    if (!targetVersion || targetVersion.submissionId !== submissionId) return undefined

    return versionService.createNewVersion(
      submissionId,
      {
        title: targetVersion.title,
        abstract: targetVersion.abstract,
        keywords: targetVersion.keywords,
        authors: targetVersion.authors,
        galleys: targetVersion.galleys,
      },
      `Reverted to version ${targetVersion.version}`,
      createdBy,
    )
  },

  updateGalleys: (versionId: string, galleys: Galley[]): ArticleVersion | undefined => {
    const versions = versionService.getAll()
    const index = versions.findIndex((v) => v.id === versionId)

    if (index === -1) return undefined

    versions[index] = {
      ...versions[index],
      galleys,
    }

    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
    return versions[index]
  },

  setDOI: (versionId: string, doi: string): ArticleVersion | undefined => {
    const versions = versionService.getAll()
    const index = versions.findIndex((v) => v.id === versionId)

    if (index === -1) return undefined

    versions[index] = {
      ...versions[index],
      doi,
    }

    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
    return versions[index]
  },

  compareVersions: (version1Id: string, version2Id: string): VersionChange[] => {
    const v1 = versionService.getById(version1Id)
    const v2 = versionService.getById(version2Id)

    if (!v1 || !v2) return []

    const changes: VersionChange[] = []

    if (v1.title !== v2.title) {
      changes.push({
        field: "title",
        oldValue: v1.title,
        newValue: v2.title,
        description: "Title changed",
      })
    }

    if (v1.abstract !== v2.abstract) {
      changes.push({
        field: "abstract",
        oldValue: v1.abstract,
        newValue: v2.abstract,
        description: "Abstract changed",
      })
    }

    if (JSON.stringify(v1.keywords) !== JSON.stringify(v2.keywords)) {
      changes.push({
        field: "keywords",
        oldValue: v1.keywords.join(", "),
        newValue: v2.keywords.join(", "),
        description: "Keywords changed",
      })
    }

    if (JSON.stringify(v1.authors) !== JSON.stringify(v2.authors)) {
      changes.push({
        field: "authors",
        oldValue: v1.authors.map((a) => `${a.firstName} ${a.lastName}`).join(", "),
        newValue: v2.authors.map((a) => `${a.firstName} ${a.lastName}`).join(", "),
        description: "Authors changed",
      })
    }

    return changes
  },

  delete: (id: string): boolean => {
    const versions = versionService.getAll()
    const filtered = versions.filter((v) => v.id !== id)
    if (filtered.length === versions.length) return false
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(filtered))
    return true
  },
}
