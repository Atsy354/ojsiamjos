# Quick Start: Refactoring Implementation

## Immediate Actions - Start Here!

### Step 1: Create New Documentation Structure

```bash
# Create folder structure
mkdir -p docs/{completion,bugfixes,implementation,guides,setup,refactoring,security,audits,workflow}
```

### Step 2: Move Documentation Files

Execute this script to organize all MD files:

```powershell
# Move completion reports
Move-Item "100_PERCENT_COMPLETE.md" "docs/completion/"
Move-Item "COMPLETION_REPORT.md" "docs/completion/"
Move-Item "FINAL_CHECKLIST.md" "docs/completion/"
Move-Item "FINAL_COMPLETION_REPORT.md" "docs/completion/"
Move-Item "FINAL_FIXES_COMPLETE.md" "docs/completion/"
Move-Item "STATUS_AKHIR.md" "docs/completion/"

# Move bugfix docs
Move-Item "BUGFIX_SECTION_SELECTOR.md" "docs/bugfixes/"
Move-Item "DROPDOWN_FIX_COMPLETE.md" "docs/bugfixes/"
Move-Item "FIXES_IN_PROGRESS.md" "docs/bugfixes/"
Move-Item "FIXES_SUMMARY.md" "docs/bugfixes/"
Move-Item "FIX_ASSIGN_REVIEWER_RLS.md" "docs/bugfixes/"

# Move implementation docs
Move-Item "IMPLEMENTATION_STATUS.md" "docs/implementation/"
Move-Item "WORKFLOW_IMPLEMENTATION_PLAN.md" "docs/implementation/"
Move-Item "WORKFLOW_COMPLETE.md" "docs/implementation/"

# Move guides
Move-Item "PRESENTATION_GUIDE.md" "docs/guides/"
Move-Item "TESTING_GUIDE.md" "docs/guides/"
Move-Item "USER_GUIDE.md" "docs/guides/"

# Move setup docs
Move-Item "QUICK_SETUP.md" "docs/setup/"
Move-Item "SETUP_ENV.md" "docs/setup/"
Move-Item "SETUP_SUPABASE.md" "docs/setup/"
Move-Item "SUPABASE_SETUP.md" "docs/setup/"
Move-Item "TEMPLATE_ENV_LOCAL.txt" "docs/setup/"

# Move refactoring docs
Move-Item "REFACTORING_GUIDE.md" "docs/refactoring/"
Move-Item "REFACTORING_SUMMARY.md" "docs/refactoring/"

# Move security docs
Move-Item "SECURITY_PROGRESS.md" "docs/security/"

# Move audit docs
Move-Item "TYPESCRIPT_AUDIT_REPORT.md" "docs/audits/"
Move-Item "audit-output.txt" "docs/audits/"
```

### Step 3: Create Documentation Index

Create `docs/README.md` with navigation to all docs.

### Step 4: Clean Up Scripts

```powershell
# Move scripts
Move-Item "add-production-button.ps1" "scripts/"
```

### Step 5: Organize Migrations

```bash
# Create migration structure
mkdir -p migrations/{active,archived}

# Move old/completed migrations to archived
# Keep only current migrations in active
```

---

## Priority Refactoring Tasks

### Task 1: API Middleware (HIGH IMPACT)

Create `lib/api/middleware/withAuth.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'

type Handler = (
  req: NextRequest,
  params: any,
  context: { user: any }
) => Promise<NextResponse>

export function withAuth(handler: Handler) {
  return async (req: NextRequest, params: any) => {
    const { authorized, user, error } = await requireAuth(req)
    
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return handler(req, params, { user })
  }
}

export function withEditor(handler: Handler) {
  return withAuth(async (req, params, context) => {
    const { user } = context
    const roles = user?.roles || []
    
    if (!roles.includes('editor') && !roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    return handler(req, params, context)
  })
}
```

**Impact:** Reduces 1160+ lines of duplicate code across 116 API routes.

### Task 2: Shared Dialog Components

Create `components/shared/ConfirmDialog.tsx`:

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Impact:** Replaces 20+ duplicate dialog implementations.

### Task 3: Form Utilities

Create `lib/forms/useForm.ts`:

```typescript
import { useState } from 'react'

interface UseFormOptions<T> {
  initialValues: T
  onSubmit: (values: T) => Promise<void>
  validate?: (values: T) => Record<string, string>
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as string]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name as string]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    // Validate
    if (validate) {
      const validationErrors = validate(values)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error: any) {
      setErrors({ submit: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
  }

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setValues,
    setErrors
  }
}
```

**Impact:** Standardizes form handling across 30+ forms.

---

## Refactoring Checklist

### Week 1: Organization
- [ ] Create docs folder structure
- [ ] Move all MD files
- [ ] Update README.md
- [ ] Move scripts to /scripts
- [ ] Organize migrations
- [ ] Remove unused files

### Week 2: Core Infrastructure
- [ ] Create API middleware
- [ ] Create shared components
- [ ] Create form utilities
- [ ] Create type definitions
- [ ] Set up testing framework

### Week 3: API Refactoring
- [ ] Refactor 20 API routes with withAuth
- [ ] Refactor 20 API routes with withEditor
- [ ] Standardize error responses
- [ ] Add logging middleware
- [ ] Update API documentation

### Week 4: Component Refactoring
- [ ] Extract dialog components
- [ ] Extract form components
- [ ] Break down large pages
- [ ] Create custom hooks
- [ ] Add prop types

### Week 5: Testing & Optimization
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Performance audit
- [ ] Bundle optimization
- [ ] Final documentation

---

## Quick Wins (Do First!)

### 1. Documentation Cleanup (2 hours)
- Immediate impact on developer experience
- Makes codebase more professional
- Easy to do, low risk

### 2. API Middleware (4 hours)
- High impact (1160 lines saved)
- Improves consistency
- Easier maintenance

### 3. Shared Dialogs (2 hours)
- Reduces 500+ lines
- Better UX consistency
- Quick implementation

### 4. Form Utilities (3 hours)
- Standardizes forms
- Reduces bugs
- Better validation

**Total Quick Wins:** 11 hours, ~2000 lines saved

---

## Measuring Success

### Before Refactoring
- Average file size: 300 lines
- Duplicate code: ~3000 lines
- TypeScript errors: 50+
- `any` types: 200+
- Test coverage: 0%

### After Refactoring (Target)
- Average file size: <200 lines
- Duplicate code: <500 lines
- TypeScript errors: 0
- `any` types: <50
- Test coverage: 60%

---

## Getting Started NOW

1. **Read:** `docs/REFACTORING_MASTER_PLAN.md`
2. **Execute:** Documentation cleanup script above
3. **Create:** API middleware (`lib/api/middleware/withAuth.ts`)
4. **Test:** Refactor 1 API route as proof of concept
5. **Review:** Verify everything still works
6. **Continue:** Move to next task

---

**Start Time:** Now
**First Milestone:** End of Week 1
**Full Completion:** 5 weeks
