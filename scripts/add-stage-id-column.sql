-- Add missing columns to submissions table
-- Run this in Supabase SQL Editor

-- Add stage_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'stage_id'
    ) THEN
        ALTER TABLE submissions ADD COLUMN stage_id INTEGER DEFAULT 1;
        COMMENT ON COLUMN submissions.stage_id IS 'Current workflow stage (1=Submission, 2=Review, 3=Copyediting, 4=Production, 5=Published)';
    END IF;
END $$;

-- Add date_last_activity column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'date_last_activity'
    ) THEN
        ALTER TABLE submissions ADD COLUMN date_last_activity TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Create index on stage_id for performance
CREATE INDEX IF NOT EXISTS idx_submissions_stage_id ON submissions(stage_id);

-- Update existing submissions to have stage_id = 1 (Submission stage)
UPDATE submissions 
SET stage_id = 1 
WHERE stage_id IS NULL;

-- Make stage_id NOT NULL after setting defaults
ALTER TABLE submissions ALTER COLUMN stage_id SET NOT NULL;
ALTER TABLE submissions ALTER COLUMN stage_id SET DEFAULT 1;

COMMENT ON TABLE submissions IS 'Article submissions with OJS PKP 3.3 workflow stages';
