-- ============================================================================
-- Review Workflow - Complete Schema
-- Create review_assignments table and add review features
-- ============================================================================

-- Drop existing indexes if any (to avoid conflicts)
DROP INDEX IF EXISTS idx_review_assignments_status;
DROP INDEX IF EXISTS idx_review_assignments_reviewer;
DROP INDEX IF EXISTS idx_review_assignments_submission;
DROP INDEX IF EXISTS idx_review_files_assignment;

-- Create review_assignments table if not exists
CREATE TABLE IF NOT EXISTS review_assignments (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  reviewer_id TEXT NOT NULL,
  review_round_id BIGINT,
  recommendation INTEGER,
  comments TEXT,
  confidential_comments TEXT,
  status INTEGER DEFAULT 0,
  date_assigned TIMESTAMP DEFAULT NOW(),
  date_due TIMESTAMP,
  date_responded TIMESTAMP,
  date_completed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- If table already exists, add missing columns
DO $$ 
BEGIN
  -- Add recommendation if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='review_assignments' AND column_name='recommendation') THEN
    ALTER TABLE review_assignments ADD COLUMN recommendation INTEGER;
  END IF;

  -- Add comments if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='review_assignments' AND column_name='comments') THEN
    ALTER TABLE review_assignments ADD COLUMN comments TEXT;
  END IF;

  -- Add confidential_comments if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='review_assignments' AND column_name='confidential_comments') THEN
    ALTER TABLE review_assignments ADD COLUMN confidential_comments TEXT;
  END IF;

  -- Add status if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='review_assignments' AND column_name='status') THEN
    ALTER TABLE review_assignments ADD COLUMN status INTEGER DEFAULT 0;
  END IF;

  -- Add date_due if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='review_assignments' AND column_name='date_due') THEN
    ALTER TABLE review_assignments ADD COLUMN date_due TIMESTAMP;
  END IF;

  -- Add date_responded if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='review_assignments' AND column_name='date_responded') THEN
    ALTER TABLE review_assignments ADD COLUMN date_responded TIMESTAMP;
  END IF;

  -- Add date_completed if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='review_assignments' AND column_name='date_completed') THEN
    ALTER TABLE review_assignments ADD COLUMN date_completed TIMESTAMP;
  END IF;
END $$;

-- Create review_files table for reviewer uploads
CREATE TABLE IF NOT EXISTS review_files (
  id BIGSERIAL PRIMARY KEY,
  review_assignment_id BIGINT REFERENCES review_assignments(id) ON DELETE CASCADE,
  file_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance (after all columns exist)
CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer 
ON review_assignments(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_review_assignments_submission 
ON review_assignments(submission_id);

CREATE INDEX IF NOT EXISTS idx_review_assignments_status 
ON review_assignments(status);

CREATE INDEX IF NOT EXISTS idx_review_files_assignment 
ON review_files(review_assignment_id);

-- Add comments
COMMENT ON TABLE review_assignments IS 'Review assignments for submissions';
COMMENT ON COLUMN review_assignments.recommendation IS 'Review recommendation: 1=Accept, 2=Minor Revisions, 3=Major Revisions, 4=Reject, 5=See Comments';
COMMENT ON COLUMN review_assignments.status IS 'Assignment status: 0=Awaiting Response, 1=Declined, 2=Accepted, 3=Complete, 4=Cancelled';
COMMENT ON TABLE review_files IS 'Files uploaded by reviewers with their review';
