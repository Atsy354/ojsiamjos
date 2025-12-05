// Application constants and configuration
// Centralized location for all app-wide constants

export const APP_NAME = "IamJOS"
export const APP_DESCRIPTION = "Integrated Management Journal System"
export const APP_VERSION = "1.0.0"
export const SEED_VERSION = "2.0.0"
export const SEED_DATA_VERSION = "3.0.0"

// Storage keys for localStorage
export const STORAGE_KEYS = {
  USERS: "iamjos_users",
  JOURNALS: "iamjos_journals",
  SECTIONS: "iamjos_sections",
  SUBMISSIONS: "iamjos_submissions",
  REVIEW_ASSIGNMENTS: "iamjos_review_assignments",
  REVIEW_ROUNDS: "iamjos_review_rounds",
  EDITORIAL_DECISIONS: "iamjos_editorial_decisions",
  ISSUES: "iamjos_issues",
  PUBLICATIONS: "iamjos_publications",
  ANNOUNCEMENTS: "iamjos_announcements",
  NOTIFICATIONS: "iamjos_notifications",
  CURRENT_USER: "iamjos_current_user",
  INITIALIZED: "iamjos_initialized",
  CURRENT_JOURNAL: "iamjos_current_journal",
} as const

// Route paths for consistent navigation
export const ROUTES = {
  // Public routes
  HOME: "/",
  BROWSE: "/browse",
  ABOUT: "/about",
  CONTACT: "/contact",
  LOGIN: "/login",
  HELP: "/help",
  SIGN_UP_FOR_ALERTS: "/alerts",
  TITLE_LIST: "/browse",
  AUTHOR_GUIDELINES: "/author-guidelines",
  TRACK_SUBMISSION: "/my-submissions",
  AUTHOR_RESOURCES: "/author-resources",
  REVIEWER_GUIDELINES: "/reviewer-guidelines",

  // Dashboard routes
  DASHBOARD: "/dashboard",
  SUBMISSIONS: "/submissions",
  MY_SUBMISSIONS: "/my-submissions",
  REVIEWS: "/reviews",
  PUBLICATIONS: "/publications",
  ISSUES: "/issues",
  ARCHIVE: "/archive",
  USERS: "/users",
  SETTINGS: "/settings",
  EDITOR: "/editor",

  // Admin routes
  ADMIN: "/admin",
  ADMIN_HOSTED_JOURNALS: "/admin/hosted-journals",
  ADMIN_SITE_SETTINGS: "/admin/site-settings",
  ADMIN_SYSTEM_INFO: "/admin/system-info",

  // Tools routes (Editor)
  TOOLS: "/tools",

  // Dynamic route helpers
  journal: (pathOrId: string) => `/journal/${pathOrId}`,
  journalDashboard: (pathOrId: string) => `/journal/${pathOrId}/dashboard`,
  journalSettings: (pathOrId: string) => `/journal/${pathOrId}/settings`,
  journalSubmissions: (pathOrId: string) => `/journal/${pathOrId}/submissions`,
  journalReviews: (pathOrId: string) => `/journal/${pathOrId}/reviews`,
  journalIssues: (pathOrId: string) => `/journal/${pathOrId}/issues`,
  journalPublications: (pathOrId: string) => `/journal/${pathOrId}/publications`,
  journalTools: (pathOrId: string) => `/journal/${pathOrId}/tools`,
  journalStatistics: (pathOrId: string) => `/journal/${pathOrId}/statistics`,
  journalSubscriptions: (pathOrId: string) => `/journal/${pathOrId}/subscriptions`,
  publicJournal: (path: string) => `/j/${path}`,
  browseJournal: (path: string) => `/browse/journal/${path}`,
  browseArticle: (id: string) => `/browse/article/${id}`,
  browseIssue: (id: string) => `/browse/issue/${id}`,
  submission: (id: string) => `/submissions/${id}`,
  newSubmission: (journalPath?: string) => (journalPath ? `/j/${journalPath}/submissions/new` : "/submissions/new"),
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const

// Date format options
export const DATE_FORMATS = {
  DISPLAY: "MMM d, yyyy",
  DISPLAY_WITH_TIME: "MMM d, yyyy h:mm a",
  ISO: "yyyy-MM-dd",
  INPUT: "yyyy-MM-dd",
} as const

// Status labels and colors
export const SUBMISSION_STATUS_CONFIG = {
  incomplete: { label: "Incomplete", color: "secondary" },
  submitted: { label: "Submitted", color: "default" },
  under_review: { label: "Under Review", color: "warning" },
  revision_required: { label: "Revision Required", color: "warning" },
  accepted: { label: "Accepted", color: "success" },
  declined: { label: "Declined", color: "destructive" },
  published: { label: "Published", color: "success" },
} as const

export const REVIEW_STATUS_CONFIG = {
  pending: { label: "Pending", color: "secondary" },
  accepted: { label: "Accepted", color: "default" },
  declined: { label: "Declined", color: "destructive" },
  completed: { label: "Completed", color: "success" },
} as const

export const REVIEW_RECOMMENDATION_CONFIG = {
  accept: { label: "Accept", color: "success" },
  minor_revisions: { label: "Minor Revisions", color: "warning" },
  major_revisions: { label: "Major Revisions", color: "warning" },
  resubmit_elsewhere: { label: "Resubmit Elsewhere", color: "secondary" },
  decline: { label: "Decline", color: "destructive" },
} as const

// Reserved routes that should not be treated as journal paths
export const RESERVED_ROUTES = [
  "browse",
  "admin",
  "dashboard",
  "login",
  "submissions",
  "reviews",
  "publications",
  "issues",
  "archive",
  "users",
  "settings",
  "about",
  "contact",
  "journal",
  "editor",
  "my-submissions",
  "api",
  "_next",
  "favicon.ico",
  "help",
  "alerts",
  "author-guidelines",
  "author-resources",
  "reviewer-guidelines",
  "tools",
  "forgot-password",
  "reset-password",
  "statistics",
  "subscriptions",
  "emails",
] as const
