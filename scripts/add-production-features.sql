-- ============================================================================
-- Production Workflow Schema
-- Tables for galley files and publication scheduling
-- ============================================================================

-- Galley files table (PDF, HTML, XML)
CREATE TABLE IF NOT EXISTS galley_files (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  file_id BIGINT,
  galley_type TEXT, -- 'pdf', 'html', 'xml'
  label TEXT, -- 'PDF', 'HTML Full Text', 'XML'
  uploaded_by TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Publication schedule table
CREATE TABLE IF NOT EXISTS publication_schedule (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL UNIQUE,
  issue_id BIGINT,
  scheduled_date TIMESTAMP,
  published_date TIMESTAMP,
  doi TEXT,
  article_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_galley_files_submission 
ON galley_files(submission_id);

CREATE INDEX IF NOT EXISTS idx_galley_files_type 
ON galley_files(galley_type);

CREATE INDEX IF NOT EXISTS idx_publication_schedule_submission 
ON publication_schedule(submission_id);

CREATE INDEX IF NOT EXISTS idx_publication_schedule_issue 
ON publication_schedule(issue_id);

CREATE INDEX IF NOT EXISTS idx_publication_schedule_date 
ON publication_schedule(scheduled_date);

-- Add comments
COMMENT ON TABLE galley_files IS 'Galley files (PDF, HTML, XML) for published articles';
COMMENT ON COLUMN galley_files.galley_type IS 'Type of galley: pdf, html, xml';
COMMENT ON TABLE publication_schedule IS 'Publication scheduling and DOI assignment';
COMMENT ON COLUMN publication_schedule.article_order IS 'Order of article in issue table of contents';
