# 🎯 COMPLETE OJS WORKFLOW IMPLEMENTATION PLAN
**Full 8-Stage Workflow Matching OJS 3.x**

---

## 📋 WORKFLOW OVERVIEW

### **STAGE 1: AUTHOR REGISTRATION & SUBMISSION** ✅ (Partial)
- [x] Author register
- [x] Author login
- [ ] 5-Step Submission Wizard (NEED TO BUILD)

### **STAGE 2: EDITOR DESK REVIEW** ⏳
- [ ] Editor checks submission
- [ ] Decision: Accept to Review / Decline

### **STAGE 3: PEER REVIEW** ⏳
- [ ] Editor assigns reviewers
- [ ] Reviewer accepts/declines
- [ ] Reviewer submits review

### **STAGE 4: EDITOR DECISION** ⏳
- [ ] Editor reviews recommendations
- [ ] Decision: Accept / Revisions / Reject

### **STAGE 5: AUTHOR REVISIONS** ⏳
- [ ] Author uploads revised files
- [ ] Optional: Second review round

### **STAGE 6: COPYEDITING** ⏳
- [ ] Copyeditor cleans manuscript
- [ ] Author final check

### **STAGE 7: PRODUCTION** ⏳
- [ ] Layout editor creates galley
- [ ] Assign to issue
- [ ] Schedule publication

### **STAGE 8: PUBLICATION** ⏳
- [ ] Article published
- [ ] Appears on website

---

## 🗂️ DATABASE SCHEMA NEEDED

### **Already Exist in iammJOSSS:**
```sql
✅ submissions
✅ users  
✅ sections
✅ authors
✅ submission_files
✅ review_assignments (basic)
✅ journals
✅ issues
```

### **Need to Create:**
```sql
⏳ review_rounds - Track review cycles
⏳ review_form_responses - Reviewer comments
⏳ editorial_decisions - Track editor decisions  
⏳ stage_assignments - Who's assigned to what stage
⏳ copyediting_files - Copyedited versions
⏳ production_galleys - Final PDF/HTML
⏳ publication_dates - Scheduling
```

---

## 🔧 IMPLEMENTATION TASKS

### **PRIORITY 1: 5-STEP SUBMISSION WIZARD** (30 min)

**Files to Create:**
1. `/app/submissions/new/wizard/page.tsx` - Main wizard
2. `/components/submissions/submission-wizard-step1.tsx` - Start
3. `/components/submissions/submission-wizard-step2.tsx` - Upload
4. `/components/submissions/submission-wizard-step3.tsx` - Metadata
5. `/components/submissions/submission-wizard-step4.tsx` - Confirmation
6. `/components/submissions/submission-wizard-step5.tsx` - Finish

**API Routes:**
- [x] `/api/submissions` (POST) - Already exists
- [ ] `/api/submissions/[id]/wizard-step` (PATCH) - Track progress
- [x] `/api/submissions/[id]/files` (POST) - Already exists

**Database Changes:**
```sql
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS submission_progress INTEGER DEFAULT 0;
-- 0=incomplete, 1=step1, 2=step2, 3=step3, 4=step4, 5=complete
```

---

### **PRIORITY 2: REVIEW ASSIGNMENT WORKFLOW** (30 min)

**Files to Create:**
1. `/app/api/reviews/assign/route.ts` - Assign reviewer
2. `/app/api/reviews/[id]/respond/route.ts` - Accept/Decline
3. `/app/api/reviews/[id]/submit/route.ts` - Submit review
4. `/components/reviews/reviewer-assignment-dialog.tsx`
5. `/components/reviews/submit-review-form.tsx`

**Database Setup:**
```sql
-- Run ojsnextjs review schema
CREATE TABLE IF NOT EXISTS review_rounds (
  review_round_id bigint PRIMARY KEY,
  submission_id bigint REFERENCES submissions(id),
  stage_id INTEGER,
  round INTEGER,
  status INTEGER,
  date_created TIMESTAMP
);

ALTER TABLE review_assignments
ADD COLUMN IF NOT EXISTS review_round_id bigint,
ADD COLUMN IF NOT EXISTS stage_id INTEGER,
ADD COLUMN IF NOT EXISTS declined BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS date_assigned TIMESTAMP,
ADD COLUMN IF NOT EXISTS date_confirmed TIMESTAMP,
ADD COLUMN IF NOT EXISTS date_completed TIMESTAMP,
ADD COLUMN IF NOT EXISTS recommendation INTEGER,
ADD COLUMN IF NOT EXISTS review_comments TEXT;
```

---

### **PRIORITY 3: EDITOR DECISION TRACKING** (20 min)

**Files:**
1. `/app/api/editorial/decision/route.ts` - Record decision
2. `/components/editorial/decision-dialog.tsx`

**Database:**
```sql
CREATE TABLE IF NOT EXISTS editorial_decisions (
  decision_id bigint PRIMARY KEY,
  submission_id bigint REFERENCES submissions(id),
  editor_id uuid REFERENCES users(id),
  decision INTEGER, -- 1=accept, 2=revisions, 4=decline, 8=send_to_review
  date_decided TIMESTAMP,
  round INTEGER,
  stage_id INTEGER
);
```

---

### **PRIORITY 4: COPYEDITING & PRODUCTION** (40 min)

**Files:**
1. `/app/copyediting/[id]/page.tsx`
2. `/app/production/[id]/page.tsx`
3. `/api/copyediting/[id]/route.ts`
4. `/api/production/galleys/route.ts`

**Database:**
```sql
CREATE TABLE IF NOT EXISTS production_galleys (
  galley_id bigint PRIMARY KEY,
  submission_id bigint,
  file_id bigint,
  label VARCHAR(50), -- PDF, HTML, XML
  locale VARCHAR(10),
  seq INTEGER,
  publication_date TIMESTAMP
);
```

---

## 🚀 EXECUTION PLAN (2 HOURS)

### **PHASE 1: Database Setup** (15 min)
```sql
-- Run all schema updates
-- Create missing tables
-- Add missing columns
```

### **PHASE 2: Submission Wizard** (30 min)
- Multi-step form component
- File upload integration
- Progress tracking

### **PHASE 3: Review System** (30 min)
- Reviewer assignment API
- Reviewer interface
- Review submission

### **PHASE 4: Decision Workflow** (20 min)
- Editorial decision API
- Stage progression logic
- Status updates

### **PHASE 5: Advanced Stages** (25 min)
- Copyediting placeholder
- Production/galley basic
- Publication trigger

---

## 📝 SQL MIGRATION SCRIPT

**PAK, RUN THIS FIRST:**

```sql
-- ================================================
-- COMPLETE OJS WORKFLOW SCHEMA
-- Based on OJS 3.x Database Structure
-- ================================================

-- 1. Update submissions table
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS submission_progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS context_id INTEGER DEFAULT 1, -- journal_id alias
ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en_US';

-- 2. Create review_rounds
CREATE TABLE IF NOT EXISTS review_rounds (
  review_round_id BIGSERIAL PRIMARY KEY,
  submission_id bigint REFERENCES submissions(id) ON DELETE CASCADE,
  stage_id INTEGER NOT NULL DEFAULT 3, -- WORKFLOW_STAGE_ID_EXTERNAL_REVIEW
  round INTEGER NOT NULL DEFAULT 1,
  status INTEGER, -- 1=pending, 6=pending_reviewers, 8=pending_reviews, 11=recommendations_ready
  date_created TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 3. Enhance review_assignments
ALTER TABLE review_assignments
ADD COLUMN IF NOT EXISTS review_round_id bigint REFERENCES review_rounds(review_round_id),
ADD COLUMN IF NOT EXISTS stage_id INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS review_method INTEGER DEFAULT 2, -- 1=double_blind, 2=blind, 3=open
ADD COLUMN IF NOT EXISTS declined BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS date_assigned TIMESTAMP,
ADD COLUMN IF NOT EXISTS date_notified TIMESTAMP,
ADD COLUMN IF NOT EXISTS date_confirmed TIMESTAMP,
ADD COLUMN IF NOT EXISTS date_completed TIMESTAMP,
ADD COLUMN IF NOT EXISTS date_due TIMESTAMP,
ADD COLUMN IF NOT EXISTS recommendation INTEGER, -- 1=accept, 2=pending_revisions, 3=resubmit, 4=decline
ADD COLUMN IF NOT EXISTS review_comments TEXT,
ADD COLUMN IF NOT EXISTS comments_for_editor TEXT,
ADD COLUMN IF NOT EXISTS quality INTEGER; -- 1-5 rating

-- 4. Create editorial_decisions
CREATE TABLE IF NOT EXISTS editorial_decisions (
  decision_id BIGSERIAL PRIMARY KEY,
  submission_id bigint REFERENCES submissions(id) ON DELETE CASCADE,
  editor_id uuid REFERENCES users(id),
  decision INTEGER NOT NULL,
  -- Decisions: 1=accept, 2=pending_revisions, 3=resubmit, 4=decline, 
  --            7=send_to_production, 8=external_review, 9=initial_decline
  date_decided TIMESTAMP DEFAULT NOW(),
  round INTEGER DEFAULT 1,
  stage_id INTEGER,
  review_round_id bigint REFERENCES review_rounds(review_round_id),
  decision_comments TEXT
);

-- 5. Create stage_assignments (who's working on what)
CREATE TABLE IF NOT EXISTS stage_assignments (
  assignment_id BIGSERIAL PRIMARY KEY,
  submission_id bigint REFERENCES submissions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  user_group_id INTEGER, -- 1=manager, 2=editor, 3=author, etc
  stage_id INTEGER NOT NULL,
  date_assigned TIMESTAMP DEFAULT NOW(),
  can_edit_metadata BOOLEAN DEFAULT FALSE,
  recommend_only BOOLEAN DEFAULT FALSE
);

-- 6. Create copyediting_files (copyeditor uploads)
CREATE TABLE IF NOT EXISTS copyediting_files (
  file_id BIGSERIAL PRIMARY KEY,
  submission_id bigint REFERENCES submissions(id) ON DELETE CASCADE,
  file_path TEXT,
  file_type VARCHAR(50),
  uploaded_by uuid REFERENCES users(id),
  date_uploaded TIMESTAMP DEFAULT NOW(),
  copyedit_stage VARCHAR(50) -- initial, author_review, final
);

-- 7. Create publication_galleys (final PDF/HTML for publication)
CREATE TABLE IF NOT EXISTS publication_galleys (
  galley_id BIGSERIAL PRIMARY KEY,
  publication_id bigint, -- Will reference publications table
  submission_id bigint REFERENCES submissions(id),
  file_id bigint, -- references submission_files or copyediting_files
  label VARCHAR(50), -- 'PDF', 'HTML', 'XML'
  locale VARCHAR(10) DEFAULT 'en_US',
  seq INTEGER DEFAULT 0,
  remote_url TEXT -- if hosted elsewhere
);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_rounds_submission ON review_rounds(submission_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer ON review_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_round ON review_assignments(review_round_id);
CREATE INDEX IF NOT EXISTS idx_editorial_decisions_submission ON editorial_decisions(submission_id);
CREATE INDEX IF NOT EXISTS idx_stage_assignments_submission ON stage_assignments(submission_id);

-- 9. Verify
SELECT 'review_rounds' as table_name, COUNT(*) FROM review_rounds
UNION ALL
SELECT 'editorial_decisions', COUNT(*) FROM editorial_decisions
UNION ALL
SELECT 'stage_assignments', COUNT(*) FROM stage_assignments;
```

---

## ⚡ QUICK START IMPLEMENTATION

**Saya mulai buat files sekarang!**

Starting with:
1. ✅ Database schema (SQL above)
2. ⏳ 5-Step Wizard Component
3. ⏳ Review Assignment API
4. ⏳ Reviewer Interface

**Estimated Time: 1.5 hours for core features**

**PAK, DECISION:**
- **Option A:** Saya implement sekarang (1.5 jam)
- **Option B:** Test current system dulu, implement besok
- **Option C:** Prioritize specific stage (mana yang paling urgent?)

**Mana yang Pak pilih?** 🎯
