-- Check if submission ID 46 has authors in database
SELECT 
    a.author_id,
    a.first_name,
    a.last_name,
    a.email,
    a.affiliation,
    a.is_primary,
    a.seq
FROM authors a
WHERE a.article_id = 46
ORDER BY a.seq;

-- Check submission 46 details
SELECT 
    id,
    title,
    stage_id,
    status,
    submitter_id,
    date_submitted
FROM submissions
WHERE id = 46;
