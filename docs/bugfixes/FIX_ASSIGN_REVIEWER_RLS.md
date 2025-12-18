# 🔧 FIX: ASSIGN REVIEWER RLS ERROR

**Date:** 2025-12-15 10:45  
**Error:** "new row violates row-level security policy for table review_rounds"  
**Status:** ✅ SOLUTION READY

---

## 🐛 PROBLEM

**Symptoms:**
- ❌ Click "Assign Reviewer" button
- ❌ Dialog tidak tutup
- ❌ Tidak ada pesan error/sukses
- ❌ Console log shows RLS policy error

**Root Cause:**
RLS (Row-Level Security) policy di Supabase tidak allow editor untuk create review_round

---

## ✅ SOLUTION

### **STEP 1: Run SQL Fix (REQUIRED)**

**Go to Supabase:**
1. Open Supabase dashboard
2. Go to SQL Editor
3. Run this script:

```sql
-- FIX RLS POLICY FOR REVIEW_ROUNDS
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "review_rounds_policy" ON review_rounds;

-- Create new comprehensive policy
CREATE POLICY "review_rounds_access_policy" ON review_rounds
FOR ALL
TO authenticated
USING (
  -- Users can see review rounds if:
  -- 1. They are admin/manager/editor
  -- 2. They are reviewer assigned to this round
  -- 3. They are the submitter
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin' = ANY(users.roles) OR
      'manager' = ANY(users.roles) OR
      'editor' = ANY(users.roles)
    )
  )
  OR
  EXISTS (
    SELECT 1 FROM review_assignments ra
    WHERE ra.review_round_id = review_rounds.review_round_id
    AND ra.reviewer_id = auth.uid()::text
  )
  OR
  EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = review_rounds.submission_id
    AND s.submitter_id = auth.uid()::text
  )
)
WITH CHECK (
  -- Users can create/update if admin/manager/editor
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin' = ANY(users.roles) OR
      'manager' = ANY(users.roles) OR
      'editor' = ANY(users.roles)
    )
  )
);

-- Fix review_assignments RLS too
DROP POLICY IF EXISTS "review_assignments_policy" ON review_assignments;

CREATE POLICY "review_assignments_access_policy" ON review_assignments
FOR ALL
TO authenticated
USING (
  -- Can view if admin/manager/editor OR assigned reviewer
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin' = ANY(users.roles) OR
      'manager' = ANY(users.roles) OR
      'editor' = ANY(users.roles)
    )
  )
  OR reviewer_id = auth.uid()::text
)
WITH CHECK (
  -- Can create/update if admin/manager/editor
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin' = ANY(users.roles) OR
      'manager' = ANY(users.roles) OR
      'editor' = ANY(users.roles)
    )
  )
);

-- Ensure tables have RLS enabled
ALTER TABLE review_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON review_rounds TO authenticated;
GRANT SELECT, INSERT, UPDATE ON review_assignments TO authenticated;

SELECT 'RLS policies fixed successfully!' as message;
```

**Expected Result:**
```
✅ message: "RLS policies fixed successfully!"
```

---

### **STEP 2: Verify Your Editor Role**

**Check if you have editor role:**

```sql
-- Check your roles
SELECT id, email, roles 
FROM users 
WHERE email = 'your.email@example.com';
```

**Expected result should include 'editor':**
```
roles: {editor, author}  ← Good!
```

**If not, add editor role:**
```sql
UPDATE users 
SET roles = array_append(roles, 'editor')
WHERE email = 'your.email@example.com';
```

---

### **STEP 3: Test Again**

1. **Refresh browser:** `Ctrl + Shift + F5`
2. **Go to submission detail page**
3. **Click "Assign Reviewer"**
4. **Select reviewer**
5. **Click "Assign Reviewer" button**

**Expected:**
- ✅ Dialog closes
- ✅ Toast notification: "Reviewer assigned successfully"
- ✅ No errors in console

---

## 🔍 TROUBLESHOOTING

### **If still error after SQL fix:**

**1. Check RLS is applied:**
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('review_rounds', 'review_assignments');
```

Should show:
- `review_rounds_access_policy`
- `review_assignments_access_policy`

**2. Check your session:**
```sql
SELECT auth.uid(), auth.jwt();
```

Should return your user ID.

**3. Test policy directly:**
```sql
-- Try to create review round manually
INSERT INTO review_rounds (
  submission_id, 
  stage_id, 
  round, 
  status
) VALUES (
  66,  -- your submission ID
  3,   -- review stage
  1,   -- round 1
  6    -- pending reviewers
);
```

If this works → SQL fix successful!

---

## 📊 WHY THIS HAPPENS

**RLS (Row-Level Security):**
- Supabase security feature
- Prevents unauthorized data access
- Policies define who can read/write

**Original policy was too restrictive:**
- Only allowed admins
- Blocked editors from creating review_rounds

**New policy allows:**
- ✅ Admins can do everything
- ✅ Managers can do everything
- ✅ **Editors can create/manage reviews** ← FIXED!
- ✅ Reviewers can see assigned reviews
- ✅ Authors can see their submission reviews

---

## 🎯 QUICK FIX CHECKLIST

- [ ] Run SQL script in Supabase
- [ ] See success message
- [ ] Verify editor role on your account
- [ ] Refresh browser (Ctrl + Shift + F5)
- [ ] Test assign reviewer
- [ ] See success toast
- [ ] Dialog closes properly

---

## 📝 FILES AFFECTED

**SQL Script:**
- `scripts/fix-review-rls.sql` ← Run this in Supabase!

**Component:**
- `components/reviews/assign-reviewer-dialog.tsx` (already has error handling)

---

## ✅ AFTER FIX

**You'll be able to:**
1. ✅ Assign reviewers successfully
2. ✅ See reviewer invitations
3. ✅ Create review rounds
4. ✅ Manage review workflow
5. ✅ Get proper success/error messages

---

**PAK, JALANKAN SQL DI SUPABASE SEKARANG!**

**Location:** Supabase Dashboard → SQL Editor → New Query → Paste script → Run

**Kabarin hasil setelah run SQL!** 🙏
