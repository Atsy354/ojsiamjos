-- ========================================
-- CLEANUP CONFLICTING RLS POLICIES
-- ========================================
-- Date: 2025-12-20
-- Purpose: Remove conflicting policies and keep only the correct ones
-- Issue: Multiple policies causing conflicts
-- ========================================

-- 1. Drop ALL old/conflicting policies on review_assignments
DROP POLICY IF EXISTS "Review assignments viewable by involved parties" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_select" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_write" ON review_assignments;
-- Keep: review_assignments_access_policy (our correct one)

-- 2. Drop ALL old/conflicting policies on review_rounds
DROP POLICY IF EXISTS "Public read review rounds" ON review_rounds;
DROP POLICY IF EXISTS "Users can view review rounds for their submissions" ON review_rounds;
-- Keep: review_rounds_access_policy (our correct one)

-- 3. Verify remaining policies
SELECT 
  tablename, 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('review_rounds', 'review_assignments')
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ Conflicting policies removed!' as message;
SELECT '✅ Only correct access policies remain' as status;
