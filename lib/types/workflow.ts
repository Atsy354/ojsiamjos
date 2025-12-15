/**
 * Complete OJS Workflow Type Definitions
 * Version: 1.0.0
 * 
 * Comprehensive type system matching OJS 3.x database schema
 * Includes all entities for complete workflow from submission to publication
 */

// ===================================================================
// CORE WORKFLOW TYPES
// ===================================================================

/**
 * Workflow Stage IDs (OJS Standard)
 */
export enum WorkflowStage {
    SUBMISSION = 1,
    INTERNAL_REVIEW = 2,
    EXTERNAL_REVIEW = 3,
    EDITING = 4,
    PRODUCTION = 5,
}

/**
 * Submission Progress Steps (5-Step Wizard)
 */
export enum SubmissionProgress {
    INCOMPLETE = 0,
    STEP_START = 1,
    STEP_UPLOAD = 2,
    STEP_METADATA = 3,
    STEP_CONFIRMATION = 4,
    COMPLETE = 5,
}

/**
 * Editorial Decision Codes (OJS Standard)
 */
export enum EditorialDecision {
    ACCEPT = 1,
    PENDING_REVISIONS = 2,
    RESUBMIT = 3,
    DECLINE = 4,
    SEND_TO_PRODUCTION = 7,
    EXTERNAL_REVIEW = 8,
    INITIAL_DECLINE = 9,
    NEW_ROUND = 16,
    REVERT_DECLINE = 17,
}

/**
 * Review Recommendation Codes
 */
export enum ReviewRecommendation {
    ACCEPT = 1,
    REVISIONS_REQUIRED = 2,
    RESUBMIT = 3,
    DECLINE = 4,
    SEE_COMMENTS = 5,
}

/**
 * Review Method Types
 */
export enum ReviewMethod {
    DOUBLE_BLIND = 1,
    BLIND = 2,
    OPEN = 3,
}

/**
 * Review Round Status
 */
export enum ReviewRoundStatus {
    PENDING = 1,
    PENDING_REVIEWERS = 6,
    PENDING_REVIEWS = 8,
    RECOMMENDATIONS_READY = 11,
    RECOMMENDATIONS_COMPLETED = 12,
}

// ===================================================================
// DATABASE ENTITY TYPES
// ===================================================================

/**
 * Enhanced Submission Entity
 */
export interface Submission {
    // Primary fields
    id: number | string
    journalId: number
    sectionId: number
    submitterId: string // UUID

    // Content
    title: string
    subtitle?: string
    abstract?: string
    keywords?: string[]

    // Workflow state
    status: string | number
    stageId: WorkflowStage
    submissionProgress: SubmissionProgress

    // Dates
    dateSubmitted?: string
    dateLastActivity?: string
    dateStatusModified?: string
    createdAt?: string
    updatedAt?: string
    lastModified?: string

    // Metadata
    language?: string
    locale?: string
    contextId?: number

    // Relations
    submitter?: User
    section?: Section
    authors?: Author[]
    files?: SubmissionFile[]
    reviewRounds?: ReviewRound[]
}

/**
 * Review Round Entity
 */
export interface ReviewRound {
    reviewRoundId: number
    submissionId: number
    stageId: WorkflowStage
    round: number
    status: ReviewRoundStatus
    dateCreated: string
    dateModified?: string

    // Relations
    reviewAssignments?: ReviewAssignment[]
    editorialDecisions?: EditorialDecision[]
}

/**
 * Enhanced Review Assignment Entity
 */
export interface ReviewAssignment {
    id: number
    submissionId: number
    reviewerId: string // UUID
    reviewRoundId?: number
    stageId: WorkflowStage

    // Assignment details
    reviewMethod: ReviewMethod
    declined: boolean
    cancelled: boolean
    replaced: boolean

    // Dates
    dateAssigned?: string
    dateNotified?: string
    dateConfirmed?: string
    dateCompleted?: string
    dateAcknowledged?: string
    dateDue?: string
    dateResponseDue?: string
    lastModified?: string

    // Review content
    recommendation?: ReviewRecommendation
    reviewComments?: string
    commentsForEditor?: string
    quality?: number // 1-5
    reviewerFileId?: number

    // Relations
    reviewer?: User
    reviewRound?: ReviewRound
    formResponses?: ReviewFormResponse[]
}

/**
 * Review Form Response
 */
export interface ReviewFormResponse {
    reviewFormResponseId: number
    reviewAssignmentId: number
    reviewFormElementId?: number
    responseType: string
    responseValue: string
    createdAt: string
}

/**
 * Editorial Decision Entity  
 */
export interface EditorialDecisionEntity {
    decisionId: number
    submissionId: number
    editorId: string // UUID
    decision: EditorialDecision
    dateDecided: string
    round: number
    stageId: WorkflowStage
    reviewRoundId?: number
    decisionComments?: string

    // Relations
    editor?: User
    reviewRound?: ReviewRound
}

/**
 * Stage Assignment
 */
export interface StageAssignment {
    assignmentId: number
    submissionId: number
    userId: string // UUID
    userGroupId: number
    stageId: WorkflowStage
    dateAssigned: string
    canChangeMetadata: boolean
    recommendOnly: boolean

    // Relations
    user?: User
}

/**
 * Copyediting File
 */
export interface CopyeditingFile {
    fileId: number
    submissionId: number
    filePath: string
    fileType: string
    fileSize?: number
    originalFilename: string
    uploadedBy?: string // UUID
    dateUploaded: string
    copyeditStage: 'initial' | 'author_review' | 'final'
    version: number
}

/**
 * Publication Galley
 */
export interface PublicationGalley {
    galleyId: number
    publicationId?: number
    submissionId: number
    fileId?: number
    label: 'PDF' | 'HTML' | 'XML' | 'EPUB' | 'DOC' | 'MOBI'
    locale: string
    seq: number
    remoteUrl?: string
    isApproved: boolean
    dateCreated: string
}

/**
 * Workflow Notification
 */
export interface WorkflowNotification {
    notificationId: number
    submissionId?: number
    userId?: string // UUID
    type: string
    message: string
    isRead: boolean
    createdAt: string
    readAt?: string
}

/**
 * Workflow Audit Log Entry
 */
export interface WorkflowAuditLog {
    logId: number
    submissionId?: number
    userId?: string // UUID
    action: string
    oldValue?: string
    newValue?: string
    metadata?: Record<string, any>
    ipAddress?: string
    userAgent?: string
    createdAt: string
}

// ===================================================================
// API REQUEST/RESPONSE TYPES
// ===================================================================

/**
 * Create Review Round Request
 */
export interface CreateReviewRoundRequest {
    submissionId: number
    stageId: WorkflowStage
    round?: number
}

/**
 * Assign Reviewer Request
 */
export interface AssignReviewerRequest {
    submissionId: number
    reviewerId: string
    reviewRoundId?: number
    stageId: WorkflowStage
    reviewMethod: ReviewMethod
    dateDue?: string
    dateResponseDue?: string
}

/**
 * Reviewer Response (Accept/Decline)
 */
export interface ReviewerResponseRequest {
    reviewAssignmentId: number
    declined: boolean
    comments?: string
}

/**
 * Submit Review Request
 */
export interface SubmitReviewRequest {
    reviewAssignmentId: number
    recommendation: ReviewRecommendation
    reviewComments: string
    commentsForEditor?: string
    quality?: number
}

/**
 * Editorial Decision Request
 */
export interface EditorialDecisionRequest {
    submissionId: number
    decision: EditorialDecision
    round?: number
    stageId: WorkflowStage
    reviewRoundId?: number
    comments?: string
}

/**
 * Create Galley Request
 */
export interface CreateGalleyRequest {
    submissionId: number
    publicationId?: number
    fileId?: number
    label: PublicationGalley['label']
    locale?: string
    remoteUrl?: string
}

// ===================================================================
// SUBMISSION WIZARD TYPES
// ===================================================================

/**
 * Wizard Step 1: Start
 */
export interface WizardStep1Data {
    sectionId: number
    submissionLanguage: string
    commentsForEditor?: string
    submissionRequirements: boolean
    copyrightNotice: boolean
    privacyStatement: boolean
}

/**
 * Wizard Step 2: Upload Files
 */
export interface WizardStep2Data {
    files: File[]
    fileDescriptions: Record<string, string>
}

/**
 * Wizard Step 3: Metadata
 */
export interface WizardStep3Data {
    title: string
    subtitle?: string
    abstract: string
    keywords: string[]
    contributors: ContributorData[]
    supportingAgencies?: string[]
    references?: string[]
}

export interface ContributorData {
    firstName: string
    middleName?: string
    lastName: string
    email: string
    affiliation?: string
    country?: string
    orcid?: string
    isPrimaryContact: boolean
    isIncludedInBrowse: boolean
    sequence: number
}

/**
 * Wizard Step 4: Confirmation
 */
export interface WizardStep4Data {
    confirmation: boolean
    finalComments?: string
}

/**
 * Complete Wizard Data
 */
export interface CompleteWizardData {
    step1: WizardStep1Data
    step2: WizardStep2Data
    step3: WizardStep3Data
    step4: WizardStep4Data
}

// ===================================================================
// UTILITY TYPES
// ===================================================================

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
    data?: T
    error?: string
    message?: string
    success: boolean
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

/**
 * Workflow Action Result
 */
export interface WorkflowActionResult {
    success: boolean
    submissionId: number
    newStageId?: WorkflowStage
    newStatus?: string
    message: string
    errors?: string[]
}

// ===================================================================
// TYPE GUARDS
// ===================================================================

export function isReviewAssignment(obj: any): obj is ReviewAssignment {
    return obj && typeof obj.id === 'number' && typeof obj.reviewerId === 'string'
}

export function isEditorialDecisionEntity(obj: any): obj is EditorialDecisionEntity {
    return obj && typeof obj.decisionId === 'number' && typeof obj.decision === 'number'
}

export function isReviewRound(obj: any): obj is ReviewRound {
    return obj && typeof obj.reviewRoundId === 'number' && typeof obj.submissionId === 'number'
}

// ===================================================================
// CONSTANTS
// ===================================================================

export const WORKFLOW_STAGE_NAMES: Record<WorkflowStage, string> = {
    [WorkflowStage.SUBMISSION]: 'Submission',
    [WorkflowStage.INTERNAL_REVIEW]: 'Internal Review',
    [WorkflowStage.EXTERNAL_REVIEW]: 'Review',
    [WorkflowStage.EDITING]: 'Copyediting',
    [WorkflowStage.PRODUCTION]: 'Production',
}

export const EDITORIAL_DECISION_LABELS: Record<EditorialDecision, string> = {
    [EditorialDecision.ACCEPT]: 'Accept Submission',
    [EditorialDecision.PENDING_REVISIONS]: 'Revisions Required',
    [EditorialDecision.RESUBMIT]: 'Resubmit for Review',
    [EditorialDecision.DECLINE]: 'Decline Submission',
    [EditorialDecision.SEND_TO_PRODUCTION]: 'Send to Production',
    [EditorialDecision.EXTERNAL_REVIEW]: 'Send to Review',
    [EditorialDecision.INITIAL_DECLINE]: 'Decline (Initial)',
    [EditorialDecision.NEW_ROUND]: 'New Review Round',
    [EditorialDecision.REVERT_DECLINE]: 'Revert Decline',
}

export const REVIEW_RECOMMENDATION_LABELS: Record<ReviewRecommendation, string> = {
    [ReviewRecommendation.ACCEPT]: 'Accept',
    [ReviewRecommendation.REVISIONS_REQUIRED]: 'Revisions Required',
    [ReviewRecommendation.RESUBMIT]: 'Resubmit',
    [ReviewRecommendation.DECLINE]: 'Decline',
    [ReviewRecommendation.SEE_COMMENTS]: 'See Comments',
}
