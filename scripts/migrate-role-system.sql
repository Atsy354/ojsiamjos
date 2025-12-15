-- ============================================================================
-- iammJOSSS Database Schema Update - Enhanced Role System
-- ============================================================================
-- Date: 2025-12-10
-- Purpose: Add support for enhanced role system with role IDs and user groups
-- Based on: ojsnextjs implementation and OJS PHP structure
-- ============================================================================

-- ============================================================================
-- STEP 1: Add role_ids column to users table
-- ============================================================================

-- Add role_ids column (array of integers)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_ids INTEGER[];

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

-- Update users with admin role
UPDATE users 
SET role_ids = ARRAY[1]
WHERE 'admin' = ANY(roles) AND role_ids IS NULL;

-- Update users with manager role
UPDATE users 
SET role_ids = ARRAY[16]
WHERE 'manager' = ANY(roles) AND role_ids IS NULL;

-- Update users with editor role (map to SUB_EDITOR)
UPDATE users 
SET role_ids = ARRAY[17]
WHERE 'editor' = ANY(roles) AND role_ids IS NULL;

-- Update users with author role
UPDATE users 
SET role_ids = ARRAY[65536]
WHERE 'author' = ANY(roles) AND role_ids IS NULL;

-- Update users with reviewer role
UPDATE users 
SET role_ids = ARRAY[4096]
WHERE 'reviewer' = ANY(roles) AND role_ids IS NULL;

-- Update users with assistant role
UPDATE users 
SET role_ids = ARRAY[4097]
WHERE 'assistant' = ANY(roles) AND role_ids IS NULL;

-- Update users with reader role
UPDATE users 
SET role_ids = ARRAY[1048576]
WHERE 'reader' = ANY(roles) AND role_ids IS NULL;

-- Handle users with multiple roles (combine role IDs)
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
WHERE array_length(roles, 1) > 1;

-- ============================================================================
-- STEP 3: Create user_groups table (for advanced RBAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_groups (
    id SERIAL PRIMARY KEY,
    context_id INTEGER REFERENCES journals(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    abbrev VARCHAR(255),
    show_title BOOLEAN DEFAULT true,
    permit_self_registration BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique group names per context
    UNIQUE(context_id, name)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_groups_context ON user_groups(context_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_role ON user_groups(role_id);

-- Add comments
COMMENT ON TABLE user_groups IS 'User groups for role-based access control';
COMMENT ON COLUMN user_groups.context_id IS 'Journal/context this group belongs to (NULL for site-wide)';
COMMENT ON COLUMN user_groups.role_id IS 'Role ID (1=Admin, 16=Manager, 17=Sub-Editor, etc.)';
COMMENT ON COLUMN user_groups.name IS 'Display name of the user group';
COMMENT ON COLUMN user_groups.abbrev IS 'Abbreviation for the group';
COMMENT ON COLUMN user_groups.show_title IS 'Whether to show group title in public';
COMMENT ON COLUMN user_groups.permit_self_registration IS 'Allow users to self-register to this group';
COMMENT ON COLUMN user_groups.is_default IS 'Default group for this role';

-- ============================================================================
-- STEP 4: Create user_user_groups junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_user_groups (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_group_id INTEGER REFERENCES user_groups(id) ON DELETE CASCADE,
    date_start TIMESTAMP DEFAULT NOW(),
    date_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure user can only be in a group once
    UNIQUE(user_id, user_group_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_user_groups_user ON user_user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_user_groups_group ON user_user_groups(user_group_id);
CREATE INDEX IF NOT EXISTS idx_user_user_groups_active ON user_user_groups(user_id, user_group_id) 
    WHERE date_end IS NULL;

-- Add comments
COMMENT ON TABLE user_user_groups IS 'Junction table linking users to user groups';
COMMENT ON COLUMN user_user_groups.date_start IS 'When user joined this group';
COMMENT ON COLUMN user_user_groups.date_end IS 'When user left this group (NULL if still active)';

-- ============================================================================
-- STEP 5: Create default user groups for each journal
-- ============================================================================

-- Insert default user groups for each existing journal
INSERT INTO user_groups (context_id, role_id, name, abbrev, is_default)
SELECT 
    j.id,
    1,
    'Site Administrators',
    'SA',
    true
FROM journals j
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups ug 
    WHERE ug.context_id = j.id AND ug.role_id = 1
);

INSERT INTO user_groups (context_id, role_id, name, abbrev, is_default)
SELECT 
    j.id,
    16,
    'Journal Managers',
    'JM',
    true
FROM journals j
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups ug 
    WHERE ug.context_id = j.id AND ug.role_id = 16
);

INSERT INTO user_groups (context_id, role_id, name, abbrev, is_default)
SELECT 
    j.id,
    17,
    'Section Editors',
    'SE',
    true
FROM journals j
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups ug 
    WHERE ug.context_id = j.id AND ug.role_id = 17
);

INSERT INTO user_groups (context_id, role_id, name, abbrev, is_default)
SELECT 
    j.id,
    65536,
    'Authors',
    'AU',
    true
FROM journals j
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups ug 
    WHERE ug.context_id = j.id AND ug.role_id = 65536
);

INSERT INTO user_groups (context_id, role_id, name, abbrev, is_default)
SELECT 
    j.id,
    4096,
    'Reviewers',
    'RE',
    true
FROM journals j
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups ug 
    WHERE ug.context_id = j.id AND ug.role_id = 4096
);

INSERT INTO user_groups (context_id, role_id, name, abbrev, is_default)
SELECT 
    j.id,
    4097,
    'Journal Assistants',
    'JA',
    true
FROM journals j
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups ug 
    WHERE ug.context_id = j.id AND ug.role_id = 4097
);

INSERT INTO user_groups (context_id, role_id, name, abbrev, is_default)
SELECT 
    j.id,
    1048576,
    'Readers',
    'RD',
    true
FROM journals j
WHERE NOT EXISTS (
    SELECT 1 FROM user_groups ug 
    WHERE ug.context_id = j.id AND ug.role_id = 1048576
);

-- ============================================================================
-- STEP 6: Verification queries
-- ============================================================================

-- Check role_ids migration
SELECT 
    COUNT(*) as total_users,
    COUNT(role_ids) as users_with_role_ids,
    COUNT(*) - COUNT(role_ids) as users_without_role_ids
FROM users;

-- Check user groups created
SELECT 
    j.name as journal_name,
    ug.name as group_name,
    ug.role_id,
    COUNT(uug.user_id) as member_count
FROM user_groups ug
LEFT JOIN journals j ON ug.context_id = j.id
LEFT JOIN user_user_groups uug ON ug.id = uug.user_group_id AND uug.date_end IS NULL
GROUP BY j.name, ug.name, ug.role_id
ORDER BY j.name, ug.role_id;

-- Check role distribution
SELECT 
    CASE role_id
        WHEN 1 THEN 'Site Admin'
        WHEN 16 THEN 'Manager'
        WHEN 17 THEN 'Sub-Editor'
        WHEN 65536 THEN 'Author'
        WHEN 4096 THEN 'Reviewer'
        WHEN 4097 THEN 'Assistant'
        WHEN 1048576 THEN 'Reader'
        ELSE 'Unknown'
    END as role_name,
    role_id,
    COUNT(*) as user_count
FROM users, unnest(role_ids) as role_id
GROUP BY role_id
ORDER BY role_id;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- Uncomment to rollback changes:
-- DROP TABLE IF EXISTS user_user_groups CASCADE;
-- DROP TABLE IF EXISTS user_groups CASCADE;
-- ALTER TABLE users DROP COLUMN IF EXISTS role_ids;
