-- Ensure editorial_decisions and revision_requests tables exist
-- Run this migration to support editorial decision workflow

-- 1. Check if editorial_decisions table exists, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'editorial_decisions') THEN
        CREATE TABLE editorial_decisions (
            decision_id BIGSERIAL PRIMARY KEY,
            submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
            editor_id UUID NOT NULL REFERENCES users(id),
            decision INTEGER NOT NULL,
            round INTEGER,
            stage_id INTEGER,
            review_round_id BIGINT REFERENCES review_rounds(review_round_id),
            decision_comments TEXT,
            date_decided TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_editorial_decisions_submission ON editorial_decisions(submission_id);
        CREATE INDEX idx_editorial_decisions_editor ON editorial_decisions(editor_id);
        CREATE INDEX idx_editorial_decisions_date ON editorial_decisions(date_decided);
        
        RAISE NOTICE '✅ Created editorial_decisions table';
    ELSE
        RAISE NOTICE '✓ editorial_decisions table already exists';
    END IF;
END $$;

-- 2. Check if revision_requests table exists, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'revision_requests') THEN
        CREATE TABLE revision_requests (
            request_id BIGSERIAL PRIMARY KEY,
            submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
            request_type VARCHAR(50) NOT NULL, -- 'revisions_required' or 'resubmit'
            editor_comments TEXT,
            due_date TIMESTAMPTZ,
            date_requested TIMESTAMPTZ DEFAULT NOW(),
            date_responded TIMESTAMPTZ,
            status VARCHAR(50) DEFAULT 'pending' -- 'pending', 'completed', 'cancelled'
        );
        
        CREATE INDEX idx_revision_requests_submission ON revision_requests(submission_id);
        CREATE INDEX idx_revision_requests_status ON revision_requests(status);
        
        RAISE NOTICE '✅ Created revision_requests table';
    ELSE
        RAISE NOTICE '✓ revision_requests table already exists';
    END IF;
END $$;

-- 3. Add RLS policies for editorial_decisions
DROP POLICY IF EXISTS "editorial_decisions_access_policy" ON editorial_decisions;

CREATE POLICY "editorial_decisions_access_policy" ON editorial_decisions
FOR ALL
TO authenticated
USING (
  -- Can view if:
  -- 1. Admin/manager/editor
  -- 2. Submitter of the submission
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin' = ANY(users.roles) OR
      'manager' = ANY(users.roles) OR
      'editor' = ANY(users.roles)
    )
  )
  OR EXISTS (
    SELECT 1 FROM submissions
    WHERE submissions.id = editorial_decisions.submission_id
    AND submissions.submitter_id = auth.uid()
  )
)
WITH CHECK (
  -- Can create if editor/admin
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin' = ANY(users.roles) OR
      'manager' = ANY(users.roles) OR
      'editor' = ANY(users.roles)
    )
  )
);

-- 4. Add RLS policies for revision_requests
DROP POLICY IF EXISTS "revision_requests_access_policy" ON revision_requests;

CREATE POLICY "revision_requests_access_policy" ON revision_requests
FOR ALL
TO authenticated
USING (
  -- Can view if:
  -- 1. Admin/manager/editor
  -- 2. Submitter of the submission
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin' = ANY(users.roles) OR
      'manager' = ANY(users.roles) OR
      'editor' = ANY(users.roles)
    )
  )
  OR EXISTS (
    SELECT 1 FROM submissions
    WHERE submissions.id = revision_requests.submission_id
    AND submissions.submitter_id = auth.uid()
  )
)
WITH CHECK (
  -- Can create if editor/admin
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin' = ANY(users.roles) OR
      'manager' = ANY(users.roles) OR
      'editor' = ANY(users.roles)
    )
  )
);

-- 5. Enable RLS
ALTER TABLE editorial_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_requests ENABLE ROW LEVEL SECURITY;

-- Success message
SELECT '✅ Editorial decision workflow schema ready!' as message;

-- Verify tables
SELECT 
    tablename,
    CASE 
        WHEN tablename = 'editorial_decisions' THEN '✅ Ready for editorial decisions'
        WHEN tablename = 'revision_requests' THEN '✅ Ready for revision requests'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('editorial_decisions', 'revision_requests')
ORDER BY tablename;
