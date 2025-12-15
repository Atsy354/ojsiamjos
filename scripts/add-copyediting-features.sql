-- ============================================================================
-- Copyediting Workflow Schema
-- Tables for copyediting assignments, file versions, and author approvals
-- ============================================================================

-- Copyediting assignments table
CREATE TABLE IF NOT EXISTS copyediting_assignments (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  copyeditor_id TEXT NOT NULL,
  status INTEGER DEFAULT 0, -- 0=Pending, 1=In Progress, 2=Complete
  date_assigned TIMESTAMP DEFAULT NOW(),
  date_completed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- File versions table
CREATE TABLE IF NOT EXISTS file_versions (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  file_id BIGINT,
  version_number INTEGER DEFAULT 1,
  version_type TEXT, -- 'original', 'copyedited', 'final'
  uploaded_by TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Author approvals table
CREATE TABLE IF NOT EXISTS author_approvals (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  author_id TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  comments TEXT,
  date_approved TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_copyediting_assignments_submission 
ON copyediting_assignments(submission_id);

CREATE INDEX IF NOT EXISTS idx_copyediting_assignments_copyeditor 
ON copyediting_assignments(copyeditor_id);

CREATE INDEX IF NOT EXISTS idx_copyediting_assignments_status 
ON copyediting_assignments(status);

CREATE INDEX IF NOT EXISTS idx_file_versions_submission 
ON file_versions(submission_id);

CREATE INDEX IF NOT EXISTS idx_author_approvals_submission 
ON author_approvals(submission_id);

CREATE INDEX IF NOT EXISTS idx_author_approvals_author 
ON author_approvals(author_id);

-- Add comments
COMMENT ON TABLE copyediting_assignments IS 'Copyediting assignments for submissions';
COMMENT ON COLUMN copyediting_assignments.status IS 'Assignment status: 0=Pending, 1=In Progress, 2=Complete';
COMMENT ON TABLE file_versions IS 'File version history for submissions';
COMMENT ON COLUMN file_versions.version_type IS 'Type of file version: original, copyedited, final';
COMMENT ON TABLE author_approvals IS 'Author approvals for copyedited versions';
