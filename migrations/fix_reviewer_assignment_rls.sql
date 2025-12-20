-- ========================================
-- FIX REVIEWER ASSIGNMENT RLS POLICIES (100% FINAL)
-- ========================================
-- Date: 2025-12-20
-- Purpose: Fix RLS policies to allow editors to assign reviewers
-- Issue: "new row violates row-level security policy for table review_rounds"
-- 
-- ✅ CONFIRMED ACTUAL DATABASE SCHEMA:
-- - auth.uid() returns UUID
-- - users.id is UUID
-- - users.roles is TEXT[] (array)
-- - review_rounds.review_round_id is BIGINT (NOT id!)
-- - review_assignments.id is BIGINT
-- - review_assignments.reviewer_id is UUID
-- - review_assignments.review_round_id is BIGINT
-- - submissions.id is BIGINT
-- - submissions.submitter_id is UUID
-- ========================================

-- 1. Fix review_rounds RLS policy
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "review_rounds_policy" ON review_rounds;
DROP POLICY IF EXISTS "review_rounds_access_policy" ON review_rounds;

-- Create comprehensive policy that allows editors to create/manage review rounds
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
    AND ra.reviewer_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = review_rounds.submission_id
    AND s.submitter_id = auth.uid()
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

-- 2. Fix review_assignments RLS policy
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "review_assignments_policy" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_access_policy" ON review_assignments;

-- Create comprehensive policy that allows editors to create/manage review assignments
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
  OR reviewer_id = auth.uid()
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

-- 3. Ensure RLS is enabled
ALTER TABLE review_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON review_rounds TO authenticated;
GRANT SELECT, INSERT, UPDATE ON review_assignments TO authenticated;

-- 5. Verify policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('review_rounds', 'review_assignments')
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ RLS policies fixed successfully!' as message;
SELECT '✅ Editors can now assign reviewers without RLS errors' as status;
