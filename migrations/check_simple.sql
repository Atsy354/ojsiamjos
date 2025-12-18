-- Query 1: Check submissions exist and what columns do they have
-- Run this first
SELECT * FROM submissions LIMIT 1;

-- Query 2: Check publications (run separately)
-- SELECT * FROM publications LIMIT 1;

-- Query 3: Check the relationship (run separately)
-- SELECT 
--   s.id,
--   (SELECT COUNT(*) FROM publications WHERE submission_id = s.id) as pub_count
-- FROM submissions s
-- LIMIT 5;
