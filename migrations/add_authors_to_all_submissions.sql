-- Script untuk menambahkan authors ke SEMUA submission lama
-- Menggunakan submitter sebagai author

DO $$
DECLARE
  submission_record RECORD;
  v_submitter_email TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_affiliation TEXT;
  total_submissions INT := 0;
  total_fixed INT := 0;
BEGIN
  RAISE NOTICE 'Starting to add authors to all submissions...';
  
  -- Loop through all submissions
  FOR submission_record IN 
    SELECT s.id, s.submitter_id, s.title
    FROM submissions s
    ORDER BY s.created_at
  LOOP
    total_submissions := total_submissions + 1;
    
    RAISE NOTICE '---';
    RAISE NOTICE 'Processing submission ID % (%)', submission_record.id, submission_record.title;
    
    -- Check if authors already exist
    IF EXISTS (SELECT 1 FROM authors WHERE article_id = submission_record.id) THEN
      RAISE NOTICE 'Authors already exist, skipping';
      CONTINUE;
    END IF;
    
    -- Get submitter info
    SELECT email, first_name, last_name, affiliation
    INTO v_submitter_email, v_first_name, v_last_name, v_affiliation
    FROM users
    WHERE id = submission_record.submitter_id;
    
    -- If no submitter, use default
    IF v_submitter_email IS NULL THEN
      SELECT email, first_name, last_name, affiliation
      INTO v_submitter_email, v_first_name, v_last_name, v_affiliation
      FROM users
      ORDER BY created_at
      LIMIT 1;
      
      RAISE NOTICE 'No submitter found, using default user: %', v_submitter_email;
    END IF;
    
    -- Insert author
    INSERT INTO authors (article_id, first_name, last_name, email, affiliation, primary_contact, seq)
    VALUES (
      submission_record.id,
      COALESCE(v_first_name, ''),
      COALESCE(v_last_name, ''),
      v_submitter_email,
      v_affiliation,
      true,
      1
    );
    
    total_fixed := total_fixed + 1;
    RAISE NOTICE 'Author added: % % (%)', v_first_name, v_last_name, v_submitter_email;
  END LOOP;
  
  RAISE NOTICE '===';
  RAISE NOTICE 'SUMMARY:';
  RAISE NOTICE 'Total submissions processed: %', total_submissions;
  RAISE NOTICE 'Total submissions fixed: %', total_fixed;
  RAISE NOTICE '===';
END $$;

-- Verify results
SELECT 
  s.id,
  s.title,
  COUNT(a.id) as author_count,
  STRING_AGG(a.first_name || ' ' || a.last_name, ', ') as authors
FROM submissions s
LEFT JOIN authors a ON a.article_id = s.id
GROUP BY s.id, s.title
ORDER BY s.id DESC
LIMIT 20;
