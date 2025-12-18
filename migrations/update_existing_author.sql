-- Update author yang sudah ada tapi belum punya nama
-- Untuk author dengan email editor@example.com

DO $$
DECLARE
  v_author_id UUID := '7a9a885f-d89b-4517-a7e6-7073d7cb6e94';
BEGIN
  -- Hapus settings lama jika ada
  DELETE FROM author_settings WHERE author_id = v_author_id;
  
  -- Insert author settings baru
  INSERT INTO author_settings (author_id, locale, setting_name, setting_value) VALUES
  (v_author_id, 'en_US', 'givenName', 'Editor'),
  (v_author_id, 'en_US', 'familyName', 'User'),
  (v_author_id, 'en_US', 'affiliation', 'Example University'),
  (v_author_id, '', 'primaryContact', '1');
  
  RAISE NOTICE 'Updated author settings for %', v_author_id;
END $$;

-- Verify
SELECT 
  a.id as author_id,
  a.email,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'givenName') as first_name,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'familyName') as last_name,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'affiliation') as affiliation,
  (SELECT setting_value FROM author_settings WHERE author_id = a.id AND setting_name = 'primaryContact') as is_primary
FROM authors a
WHERE a.id = '7a9a885f-d89b-4517-a7e6-7073d7cb6e94';
