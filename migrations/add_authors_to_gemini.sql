-- Script untuk menambahkan authors ke submission yang sudah ada
-- Untuk submission "Gemini" dengan submitter aksitsalatsa@gmail.com

-- Step 1: Cari submission berdasarkan submitter
DO $$
DECLARE
  v_submission_id UUID;
  v_publication_id UUID;
  v_author_id UUID;
  v_submitter_email TEXT := 'aksitsalatsa@gmail.com';
BEGIN
  -- Cari submission
  SELECT id, current_publication_id INTO v_submission_id, v_publication_id
  FROM submissions
  WHERE submitter_id = '4968fd0a-bfe1-4d50-b0a4-b9446043eaab'
  ORDER BY created_at DESC
  LIMIT 1;

  RAISE NOTICE 'Submission ID: %, Publication ID: %', v_submission_id, v_publication_id;

  -- Jika tidak ada publication, buat dulu
  IF v_publication_id IS NULL THEN
    INSERT INTO publications (submission_id, version, status, primary_locale, seq)
    VALUES (v_submission_id, 1, 1, 'en_US', 0)
    RETURNING id INTO v_publication_id;
    
    -- Update submission dengan publication_id
    UPDATE submissions 
    SET current_publication_id = v_publication_id
    WHERE id = v_submission_id;
    
    RAISE NOTICE 'Created publication: %', v_publication_id;
  END IF;

  -- Hapus authors lama jika ada
  DELETE FROM author_settings 
  WHERE author_id IN (SELECT id FROM authors WHERE publication_id = v_publication_id);
  
  DELETE FROM authors WHERE publication_id = v_publication_id;

  -- Insert author baru
  INSERT INTO authors (publication_id, email, seq, include_in_browse)
  VALUES (v_publication_id, v_submitter_email, 0, true)
  RETURNING id INTO v_author_id;

  RAISE NOTICE 'Created author: %', v_author_id;

  -- Insert author settings
  INSERT INTO author_settings (author_id, locale, setting_name, setting_value) VALUES
  (v_author_id, 'en_US', 'givenName', 'aksioma'),
  (v_author_id, 'en_US', 'familyName', 'yufuna'),
  (v_author_id, 'en_US', 'affiliation', 'UDINUS'),
  (v_author_id, '', 'primaryContact', '1');

  RAISE NOTICE 'Author settings created';
  
  -- Verify
  RAISE NOTICE 'Verification:';
  RAISE NOTICE 'Authors count: %', (SELECT COUNT(*) FROM authors WHERE publication_id = v_publication_id);
  RAISE NOTICE 'Settings count: %', (SELECT COUNT(*) FROM author_settings WHERE author_id = v_author_id);
END $$;

-- Verify hasil
SELECT 
  a.id as author_id,
  a.email,
  a.seq,
  a.include_in_browse,
  p.submission_id,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'givenName') as first_name,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'familyName') as last_name,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'affiliation') as affiliation
FROM authors a
JOIN publications p ON a.publication_id = p.id
WHERE p.submission_id IN (
  SELECT id FROM submissions WHERE submitter_id = '4968fd0a-bfe1-4d50-b0a4-b9446043eaab'
)
ORDER BY a.created_at DESC;
