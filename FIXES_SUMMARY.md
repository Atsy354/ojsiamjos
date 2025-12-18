# Summary of Recent Fixes

## 1. Author Auto-Population in Wizard Step 3 ✅
- Logged-in user automatically populated as first author
- Removed affiliation field from submitting author (first author)
- Affiliation now required only for co-authors

## 2. Browse List Checkbox ✅
- Added "Include in browse list" checkbox for each author
- Auto-checked by default
- Database schema updated (needs migration)

## 3. Primary Contact Checkbox Removed ✅
- Removed Primary Contact checkbox from UI
- First author automatically set as primary contact in backend

## 4. Keywords Input Improved ✅
- Changed from comma-separated input to tag/badge style
- Press Enter to add keyword
- Click X to remove keyword
- Matches OJS 3.3 UX

## 5. Authors Display Fix 🔧
- Fixed API endpoint to use `submission_id` instead of `article_id`
- Should resolve "No authors listed" issue

## Required Actions:
1. **Run Supabase Migration** for `include_in_browse` column:
   ```sql
   ALTER TABLE authors ADD COLUMN IF NOT EXISTS include_in_browse BOOLEAN DEFAULT true;
   ```

2. **Verify Database Column Name** for authors table:
   - Check if column is `article_id` or `submission_id`
   - If `article_id`, need to revert API changes

3. **Test Submission Wizard** end-to-end to verify all fixes work correctly
