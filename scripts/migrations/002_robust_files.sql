-- ===================================================================
-- ROBUST FILE SUBMISSION SCHEMA
-- ===================================================================

-- 1. Ensure submission_files is robust
CREATE TABLE IF NOT EXISTS submission_files (
  file_id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT REFERENCES submissions(id) ON DELETE CASCADE,
  journal_id INTEGER,
  file_stage INTEGER NOT NULL DEFAULT 2, -- 2=Submission
  original_file_name TEXT NOT NULL,
  file_name TEXT NOT NULL, -- Storage path key
  file_type TEXT,
  file_size BIGINT,
  file_path TEXT, -- Redundant but useful
  uploader_user_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id), -- Alias for uploader
  date_uploaded TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  viewable BOOLEAN DEFAULT TRUE,
  genre_id INTEGER,
  direct_sales_price NUMERIC(10,2),
  sales_type VARCHAR(50)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_submission_files_submission ON submission_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_files_stage ON submission_files(file_stage);

-- 2. Create activity_logs table for audit
CREATE TABLE IF NOT EXISTS activity_logs (
  log_id BIGSERIAL PRIMARY KEY,
  journal_id INTEGER,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- 'FILE_UPLOAD', 'LOGIN', etc
  entity_type VARCHAR(50), -- 'submission', 'file'
  entity_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- 3. RLS Policies
ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to authors and editors
DROP POLICY IF EXISTS "Users can view files they own or if they are editors" ON submission_files;
CREATE POLICY "Users can view files they own or if they are editors"
ON submission_files FOR SELECT
USING (
  uploader_user_id = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM submissions s WHERE s.id = submission_files.submission_id AND s.submitter_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND ('editor' = ANY(roles) OR 'admin' = ANY(roles)))
  OR EXISTS (
    SELECT 1 FROM review_assignments ra 
    WHERE ra.submission_id = submission_files.submission_id 
    AND ra.reviewer_id = auth.uid()
  )
);

-- 4. Storage Bucket Policy (SQL Representation)
-- Note: Bucket policies are usually managed via Storage API, but good to document
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false) ON CONFLICT DO NOTHING;
