# 🎯 IMPLEMENTATION PLAN: 100% OJS 3.3 Backend Compliance

**Goal**: Fix ALL missing features to achieve 100% OJS 3.3 compliance  
**Timeline**: 2-3 weeks  
**Priority**: 🔴 CRITICAL - Must complete before public access

---

## 📋 MISSING FEATURES SUMMARY

### Priority 1: Critical (Week 1)
1. ✅ Reviewer Accept/Decline Workflow
2. ✅ Email Notification System
3. ✅ Revision Deadline Management

### Priority 2: Important (Week 2)
4. ✅ Review Rating System
5. ✅ Editor Assignment
6. ✅ Metadata Locking After Submission

### Priority 3: Polish (Week 3)
7. ✅ Notification Preferences
8. ✅ Audit Trail Enhancement
9. ✅ Final Testing & Verification

---

## 🔧 FEATURE 1: REVIEWER ACCEPT/DECLINE WORKFLOW

### Current State
- ❌ Reviewer auto-assigned, no accept/decline
- ❌ No assignment status tracking
- ❌ Can review immediately without accepting

### OJS 3.3 Standard
```
1. Editor assigns reviewer
2. Reviewer receives notification
3. Reviewer accepts OR declines
4. If accepted: Can proceed to review
5. If declined: Editor assigns another reviewer
```

### Implementation

#### 1.1 Database Schema
```sql
-- File: migrations/add-review-assignment-status.sql

-- Add status column to review_assignments
ALTER TABLE review_assignments 
ADD COLUMN IF NOT EXISTS status INTEGER DEFAULT 0;
-- 0 = Pending (awaiting response)
-- 1 = Accepted
-- 2 = Declined
-- 3 = Completed

-- Add response date
ALTER TABLE review_assignments 
ADD COLUMN IF NOT EXISTS date_responded TIMESTAMP;

-- Add decline reason
ALTER TABLE review_assignments 
ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_review_assignments_status 
ON review_assignments(status);

COMMENT ON COLUMN review_assignments.status IS 
'Assignment status: 0=Pending, 1=Accepted, 2=Declined, 3=Completed';
```

#### 1.2 API Endpoints

**File**: `app/api/review-assignments/[id]/respond/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { sendEmail } from "@/lib/email/sender"

/**
 * POST /api/review-assignments/[id]/respond
 * Reviewer accepts or declines review assignment
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, user } = await requireAuth(request)
        if (!authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const assignmentId = parseInt(id, 10)
        const { action, reason } = await request.json()
        
        // action: 'accept' or 'decline'
        // reason: required if declining

        if (!['accept', 'decline'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        if (action === 'decline' && !reason) {
            return NextResponse.json({ 
                error: 'Decline reason is required' 
            }, { status: 400 })
        }

        const supabase = await createClient()

        // Get assignment
        const { data: assignment, error: assignError } = await supabase
            .from('review_assignments')
            .select('*, submissions(title, submitter_id)')
            .eq('id', assignmentId)
            .eq('reviewer_id', user?.id)
            .single()

        if (assignError || !assignment) {
            return NextResponse.json({ 
                error: 'Assignment not found' 
            }, { status: 404 })
        }

        // Check if already responded
        if (assignment.status !== 0) {
            return NextResponse.json({ 
                error: 'Assignment already responded to' 
            }, { status: 400 })
        }

        // Update assignment
        const newStatus = action === 'accept' ? 1 : 2
        
        const { error: updateError } = await supabaseAdmin
            .from('review_assignments')
            .update({
                status: newStatus,
                date_responded: new Date().toISOString(),
                decline_reason: action === 'decline' ? reason : null
            })
            .eq('id', assignmentId)

        if (updateError) {
            logger.apiError('/api/review-assignments/[id]/respond', 'POST', updateError)
            return NextResponse.json({ 
                error: 'Failed to update assignment' 
            }, { status: 500 })
        }

        // Send email notification to editor
        await sendEmail({
            to: assignment.submissions.submitter_id,  // Editor email
            subject: action === 'accept' 
                ? 'Reviewer Accepted Assignment'
                : 'Reviewer Declined Assignment',
            template: action === 'accept' 
                ? 'reviewer-accepted'
                : 'reviewer-declined',
            data: {
                reviewerName: user?.name,
                submissionTitle: assignment.submissions.title,
                declineReason: reason
            }
        })

        logger.info(`Reviewer ${action}ed assignment`, {
            assignmentId,
            reviewerId: user?.id,
            action
        })

        return NextResponse.json({
            success: true,
            message: `Assignment ${action}ed successfully`
        })
    } catch (error) {
        logger.apiError('/api/review-assignments/[id]/respond', 'POST', error)
        return NextResponse.json({ 
            error: 'Internal server error' 
        }, { status: 500 })
    }
}
```

#### 1.3 Frontend Component

**File**: `components/workflow/reviewer-assignment-response.tsx`
```typescript
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { apiPost } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

interface ReviewerAssignmentResponseProps {
    assignmentId: number
    submissionTitle: string
    dueDate: string
    onResponse: () => void
}

export function ReviewerAssignmentResponse({
    assignmentId,
    submissionTitle,
    dueDate,
    onResponse
}: ReviewerAssignmentResponseProps) {
    const [isAccepting, setIsAccepting] = useState(false)
    const [isDeclining, setIsDeclining] = useState(false)
    const [showDeclineForm, setShowDeclineForm] = useState(false)
    const [declineReason, setDeclineReason] = useState("")
    const { toast } = useToast()

    const handleAccept = async () => {
        setIsAccepting(true)
        try {
            await apiPost(`/api/review-assignments/${assignmentId}/respond`, {
                action: 'accept'
            })

            toast({
                title: "Assignment Accepted",
                description: "You can now proceed with the review.",
            })

            onResponse()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsAccepting(false)
        }
    }

    const handleDecline = async () => {
        if (!declineReason.trim()) {
            toast({
                title: "Reason Required",
                description: "Please provide a reason for declining.",
                variant: "destructive"
            })
            return
        }

        setIsDeclining(true)
        try {
            await apiPost(`/api/review-assignments/${assignmentId}/respond`, {
                action: 'decline',
                reason: declineReason
            })

            toast({
                title: "Assignment Declined",
                description: "The editor has been notified.",
            })

            onResponse()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsDeclining(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Review Assignment
                </CardTitle>
                <CardDescription>
                    You have been invited to review this submission
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertDescription>
                        <strong>Submission:</strong> {submissionTitle}
                        <br />
                        <strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString()}
                    </AlertDescription>
                </Alert>

                {!showDeclineForm ? (
                    <div className="flex gap-2">
                        <Button
                            onClick={handleAccept}
                            disabled={isAccepting}
                            className="flex-1"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {isAccepting ? "Accepting..." : "Accept Assignment"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeclineForm(true)}
                            className="flex-1"
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Decline Assignment
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium">
                                Reason for Declining *
                            </label>
                            <Textarea
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                placeholder="Please provide a reason for declining this assignment..."
                                rows={4}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                onClick={handleDecline}
                                disabled={isDeclining || !declineReason.trim()}
                            >
                                {isDeclining ? "Declining..." : "Confirm Decline"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDeclineForm(false)
                                    setDeclineReason("")
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
```

#### 1.4 Update Reviewer Dashboard

**File**: `app/reviewer/dashboard/page.tsx`
```typescript
// Add status filter
const pendingAssignments = assignments.filter(a => a.status === 0)
const acceptedAssignments = assignments.filter(a => a.status === 1)
const completedAssignments = assignments.filter(a => a.status === 3)

// Show response component for pending assignments
{pendingAssignments.map(assignment => (
    <ReviewerAssignmentResponse
        key={assignment.id}
        assignmentId={assignment.id}
        submissionTitle={assignment.submission.title}
        dueDate={assignment.date_due}
        onResponse={() => fetchAssignments()}
    />
))}
```

#### 1.5 Update Review Form Access

**File**: `components/workflow/reviewer-submission-form.tsx`
```typescript
// Add check at the top
if (assignment.status !== 1) {
    return (
        <Alert>
            <AlertDescription>
                You must accept the review assignment before you can submit a review.
            </AlertDescription>
        </Alert>
    )
}
```

---

## 🔧 FEATURE 2: EMAIL NOTIFICATION SYSTEM

### Implementation

#### 2.1 Email Service Setup

**File**: `lib/email/sender.ts`
```typescript
import nodemailer from 'nodemailer'
import { logger } from '@/lib/utils/logger'

interface EmailOptions {
    to: string | string[]
    subject: string
    template: string
    data: Record<string, any>
}

// Email templates
const templates = {
    'review-assignment': (data: any) => `
        <h2>New Review Assignment</h2>
        <p>Dear ${data.reviewerName},</p>
        <p>You have been assigned to review the following submission:</p>
        <p><strong>${data.submissionTitle}</strong></p>
        <p>Due date: ${data.dueDate}</p>
        <p><a href="${data.acceptUrl}">Accept Assignment</a> | <a href="${data.declineUrl}">Decline Assignment</a></p>
    `,
    'reviewer-accepted': (data: any) => `
        <h2>Reviewer Accepted Assignment</h2>
        <p>${data.reviewerName} has accepted the review assignment for "${data.submissionTitle}".</p>
    `,
    'reviewer-declined': (data: any) => `
        <h2>Reviewer Declined Assignment</h2>
        <p>${data.reviewerName} has declined the review assignment for "${data.submissionTitle}".</p>
        <p>Reason: ${data.declineReason}</p>
    `,
    'revision-request': (data: any) => `
        <h2>Revision Requested</h2>
        <p>Dear ${data.authorName},</p>
        <p>The editor has requested revisions for your submission "${data.submissionTitle}".</p>
        <p>Deadline: ${data.deadline}</p>
        <p>Editor comments: ${data.comments}</p>
        <p><a href="${data.submissionUrl}">View Submission</a></p>
    `,
    'decision-notification': (data: any) => `
        <h2>Editorial Decision</h2>
        <p>Dear ${data.authorName},</p>
        <p>A decision has been made on your submission "${data.submissionTitle}".</p>
        <p>Decision: <strong>${data.decision}</strong></p>
        <p>${data.comments}</p>
        <p><a href="${data.submissionUrl}">View Submission</a></p>
    `
}

export async function sendEmail(options: EmailOptions) {
    try {
        // Create transporter
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })

        // Get template
        const templateFn = templates[options.template as keyof typeof templates]
        if (!templateFn) {
            throw new Error(`Template ${options.template} not found`)
        }

        const html = templateFn(options.data)

        // Send email
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@journal.com',
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html
        })

        logger.info('Email sent successfully', {
            to: options.to,
            subject: options.subject,
            template: options.template
        })

        return { success: true }
    } catch (error) {
        logger.error('Failed to send email', error)
        throw error
    }
}
```

#### 2.2 Environment Variables

**File**: `.env.local`
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Journal Name <noreply@journal.com>"
```

#### 2.3 Integrate with Workflow

**Update**: `app/api/review-assignments/route.ts`
```typescript
// After creating assignment
await sendEmail({
    to: reviewer.email,
    subject: 'New Review Assignment',
    template: 'review-assignment',
    data: {
        reviewerName: reviewer.name,
        submissionTitle: submission.title,
        dueDate: dueDate,
        acceptUrl: `${baseUrl}/reviewer/assignments/${assignment.id}/accept`,
        declineUrl: `${baseUrl}/reviewer/assignments/${assignment.id}/decline`
    }
})
```

**Update**: `app/api/workflow/decision/route.ts`
```typescript
// After revision decision
if (decision === REVISION_REQUIRED) {
    await sendEmail({
        to: author.email,
        subject: 'Revision Requested',
        template: 'revision-request',
        data: {
            authorName: author.name,
            submissionTitle: submission.title,
            deadline: revisionDeadline,
            comments: editorComments,
            submissionUrl: `${baseUrl}/submissions/${submissionId}`
        }
    })
}
```

---

## 🔧 FEATURE 3: REVISION DEADLINE MANAGEMENT

### Implementation

#### 3.1 Database Schema

**File**: `migrations/add-revision-deadline.sql`
```sql
-- Add revision deadline to submissions
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS revision_deadline TIMESTAMP;

-- Add revision request date
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS revision_requested_date TIMESTAMP;

-- Create index
CREATE INDEX IF NOT EXISTS idx_submissions_revision_deadline 
ON submissions(revision_deadline);
```

#### 3.2 API Update

**File**: `app/api/workflow/decision/route.ts`
```typescript
// When requesting revision
if (decision === REVISION_REQUIRED) {
    const { revisionDeadline } = await request.json()
    
    await supabaseAdmin
        .from('submissions')
        .update({
            status: STATUS_QUEUED,
            stage_id: WORKFLOW_STAGE_ID_EXTERNAL_REVIEW,
            revision_deadline: revisionDeadline,
            revision_requested_date: new Date().toISOString()
        })
        .eq('id', submissionId)
}
```

#### 3.3 Frontend Component

**File**: `components/workflow/revision-deadline-display.tsx`
```typescript
"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, AlertTriangle } from "lucide-react"
import { differenceInDays } from "date-fns"

interface RevisionDeadlineDisplayProps {
    deadline: string
}

export function RevisionDeadlineDisplay({ deadline }: RevisionDeadlineDisplayProps) {
    const daysRemaining = differenceInDays(new Date(deadline), new Date())
    const isOverdue = daysRemaining < 0
    const isUrgent = daysRemaining <= 3 && daysRemaining >= 0

    return (
        <Alert variant={isOverdue ? "destructive" : isUrgent ? "default" : "default"}>
            {isOverdue ? (
                <AlertTriangle className="h-4 w-4" />
            ) : (
                <Clock className="h-4 w-4" />
            )}
            <AlertDescription>
                <strong>Revision Deadline:</strong> {new Date(deadline).toLocaleDateString()}
                {isOverdue && (
                    <span className="ml-2 text-destructive font-semibold">
                        (Overdue by {Math.abs(daysRemaining)} days)
                    </span>
                )}
                {isUrgent && !isOverdue && (
                    <span className="ml-2 text-orange-600 font-semibold">
                        ({daysRemaining} days remaining)
                    </span>
                )}
            </AlertDescription>
        </Alert>
    )
}
```

---

## 📋 IMPLEMENTATION TIMELINE

### Week 1: Critical Features
**Days 1-2**: Reviewer Accept/Decline
- [ ] Database migration
- [ ] API endpoints
- [ ] Frontend components
- [ ] Testing

**Days 3-4**: Email Notification System
- [ ] Email service setup
- [ ] Templates creation
- [ ] Integration with workflow
- [ ] Testing

**Days 5-7**: Revision Deadline
- [ ] Database migration
- [ ] API updates
- [ ] Frontend components
- [ ] Testing

### Week 2: Important Features
**Days 8-10**: Review Rating System
- [ ] Database schema
- [ ] API updates
- [ ] Frontend forms
- [ ] Testing

**Days 11-12**: Editor Assignment
- [ ] Database schema
- [ ] API endpoints
- [ ] Frontend UI
- [ ] Testing

**Days 13-14**: Metadata Locking
- [ ] Access control logic
- [ ] Frontend validation
- [ ] Testing

### Week 3: Polish & Testing
**Days 15-17**: Notification Preferences
- [ ] User preferences UI
- [ ] Email opt-in/opt-out
- [ ] Testing

**Days 18-19**: Audit Trail Enhancement
- [ ] Enhanced logging
- [ ] Activity history
- [ ] Testing

**Days 20-21**: Final Testing & Verification
- [ ] End-to-end testing
- [ ] OJS 3.3 compliance verification
- [ ] Bug fixes
- [ ] Documentation

---

## ✅ COMPLETION CHECKLIST

### Feature Completion
- [ ] Reviewer Accept/Decline - 100%
- [ ] Email Notifications - 100%
- [ ] Revision Deadline - 100%
- [ ] Review Rating System - 100%
- [ ] Editor Assignment - 100%
- [ ] Metadata Locking - 100%
- [ ] Notification Preferences - 100%
- [ ] Audit Trail - 100%

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] OJS 3.3 compliance verified

### Documentation
- [ ] API documentation updated
- [ ] User guide updated
- [ ] Admin guide updated
- [ ] Migration guide created

---

**Created**: 21 Desember 2025, 05:40 WIB  
**Timeline**: 3 weeks  
**Goal**: 100% OJS 3.3 Backend Compliance  
**Status**: Ready to implement
