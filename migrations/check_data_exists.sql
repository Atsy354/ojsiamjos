-- Check if there are any submissions at all
SELECT COUNT(*) as total_submissions FROM submissions;

-- Check if there are any users
SELECT COUNT(*) as total_users FROM users;

-- Check if there are any publications
SELECT COUNT(*) as total_publications FROM publications;

-- Check submissions without JOIN to see the data
SELECT id, submitter_id FROM submissions LIMIT 5;

-- Check users to see the data
SELECT id, email FROM users LIMIT 5;
