// OJS Core Types based on PKP Architecture

export type UserRole =
  | "admin"
  | "editor"
  | "author"
  | "reviewer"
  | "reader"
  | "copyeditor"
  | "proofreader"
  | "layout_editor"
  | "subscription_manager"

export type SubmissionStatus =
  | "incomplete"
  | "submitted"
  | "under_review"
  | "revision_required"
  | "accepted"
  | "declined"
  | "published"
  | "copyediting"
  | "proofreading"
  | "production"
  | "scheduled"

export type ReviewStatus = "pending" | "accepted" | "declined" | "completed"

export type ReviewRecommendation = "accept" | "minor_revisions" | "major_revisions" | "resubmit_elsewhere" | "decline"

export type CopyeditingStatus = "pending" | "in_progress" | "author_review" | "completed"
export type ProofreadingStatus = "pending" | "in_progress" | "author_corrections" | "completed"
export type ProductionStatus = "pending" | "layout" | "galleys_ready" | "scheduled" | "published"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  affiliation?: string
  orcid?: string
  roles: UserRole[]
  createdAt: string
  bio?: string
  avatar?: string
  journalId?: string
}

export interface Journal {
  id: string
  path: string
  name: string
  acronym: string
  description: string
  issn?: string
  publisher?: string
  contactEmail: string
  logo?: string
  primaryLocale: string
  createdAt: string
}

export interface Section {
  id: string
  journalId: string
  title: string
  abbreviation: string
  policy?: string
  wordCount?: number
  isActive: boolean
  sequence: number
}

export interface Author {
  id: string
  userId?: string
  firstName: string
  lastName: string
  email: string
  affiliation?: string
  orcid?: string
  country?: string
  isPrimary: boolean
  sequence: number
}

export interface Submission {
  id: string
  journalId: string
  sectionId: string
  title: string
  abstract: string
  keywords: string[]
  status: SubmissionStatus
  submitterId: string
  authors: Author[]
  files: SubmissionFile[]
  dateSubmitted?: string
  dateStatusModified?: string
  locale: string
  stageId: number
  currentRound: number
  // Rich content fields for published articles
  sections?: ArticleSection[]
  references?: ArticleReference[]
  metrics?: ArticleMetrics
  figures?: ArticleFigure[]
  acknowledgments?: string
  funding?: string
  conflictOfInterest?: string
  version?: number
  previousVersionId?: string
}

export interface SubmissionFile {
  id: string
  submissionId: string
  fileName: string
  fileType: string
  fileSize: number
  fileStage: "submission" | "review" | "copyedit" | "production" | "proof"
  uploadedAt: string
  uploadedBy: string
  revision?: number
  originalFileId?: string
}

export interface ReviewAssignment {
  id: string
  submissionId: string
  reviewerId: string
  reviewRoundId: string
  status: ReviewStatus
  recommendation?: ReviewRecommendation
  dateAssigned: string
  dateConfirmed?: string
  dateDue?: string
  dateCompleted?: string
  quality?: number
  comments?: string
  commentsToEditor?: string
}

export interface ReviewRound {
  id: string
  submissionId: string
  round: number
  status: "pending" | "reviews_completed" | "revisions_requested" | "revisions_submitted" | "decision_made"
  dateCreated: string
}

export interface EditorialDecision {
  id: string
  submissionId: string
  reviewRoundId?: string
  editorId: string
  decision: "accept" | "decline" | "request_revisions" | "send_to_review" | "send_to_copyediting" | "send_to_production"
  dateDecided: string
  comments?: string
}

export interface CopyeditingAssignment {
  id: string
  submissionId: string
  copyeditorId: string
  status: CopyeditingStatus
  dateAssigned: string
  dateDue?: string
  dateCompleted?: string
  instructions?: string
  copyeditorComments?: string
  authorComments?: string
  files: SubmissionFile[]
}

export interface ProofreadingAssignment {
  id: string
  submissionId: string
  proofreaderId: string
  status: ProofreadingStatus
  dateAssigned: string
  dateDue?: string
  dateCompleted?: string
  instructions?: string
  proofreaderComments?: string
  authorCorrections?: string
  files: SubmissionFile[]
}

export interface ProductionAssignment {
  id: string
  submissionId: string
  layoutEditorId: string
  status: ProductionStatus
  dateAssigned: string
  dateCompleted?: string
  galleys: Galley[]
}

export interface Galley {
  id: string
  submissionId: string
  label: string
  locale: string
  fileId: string
  fileName: string
  fileType: "pdf" | "html" | "xml" | "epub"
  sequence: number
  isRemote: boolean
  remoteUrl?: string
}

export interface Issue {
  id: string
  journalId: string
  volume: number
  number: number
  year: number
  title?: string
  description?: string
  coverImage?: string
  datePublished?: string
  isPublished: boolean
  isCurrent: boolean
}

export interface Publication {
  id: string
  submissionId: string
  issueId?: string
  title: string
  abstract: string
  keywords: string[]
  pages?: string
  doi?: string
  datePublished?: string
  version: number
  status: "draft" | "scheduled" | "published"
  previousVersionId?: string
  versionNotes?: string
  isCurrentVersion: boolean
  authors?: Author[]
  galleys?: Galley[]
  citations?: number
  licenseUrl?: string
}

export interface ArticleVersion {
  id: string
  submissionId: string
  publicationId: string
  version: number
  title: string
  abstract: string
  keywords: string[]
  authors: Author[]
  dateCreated: string
  datePublished?: string
  status: "draft" | "published" | "unpublished"
  changes: VersionChange[]
  createdBy: string
  doi?: string
  galleys: Galley[]
  isCurrentVersion: boolean
}

export interface VersionChange {
  field: string
  oldValue?: string
  newValue?: string
  description: string
}

export interface Announcement {
  id: string
  journalId: string
  title: string
  content: string
  datePosted: string
  dateExpire?: string
  isActive: boolean
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
}

// Statistics
export interface SubmissionStatistics {
  total: number
  byStatus: Record<SubmissionStatus, number>
  thisMonth: number
  thisYear: number
}

export interface ReviewStatistics {
  averageReviewTime: number
  completionRate: number
  pendingReviews: number
}

// Article content types
export interface ArticleSection {
  id: string
  title: string
  content: string
  order: number
}

export interface ArticleReference {
  id: string
  authors: string
  title: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  year: number
  doi?: string
  url?: string
}

export interface ArticleMetrics {
  views: number
  downloads: number
  citations: number
  altmetricScore?: number
  socialShares?: number
}

export interface ArticleFigure {
  id: string
  caption: string
  imageUrl: string
  order: number
}

export interface SubscriptionType {
  id: string
  journalId: string
  name: string
  description?: string
  cost: number
  currency: string
  duration: number // in months
  format: "online" | "print" | "both"
  institutional: boolean
  isActive: boolean
}

export interface Subscription {
  id: string
  journalId: string
  subscriptionTypeId: string
  userId?: string
  institutionName?: string
  status: "active" | "expired" | "cancelled" | "pending"
  dateStart: string
  dateEnd: string
  referenceNumber?: string
  notes?: string
  ipRanges?: string[] // for institutional subscriptions
}

export interface EmailTemplate {
  id: string
  journalId?: string
  key: string
  name: string
  subject: string
  body: string
  description?: string
  isCustom: boolean
  locale: string
}

export interface PasswordResetToken {
  id: string
  userId: string
  token: string
  expiresAt: string
  used: boolean
}
