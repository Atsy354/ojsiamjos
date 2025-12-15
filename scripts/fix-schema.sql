-- Fix Schema: Quick Migration Script
-- This will update the database to match API expectations

-- 1. Fix journals table - add missing columns
ALTER TABLE journals 
  ADD COLUMN IF NOT EXISTS id SERIAL,
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS acronym VARCHAR(50),
  ADD COLUMN IF NOT EXISTS issn VARCHAR(20),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS publisher VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS online_issn VARCHAR(20),
  ADD COLUMN IF NOT EXISTS print_issn VARCHAR(20);

-- Update id to use journal_id value
UPDATE journals SET id = journal_id WHERE id IS NULL;

-- 2. Fix users table - add roles column
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS roles TEXT[];

-- Migrate role to roles array
UPDATE users 
SET roles = ARRAY[role]::TEXT[] 
WHERE roles IS NULL AND role IS NOT NULL;

-- 3. Create submissions table if not exists
CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  journal_id BIGINT REFERENCES journals(journal_id),
  submitter_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  abstract TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  section_id BIGINT REFERENCES sections(id),
  language VARCHAR(10) DEFAULT 'en',
  date_submitted TIMESTAMP DEFAULT NOW(),
  date_last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create reviews table if not exists
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT REFERENCES submissions(id),
  reviewer_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  recommendation VARCHAR(50),
  comments TEXT,
  date_assigned TIMESTAMP DEFAULT NOW(),
  date_completed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create review_assignments table
CREATE TABLE IF NOT EXISTS review_assignments (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT REFERENCES submissions(id),
  reviewer_id UUID REFERENCES users(id),
  round INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  date_assigned TIMESTAMP DEFAULT NOW(),
  date_due TIMESTAMP,
  date_completed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create editorial_decisions table
CREATE TABLE IF NOT EXISTS editorial_decisions (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT REFERENCES submissions(id),
  editor_id UUID REFERENCES users(id),
  decision VARCHAR(50) NOT NULL,
  comments TEXT,
  date_decided TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create workflow_stages table
CREATE TABLE IF NOT EXISTS workflow_stages (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  seq INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default workflow stages
INSERT INTO workflow_stages (name, description, seq) VALUES
  ('Submission', 'Initial submission stage', 1),
  ('Review', 'Peer review stage', 2),
  ('Copyediting', 'Copyediting stage', 3),
  ('Production', 'Production stage', 4),
  ('Published', 'Published stage', 5)
ON CONFLICT DO NOTHING;

-- 8. Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT REFERENCES submissions(id),
  user_id UUID REFERENCES users(id),
  topic VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Create galleys table (publication formats)
CREATE TABLE IF NOT EXISTS galleys (
  id BIGSERIAL PRIMARY KEY,
  publication_id BIGINT REFERENCES publications(id),
  label VARCHAR(50),
  locale VARCHAR(10),
  file_path VARCHAR(255),
  seq INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_journal ON submissions(journal_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter ON submissions(submitter_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_reviews_submission ON reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_submission ON review_assignments(submission_id);
CREATE INDEX IF NOT EXISTS idx_editorial_decisions_submission ON editorial_decisions(submission_id);
CREATE INDEX IF NOT EXISTS idx_discussions_submission ON discussions(submission_id);
CREATE INDEX IF NOT EXISTS idx_galleys_publication ON galleys(publication_id);

COMMENT ON TABLE submissions IS 'Article submissions to journals';
COMMENT ON TABLE reviews IS 'Peer reviews of submissions';
COMMENT ON TABLE review_assignments IS 'Review assignments to reviewers';
COMMENT ON TABLE editorial_decisions IS 'Editorial decisions on submissions';
COMMENT ON TABLE workflow_stages IS 'Workflow stages for submissions';
COMMENT ON TABLE discussions IS 'Discussions on submissions';
COMMENT ON TABLE galleys IS 'Publication formats (PDF, HTML, etc)';
