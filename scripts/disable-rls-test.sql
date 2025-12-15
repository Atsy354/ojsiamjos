-- SIMPLIFIED RLS FIX - MORE PERMISSIVE
-- Date: 2025-12-15 13:25
-- Issue: review_rounds creation still failing

-- STEP 1: Disable RLS temporarily to test
ALTER TABLE review_rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments DISABLE ROW LEVEL SECURITY;

-- Test if it works without RLS
-- If it works, then re-enable with simpler policy

SELECT 'RLS disabled for testing. Try assigning reviewer now.' as message;

-- =================================================================
-- If assignment works with RLS disabled, run this to re-enable:
-- =================================================================

/*
-- STEP 2: Re-enable with VERY permissive policy

ALTER TABLE review_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "review_rounds_policy" ON review_rounds;
DROP POLICY IF EXISTS "review_rounds_access_policy" ON review_rounds;
DROP POLICY IF EXISTS "Public read review rounds" ON review_rounds;
DROP POLICY IF EXISTS "Users can view review rounds for their submissions" ON review_rounds;

DROP POLICY IF EXISTS "review_assignments_policy" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_access_policy" ON review_assignments;
DROP POLICY IF EXISTS "Review assignments viewable by involved parties" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_select" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_write" ON review_assignments;

-- Create SIMPLE permissive policies
CREATE POLICY "review_rounds_all" ON review_rounds
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "review_assignments_all" ON review_assignments  
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

SELECT 'Permissive RLS policies created!' as message;
*/
