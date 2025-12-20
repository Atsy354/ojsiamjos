-- Author Revision Workflow Schema
-- Tables to track revision submissions and author responses

-- 1. Create revision_submissions table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'revision_submissions') THEN
        CREATE TABLE revision_submissions (
            revision_id BIGSERIAL PRIMARY KEY,
            submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
            revision_request_id BIGINT REFERENCES revision_requests(request_id),
            author_id UUID NOT NULL REFERENCES users(id),
            revision_round INTEGER DEFAULT 1,
            
            -- Revision content
            cover_letter TEXT,
            response_to_reviewers TEXT,
            changes_summary TEXT,
            
            -- Status
            status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'under_review', 'accepted', 'rejected'
            
            -- Dates
            date_submitted TIMESTAMPTZ DEFAULT NOW(),
            date_reviewed TIMESTAMPTZ,
            
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_revision_submissions_submission ON revision_submissions(submission_id);
        CREATE INDEX idx_revision_submissions_author ON revision_submissions(author_id);
        CREATE INDEX idx_revision_submissions_status ON revision_submissions(status);
        
        RAISE NOTICE '✅ Created revision_submissions table';
    ELSE
        RAISE NOTICE '✓ revision_submissions table already exists';
    END IF;
END $$;

-- 2. Create author_reviewer_responses table for tracking responses to each reviewer
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'author_reviewer_responses') THEN
        CREATE TABLE author_reviewer_responses (
            response_id BIGSERIAL PRIMARY KEY,
            revision_id BIGINT NOT NULL REFERENCES revision_submissions(revision_id) ON DELETE CASCADE,
            review_assignment_id BIGINT REFERENCES review_assignments(id),
            reviewer_number INTEGER, -- For anonymous display (Reviewer 1, 2, etc)
            
            -- Response content
            response_text TEXT NOT NULL,
            addressed BOOLEAN DEFAULT false,
            
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_author_responses_revision ON author_reviewer_responses(revision_id);
        
        RAISE NOTICE '✅ Created author_reviewer_responses table';
    ELSE
        RAISE NOTICE '✓ author_reviewer_responses table already exists';
    END IF;
END $$;

-- 3. Add RLS policies for revision_submissions
DROP POLICY IF EXISTS "revision_submissions_access_policy" ON revision_submissions;

CREATE POLICY "revision_submissions_access_policy" ON revision_submissions
FOR ALL
TO authenticated
USING (
  -- Can view if:
  -- 1. Author of the submission
  -- 2. Editor/admin/manager
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin' = ANY(users.roles) OR
      'manager' = ANY(users.roles) OR
      'editor' = ANY(users.roles)
    )
  )
)
WITH CHECK (
  -- Can create if:
  -- 1. Author of the submission
  -- 2. Editor/admin (for administrative purposes)
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin' = ANY(users.roles) OR
      'manager' = ANY(users.roles) OR
      'editor' = ANY(users.roles)
    )
  )
);

-- 4. Add RLS policies for author_reviewer_responses
DROP POLICY IF EXISTS "author_responses_access_policy" ON author_reviewer_responses;

CREATE POLICY "author_responses_access_policy" ON author_reviewer_responses
FOR ALL
TO authenticated
USING (
  -- Can view if:
  -- 1. Author of the revision
  -- 2. Editor/admin
  EXISTS (
    SELECT 1 FROM revision_submissions rs
    WHERE rs.revision_id = author_reviewer_responses.revision_id
    AND (
      rs.author_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND (
          'admin' = ANY(users.roles) OR
          'manager' = ANY(users.roles) OR
          'editor' = ANY(users.roles)
        )
      )
    )
  )
)
WITH CHECK (
  -- Can create if author of the revision
  EXISTS (
    SELECT 1 FROM revision_submissions rs
    WHERE rs.revision_id = author_reviewer_responses.revision_id
    AND rs.author_id = auth.uid()
  )
);

-- 5. Enable RLS
ALTER TABLE revision_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_reviewer_responses ENABLE ROW LEVEL SECURITY;

-- Success message
SELECT '✅ Author revision workflow schema ready!' as message;

-- Verify tables
SELECT 
    tablename,
    CASE 
        WHEN tablename = 'revision_submissions' THEN '✅ Ready for revision submissions'
        WHEN tablename = 'author_reviewer_responses' THEN '✅ Ready for author responses'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('revision_submissions', 'author_reviewer_responses')
ORDER BY tablename;
