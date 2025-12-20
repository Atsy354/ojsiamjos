-- Fix review_assignments RLS policy to allow reviewers to update their own reviews
-- Issue: Reviewers can't submit reviews because UPDATE is blocked by RLS

-- Drop existing policy
DROP POLICY IF EXISTS "review_assignments_access_policy" ON review_assignments;

-- Create new policy that allows:
-- - Editors/admins to do everything
-- - Reviewers to view and UPDATE their own assignments
CREATE POLICY "review_assignments_access_policy" ON review_assignments
FOR ALL
TO authenticated
USING (
  -- Can view if:
  -- 1. Admin/manager/editor
  -- 2. Assigned reviewer
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
  -- Can create/update if:
  -- 1. Admin/manager/editor (for creating assignments)
  -- 2. Assigned reviewer (for updating their own review)
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
);

-- Verify the policy
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'review_assignments'
ORDER BY policyname;

-- Success message
SELECT '✅ Review assignments policy updated - reviewers can now submit reviews!' as message;
