-- FIX RLS POLICY FOR REVIEW_ROUNDS
-- Date: 2025-12-15
-- Issue: Editors cannot create review rounds

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
  -- 3. They are the submitter of the submission
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
  -- Users can create/update review rounds if:
  -- They are admin/manager/editor
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

-- Also fix review_assignments RLS
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

-- Ensure table is RLS enabled
ALTER TABLE review_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON review_rounds TO authenticated;
GRANT SELECT, INSERT, UPDATE ON review_assignments TO authenticated;

-- Success message
SELECT 'RLS policies updated successfully!' as message;
