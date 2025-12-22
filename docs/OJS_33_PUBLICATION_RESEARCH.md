# 📋 OJS 3.3 Publication Workflow - Research & Implementation Plan

## 🔍 OJS 3.3 Publication Process

### Standard Workflow
```
Production Stage
    ↓
Upload Galleys (PDF, HTML, XML)
    ↓
Assign to Issue (Optional)
    ↓
Schedule Publication OR Publish Now
    ↓
Article becomes publicly available
```

### What Happens on "Publish Now"

**In OJS 3.3**:
1. Submission status changes to "Published" (STATUS_PUBLISHED = 3)
2. `date_published` is set to current timestamp
3. Article becomes visible in:
   - Journal's current issue (if assigned)
   - Archive/Browse page
   - Search results
4. DOI is generated (if configured)
5. Article gets a public URL

### Database Changes

**Minimal Required**:
- `submissions.status` = 3 (Published)
- `submissions.date_published` = NOW()

**Optional** (if tables exist):
- `publications` table entry
- `publication_galleys` links
- Issue assignment

---

## ✅ Simplified Implementation (Compatible)

### Strategy
Since we don't know exact database schema, implement **minimal viable publish**:

1. ✅ Update submission status to Published
2. ✅ Set publication date
3. ✅ Return success
4. ✅ Redirect to published article view (or submissions list)

### No Complex Dependencies
- ❌ Don't require `articles` table
- ❌ Don't require `publications` table
- ❌ Don't require issue assignment
- ✅ Just mark as published

---

## 🎯 Implementation

### API Endpoint
**File**: `app/api/production/[id]/publish/route.ts`

**Logic**:
```typescript
1. Validate user is editor
2. Check submission exists
3. Check submission in Production stage
4. Check has galley files (minimum 1)
5. Update submission:
   - status = 3 (Published)
   - date_published = NOW()
6. Return success
```

### Frontend Response
**File**: `app/production/[id]/page.tsx`

**After Publish**:
```typescript
// Success message
toast({ 
    title: "Published!", 
    description: "Article is now publicly available" 
})

// Redirect to submission detail (not /publications)
router.push(`/submissions/${params.id}`)
```

**Why redirect to submission detail?**
- User can see updated status badge (Published)
- Can view published article metadata
- Can access public URL
- More intuitive than /publications page

---

## 📊 Status Badge Update

After publish, submission detail should show:
- Badge: "Published" (green)
- Date Published: "Dec 21, 2025"
- Public URL: Link to article

---

## 🚀 Next Steps

1. Fix API endpoint (simplified)
2. Update frontend redirect
3. Test publish flow
4. Verify status badge updates

---

**Created**: 21 Desember 2025, 05:05 WIB
**Purpose**: Research OJS 3.3 publish behavior for proper implementation
