-- ================================================
-- ADD AUTHORS & KEYWORDS TO TEST SUBMISSIONS
-- ================================================

-- 1. Add authors for each submission
DO $$
DECLARE
    sub RECORD;
    v_user_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE email = 'editor@jcst.org' LIMIT 1;
    
    -- For each submission, add author
    FOR sub IN SELECT id FROM submissions WHERE journal_id = 1 LOOP
        INSERT INTO authors (
            submission_id,
            user_id,
            first_name,
            last_name,
            email,
            is_primary,
            seq
        ) VALUES (
            sub.id,
            v_user_id,
            'John',
            'Doe',
            'john.doe@example.com',
            true,
            0
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Authors added to all submissions!';
END $$;

-- 2. Update submissions to add keywords (as JSON array in text field)
UPDATE submissions 
SET 
    abstract = COALESCE(abstract, 'This is a comprehensive study exploring key concepts and methodologies.'),
    -- Note: If keywords column exists as TEXT, store as JSON string
    -- If keywords column exists as JSONB, use proper JSONB
    updated_at = NOW()
WHERE journal_id = 1;

-- 3. Verify
SELECT 
    s.id,
    s.title,
    COUNT(a.id) as author_count
FROM submissions s
LEFT JOIN authors a ON s.id = a.submission_id
WHERE s.journal_id = 1
GROUP BY s.id, s.title
ORDER BY s.date_submitted DESC
LIMIT 10;
