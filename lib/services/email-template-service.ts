// Email Template Service - OJS 3.3 Compatible
// Manages email templates for various workflow notifications

import type { EmailTemplate } from "@/lib/types"

// Default OJS email template keys
export const EMAIL_TEMPLATE_KEYS = {
  // Submission
  SUBMISSION_ACK: "SUBMISSION_ACK",
  SUBMISSION_ACK_NOT_USER: "SUBMISSION_ACK_NOT_USER",
  EDITOR_ASSIGN: "EDITOR_ASSIGN",
  EDITOR_DECISION_ACCEPT: "EDITOR_DECISION_ACCEPT",
  EDITOR_DECISION_SEND_TO_EXTERNAL: "EDITOR_DECISION_SEND_TO_EXTERNAL",
  EDITOR_DECISION_SEND_TO_PRODUCTION: "EDITOR_DECISION_SEND_TO_PRODUCTION",
  EDITOR_DECISION_REVISIONS: "EDITOR_DECISION_REVISIONS",
  EDITOR_DECISION_RESUBMIT: "EDITOR_DECISION_RESUBMIT",
  EDITOR_DECISION_DECLINE: "EDITOR_DECISION_DECLINE",
  EDITOR_DECISION_INITIAL_DECLINE: "EDITOR_DECISION_INITIAL_DECLINE",

  // Review
  REVIEW_REQUEST: "REVIEW_REQUEST",
  REVIEW_REQUEST_SUBSEQUENT: "REVIEW_REQUEST_SUBSEQUENT",
  REVIEW_CANCEL: "REVIEW_CANCEL",
  REVIEW_REINSTATE: "REVIEW_REINSTATE",
  REVIEW_CONFIRM: "REVIEW_CONFIRM",
  REVIEW_DECLINE: "REVIEW_DECLINE",
  REVIEW_ACK: "REVIEW_ACK",
  REVIEW_REMIND: "REVIEW_REMIND",
  REVIEW_REMIND_AUTO: "REVIEW_REMIND_AUTO",

  // Copyediting
  COPYEDIT_REQUEST: "COPYEDIT_REQUEST",
  COPYEDIT_COMPLETE: "COPYEDIT_COMPLETE",

  // Layout/Production
  LAYOUT_REQUEST: "LAYOUT_REQUEST",
  LAYOUT_COMPLETE: "LAYOUT_COMPLETE",

  // Proofreading
  PROOFREAD_REQUEST: "PROOFREAD_REQUEST",
  PROOFREAD_COMPLETE: "PROOFREAD_COMPLETE",

  // User
  USER_REGISTER: "USER_REGISTER",
  USER_VALIDATE: "USER_VALIDATE",
  PASSWORD_RESET: "PASSWORD_RESET",
  PASSWORD_RESET_CONFIRM: "PASSWORD_RESET_CONFIRM",

  // Publication
  PUBLISH_NOTIFY: "PUBLISH_NOTIFY",

  // Subscription
  SUBSCRIPTION_NOTIFY: "SUBSCRIPTION_NOTIFY",
  SUBSCRIPTION_BEFORE_EXPIRY: "SUBSCRIPTION_BEFORE_EXPIRY",
  SUBSCRIPTION_AFTER_EXPIRY: "SUBSCRIPTION_AFTER_EXPIRY",
  SUBSCRIPTION_AFTER_EXPIRY_LAST: "SUBSCRIPTION_AFTER_EXPIRY_LAST",
  SUBSCRIPTION_PURCHASE_INDL: "SUBSCRIPTION_PURCHASE_INDL",
  SUBSCRIPTION_PURCHASE_INSTL: "SUBSCRIPTION_PURCHASE_INSTL",
  SUBSCRIPTION_RENEW_INDL: "SUBSCRIPTION_RENEW_INDL",
  SUBSCRIPTION_RENEW_INSTL: "SUBSCRIPTION_RENEW_INSTL",

  // Announcements
  ANNOUNCEMENT: "ANNOUNCEMENT",
} as const

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[keyof typeof EMAIL_TEMPLATE_KEYS]

// Default template contents
const defaultTemplates: Omit<EmailTemplate, "id" | "journalId">[] = [
  // Submission Templates
  {
    key: EMAIL_TEMPLATE_KEYS.SUBMISSION_ACK,
    name: "Submission Acknowledgement",
    subject: "Submission Acknowledgement",
    body: `Dear {$authorName},

Thank you for submitting the manuscript, "{$submissionTitle}" to {$journalName}. With the online journal management system that we are using, you will be able to track its progress through the editorial process by logging in to the journal web site:

Submission URL: {$submissionUrl}
Username: {$authorUsername}

If you have any questions, please contact me. Thank you for considering this journal as a venue for your work.

{$signature}`,
    description: "Sent to the author when a new submission is received",
    isCustom: false,
    locale: "en",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.EDITOR_ASSIGN,
    name: "Editor Assignment",
    subject: "Editorial Assignment",
    body: `Dear {$editorName},

The submission, "{$submissionTitle}," to {$journalName} has been assigned to you to see through the editorial process.

Submission URL: {$submissionUrl}

{$signature}`,
    description: "Sent to an editor when assigned to handle a submission",
    isCustom: false,
    locale: "en",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_ACCEPT,
    name: "Editor Decision: Accept",
    subject: "Editor Decision",
    body: `Dear {$authorName},

We are pleased to inform you that we have decided to accept your submission "{$submissionTitle}" to {$journalName}. Congratulations!

We will be in touch shortly with further instructions regarding the copyediting and publication process.

{$signature}`,
    description: "Sent to author when submission is accepted",
    isCustom: false,
    locale: "en",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_DECLINE,
    name: "Editor Decision: Decline",
    subject: "Editor Decision",
    body: `Dear {$authorName},

We have reached a decision regarding your submission to {$journalName}, "{$submissionTitle}".

Our decision is to decline this submission.

{$signature}`,
    description: "Sent to author when submission is declined",
    isCustom: false,
    locale: "en",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_REVISIONS,
    name: "Editor Decision: Revisions Required",
    subject: "Editor Decision",
    body: `Dear {$authorName},

We have reached a decision regarding your submission to {$journalName}, "{$submissionTitle}".

Our decision is to request revisions before proceeding with publication. Please see below for the reviewer comments:

{$reviewerComments}

Please revise your submission and resubmit by {$revisionDueDate}.

{$signature}`,
    description: "Sent to author when revisions are requested",
    isCustom: false,
    locale: "en",
  },
  // Review Templates
  {
    key: EMAIL_TEMPLATE_KEYS.REVIEW_REQUEST,
    name: "Review Request",
    subject: "Article Review Request",
    body: `Dear {$reviewerName},

I believe that you would serve as an excellent reviewer of the manuscript, "{$submissionTitle}," which has been submitted to {$journalName}. The submission's abstract is inserted below, and I hope that you will consider undertaking this important task for us.

Please log into the journal web site by {$responseDueDate} to indicate whether you will undertake the review or not, as well as to access the submission and to record your review and recommendation.

The review itself is due {$reviewDueDate}.

Submission URL: {$submissionUrl}

Abstract:
{$submissionAbstract}

Thank you for considering this request.

{$signature}`,
    description: "Sent when requesting a reviewer",
    isCustom: false,
    locale: "en",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.REVIEW_CONFIRM,
    name: "Review Confirmed",
    subject: "Review Confirmed",
    body: `Dear {$editorName},

{$reviewerName} has confirmed the request to review the submission, "{$submissionTitle}," for {$journalName}. 

The review is due {$reviewDueDate}.

{$signature}`,
    description: "Sent to editor when reviewer accepts",
    isCustom: false,
    locale: "en",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.REVIEW_DECLINE,
    name: "Review Declined",
    subject: "Unable to Review",
    body: `Dear {$editorName},

I am afraid that I am unable to review the submission, "{$submissionTitle}," for {$journalName} at this time. I apologize for any inconvenience this may cause.

{$reviewerName}`,
    description: "Sent to editor when reviewer declines",
    isCustom: false,
    locale: "en",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.REVIEW_ACK,
    name: "Review Acknowledgement",
    subject: "Thank You for Your Review",
    body: `Dear {$reviewerName},

Thank you for completing the review of the submission, "{$submissionTitle}," for {$journalName}. We appreciate your contribution to the quality of the work that we publish.

{$signature}`,
    description: "Sent to reviewer after completing review",
    isCustom: false,
    locale: "en",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.REVIEW_REMIND,
    name: "Review Reminder",
    subject: "Submission Review Reminder",
    body: `Dear {$reviewerName},

This email is a reminder that you agreed to review the submission, "{$submissionTitle}," for {$journalName}. 

The review was originally due {$reviewDueDate} and we are hoping to receive it as soon as possible.

Review URL: {$submissionUrl}

{$signature}`,
    description: "Sent to remind reviewer of pending review",
    isCustom: false,
    locale: "en",
  },
  // Copyediting Templates
  {
    key: EMAIL_TEMPLATE_KEYS.COPYEDIT_REQUEST,
    name: "Copyediting Request",
    subject: "Copyediting Assignment",
    body: `Dear {$copyeditorName},

I would like you to undertake the copyediting of "{$submissionTitle}" for {$journalName}. 

Please follow these steps:
1. Access the submission at {$submissionUrl}
2. Download the submission file
3. Copyedit the file
4. Upload the copyedited file
5. Notify the author of any queries

The copyediting is due by {$copyeditDueDate}.

{$signature}`,
    description: "Sent to copyeditor when assigned",
    isCustom: false,
    locale: "en",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.COPYEDIT_COMPLETE,
    name: "Copyediting Complete",
    subject: "Copyediting Complete",
    body: `Dear {$editorName},

The copyediting of "{$submissionTitle}" for {$journalName} has been completed.

The copyedited file is now available at: {$submissionUrl}

{$signature}`,
    description: "Sent when copyediting is complete",
    isCustom: false,
    locale: "en",
  },
  // Proofreading Templates
  {
    key: EMAIL_TEMPLATE_KEYS.PROOFREAD_REQUEST,
    name: "Proofreading Request",
    subject: "Proofreading Assignment",
    body: `Dear {$authorName},

Your submission "{$submissionTitle}" to {$journalName} is now ready for proofreading.

Please review the galley proofs carefully and submit any corrections by {$proofDueDate}.

Access the proofs at: {$submissionUrl}

{$signature}`,
    description: "Sent to author for proofreading",
    isCustom: false,
    locale: "en",
  },
  // User Templates
  {
    key: EMAIL_TEMPLATE_KEYS.USER_REGISTER,
    name: "User Registration",
    subject: "Journal Registration",
    body: `Dear {$userName},

You have been registered as a user with {$journalName}. We have included your username and password in this email, which are needed for all work with this journal through its website.

Username: {$username}

To set or reset your password, please visit: {$passwordResetUrl}

{$signature}`,
    description: "Sent to new users upon registration",
    isCustom: false,
    locale: "en",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.PASSWORD_RESET,
    name: "Password Reset",
    subject: "Password Reset Request",
    body: `Dear {$userName},

We received a request to reset your password for {$journalName}.

Click the link below to reset your password:
{$passwordResetUrl}

This link will expire in 24 hours.

If you did not request this password reset, please ignore this email.

{$signature}`,
    description: "Sent when user requests password reset",
    isCustom: false,
    locale: "en",
  },
  // Publication Templates
  {
    key: EMAIL_TEMPLATE_KEYS.PUBLISH_NOTIFY,
    name: "Publication Notification",
    subject: "Your Article Has Been Published",
    body: `Dear {$authorName},

We are pleased to inform you that your article "{$submissionTitle}" has been published in {$journalName}.

You can view your published article at: {$articleUrl}

{$signature}`,
    description: "Sent to author when article is published",
    isCustom: false,
    locale: "en",
  },
  // Subscription Templates
  {
    key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_NOTIFY,
    name: "Subscription Notification",
    subject: "Subscription Notification",
    body: `Dear {$subscriberName},

Your subscription to {$journalName} has been activated.

Subscription Type: {$subscriptionType}
Start Date: {$startDate}
End Date: {$endDate}

Thank you for your subscription.

{$signature}`,
    description: "Sent when subscription is activated",
    isCustom: false,
    locale: "en",
  },
  {
    key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_BEFORE_EXPIRY,
    name: "Subscription Expiry Warning",
    subject: "Subscription Expiring Soon",
    body: `Dear {$subscriberName},

Your subscription to {$journalName} will expire on {$expiryDate}.

To continue your access, please renew your subscription at: {$renewalUrl}

{$signature}`,
    description: "Sent before subscription expires",
    isCustom: false,
    locale: "en",
  },
  // Announcement Templates
  {
    key: EMAIL_TEMPLATE_KEYS.ANNOUNCEMENT,
    name: "New Announcement",
    subject: "{$announcementTitle}",
    body: `{$announcementContent}

This announcement was posted by {$journalName}.

To unsubscribe from announcements, visit: {$unsubscribeUrl}`,
    description: "Sent for journal announcements",
    isCustom: false,
    locale: "en",
  },
]

const STORAGE_KEY = "iamjos_email_templates"

class EmailTemplateService {
  private getTemplates(): EmailTemplate[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  private saveTemplates(templates: EmailTemplate[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  }

  // Initialize default templates for a journal
  initializeDefaultTemplates(journalId: string): EmailTemplate[] {
    const templates = this.getTemplates()
    const journalTemplates = templates.filter((t) => t.journalId === journalId)

    if (journalTemplates.length === 0) {
      const newTemplates: EmailTemplate[] = defaultTemplates.map((t, index) => ({
        ...t,
        id: `tmpl_${journalId}_${index}_${Date.now()}`,
        journalId,
      }))

      const allTemplates = [...templates, ...newTemplates]
      this.saveTemplates(allTemplates)
      return newTemplates
    }

    return journalTemplates
  }

  // Get all templates for a journal
  getByJournal(journalId: string): EmailTemplate[] {
    const templates = this.getTemplates()
    const journalTemplates = templates.filter((t) => t.journalId === journalId)

    // If no templates exist, initialize defaults
    if (journalTemplates.length === 0) {
      return this.initializeDefaultTemplates(journalId)
    }

    return journalTemplates
  }

  // Get template by key
  getByKey(journalId: string, key: EmailTemplateKey): EmailTemplate | null {
    const templates = this.getByJournal(journalId)
    return templates.find((t) => t.key === key) || null
  }

  // Get template by ID
  getById(id: string): EmailTemplate | null {
    return this.getTemplates().find((t) => t.id === id) || null
  }

  // Update template
  update(id: string, updates: Partial<Pick<EmailTemplate, "subject" | "body" | "name">>): EmailTemplate | null {
    const templates = this.getTemplates()
    const index = templates.findIndex((t) => t.id === id)

    if (index === -1) return null

    templates[index] = {
      ...templates[index],
      ...updates,
      isCustom: true,
    }

    this.saveTemplates(templates)
    return templates[index]
  }

  // Reset template to default
  resetToDefault(id: string): EmailTemplate | null {
    const templates = this.getTemplates()
    const template = templates.find((t) => t.id === id)

    if (!template) return null

    const defaultTemplate = defaultTemplates.find((d) => d.key === template.key)
    if (!defaultTemplate) return null

    const index = templates.findIndex((t) => t.id === id)
    templates[index] = {
      ...template,
      subject: defaultTemplate.subject,
      body: defaultTemplate.body,
      name: defaultTemplate.name,
      isCustom: false,
    }

    this.saveTemplates(templates)
    return templates[index]
  }

  // Create custom template
  createCustom(
    journalId: string,
    data: {
      key: string
      name: string
      subject: string
      body: string
      description?: string
    },
  ): EmailTemplate {
    const templates = this.getTemplates()

    const newTemplate: EmailTemplate = {
      id: `tmpl_custom_${Date.now()}`,
      journalId,
      key: data.key,
      name: data.name,
      subject: data.subject,
      body: data.body,
      description: data.description,
      isCustom: true,
      locale: "en",
    }

    templates.push(newTemplate)
    this.saveTemplates(templates)

    return newTemplate
  }

  // Delete custom template
  deleteCustom(id: string): boolean {
    const templates = this.getTemplates()
    const template = templates.find((t) => t.id === id)

    if (!template || !template.isCustom) return false

    const filtered = templates.filter((t) => t.id !== id)
    this.saveTemplates(filtered)
    return true
  }

  // Get template categories
  getCategories(): { key: string; name: string; templates: EmailTemplateKey[] }[] {
    return [
      {
        key: "submission",
        name: "Submission",
        templates: [
          EMAIL_TEMPLATE_KEYS.SUBMISSION_ACK,
          EMAIL_TEMPLATE_KEYS.SUBMISSION_ACK_NOT_USER,
          EMAIL_TEMPLATE_KEYS.EDITOR_ASSIGN,
        ],
      },
      {
        key: "decision",
        name: "Editorial Decisions",
        templates: [
          EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_ACCEPT,
          EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_DECLINE,
          EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_REVISIONS,
          EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_RESUBMIT,
          EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_INITIAL_DECLINE,
          EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_SEND_TO_EXTERNAL,
          EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_SEND_TO_PRODUCTION,
        ],
      },
      {
        key: "review",
        name: "Review",
        templates: [
          EMAIL_TEMPLATE_KEYS.REVIEW_REQUEST,
          EMAIL_TEMPLATE_KEYS.REVIEW_REQUEST_SUBSEQUENT,
          EMAIL_TEMPLATE_KEYS.REVIEW_CONFIRM,
          EMAIL_TEMPLATE_KEYS.REVIEW_DECLINE,
          EMAIL_TEMPLATE_KEYS.REVIEW_ACK,
          EMAIL_TEMPLATE_KEYS.REVIEW_REMIND,
          EMAIL_TEMPLATE_KEYS.REVIEW_REMIND_AUTO,
          EMAIL_TEMPLATE_KEYS.REVIEW_CANCEL,
          EMAIL_TEMPLATE_KEYS.REVIEW_REINSTATE,
        ],
      },
      {
        key: "copyediting",
        name: "Copyediting",
        templates: [EMAIL_TEMPLATE_KEYS.COPYEDIT_REQUEST, EMAIL_TEMPLATE_KEYS.COPYEDIT_COMPLETE],
      },
      {
        key: "production",
        name: "Production",
        templates: [
          EMAIL_TEMPLATE_KEYS.LAYOUT_REQUEST,
          EMAIL_TEMPLATE_KEYS.LAYOUT_COMPLETE,
          EMAIL_TEMPLATE_KEYS.PROOFREAD_REQUEST,
          EMAIL_TEMPLATE_KEYS.PROOFREAD_COMPLETE,
        ],
      },
      {
        key: "user",
        name: "User Management",
        templates: [
          EMAIL_TEMPLATE_KEYS.USER_REGISTER,
          EMAIL_TEMPLATE_KEYS.USER_VALIDATE,
          EMAIL_TEMPLATE_KEYS.PASSWORD_RESET,
          EMAIL_TEMPLATE_KEYS.PASSWORD_RESET_CONFIRM,
        ],
      },
      {
        key: "subscription",
        name: "Subscriptions",
        templates: [
          EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_NOTIFY,
          EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_BEFORE_EXPIRY,
          EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_AFTER_EXPIRY,
          EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_AFTER_EXPIRY_LAST,
          EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_PURCHASE_INDL,
          EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_PURCHASE_INSTL,
          EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_RENEW_INDL,
          EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_RENEW_INSTL,
        ],
      },
      {
        key: "other",
        name: "Other",
        templates: [EMAIL_TEMPLATE_KEYS.PUBLISH_NOTIFY, EMAIL_TEMPLATE_KEYS.ANNOUNCEMENT],
      },
    ]
  }

  // Preview template with variables
  previewTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; body: string } {
    let subject = template.subject
    let body = template.body

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{$${key}}`
      subject = subject.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), value)
      body = body.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), value)
    })

    return { subject, body }
  }

  // Get available variables for a template
  getTemplateVariables(key: EmailTemplateKey): string[] {
    const commonVariables = ["journalName", "signature"]

    const templateVariables: Record<string, string[]> = {
      [EMAIL_TEMPLATE_KEYS.SUBMISSION_ACK]: ["authorName", "submissionTitle", "submissionUrl", "authorUsername"],
      [EMAIL_TEMPLATE_KEYS.EDITOR_ASSIGN]: ["editorName", "submissionTitle", "submissionUrl"],
      [EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_ACCEPT]: ["authorName", "submissionTitle"],
      [EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_DECLINE]: ["authorName", "submissionTitle"],
      [EMAIL_TEMPLATE_KEYS.EDITOR_DECISION_REVISIONS]: [
        "authorName",
        "submissionTitle",
        "reviewerComments",
        "revisionDueDate",
      ],
      [EMAIL_TEMPLATE_KEYS.REVIEW_REQUEST]: [
        "reviewerName",
        "submissionTitle",
        "submissionUrl",
        "submissionAbstract",
        "responseDueDate",
        "reviewDueDate",
      ],
      [EMAIL_TEMPLATE_KEYS.REVIEW_CONFIRM]: ["editorName", "reviewerName", "submissionTitle", "reviewDueDate"],
      [EMAIL_TEMPLATE_KEYS.REVIEW_DECLINE]: ["editorName", "reviewerName", "submissionTitle"],
      [EMAIL_TEMPLATE_KEYS.REVIEW_ACK]: ["reviewerName", "submissionTitle"],
      [EMAIL_TEMPLATE_KEYS.REVIEW_REMIND]: ["reviewerName", "submissionTitle", "submissionUrl", "reviewDueDate"],
      [EMAIL_TEMPLATE_KEYS.COPYEDIT_REQUEST]: ["copyeditorName", "submissionTitle", "submissionUrl", "copyeditDueDate"],
      [EMAIL_TEMPLATE_KEYS.COPYEDIT_COMPLETE]: ["editorName", "submissionTitle", "submissionUrl"],
      [EMAIL_TEMPLATE_KEYS.PROOFREAD_REQUEST]: ["authorName", "submissionTitle", "submissionUrl", "proofDueDate"],
      [EMAIL_TEMPLATE_KEYS.USER_REGISTER]: ["userName", "username", "passwordResetUrl"],
      [EMAIL_TEMPLATE_KEYS.PASSWORD_RESET]: ["userName", "passwordResetUrl"],
      [EMAIL_TEMPLATE_KEYS.PUBLISH_NOTIFY]: ["authorName", "submissionTitle", "articleUrl"],
      [EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_NOTIFY]: ["subscriberName", "subscriptionType", "startDate", "endDate"],
      [EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_BEFORE_EXPIRY]: ["subscriberName", "expiryDate", "renewalUrl"],
      [EMAIL_TEMPLATE_KEYS.ANNOUNCEMENT]: ["announcementTitle", "announcementContent", "unsubscribeUrl"],
    }

    return [...commonVariables, ...(templateVariables[key] || [])]
  }
}

export const emailTemplateService = new EmailTemplateService()
