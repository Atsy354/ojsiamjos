-- ============================================================================
-- iammJOSSS Database Schema Update - Enhanced Role System (SAFE VERSION)
-- ============================================================================
-- Date: 2025-12-10
-- Purpose: Add support for enhanced role system with role IDs
-- This version checks existing tables and only adds what's missing
-- ============================================================================

-- ============================================================================
-- STEP 1: Add role_ids column to users table (SAFE)
-- ============================================================================

-- Add role_ids column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role_ids'
    ) THEN
        ALTER TABLE users ADD COLUMN role_ids INTEGER[];
        RAISE NOTICE 'Added role_ids column to users table';
    ELSE
        RAISE NOTICE 'role_ids column already exists in users table';
    END IF;
END $$;

-- Add index for faster role queries
CREATE INDEX IF NOT EXISTS idx_users_role_ids ON users USING GIN (role_ids);

-- ============================================================================
-- STEP 2: Migrate existing string roles to role IDs
-- ============================================================================

-- Role ID mappings (matching ojsnextjs):
-- 'admin' / 'site_admin' -> 1
-- 'manager' -> 16
-- 'editor' / 'sub_editor' -> 17
-- 'author' -> 65536
-- 'reviewer' -> 4096
-- 'assistant' -> 4097
-- 'reader' -> 1048576

-- Update users with roles (handle multiple roles)
UPDATE users
SET role_ids = ARRAY(
    SELECT DISTINCT unnest(
        CASE 
            WHEN 'admin' = ANY(roles) THEN ARRAY[1]
            ELSE ARRAY[]::INTEGER[]
        END ||
        CASE 
            WHEN 'manager' = ANY(roles) THEN ARRAY[16]
            ELSE ARRAY[]::INTEGER[]
        END ||
        CASE 
            WHEN 'editor' = ANY(roles) THEN ARRAY[17]
            ELSE ARRAY[]::INTEGER[]
        END ||
        CASE 
            WHEN 'author' = ANY(roles) THEN ARRAY[65536]
            ELSE ARRAY[]::INTEGER[]
        END ||
        CASE 
            WHEN 'reviewer' = ANY(roles) THEN ARRAY[4096]
            ELSE ARRAY[]::INTEGER[]
        END ||
        CASE 
            WHEN 'assistant' = ANY(roles) THEN ARRAY[4097]
            ELSE ARRAY[]::INTEGER[]
        END ||
        CASE 
            WHEN 'reader' = ANY(roles) THEN ARRAY[1048576]
            ELSE ARRAY[]::INTEGER[]
        END
    )
)
WHERE roles IS NOT NULL AND array_length(roles, 1) > 0;

-- ============================================================================
-- STEP 3: Verification queries
-- ============================================================================

-- Check role_ids migration
SELECT 
    COUNT(*) as total_users,
    COUNT(role_ids) as users_with_role_ids,
    COUNT(*) - COUNT(role_ids) as users_without_role_ids
FROM users;

-- Check role distribution
SELECT 
    CASE role_id
        WHEN 1 THEN 'Site Admin (1)'
        WHEN 16 THEN 'Manager (16)'
        WHEN 17 THEN 'Sub-Editor (17)'
        WHEN 65536 THEN 'Author (65536)'
        WHEN 4096 THEN 'Reviewer (4096)'
        WHEN 4097 THEN 'Assistant (4097)'
        WHEN 1048576 THEN 'Reader (1048576)'
        ELSE 'Unknown (' || role_id || ')'
    END as role_name,
    COUNT(*) as user_count
FROM users, unnest(role_ids) as role_id
GROUP BY role_id
ORDER BY role_id;

-- Show sample users with their roles
SELECT 
    id,
    email,
    roles as old_roles,
    role_ids as new_role_ids
FROM users
LIMIT 10;

-- ============================================================================
-- NOTES FOR user_groups table
-- ============================================================================

-- The user_groups table already exists in your database with a different structure.
-- To avoid conflicts, we're NOT creating/modifying it in this migration.
-- 
-- If you need to add user groups functionality later, you can:
-- 1. Check the existing user_groups table structure
-- 2. Modify it to match the required structure
-- 3. Or create a new table with a different name (e.g., role_groups)

-- To check existing user_groups structure, run:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_groups';

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- Uncomment to rollback changes:
-- UPDATE users SET role_ids = NULL;
-- ALTER TABLE users DROP COLUMN IF EXISTS role_ids;
-- DROP INDEX IF EXISTS idx_users_role_ids;
