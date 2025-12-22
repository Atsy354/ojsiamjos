# Production Stage Workflow - Implementation Plan

## 📋 Overview
Setelah copyediting selesai dan author approve, submission masuk ke **Production Stage** untuk persiapan publikasi.

## 🎯 Goals
1. Production editor dapat mengelola galley files (PDF, HTML, XML)
2. Proofreader dapat review dan submit corrections
3. Author dapat approve final version
4. Editor dapat schedule publication

---

## 📊 Database Schema

### 1. Production Assignments Table
```sql
CREATE TABLE production_assignments (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    production_editor_id TEXT NOT NULL,
    status INTEGER DEFAULT 0, -- 0=Pending, 1=In Progress, 2=Complete
    date_assigned TIMESTAMP DEFAULT NOW(),
    date_completed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Galley Files Table
```sql
CREATE TABLE galley_files (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    label TEXT NOT NULL, -- 'PDF', 'HTML', 'XML'
    file_id BIGINT,
    locale TEXT DEFAULT 'en_US',
    is_approved BOOLEAN DEFAULT FALSE,
    seq INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Proofreading Assignments Table
```sql
CREATE TABLE proofreading_assignments (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    proofreader_id TEXT NOT NULL,
    galley_id BIGINT,
    status INTEGER DEFAULT 0, -- 0=Pending, 1=In Progress, 2=Complete
    corrections TEXT,
    date_assigned TIMESTAMP DEFAULT NOW(),
    date_completed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Publication Schedule Table
```sql
CREATE TABLE publication_schedule (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    issue_id BIGINT,
    scheduled_date TIMESTAMP,
    published_date TIMESTAMP,
    doi TEXT,
    pages TEXT, -- e.g., "1-15"
    seq INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🏗️ Components Structure

### 1. Production Panel (Editor View)
**File**: `components/workflow/production-panel.tsx`

Features:
- ✅ Production ready indicator
- ✅ Assign production editor
- ✅ Galley files management (upload, delete, preview)
- ✅ Assign proofreader
- ✅ Schedule publication
- ✅ Send to publication

### 2. Galley Upload Component
**File**: `components/production/galley-upload.tsx`

Features:
- ✅ Upload PDF galley
- ✅ Upload HTML galley
- ✅ Upload XML galley
- ✅ Preview galley files
- ✅ Delete galley files

### 3. Proofreading Panel (Proofreader View)
**File**: `components/workflow/proofreading-panel.tsx`

Features:
- ✅ View galley files
- ✅ Download for proofreading
- ✅ Submit corrections
- ✅ Mark as complete

### 4. Author Final Approval Panel
**File**: `components/workflow/author-production-panel.tsx`

Features:
- ✅ View final galley files
- ✅ Download for review
- ✅ Approve final version
- ✅ Request changes

---

## 🔌 API Endpoints

### Production Management
- `POST /api/production/assign` - Assign production editor
- `GET /api/production/:submissionId` - Get production details
- `POST /api/production/:submissionId/complete` - Mark production complete

### Galley Management
- `POST /api/galleys/upload` - Upload galley file
- `GET /api/galleys/:submissionId` - Get all galleys for submission
- `DELETE /api/galleys/:id` - Delete galley
- `PUT /api/galleys/:id/approve` - Approve galley

### Proofreading
- `POST /api/proofreading/assign` - Assign proofreader
- `GET /api/proofreading/:submissionId` - Get proofreading tasks
- `POST /api/proofreading/:id/submit` - Submit corrections
- `POST /api/proofreading/:id/complete` - Mark proofreading complete

### Publication
- `POST /api/publication/schedule` - Schedule publication
- `POST /api/publication/publish` - Publish article
- `GET /api/publication/:submissionId` - Get publication details

---

## 📝 Workflow Steps

### Step 1: Production Editor Assignment
1. Editor assigns production editor
2. Production editor receives notification
3. Status: Production (In Progress)

### Step 2: Galley Creation
1. Production editor uploads galley files (PDF, HTML, XML)
2. Each galley is stored with metadata
3. Preview available for review

### Step 3: Proofreading
1. Production editor assigns proofreader
2. Proofreader reviews galley files
3. Proofreader submits corrections
4. Production editor makes corrections

### Step 4: Author Final Approval
1. Author reviews final galley files
2. Author approves or requests changes
3. If approved, proceed to publication

### Step 5: Publication Scheduling
1. Editor schedules publication date
2. Assigns to issue
3. Sets DOI and page numbers
4. Publishes article

---

## 🎨 UI/UX Design

### Production Panel Layout
```
┌─────────────────────────────────────────────┐
│ Production Ready                            │
│ Badge: Ready for Production                 │
├─────────────────────────────────────────────┤
│ Production Editor: [Select Editor ▼]       │
│ [Assign Production Editor]                  │
├─────────────────────────────────────────────┤
│ Galley Files                                │
│ ┌─────────────────────────────────────────┐ │
│ │ PDF  [Upload] [Preview] [Delete]        │ │
│ │ HTML [Upload] [Preview] [Delete]        │ │
│ │ XML  [Upload] [Preview] [Delete]        │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Proofreading                                │
│ Proofreader: [Select Proofreader ▼]        │
│ [Assign Proofreader]                        │
├─────────────────────────────────────────────┤
│ Publication                                 │
│ Issue: [Select Issue ▼]                     │
│ Publication Date: [Date Picker]             │
│ DOI: [Auto-generate]                        │
│ Pages: [1-15]                               │
│ [Schedule Publication]                      │
└─────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Phase 1: Database & API (Priority 1)
- [ ] Create database migration for production tables
- [ ] Create production assignment API
- [ ] Create galley upload API
- [ ] Create proofreading API
- [ ] Create publication schedule API

### Phase 2: Components (Priority 2)
- [ ] Build ProductionPanel component
- [ ] Build GalleyUpload component
- [ ] Build ProofreadingPanel component
- [ ] Build AuthorProductionPanel component

### Phase 3: Integration (Priority 3)
- [ ] Integrate with submission workflow
- [ ] Add production tab to submission detail page
- [ ] Add notifications
- [ ] Add email alerts

### Phase 4: Testing (Priority 4)
- [ ] Test production assignment
- [ ] Test galley upload/download
- [ ] Test proofreading workflow
- [ ] Test publication scheduling
- [ ] End-to-end testing

---

## 🚀 Next Steps

1. **Create database migration** for production tables
2. **Build API endpoints** for production management
3. **Create UI components** for production workflow
4. **Test end-to-end** workflow
5. **Deploy and monitor**

---

**Status**: Ready to implement  
**Estimated Time**: 3-4 hours  
**Priority**: High (continues workflow from copyediting)
