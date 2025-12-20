-- Debug: Check if review assignment was created successfully
-- Run this to see if the assignment exists in the database

SELECT 
    ra.id,
    ra.submission_id,
    ra.reviewer_id,
    ra.date_assigned,
    ra.date_due,
    ra.declined,
    ra.cancelled,
    ra.date_confirmed,
    u.first_name,
    u.last_name,
    u.email,
    s.title as submission_title
FROM review_assignments ra
LEFT JOIN users u ON u.id = ra.reviewer_id
LEFT JOIN submissions s ON s.id = ra.submission_id
ORDER BY ra.date_assigned DESC
LIMIT 10;
