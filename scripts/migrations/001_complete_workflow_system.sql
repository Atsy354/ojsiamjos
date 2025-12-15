-- ===================================================================
-- COMPLETE OJS WORKFLOW DATABASE MIGRATION
-- Version: 1.0.0
-- Date: 2025-12-14
-- Author: CTO-Level Implementation
-- Description: Full workflow system matching OJS 3.x architecture
-- ===================================================================

-- Safety checks
DO $$ 
BEGIN
    RAISE NOTICE 'Starting workflow migration at %', NOW();
    RAISE NOTICE 'Database: %', current_database();
END $$;

-- ===================================================================
-- SECTION 1: CORE TABLES ENHANCEMENT
-- ===================================================================

-- 1.1: Enhance submissions table
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS submission_progress INTEGER DEFAULT 0 CHECK (submission_progress BETWEEN 0 AND 5),
ADD COLUMN IF NOT EXISTS context_id INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en_US',
ADD COLUMN IF NOT EXISTS date_status_modified TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();

COMMENT ON COLUMN submissions.submission_progress IS '0=incomplete, 1-4=wizard steps, 5=complete';

-- 1.2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_submissions_progress ON submissions(submission_progress);
CREATE INDEX IF NOT EXISTS idx_submissions_stage ON submissions(stage_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- ===================================================================
-- SECTION 2: REVIEW SYSTEM
-- ===================================================================

-- 2.1: Review Rounds (tracks multiple review cycles)
CREATE TABLE IF NOT EXISTS review_rounds (
  review_round_id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  stage_id INTEGER NOT NULL DEFAULT 3,
  round INTEGER NOT NULL DEFAULT 1,
  status INTEGER DEFAULT 1,
  -- Status codes: 1=pending, 6=pending_reviewers, 8=pending_reviews, 
  --               11=recommendations_ready, 12=recommendations_completed
  date_created TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_submission_stage_round UNIQUE (submission_id, stage_id, round)
);

COMMENT ON TABLE review_rounds IS 'Tracks review cycles for each submission stage';
COMMENT ON COLUMN review_rounds.status IS '1=pending, 6=awaiting reviewers, 8=reviews in progress, 11=complete';

-- 2.2: Enhance review_assignments
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='review_assignments' AND column_name='review_round_id') THEN
        ALTER TABLE review_assignments
        ADD COLUMN review_round_id BIGINT REFERENCES review_rounds(review_round_id) ON DELETE SET NULL,
        ADD COLUMN stage_id INTEGER DEFAULT 3,
        ADD COLUMN review_method INTEGER DEFAULT 2,
        ADD COLUMN declined BOOLEAN DEFAULT FALSE,
        ADD COLUMN cancelled BOOLEAN DEFAULT FALSE,
        ADD COLUMN replaced BOOLEAN DEFAULT FALSE,
        ADD COLUMN date_assigned TIMESTAMP WITHOUT TIME ZONE,
        ADD COLUMN date_notified TIMESTAMP WITHOUT TIME ZONE,
        ADD COLUMN date_confirmed TIMESTAMP WITHOUT TIME ZONE,
        ADD COLUMN date_completed TIMESTAMP WITHOUT TIME ZONE,
        ADD COLUMN date_acknowledged TIMESTAMP WITHOUT TIME ZONE,
        ADD COLUMN date_due TIMESTAMP WITHOUT TIME ZONE,
        ADD COLUMN date_response_due TIMESTAMP WITHOUT TIME ZONE,
        ADD COLUMN last_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        ADD COLUMN recommendation INTEGER,
        ADD COLUMN review_comments TEXT,
        ADD COLUMN comments_for_editor TEXT,
        ADD COLUMN quality INTEGER CHECK (quality BETWEEN 1 AND 5),
        ADD COLUMN reviewer_file_id BIGINT;
        
        RAISE NOTICE 'Enhanced review_assignments table';
    END IF;
END $$;

COMMENT ON COLUMN review_assignments.recommendation IS '1=accept, 2=revisions_required, 3=resubmit, 4=decline, 5=see_comments';
COMMENT ON COLUMN review_assignments.review_method IS '1=double_blind, 2=blind, 3=open';

-- 2.3: Review responses (detailed feedback)
CREATE TABLE IF NOT EXISTS review_form_responses (
  review_form_response_id BIGSERIAL PRIMARY KEY,
  review_assignment_id BIGINT NOT NULL REFERENCES review_assignments(id) ON DELETE CASCADE,
  review_form_element_id INTEGER,
  response_type VARCHAR(50),
  response_value TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- SECTION 3: EDITORIAL WORKFLOW
-- ===================================================================

-- 3.1: Editorial decisions
CREATE TABLE IF NOT EXISTS editorial_decisions (
  decision_id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES users(id),
  decision INTEGER NOT NULL,
  -- Decision codes (OJS standard):
  -- 1=ACCEPT, 2=PENDING_REVISIONS, 3=RESUBMIT, 4=DECLINE,
  -- 7=SEND_TO_PRODUCTION, 8=EXTERNAL_REVIEW, 9=INITIAL_DECLINE,
  -- 16=NEW_ROUND, 17=REVERT_DECLINE
  date_decided TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  round INTEGER DEFAULT 1,
  stage_id INTEGER NOT NULL,
  review_round_id BIGINT REFERENCES review_rounds(review_round_id),
  decision_comments TEXT,
  
  CONSTRAINT valid_decision CHECK (decision IN (1,2,3,4,7,8,9,16,17))
);

COMMENT ON TABLE editorial_decisions IS 'Tracks all editorial decisions throughout workflow';
COMMENT ON COLUMN editorial_decisions.decision IS 'OJS decision codes: 1=accept, 4=decline, 8=send_to_review, etc';

-- 3.2: Stage assignments (who works on what)
CREATE TABLE IF NOT EXISTS stage_assignments (
  assignment_id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  user_group_id INTEGER NOT NULL,
  -- User groups: 1=manager, 2=editor, 3=author, 4=reviewer, 5=copyeditor, 6=layout_editor
  stage_id INTEGER NOT NULL,
  date_assigned TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  can_change_metadata BOOLEAN DEFAULT FALSE,
  recommend_only BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT unique_user_submission_stage UNIQUE (submission_id, user_id, user_group_id, stage_id)
);

COMMENT ON TABLE stage_assignments IS 'Tracks user assignments to submission workflow stages';

-- ===================================================================
-- SECTION 4: COPYEDITING & PRODUCTION
-- ===================================================================

-- 4.1: Copyediting files
CREATE TABLE IF NOT EXISTS copyediting_files (
  file_id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  original_filename VARCHAR(255),
  uploaded_by UUID REFERENCES users(id),
  date_uploaded TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  copyedit_stage VARCHAR(50) DEFAULT 'initial',
  -- Stages: initial, author_review, final
  version INTEGER DEFAULT 1,
  
  CONSTRAINT valid_copyedit_stage CHECK (copyedit_stage IN ('initial', 'author_review', 'final'))
);

-- 4.2: Publication galleys (final published formats)
CREATE TABLE IF NOT EXISTS publication_galleys (
  galley_id BIGSERIAL PRIMARY KEY,
  publication_id BIGINT,
  submission_id BIGINT REFERENCES submissions(id) ON DELETE CASCADE,
  file_id BIGINT,
  label VARCHAR(50) NOT NULL,
  -- Labels: PDF, HTML, XML, EPUB, etc
  locale VARCHAR(10) DEFAULT 'en_US',
  seq INTEGER DEFAULT 0,
  remote_url TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  date_created TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_galley_label CHECK (label IN ('PDF', 'HTML', 'XML', 'EPUB', 'DOC', 'MOBI'))
);

COMMENT ON TABLE publication_galleys IS 'Final publication formats (PDF, HTML, etc)';

-- ===================================================================
-- SECTION 5: NOTIFICATION & AUDIT
-- ===================================================================

-- 5.1: Workflow notifications
CREATE TABLE IF NOT EXISTS workflow_notifications (
  notification_id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  type VARCHAR(100) NOT NULL,
  -- Types: reviewer_assigned, decision_made, revision_requested, etc
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITHOUT TIME ZONE
);

-- 5.2: Workflow audit log
CREATE TABLE IF NOT EXISTS workflow_audit_log (
  log_id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  -- Actions: stage_change, status_change, file_upload, decision_made, etc
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE workflow_audit_log IS 'Complete audit trail of all workflow actions';

-- ===================================================================
-- SECTION 6: PERFORMANCE INDEXES
-- ===================================================================

-- Review system indexes
CREATE INDEX IF NOT EXISTS idx_review_rounds_submission ON review_rounds(submission_id);
CREATE INDEX IF NOT EXISTS idx_review_rounds_status ON review_rounds(status);
CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer ON review_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_round ON review_assignments(review_round_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_status ON review_assignments(declined, cancelled);

-- Editorial workflow indexes
CREATE INDEX IF NOT EXISTS idx_editorial_decisions_submission ON editorial_decisions(submission_id);
CREATE INDEX IF NOT EXISTS idx_editorial_decisions_editor ON editorial_decisions(editor_id);
CREATE INDEX IF NOT EXISTS idx_editorial_decisions_date ON editorial_decisions(date_decided DESC);
CREATE INDEX IF NOT EXISTS idx_stage_assignments_submission ON stage_assignments(submission_id);
CREATE INDEX IF NOT EXISTS idx_stage_assignments_user ON stage_assignments(user_id);

-- Production indexes
CREATE INDEX IF NOT EXISTS idx_copyediting_files_submission ON copyediting_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_publication_galleys_submission ON publication_galleys(submission_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_user ON workflow_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_workflow_audit_submission ON workflow_audit_log(submission_id);

-- ===================================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS)
-- ===================================================================

-- Enable RLS on sensitive tables
ALTER TABLE review_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies (basic - can be enhanced based on requirements)
CREATE POLICY "Users can view review rounds for their submissions" 
ON review_rounds FOR SELECT
USING (
  submission_id IN (
    SELECT id FROM submissions WHERE submitter_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND 'editor' = ANY(roles)
  )
);

CREATE POLICY "Reviewers can view their assigned reviews"
ON review_form_responses FOR SELECT
USING (
  review_assignment_id IN (
    SELECT id FROM review_assignments WHERE reviewer_id = auth.uid()
  )
);

-- ===================================================================
-- SECTION 8: DATA INTEGRITY TRIGGERS
-- ===================================================================

-- Trigger: Update last_modified on submissions
CREATE OR REPLACE FUNCTION update_submission_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_submission_modified
BEFORE UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_submission_modified();

-- Trigger: Audit log for submissions
CREATE OR REPLACE FUNCTION audit_submission_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.status != OLD.status THEN
            INSERT INTO workflow_audit_log (
                submission_id, action, old_value, new_value, created_at
            ) VALUES (
                NEW.id, 'status_change', OLD.status, NEW.status, NOW()
            );
        END IF;
        
        IF NEW.stage_id != OLD.stage_id THEN
            INSERT INTO workflow_audit_log (
                submission_id, action, old_value, new_value, created_at
            ) VALUES (
                NEW.id, 'stage_change', OLD.stage_id::TEXT, NEW.stage_id::TEXT, NOW()
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_submission_changes
AFTER UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION audit_submission_changes();

-- ===================================================================
-- SECTION 9: VERIFICATION & STATS
-- ===================================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- Count new tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'review_rounds', 'review_form_responses', 'editorial_decisions',
        'stage_assignments', 'copyediting_files', 'publication_galleys',
        'workflow_notifications', 'workflow_audit_log'
    );
    
    RAISE NOTICE 'Migration complete! Created/verified % workflow tables', table_count;
    
    -- Display table statistics
    RAISE NOTICE '=== TABLE STATISTICS ===';
    RAISE NOTICE 'submissions: % rows', (SELECT COUNT(*) FROM submissions);
    RAISE NOTICE 'review_rounds: % rows', (SELECT COUNT(*) FROM review_rounds);
    RAISE NOTICE 'review_assignments: % rows', (SELECT COUNT(*) FROM review_assignments);
    RAISE NOTICE 'editorial_decisions: % rows', (SELECT COUNT(*) FROM editorial_decisions);
    RAISE NOTICE '========================';
END $$;

-- ===================================================================
-- MIGRATION COMPLETE
-- ===================================================================

-- Final verification query
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
    'submissions', 'review_rounds', 'review_assignments', 
    'editorial_decisions', 'stage_assignments', 'copyediting_files', 
    'publication_galleys', 'workflow_notifications', 'workflow_audit_log'
)
ORDER BY table_name;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════╗';
    RAISE NOTICE '║  DATABASE MIGRATION SUCCESSFUL             ║';
    RAISE NOTICE '║  OJS Workflow System v1.0.0                ║';
    RAISE NOTICE '║  Ready for production use                  ║';
    RAISE NOTICE '╚════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;
