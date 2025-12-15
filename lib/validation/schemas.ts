// lib/validation/schemas.ts
// Zod validation schemas for API routes

import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
})

// Submission schemas
export const createSubmissionSchema = z.object({
    title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
    abstract: z.string().max(5000, 'Abstract too long').optional(),
    sectionId: z.number().int().positive('Invalid section ID'),
    journalId: z.number().int().positive('Invalid journal ID').optional(),
})

export const updateSubmissionSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    abstract: z.string().max(5000).optional(),
    status: z.enum(['submission', 'under_review', 'accepted', 'rejected', 'revisions_required', 'published']).optional(),
    sectionId: z.number().int().positive().optional(),
})

// Review schemas
export const createReviewSchema = z.object({
    submissionId: z.number().int().positive('Invalid submission ID'),
    reviewerId: z.string().uuid('Invalid reviewer ID'),
    dueDate: z.string().datetime().optional(),
})

export const submitReviewSchema = z.object({
    status: z.enum(['pending', 'completed', 'declined']),
    recommendation: z.enum(['accept', 'minor_revisions', 'major_revisions', 'reject']).optional(),
    comments: z.string().max(10000, 'Comments too long').optional(),
})

// Journal schemas
export const createJournalSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    acronym: z.string().min(1, 'Acronym is required').max(50),
    path: z.string().min(1, 'Path is required').max(100).regex(/^[a-z0-9-]+$/, 'Path must be lowercase alphanumeric with hyphens'),
    description: z.string().max(2000).optional(),
    contactEmail: z.string().email('Invalid email'),
    issn: z.string().max(20).optional(),
})

export const updateJournalSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    acronym: z.string().min(1).max(50).optional(),
    description: z.string().max(2000).optional(),
    contactEmail: z.string().email().optional(),
    issn: z.string().max(20).optional(),
    enabled: z.boolean().optional(),
})

// Editorial decision schema
// Supports both string aliases and OJS integer constants
export const editorialDecisionSchema = z.object({
    submissionId: z.union([
        z.number().int().positive('Invalid submission ID'),
        z.string().transform((val) => parseInt(val)).pipe(z.number().int().positive())
    ]),
    decision: z.union([
        z.enum(['accept', 'reject', 'decline', 'revisions', 'request_revisions', 'send_to_review', 'send_to_production']),
        z.number().int().positive('Invalid decision constant')
    ]),
    comments: z.string().max(5000).optional(),
    editorId: z.string().uuid('Invalid editor ID').optional(),
    reviewRoundId: z.union([
        z.number().int().positive().optional(),
        z.string().uuid().optional(),
    ]).optional(),
})

// Workflow schemas
export const assignStageSchema = z.object({
    submissionId: z.number().int().positive('Invalid submission ID'),
    stageId: z.number().int().positive('Invalid stage ID'),
    userId: z.string().uuid().optional(),
})

// User schemas
export const updateUserSchema = z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    roles: z.array(z.enum(['admin', 'editor', 'author', 'reviewer', 'reader'])).optional(),
})

// Helper function to validate request body
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
    try {
        const validated = schema.parse(data)
        return { success: true, data: validated }
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
            return { success: false, error: errorMessage }
        }
        return { success: false, error: 'Validation failed' }
    }
}
