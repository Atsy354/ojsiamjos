-- QUICK FIX: DISABLE RLS FOR TESTING
-- Date: 2025-12-15 14:15
-- Purpose: Test if RLS is blocking review_rounds creation

-- Disable RLS on both tables
ALTER TABLE review_rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled. Try assigning reviewer now!' as status;
