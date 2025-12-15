-- Fix "Unnamed File" issue by updating original_file_name from file_path
-- Run this in Supabase SQL Editor

-- 1. Check current files with NULL or empty original_file_name
SELECT 
  file_id,
  submission_id,
  original_file_name,
  file_path,
  file_type,
  file_stage,
  date_uploaded
FROM submission_files
WHERE original_file_name IS NULL 
   OR original_file_name = ''
ORDER BY date_uploaded DESC
LIMIT 20;

-- 2. Update files to extract filename from file_path
-- This will set original_file_name based on the last part of file_path
UPDATE submission_files
SET original_file_name = COALESCE(
  -- Try to extract filename from file_path
  CASE 
    WHEN file_path LIKE '%/%' THEN 
      substring(file_path from '[^/]+$')
    ELSE 
      'document.pdf'
  END,
  'document.pdf'
)
WHERE original_file_name IS NULL 
   OR original_file_name = '';

-- 3. Verify the update worked
SELECT 
  file_id,
  submission_id,
  original_file_name,
  file_type,
  file_stage
FROM submission_files
ORDER BY date_uploaded DESC
LIMIT 20;

-- 4. Check files for specific submission (replace 69 with your submission ID)
SELECT 
  file_id,
  submission_id,
  original_file_name,
  file_path,
  file_type,
  file_stage,
  date_uploaded
FROM submission_files
WHERE submission_id = 69
ORDER BY date_uploaded DESC;
