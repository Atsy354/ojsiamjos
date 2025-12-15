-- ============================================================================
-- Update Existing Users with role_ids for Testing
-- ============================================================================
-- Date: 2025-12-10
-- Purpose: Update existing users to have proper role_ids for testing
-- Note: Users must be created via Supabase Auth Dashboard first!
-- ============================================================================

-- ============================================================================
-- STEP 1: Check existing users
-- ============================================================================
SELECT id, email, roles, role_ids 
FROM users 
ORDER BY email;

-- ============================================================================
-- STEP 2: Update existing users with role_ids
-- ============================================================================

-- Update admin user (if exists)
UPDATE users SET 
  roles = ARRAY['admin'],
  role_ids = ARRAY[1]
WHERE email LIKE '%admin%' OR 'admin' = ANY(roles);

-- Update manager users (if exists)
UPDATE users SET 
  roles = ARRAY['manager'],
  role_ids = ARRAY[16]
WHERE email LIKE '%manager%' OR 'manager' = ANY(roles);

-- Update editor users (if exists)
UPDATE users SET 
  roles = ARRAY['editor'],
  role_ids = ARRAY[17]
WHERE email LIKE '%editor%' OR 'editor' = ANY(roles);

-- Update reviewer users (if exists)
UPDATE users SET 
  roles = ARRAY['reviewer'],
  role_ids = ARRAY[4096]
WHERE email LIKE '%reviewer%' OR 'reviewer' = ANY(roles);

-- Update author users (if exists)
UPDATE users SET 
  roles = ARRAY['author'],
  role_ids = ARRAY[65536]
WHERE email LIKE '%author%' OR 'author' = ANY(roles);

-- Update reader users (if exists)
UPDATE users SET 
  roles = ARRAY['reader'],
  role_ids = ARRAY[1048576]
WHERE email LIKE '%reader%' OR 'reader' = ANY(roles);

-- ============================================================================
-- STEP 3: Verify updates
-- ============================================================================
SELECT 
  email,
  roles,
  role_ids,
  CASE 
    WHEN 1 = ANY(role_ids) THEN 'Site Admin (1)'
    WHEN 16 = ANY(role_ids) THEN 'Manager (16)'
    WHEN 17 = ANY(role_ids) THEN 'Sub-Editor (17)'
    WHEN 4096 = ANY(role_ids) THEN 'Reviewer (4096)'
    WHEN 4097 = ANY(role_ids) THEN 'Assistant (4097)'
    WHEN 65536 = ANY(role_ids) THEN 'Author (65536)'
    WHEN 1048576 = ANY(role_ids) THEN 'Reader (1048576)'
    ELSE 'No role_ids'
  END as role_name
FROM users
ORDER BY role_ids;

-- ============================================================================
-- ALTERNATIVE: Create specific test users if they don't exist
-- ============================================================================

-- First, you need to create these users via Supabase Dashboard:
-- 1. Go to Authentication → Users → Add User
-- 2. Create each user with:
--    - Email: admin@ojs.local, manager@ojs.local, etc.
--    - Password: password
--    - Auto Confirm: YES
-- 3. Then run the updates below

-- Update specific test users (run AFTER creating them in Supabase Auth)
UPDATE users SET roles = ARRAY['admin'], role_ids = ARRAY[1] 
WHERE email = 'admin@ojs.local';

UPDATE users SET roles = ARRAY['manager'], role_ids = ARRAY[16] 
WHERE email = 'manager@ojs.local';

UPDATE users SET roles = ARRAY['editor'], role_ids = ARRAY[17] 
WHERE email = 'editor@ojs.local';

UPDATE users SET roles = ARRAY['reviewer'], role_ids = ARRAY[4096] 
WHERE email = 'reviewer@ojs.local';

UPDATE users SET roles = ARRAY['author'], role_ids = ARRAY[65536] 
WHERE email = 'author@ojs.local';

-- ============================================================================
-- QUICK FIX: Use your existing user for testing
-- ============================================================================

-- If you have user anjarbdn@gmail.com, make it admin for testing:
UPDATE users SET 
  roles = ARRAY['admin'],
  role_ids = ARRAY[1]
WHERE email = 'anjarbdn@gmail.com';

-- Verify
SELECT email, roles, role_ids FROM users WHERE email = 'anjarbdn@gmail.com';
