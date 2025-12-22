# 🔧 IMPLEMENTATION PLAN - Additional Fixes
**Date**: 2025-12-22  
**Issues**: 4 critical improvements requested

---

## 📋 ISSUES TO FIX

### Issue #1: Email/Notification untuk Revision Submitted
**Status**: Partially Done  
**What's Missing**:
- Email to editor: ✅ Already implemented
- UI notification for editor: ❌ Need to add
- UI notification for author after submit: ❌ Need to add

**Solution**:
1. Add Alert banner for editor showing "New revision submitted"
2. Add success message/alert for author after revision submitted
3. Verify email is actually sent

---

### Issue #2: Review Files & Comments
**Current Problem**:
- Reviewer tidak bisa upload file review
- Comments hanya antara editor-author, tidak termasuk reviewer comments

**Root Cause**:
- No file upload interface for reviewers
- Review comments tidak ditampilkan di discussion/files

**Solution**:
1. Add file upload capability untuk reviewer saat submit review
2. Create `review_files` table atau gunakan `submission_files` dengan stage='review'
3. Display reviewer comments di submission detail page
4. Show review files di Files tab dengan kategori "Review Results"

---

### Issue #3: File Categorization
**Current**: Files di sidebar Participants tidak dikategorikan  
**Required Categories**:
1. File Submit (submission files)
2. Hasil Review (review files from reviewers)
3. Copyediting (already exists)

**Solution**:
1. Update file grouping logic
2. Add visual separation by category
3. Add icons for each category

---

### Issue #4: History Tab Enhancement
**Current**: Basic history  
**Required**: More complete and up-to-date

**Solution**:
1. Show all editorial decisions
2. Show review assignments
3. Show file uploads
4. Show status changes
5. Show stage transitions
6. Timeline format with dates

---

## 🎯 IMPLEMENTATION ORDER

### Phase 1: Database Schema (if needed)
- [ ] Check if submission_files supports review stage
- [ ] Add review_files table if needed
- [ ] Add file_stage enum values

### Phase 2: Review File Upload
- [ ] Add file upload to review submission form
- [ ] API endpoint to handle review file upload
- [ ] Store files with stage='review'

### Phase 3: File Categorization
- [ ] Update file grouping in submission detail
- [ ] Add "Review Results" category
- [ ] Improve UI for file categories

### Phase 4: Review Comments Display
- [ ] Show reviewer comments in submission detail
- [ ] Add to discussion or separate section
- [ ] Make visible to editor and author (after decision)

### Phase 5: Notifications
- [ ] Add editor notification banner for new revisions
- [ ] Add author success notification after revision submit
- [ ] Test email notifications

### Phase 6: History Enhancement
- [ ] Fetch all workflow events
- [ ] Create timeline component
- [ ] Display comprehensive history

---

## 📁 FILES TO MODIFY

1. **Review Submission**:
   - `app/api/reviews/[id]/submit/route.ts` - Add file upload
   - `components/reviews/ReviewSubmissionForm.tsx` - Add file upload UI

2. **File Display**:
   - `app/submissions/[id]/page.tsx` - Update file categorization
   - Add review files to display

3. **Comments/Discussion**:
   - `app/submissions/[id]/page.tsx` - Show reviewer comments
   - Create ReviewCommentsSection component

4. **Notifications**:
   - `app/submissions/[id]/page.tsx` - Add alert banners
   - `components/notifications/RevisionAlert.tsx` - New component

5. **History**:
   - `app/submissions/[id]/page.tsx` - History tab
   - `components/workflow/HistoryTimeline.tsx` - New component
   - `app/api/submissions/[id]/history/route.ts` - New API

---

## ⏱️ ESTIMATED TIME
- Phase 1: 15 min
- Phase 2: 30 min
- Phase 3: 20 min
- Phase 4: 20 min
- Phase 5: 15 min
- Phase 6: 30 min
**Total**: ~2 hours

---

## ✅ SUCCESS CRITERIA

1. ✅ Reviewer can upload files when submitting review
2. ✅ Review files appear in "Review Results" category
3. ✅ Reviewer comments visible to editor and author
4. ✅ Editor sees notification when revision submitted
5. ✅ Author sees success message after revision submit
6. ✅ Files properly categorized (Submit, Review, Copyediting)
7. ✅ History tab shows complete workflow timeline
8. ✅ All features work without bugs or errors

---

Let's start implementation!
