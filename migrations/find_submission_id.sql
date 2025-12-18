-- Check if there's a submission_id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
  AND column_name LIKE '%submission%'
ORDER BY ordinal_position;

-- Check all submissions to see if there's a numeric ID
SELECT * FROM submissions ORDER BY created_at DESC LIMIT 3;
