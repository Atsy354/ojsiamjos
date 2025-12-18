-- Script untuk memperbaiki authors di SEMUA submission
-- Akan membuat publication dan authors untuk semua submission yang belum punya

DO $$
DECLARE
  submission_record RECORD;
  v_publication_id UUID;
  v_author_id UUID;
  v_submitter_email TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_affiliation TEXT;
  total_submissions INT := 0;
  total_fixed INT := 0;
BEGIN
  RAISE NOTICE 'Starting to fix all submissions...';
  
  -- Loop through all submissions
  FOR submission_record IN 
    SELECT s.id, s.current_publication_id, s.submitter_id
    FROM submissions s
    ORDER BY s.created_at
  LOOP
    total_submissions := total_submissions + 1;
    v_publication_id := submission_record.current_publication_id;
    
    RAISE NOTICE '---';
    RAISE NOTICE 'Processing submission: %', submission_record.id;
    
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
    
    -- Create publication if doesn't exist
    IF v_publication_id IS NULL THEN
      INSERT INTO publications (submission_id, version, status, primary_locale, seq)
      VALUES (submission_record.id, 1, 1, 'en_US', 0)
      RETURNING id INTO v_publication_id;
      
      UPDATE submissions 
      SET current_publication_id = v_publication_id
      WHERE id = submission_record.id;
      
      RAISE NOTICE 'Created publication: %', v_publication_id;
    ELSE
      RAISE NOTICE 'Publication exists: %', v_publication_id;
    END IF;
    
    -- Check if authors already exist
    IF EXISTS (SELECT 1 FROM authors WHERE publication_id = v_publication_id) THEN
      RAISE NOTICE 'Authors already exist, skipping';
      CONTINUE;
    END IF;
    
    -- Insert author
    INSERT INTO authors (publication_id, email, seq, include_in_browse)
    VALUES (v_publication_id, v_submitter_email, 0, true)
    RETURNING id INTO v_author_id;
    
    RAISE NOTICE 'Created author: % (%)', v_author_id, v_submitter_email;
    
    -- Insert author settings
    IF v_first_name IS NOT NULL AND v_first_name != '' THEN
      INSERT INTO author_settings (author_id, locale, setting_name, setting_value)
      VALUES (v_author_id, 'en_US', 'givenName', v_first_name);
    END IF;
    
    IF v_last_name IS NOT NULL AND v_last_name != '' THEN
      INSERT INTO author_settings (author_id, locale, setting_name, setting_value)
      VALUES (v_author_id, 'en_US', 'familyName', v_last_name);
    END IF;
    
    IF v_affiliation IS NOT NULL AND v_affiliation != '' THEN
      INSERT INTO author_settings (author_id, locale, setting_name, setting_value)
      VALUES (v_author_id, 'en_US', 'affiliation', v_affiliation);
    END IF;
    
    -- Set as primary contact
    INSERT INTO author_settings (author_id, locale, setting_name, setting_value)
    VALUES (v_author_id, '', 'primaryContact', '1');
    
    total_fixed := total_fixed + 1;
    RAISE NOTICE 'Author settings created';
  END LOOP;
  
  RAISE NOTICE '===';
  RAISE NOTICE 'SUMMARY:';
  RAISE NOTICE 'Total submissions processed: %', total_submissions;
  RAISE NOTICE 'Total submissions fixed: %', total_fixed;
  RAISE NOTICE '===';
END $$;

-- Verify results
SELECT 
  s.id as submission_id,
  s.current_publication_id,
  a.id as author_id,
  a.email,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'givenName') as first_name,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'familyName') as last_name,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'affiliation') as affiliation,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'primaryContact') as is_primary
FROM submissions s
LEFT JOIN publications p ON s.current_publication_id = p.id
LEFT JOIN authors a ON a.publication_id = p.id
ORDER BY s.created_at DESC;
