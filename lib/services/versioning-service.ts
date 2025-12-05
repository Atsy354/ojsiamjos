// Article Versioning Service - OJS 3.3 Compatible
// Manages article versions, version history, and version comparison

import type { Submission, SubmissionFile } from "@/lib/types"

export interface ArticleVersion {
  id: string
  submissionId: string
  publicationId?: string
  version: number
  title: string
  abstract: string
  keywords: string[]
  authors: {
    firstName: string
    lastName: string
    email: string
    affiliation?: string
    orcid?: string
  }[]
  files: SubmissionFile[]
  dateCreated: string
  datePublished?: string
  status: "draft" | "published" | "archived"
  changelog?: string
  createdBy: string
  doi?: string
  previousVersionId?: string
}

export interface VersionComparison {
  field: string
  oldValue: string
  newValue: string
  changeType: "added" | "removed" | "modified"
}

const STORAGE_KEY = "iamjos_article_versions"

class VersioningService {
  private getVersions(): ArticleVersion[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  private saveVersions(versions: ArticleVersion[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions))
  }

  // Get all versions for a submission
  getVersionHistory(submissionId: string): ArticleVersion[] {
    return this.getVersions()
      .filter((v) => v.submissionId === submissionId)
      .sort((a, b) => b.version - a.version)
  }

  // Get specific version
  getVersion(versionId: string): ArticleVersion | null {
    return this.getVersions().find((v) => v.id === versionId) || null
  }

  // Get latest version for a submission
  getLatestVersion(submissionId: string): ArticleVersion | null {
    const versions = this.getVersionHistory(submissionId)
    return versions.length > 0 ? versions[0] : null
  }

  // Get published versions only
  getPublishedVersions(submissionId: string): ArticleVersion[] {
    return this.getVersionHistory(submissionId).filter((v) => v.status === "published")
  }

  // Create initial version from submission
  createInitialVersion(submission: Submission, createdBy: string): ArticleVersion {
    const versions = this.getVersions()

    const newVersion: ArticleVersion = {
      id: `ver_${Date.now()}`,
      submissionId: submission.id,
      version: 1,
      title: submission.title,
      abstract: submission.abstract,
      keywords: submission.keywords,
      authors: submission.authors.map((a) => ({
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        affiliation: a.affiliation,
        orcid: a.orcid,
      })),
      files: submission.files,
      dateCreated: new Date().toISOString(),
      status: "draft",
      createdBy,
    }

    versions.push(newVersion)
    this.saveVersions(versions)

    return newVersion
  }

  // Create new version from existing submission (for updates/revisions)
  createNewVersion(submission: Submission, createdBy: string, changelog?: string): ArticleVersion {
    const versions = this.getVersions()
    const existingVersions = this.getVersionHistory(submission.id)
    const latestVersion = existingVersions.length > 0 ? existingVersions[0] : null
    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1

    const newVersion: ArticleVersion = {
      id: `ver_${Date.now()}`,
      submissionId: submission.id,
      version: newVersionNumber,
      title: submission.title,
      abstract: submission.abstract,
      keywords: submission.keywords,
      authors: submission.authors.map((a) => ({
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        affiliation: a.affiliation,
        orcid: a.orcid,
      })),
      files: submission.files,
      dateCreated: new Date().toISOString(),
      status: "draft",
      createdBy,
      changelog,
      previousVersionId: latestVersion?.id,
    }

    versions.push(newVersion)
    this.saveVersions(versions)

    return newVersion
  }

  // Publish a version
  publishVersion(versionId: string, doi?: string): ArticleVersion | null {
    const versions = this.getVersions()
    const index = versions.findIndex((v) => v.id === versionId)

    if (index === -1) return null

    versions[index] = {
      ...versions[index],
      status: "published",
      datePublished: new Date().toISOString(),
      doi: doi || versions[index].doi,
    }

    this.saveVersions(versions)
    return versions[index]
  }

  // Archive a version
  archiveVersion(versionId: string): ArticleVersion | null {
    const versions = this.getVersions()
    const index = versions.findIndex((v) => v.id === versionId)

    if (index === -1) return null

    versions[index] = {
      ...versions[index],
      status: "archived",
    }

    this.saveVersions(versions)
    return versions[index]
  }

  // Update version metadata
  updateVersion(
    versionId: string,
    updates: Partial<Pick<ArticleVersion, "title" | "abstract" | "keywords" | "authors" | "changelog" | "doi">>,
  ): ArticleVersion | null {
    const versions = this.getVersions()
    const index = versions.findIndex((v) => v.id === versionId)

    if (index === -1) return null

    versions[index] = {
      ...versions[index],
      ...updates,
    }

    this.saveVersions(versions)
    return versions[index]
  }

  // Compare two versions
  compareVersions(versionId1: string, versionId2: string): VersionComparison[] {
    const v1 = this.getVersion(versionId1)
    const v2 = this.getVersion(versionId2)

    if (!v1 || !v2) return []

    const comparisons: VersionComparison[] = []

    // Compare title
    if (v1.title !== v2.title) {
      comparisons.push({
        field: "Title",
        oldValue: v1.title,
        newValue: v2.title,
        changeType: "modified",
      })
    }

    // Compare abstract
    if (v1.abstract !== v2.abstract) {
      comparisons.push({
        field: "Abstract",
        oldValue: v1.abstract.substring(0, 200) + (v1.abstract.length > 200 ? "..." : ""),
        newValue: v2.abstract.substring(0, 200) + (v2.abstract.length > 200 ? "..." : ""),
        changeType: "modified",
      })
    }

    // Compare keywords
    const oldKeywords = v1.keywords.sort().join(", ")
    const newKeywords = v2.keywords.sort().join(", ")
    if (oldKeywords !== newKeywords) {
      comparisons.push({
        field: "Keywords",
        oldValue: oldKeywords,
        newValue: newKeywords,
        changeType: "modified",
      })
    }

    // Compare authors
    const oldAuthors = v1.authors.map((a) => `${a.firstName} ${a.lastName}`).join(", ")
    const newAuthors = v2.authors.map((a) => `${a.firstName} ${a.lastName}`).join(", ")
    if (oldAuthors !== newAuthors) {
      comparisons.push({
        field: "Authors",
        oldValue: oldAuthors,
        newValue: newAuthors,
        changeType: "modified",
      })
    }

    // Compare files
    const oldFiles = v1.files
      .map((f) => f.fileName)
      .sort()
      .join(", ")
    const newFiles = v2.files
      .map((f) => f.fileName)
      .sort()
      .join(", ")
    if (oldFiles !== newFiles) {
      comparisons.push({
        field: "Files",
        oldValue: oldFiles || "None",
        newValue: newFiles || "None",
        changeType: "modified",
      })
    }

    return comparisons
  }

  // Delete a version (only drafts can be deleted)
  deleteVersion(versionId: string): boolean {
    const versions = this.getVersions()
    const version = versions.find((v) => v.id === versionId)

    if (!version || version.status === "published") return false

    const filtered = versions.filter((v) => v.id !== versionId)
    this.saveVersions(filtered)
    return true
  }

  // Get version statistics
  getVersionStats(submissionId: string): {
    totalVersions: number
    publishedVersions: number
    draftVersions: number
    archivedVersions: number
    latestVersion: number
  } {
    const versions = this.getVersionHistory(submissionId)

    return {
      totalVersions: versions.length,
      publishedVersions: versions.filter((v) => v.status === "published").length,
      draftVersions: versions.filter((v) => v.status === "draft").length,
      archivedVersions: versions.filter((v) => v.status === "archived").length,
      latestVersion: versions.length > 0 ? versions[0].version : 0,
    }
  }
}

export const versioningService = new VersioningService()
