// Storage Module - Backward compatible re-export
// This file maintains backward compatibility with existing imports
// New code should import from lib/services directly

import { STORAGE_KEYS, SEED_VERSION, SEED_DATA_VERSION } from "./constants"
import { setStorage, generateId, isBrowser, clearAllStorage } from "./services/base"
import { userService } from "./services/user-service"
import { journalService } from "./services/journal-service"
import { submissionService } from "./services/submission-service"
import { reviewAssignmentService, reviewRoundService, editorialDecisionService } from "./services/review-service"
import {
  sectionService,
  issueService,
  publicationService,
  announcementService,
  notificationService,
} from "./services/content-service"
import {
  seedUsers,
  seedJournals,
  createSeedSections,
  createSeedIssues,
  createSeedAnnouncement,
  workflowArticlesByJournal,
} from "./services/seed-data"
import type {
  User,
  Journal,
  Section,
  Submission,
  Issue,
  Publication,
  Announcement,
  ReviewAssignment,
  ReviewRound,
  EditorialDecision,
} from "./types"

// Re-export all services for backward compatibility
export {
  userService,
  journalService,
  sectionService,
  submissionService,
  reviewAssignmentService,
  reviewRoundService,
  editorialDecisionService,
  issueService,
  publicationService,
  announcementService,
  notificationService,
}

// Initialize storage with seed data
export function initializeStorage(): void {
  if (!isBrowser()) return

  // Run migrations first
  journalService.migrate()

  const currentVersion = localStorage.getItem("iamjos_seed_version")
  const dataVersion = localStorage.getItem("iamjos_seed_data_version")
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED)

  // Re-initialize if version mismatch or not initialized
  if (isInitialized && currentVersion === SEED_VERSION && dataVersion === SEED_DATA_VERSION) return

  // Clear old data if version mismatch
  if (currentVersion !== SEED_VERSION || dataVersion !== SEED_DATA_VERSION) {
    clearAllStorage()
  }

  // Create journals first so we can reference their IDs
  const journals: Journal[] = []
  const journalIdMap: Record<string, string> = {}

  seedJournals.forEach((journalData, index) => {
    const journalId = `journal-${index + 1}`
    const journal: Journal = {
      ...journalData,
      id: journalId,
      createdAt: new Date().toISOString(),
    }
    journals.push(journal)
    journalIdMap[journalData.path] = journalId
  })

  const users: User[] = seedUsers.map((user) => ({
    ...user,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }))
  setStorage(STORAGE_KEYS.USERS, users)

  // Helper to find users by journal and role
  const findUserByJournalRole = (journalPath: string, role: string): User | undefined => {
    return users.find((u) => u.journalId === journalPath && u.roles.includes(role as any))
  }

  const findUserByEmail = (email: string): User | undefined => {
    return users.find((u) => u.email === email)
  }

  // Create journal-related data
  const allSections: Section[] = []
  const allIssues: Issue[] = []
  const allPublications: Publication[] = []
  const allAnnouncements: Announcement[] = []
  const allSubmissions: Submission[] = []
  const allReviewRounds: ReviewRound[] = []
  const allReviewAssignments: ReviewAssignment[] = []
  const allEditorialDecisions: EditorialDecision[] = []

  journals.forEach((journal) => {
    const journalId = journal.id
    const journalPath = journal.path

    // Create sections
    const sections = createSeedSections(journalId).map((s, i) => ({
      ...s,
      id: `section-${journalId}-${i + 1}`,
    }))
    allSections.push(...sections)

    // Create issues
    const issues = createSeedIssues(journalId).map((issue, i) => ({
      ...issue,
      id: `issue-${journalId}-${i + 1}`,
    }))
    allIssues.push(...issues)

    // Create announcement
    const announcement: Announcement = {
      ...createSeedAnnouncement(journalId),
      id: `announcement-${journalId}`,
    }
    allAnnouncements.push(announcement)

    // Get journal users
    const editor = findUserByJournalRole(journalPath, "editor")
    const author = findUserByJournalRole(journalPath, "author")
    const reviewer1 = findUserByEmail(`reviewer@${journalPath}.org`)
    const reviewer2 = findUserByEmail(`reviewer2@${journalPath}.org`)
    const currentIssue = issues.find((i) => i.isCurrent)

    // Create workflow articles with full review data
    const journalArticles = workflowArticlesByJournal[journalPath] || []

    journalArticles.forEach((article, articleIndex) => {
      const submissionId = `sub-${journalPath}-${articleIndex + 1}`
      const now = Date.now()
      const submittedDate = new Date(now - article.daysAgo * 24 * 60 * 60 * 1000)

      // Create submission
      const submission: Submission = {
        id: submissionId,
        journalId,
        sectionId: sections[0]?.id || "",
        title: article.title,
        abstract: article.abstract,
        keywords: article.keywords,
        status: article.status,
        submitterId: author?.id || "",
        authors: [
          {
            id: `author-${submissionId}-1`,
            firstName: author?.firstName || "Author",
            lastName: author?.lastName || "Name",
            email: author?.email || "author@example.com",
            affiliation: author?.affiliation,
            orcid: author?.orcid,
            isPrimary: true,
            sequence: 1,
          },
        ],
        files: [
          {
            id: `file-${submissionId}-1`,
            submissionId,
            fileName: `manuscript-${submissionId}.pdf`,
            fileType: "application/pdf",
            fileSize: Math.floor(Math.random() * 2000000) + 500000,
            fileStage: "submission",
            uploadedAt: submittedDate.toISOString(),
            uploadedBy: author?.id || "",
          },
        ],
        dateSubmitted: submittedDate.toISOString(),
        dateStatusModified: new Date(now - Math.min(article.daysAgo - 1, 1) * 24 * 60 * 60 * 1000).toISOString(),
        locale: "en",
        stageId:
          article.status === "published"
            ? 5
            : article.status === "accepted"
              ? 4
              : article.status === "under_review"
                ? 3
                : article.status === "revision_required"
                  ? 3
                  : 1,
        currentRound: 1,
      }
      allSubmissions.push(submission)

      // Create review round if article has been sent to review
      if (article.workflowStage !== "new") {
        const roundId = `round-${submissionId}-1`
        const reviewRound: ReviewRound = {
          id: roundId,
          submissionId,
          round: 1,
          status:
            article.reviewsCompleted === article.reviewerCount && article.reviewerCount > 0
              ? article.status === "revision_required"
                ? "revisions_requested"
                : "decision_made"
              : "pending",
          dateCreated: new Date(submittedDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        }
        allReviewRounds.push(reviewRound)

        // Create review assignments
        const reviewers = [reviewer1, reviewer2].filter(Boolean).slice(0, article.reviewerCount)

        reviewers.forEach((reviewer, reviewerIndex) => {
          if (!reviewer) return

          const isCompleted = reviewerIndex < article.reviewsCompleted
          const assignedDate = new Date(submittedDate.getTime() + 3 * 24 * 60 * 60 * 1000)
          const dueDate = new Date(assignedDate.getTime() + 14 * 24 * 60 * 60 * 1000)
          const completedDate = isCompleted
            ? new Date(assignedDate.getTime() + (7 + Math.random() * 7) * 24 * 60 * 60 * 1000)
            : undefined

          const assignment: ReviewAssignment = {
            id: `review-${submissionId}-${reviewerIndex + 1}`,
            submissionId,
            reviewerId: reviewer.id,
            reviewRoundId: roundId,
            status: isCompleted ? "completed" : "accepted",
            recommendation: isCompleted ? article.recommendation : undefined,
            dateAssigned: assignedDate.toISOString(),
            dateConfirmed: new Date(assignedDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            dateDue: dueDate.toISOString(),
            dateCompleted: completedDate?.toISOString(),
            quality: isCompleted ? Math.floor(Math.random() * 2) + 4 : undefined, // 4 or 5 stars
            comments: isCompleted ? generateReviewComments(article.recommendation) : undefined,
            commentsToEditor: isCompleted
              ? `Confidential comments regarding "${article.title}". Overall assessment is ${article.recommendation?.replace("_", " ")}.`
              : undefined,
          }
          allReviewAssignments.push(assignment)
        })

        // Create editorial decision for decided articles
        if (
          article.status === "accepted" ||
          article.status === "declined" ||
          article.status === "revision_required" ||
          article.status === "published"
        ) {
          const decisionMap: Record<string, "accept" | "decline" | "request_revisions"> = {
            accepted: "accept",
            published: "accept",
            declined: "decline",
            revision_required: "request_revisions",
          }

          const decision: EditorialDecision = {
            id: `decision-${submissionId}-1`,
            submissionId,
            reviewRoundId: roundId,
            editorId: editor?.id || "",
            decision: decisionMap[article.status] || "accept",
            dateDecided: new Date(now - (article.daysAgo - 5) * 24 * 60 * 60 * 1000).toISOString(),
            comments: generateDecisionComments(decisionMap[article.status], article.title),
          }
          allEditorialDecisions.push(decision)
        }
      }

      // Create publication for published/accepted articles
      if (article.status === "published" || article.status === "accepted") {
        const publication: Publication = {
          id: `pub-${submissionId}`,
          submissionId,
          issueId: article.status === "published" ? currentIssue?.id : undefined,
          title: article.title,
          abstract: article.abstract,
          keywords: article.keywords,
          pages: `${articleIndex * 15 + 1}-${(articleIndex + 1) * 15}`,
          doi: article.status === "published" ? `10.1234/${journalPath}.2024.${articleIndex + 1}` : undefined,
          datePublished: article.status === "published" ? currentIssue?.datePublished : undefined,
          version: 1,
          status: article.status === "published" ? "published" : "draft",
        }
        allPublications.push(publication)
      }
    })
  })

  // Save all data
  setStorage(STORAGE_KEYS.JOURNALS, journals)
  setStorage(STORAGE_KEYS.SECTIONS, allSections)
  setStorage(STORAGE_KEYS.ISSUES, allIssues)
  setStorage(STORAGE_KEYS.PUBLICATIONS, allPublications)
  setStorage(STORAGE_KEYS.ANNOUNCEMENTS, allAnnouncements)
  setStorage(STORAGE_KEYS.SUBMISSIONS, allSubmissions)
  setStorage(STORAGE_KEYS.REVIEW_ROUNDS, allReviewRounds)
  setStorage(STORAGE_KEYS.REVIEW_ASSIGNMENTS, allReviewAssignments)
  setStorage(STORAGE_KEYS.EDITORIAL_DECISIONS, allEditorialDecisions)

  localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true")
  localStorage.setItem("iamjos_seed_version", SEED_VERSION)
  localStorage.setItem("iamjos_seed_data_version", SEED_DATA_VERSION)
}

// Helper function to generate review comments
function generateReviewComments(recommendation?: string): string {
  const comments: Record<string, string> = {
    accept:
      "This is an excellent manuscript with significant contributions to the field. The methodology is sound, results are well-presented, and conclusions are supported by the data. I recommend acceptance with only minor editorial corrections.",
    minor_revisions:
      "This is a well-written manuscript addressing an important topic. The methodology is generally sound, but there are some areas that need clarification. I recommend minor revisions focusing on: 1) Expanding the literature review, 2) Clarifying the statistical methods, 3) Improving figure quality.",
    major_revisions:
      "The manuscript addresses an interesting research question, but significant revisions are needed before it can be considered for publication. Major concerns include: 1) Insufficient sample size justification, 2) Missing control experiments, 3) Overstated conclusions not fully supported by the data. A thorough revision addressing these issues is required.",
    resubmit_elsewhere:
      "While the topic is of interest, the manuscript does not align well with the scope of this journal. The methodology has fundamental issues that would require extensive revision. I recommend the authors consider submitting to a more specialized venue after addressing the methodological concerns.",
    decline:
      "The manuscript presents preliminary findings but lacks the rigor expected for this journal. The research question is not clearly defined, the methodology has significant flaws, and the conclusions are not supported by the presented data. I cannot recommend this for publication.",
  }
  return comments[recommendation || "accept"] || comments.accept
}

// Helper function to generate decision comments
function generateDecisionComments(decision: string, title: string): string {
  const comments: Record<string, string> = {
    accept: `Dear Author, I am pleased to inform you that your manuscript "${title}" has been accepted for publication. The reviewers found your work to be of high quality and a valuable contribution to the field. Congratulations!`,
    decline: `Dear Author, After careful consideration by our reviewers and editorial board, I regret to inform you that your manuscript "${title}" cannot be accepted for publication. We encourage you to consider the reviewers' feedback for future submissions.`,
    request_revisions: `Dear Author, Your manuscript "${title}" has been reviewed and requires revisions before a final decision can be made. Please carefully address all reviewer comments and submit a revised version within 30 days.`,
  }
  return comments[decision] || comments.accept
}

// Reset storage (for development/testing)
export function resetStorage(): void {
  if (!isBrowser()) return
  clearAllStorage()
  initializeStorage()
}
