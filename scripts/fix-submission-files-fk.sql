-- Fix Foreign Key Constraint: submission_files -> submissions
-- Problem: submission_files might reference wrong table (e.g., 'articles' instead of 'submissions')
-- Solution: Drop old constraint and recreate pointing to correct table

BEGIN;

-- 1. Check current foreign key constraint
DO $$ 
DECLARE
    constraint_exists boolean;
    fk_table text;
BEGIN
    -- Check if the constraint exists and which table it points to
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'submission_files_submission_id_fkey'
        AND table_name = 'submission_files'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        -- Get the referenced table
        SELECT ccu.table_name INTO fk_table
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_name = 'submission_files_submission_id_fkey'
        LIMIT 1;

        RAISE NOTICE 'Current FK points to table: %', fk_table;

        -- Drop existing constraint
        ALTER TABLE submission_files 
        DROP CONSTRAINT IF EXISTS submission_files_submission_id_fkey;
        
        RAISE NOTICE 'Dropped old foreign key constraint';
    ELSE
        RAISE NOTICE 'No existing FK constraint found';
    END IF;
END $$;

-- 2. Ensure 'submissions' table exists
-- If it doesn't exist but 'articles' does, we might need to use 'articles'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles') THEN
            -- Create alias/view if submissions doesn't exist
            RAISE NOTICE 'submissions table not found, checking if articles table should be used';
            -- In this case, the FK should point to 'articles'
        ELSE
            RAISE EXCEPTION 'Neither submissions nor articles table exists!';
        END IF;
    ELSE
        RAISE NOTICE 'submissions table exists';
    END IF;
END $$;

-- 3. Add correct foreign key constraint
-- This points submission_files.submission_id -> submissions.id
ALTER TABLE submission_files 
ADD CONSTRAINT submission_files_submission_id_fkey 
FOREIGN KEY (submission_id) 
REFERENCES submissions(id) 
ON DELETE CASCADE;

-- 4. Verify the new constraint
DO $$
DECLARE
    fk_table text;
BEGIN
    SELECT ccu.table_name INTO fk_table
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_name = 'submission_files_submission_id_fkey'
    LIMIT 1;

    RAISE NOTICE 'New FK now points to table: %', fk_table;
END $$;

-- 5. Clean up orphaned records (optional - be careful!)
-- Uncomment to remove submission_files records that don't have matching submissions
-- DELETE FROM submission_files 
-- WHERE submission_id NOT IN (SELECT id FROM submissions);

COMMIT;

-- 6. Verification query
SELECT 
    'FK Constraint Fixed' as status,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_name = 'submission_files_submission_id_fkey';
