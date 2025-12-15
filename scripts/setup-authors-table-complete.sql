-- =====================================================
-- COMPLETE AUTHORS TABLE SETUP FOR OJS CLONE
-- This handles: CREATE if not exists, ADD columns if missing
-- =====================================================

-- Step 1: Create authors table if not exists
CREATE TABLE IF NOT EXISTS public.authors (
    author_id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    affiliation TEXT,
    country VARCHAR(90),
    url VARCHAR(2047),
    biography TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    seq NUMERIC(8,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add foreign key to submissions if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'authors_submission_id_fkey'
        AND table_name = 'authors'
    ) THEN
        ALTER TABLE public.authors
        ADD CONSTRAINT authors_submission_id_fkey
        FOREIGN KEY (submission_id)
        REFERENCES public.submissions(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_authors_submission_id ON public.authors(submission_id);
CREATE INDEX IF NOT EXISTS idx_authors_is_primary ON public.authors(is_primary);

-- Step 4: Add RLS policies
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read authors
DROP POLICY IF EXISTS "Authors are viewable by everyone" ON public.authors;
CREATE POLICY "Authors are viewable by everyone"
    ON public.authors FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert authors for their own submissions
DROP POLICY IF EXISTS "Users can insert authors for their submissions" ON public.authors;
CREATE POLICY "Users can insert authors for their submissions"
    ON public.authors FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT submitter_id FROM public.submissions WHERE id = submission_id
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM public.user_roles WHERE role_id IN (
                SELECT id FROM public.roles WHERE name IN ('admin', 'editor', 'manager')
            )
        )
    );

-- Policy: Users can update authors for their own submissions
DROP POLICY IF EXISTS "Users can update their submission authors" ON public.authors;
CREATE POLICY "Users can update their submission authors"
    ON public.authors FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT submitter_id FROM public.submissions WHERE id = submission_id
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM public.user_roles WHERE role_id IN (
                SELECT id FROM public.roles WHERE name IN ('admin', 'editor', 'manager')
            )
        )
    );

-- Policy: Users can delete authors for their own submissions
DROP POLICY IF EXISTS "Users can delete their submission authors" ON public.authors;
CREATE POLICY "Users can delete their submission authors"
    ON public.authors FOR DELETE
    USING (
        auth.uid() IN (
            SELECT submitter_id FROM public.submissions WHERE id = submission_id
        )
        OR
        auth.uid() IN (
            SELECT user_id FROM public.user_roles WHERE role_id IN (
                SELECT id FROM public.roles WHERE name IN ('admin', 'editor', 'manager')
            )
        )
    );

-- Verification Query
SELECT 
    'Authors table setup complete!' as message,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'authors') as column_count,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'authors' AND constraint_type = 'FOREIGN KEY') as fk_count,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'authors') as policy_count;
