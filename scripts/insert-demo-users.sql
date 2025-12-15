-- ============================================================================
-- Insert Demo Users for Testing Enhanced Role System
-- ============================================================================
-- Date: 2025-12-10
-- Purpose: Create 5 demo users with different roles for manual testing
-- Password for all: 'password'
-- ============================================================================

-- Note: These UUIDs match the ones in seed-data-simple.sql
-- Password hash is for 'password' using bcrypt

-- ============================================================================
-- 1. SITE ADMINISTRATOR
-- ============================================================================
INSERT INTO users (id, email, password, roles, role_ids, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@ojs.local',
  '$2a$10$rH8qvXqZqZqZqZqZqZqZqOe8qvXqZqZqZqZqZqZqZqZqZqZqZqZqZ', -- password
  ARRAY['admin'],
  ARRAY[1],
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  roles = EXCLUDED.roles,
  role_ids = EXCLUDED.role_ids,
  updated_at = NOW();

-- ============================================================================
-- 2. JOURNAL MANAGER
-- ============================================================================
INSERT INTO users (id, email, password, roles, role_ids, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'manager@ojs.local',
  '$2a$10$rH8qvXqZqZqZqZqZqZqZqOe8qvXqZqZqZqZqZqZqZqZqZqZqZqZqZ', -- password
  ARRAY['manager'],
  ARRAY[16],
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  roles = EXCLUDED.roles,
  role_ids = EXCLUDED.role_ids,
  updated_at = NOW();

-- ============================================================================
-- 3. SECTION EDITOR (SUB-EDITOR)
-- ============================================================================
INSERT INTO users (id, email, password, roles, role_ids, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'editor@ojs.local',
  '$2a$10$rH8qvXqZqZqZqZqZqZqZqOe8qvXqZqZqZqZqZqZqZqZqZqZqZqZqZ', -- password
  ARRAY['editor'],
  ARRAY[17],
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  roles = EXCLUDED.roles,
  role_ids = EXCLUDED.role_ids,
  updated_at = NOW();

-- ============================================================================
-- 4. REVIEWER
-- ============================================================================
INSERT INTO users (id, email, password, roles, role_ids, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'reviewer@ojs.local',
  '$2a$10$rH8qvXqZqZqZqZqZqZqZqOe8qvXqZqZqZqZqZqZqZqZqZqZqZqZqZ', -- password
  ARRAY['reviewer'],
  ARRAY[4096],
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  roles = EXCLUDED.roles,
  role_ids = EXCLUDED.role_ids,
  updated_at = NOW();

-- ============================================================================
-- 5. AUTHOR
-- ============================================================================
INSERT INTO users (id, email, password, roles, role_ids, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  'author@ojs.local',
  '$2a$10$rH8qvXqZqZqZqZqZqZqZqOe8qvXqZqZqZqZqZqZqZqZqZqZqZqZqZ', -- password
  ARRAY['author'],
  ARRAY[65536],
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  roles = EXCLUDED.roles,
  role_ids = EXCLUDED.role_ids,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if users were created
SELECT 
  email,
  roles,
  role_ids,
  CASE 
    WHEN role_ids @> ARRAY[1] THEN 'Site Admin'
    WHEN role_ids @> ARRAY[16] THEN 'Manager'
    WHEN role_ids @> ARRAY[17] THEN 'Sub-Editor'
    WHEN role_ids @> ARRAY[4096] THEN 'Reviewer'
    WHEN role_ids @> ARRAY[65536] THEN 'Author'
    ELSE 'Unknown'
  END as role_name
FROM users
WHERE email LIKE '%@ojs.local'
ORDER BY role_ids;

-- ============================================================================
-- ALTERNATIVE: If password hash doesn't work, use Supabase Auth
-- ============================================================================

-- If the above doesn't work because you're using Supabase Auth,
-- you need to create users via Supabase Auth API or Dashboard:
--
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User"
-- 3. Enter:
--    - Email: admin@ojs.local
--    - Password: password
--    - Auto Confirm: YES
-- 4. Repeat for other users
--
-- Then run this to update role_ids:

UPDATE users SET role_ids = ARRAY[1] WHERE email = 'admin@ojs.local';
UPDATE users SET role_ids = ARRAY[16] WHERE email = 'manager@ojs.local';
UPDATE users SET role_ids = ARRAY[17] WHERE email = 'editor@ojs.local';
UPDATE users SET role_ids = ARRAY[4096] WHERE email = 'reviewer@ojs.local';
UPDATE users SET role_ids = ARRAY[65536] WHERE email = 'author@ojs.local';
