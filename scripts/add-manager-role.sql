-- Add Manager Role Support
-- This script updates the database schema to support the 'manager' role as per OJS PKP 3.3

-- 1. Update user_journal_roles table check constraint to include 'manager'
ALTER TABLE user_journal_roles 
  DROP CONSTRAINT IF EXISTS user_journal_roles_role_check;

ALTER TABLE user_journal_roles 
  ADD CONSTRAINT user_journal_roles_role_check 
  CHECK (role IN (
    'admin',
    'manager',      -- Journal Manager (OJS PKP 3.3)
    'editor',
    'author',
     'reviewer',
    'reader',
    'assistant',
    'copyeditor',
    'proofreader',
    'layout_editor',
    'subscription_manager'
  ));

-- 2. If you have a users table with role column, update that too
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_role_check;
    
    ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN (
        'admin',
        'manager',
        'editor',
        'author',
        'reviewer',
        'reader',
        'assistant',
        'copyeditor',
        'proofreader',
        'layout_editor',
        'subscription_manager'
      ));
  END IF;
END $$;

-- 3. Update RLS policies if needed (example)
-- Managers should have same access as admins for journal management
-- This is already handled by role_id checks, but we ensure policies are aware

COMMENT ON CONSTRAINT user_journal_roles_role_check ON user_journal_roles IS 
  'Ensures role matches OJS PKP 3.3 role system including Journal Manager';

