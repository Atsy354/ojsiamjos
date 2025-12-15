-- FIX RLS POLICY FOR REVIEW_ROUNDS - CORRECTED TYPE CASTING
-- Date: 2025-12-15
-- Issue: UUID vs TEXT type mismatch

-- Drop existing policies
DROP POLICY IF EXISTS "review_rounds_policy" ON review_rounds;
DROP POLICY IF EXISTS "review_rounds_access_policy" ON review_rounds;

-- Create new policy with proper type casting
CREATE POLICY "review_rounds_access_policy" ON review_rounds
FOR ALL
TO authenticated
USING (
  -- Users can see review rounds if they are admin/manager/editor
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
  -- OR they are reviewer assigned to this round (with proper type casting)
  EXISTS (
    SELECT 1 FROM review_assignments ra
    WHERE ra.review_round_id = review_rounds.review_round_id
    AND ra.reviewer_id::uuid = auth.uid()
  )
  OR
  -- OR they are the submitter (with proper type casting)
  EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = review_rounds.submission_id
    AND s.submitter_id::uuid = auth.uid()
  )
)
WITH CHECK (
  -- Users can create/update if they are admin/manager/editor
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

-- Fix review_assignments RLS with proper type casting
DROP POLICY IF EXISTS "review_assignments_policy" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_access_policy" ON review_assignments;

CREATE POLICY "review_assignments_access_policy" ON review_assignments
FOR ALL
TO authenticated
USING (
  -- Can view if admin/manager/editor
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin' = ANY(users.roles) OR
      'manager' = ANY(users.roles) OR
      'editor' = ANY(users.roles)
    )
  )
  -- OR if they are the assigned reviewer (with proper type casting)
  OR reviewer_id::uuid = auth.uid()
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

-- Ensure RLS is enabled
ALTER TABLE review_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON review_rounds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON review_assignments TO authenticated;

-- Verify policies created
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
