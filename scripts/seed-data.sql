-- Comprehensive Seed Data for iammJOSSS
-- Insert sample data for testing

-- 1. Update existing journal with full data
UPDATE journals 
SET 
  name = 'Journal of Computer Science and Technology',
  acronym = 'JCST',
  issn = '1000-9000',
  description = 'A leading journal in computer science research',
  publisher = 'Science Press',
  contact_email = 'editor@jcst.org',
  online_issn = '1860-4749',
  print_issn = '1000-9000'
WHERE journal_id = 1;

-- 2. Insert additional journals
INSERT INTO journals (journal_id, path, enabled, seq, primary_locale, name, acronym, issn, description, publisher, contact_email, online_issn, print_issn, created_at) VALUES
(2, 'ijms', 1, 2, 'en_US', 'International Journal of Medical Sciences', 'IJMS', '1449-1907', 'Open access journal for medical research', 'Ivyspring International', 'editor@ijms.org', '1449-1907', '1449-1907', NOW()),
(3, 'jee', 1, 3, 'en_US', 'Journal of Environmental Engineering', 'JEE', '0733-9372', 'Environmental engineering research and practice', 'ASCE', 'editor@jee.org', '1943-7870', '0733-9372', NOW()),
(4, 'jbf', 1, 4, 'en_US', 'Journal of Business and Finance', 'JBF', '0148-6195', 'Research in business and financial markets', 'Elsevier', 'editor@jbf.org', '1879-1832', '0148-6195', NOW()),
(5, 'jedu', 1, 5, 'en_US', 'Journal of Education and Learning', 'JEDU', '1927-5250', 'Educational research and pedagogy', 'CCSE', 'editor@jedu.org', '1927-5269', '1927-5250', NOW())
ON CONFLICT (journal_id) DO UPDATE SET
  name = EXCLUDED.name,
  acronym = EXCLUDED.acronym,
  issn = EXCLUDED.issn,
  description = EXCLUDED.description,
  publisher = EXCLUDED.publisher,
  contact_email = EXCLUDED.contact_email,
  online_issn = EXCLUDED.online_issn,
  print_issn = EXCLUDED.print_issn;

-- Update id column for new journals
UPDATE journals SET id = journal_id WHERE id IS NULL;

-- 3. Insert sections for each journal (MUST BE BEFORE SUBMISSIONS)
INSERT INTO sections (id, journal_id, title, abbrev, seq) VALUES
-- JCST sections
(1, 1, 'Articles', 'ART', 1),
(2, 1, 'Research Papers', 'RES', 2),
-- IJMS sections  
(3, 2, 'Clinical Research', 'CLIN', 1),
(4, 2, 'Basic Science', 'BASIC', 2),
-- JEE sections
(5, 3, 'Environmental Engineering', 'ENV', 1),
(6, 3, 'Sustainability', 'SUST', 2),
-- JBF sections
(7, 4, 'Finance', 'FIN', 1),
(8, 4, 'Business Management', 'BUS', 2),
-- JEDU sections
(9, 5, 'Pedagogy', 'PED', 1),
(10, 5, 'Educational Technology', 'TECH', 2)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  abbrev = EXCLUDED.abbrev;

-- 4. Insert sample submissions (NOW WITH CORRECT SECTION IDS)
INSERT INTO submissions (id, journal_id, submitter_id, title, abstract, status, section_id, language, date_submitted, created_at) VALUES
(1, 1, '95eda308-6574-46f7-80c9-7584050b62ff', 'Machine Learning Approaches for Data Analysis', 'This paper explores various machine learning techniques for analyzing large datasets...', 'under_review', 1, 'en', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(2, 1, '539839bb-3f4c-4ed7-b448-ea5cba6d23a7', 'Blockchain Technology in Supply Chain Management', 'An investigation into the application of blockchain technology in modern supply chains...', 'pending', 2, 'en', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(3, 1, '539839bb-3f4c-4ed7-b448-ea5cba6d23a7', 'Cloud Computing Security Challenges', 'A comprehensive review of security challenges in cloud computing environments...', 'accepted', 1, 'en', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
(4, 2, '95eda308-6574-46f7-80c9-7584050b62ff', 'COVID-19 Vaccine Efficacy Study', 'Analysis of vaccine efficacy across different populations...', 'under_review', 3, 'en', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
(5, 2, '539839bb-3f4c-4ed7-b448-ea5cba6d23a7', 'Cancer Treatment Innovations', 'Recent advances in targeted cancer therapies...', 'pending', 4, 'en', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(6, 3, '95eda308-6574-46f7-80c9-7584050b62ff', 'Sustainable Water Management Systems', 'Innovative approaches to water resource management...', 'accepted', 5, 'en', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
(7, 3, '539839bb-3f4c-4ed7-b448-ea5cba6d23a7', 'Air Quality Monitoring Technologies', 'Advanced sensors for urban air quality assessment...', 'under_review', 6, 'en', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(8, 4, '95eda308-6574-46f7-80c9-7584050b62ff', 'Financial Market Volatility Analysis', 'Statistical models for predicting market volatility...', 'pending', 7, 'en', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
(9, 4, '539839bb-3f4c-4ed7-b448-ea5cba6d23a7', 'Corporate Governance Best Practices', 'A study of governance structures in multinational corporations...', 'under_review', 8, 'en', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
(10, 5, '95eda308-6574-46f7-80c9-7584050b62ff', 'Online Learning Effectiveness', 'Comparative study of online vs traditional learning outcomes...', 'accepted', 9, 'en', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
(11, 5, '539839bb-3f4c-4ed7-b448-ea5cba6d23a7', 'STEM Education Methodologies', 'Innovative teaching approaches for STEM subjects...', 'under_review', 10, 'en', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
(12, 1, '95eda308-6574-46f7-80c9-7584050b62ff', 'Artificial Intelligence Ethics', 'Ethical considerations in AI development and deployment...', 'pending', 1, 'en', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(13, 2, '539839bb-3f4c-4ed7-b448-ea5cba6d23a7', 'Telemedicine Implementation', 'Challenges and opportunities in telemedicine adoption...', 'under_review', 3, 'en', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
(14, 3, '95eda308-6574-46f7-80c9-7584050b62ff', 'Renewable Energy Integration', 'Grid integration strategies for renewable energy sources...', 'accepted', 5, 'en', NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days'),
(15, 4, '539839bb-3f4c-4ed7-b448-ea5cba6d23a7', 'Cryptocurrency Market Analysis', 'Trends and patterns in cryptocurrency trading...', 'pending', 7, 'en', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert review assignments (only columns that exist in table)
INSERT INTO review_assignments (id, submission_id, reviewer_id, round, date_assigned, date_due) VALUES
(1, 1, 'c1e95c17-16c7-485e-960c-d28854ebd616', 1, NOW() - INTERVAL '8 days', NOW() + INTERVAL '7 days'),
(2, 1, '6c01aeef-3651-44ec-b66a-23b67620eb51', 1, NOW() - INTERVAL '8 days', NOW() + INTERVAL '7 days'),
(3, 4, '6c01aeef-3651-44ec-b66a-23b67620eb51', 1, NOW() - INTERVAL '5 days', NOW() + INTERVAL '10 days'),
(4, 7, 'd976c2dd-7aa2-4df8-97ac-ab022114a16b', 1, NOW() - INTERVAL '10 days', NOW() + INTERVAL '5 days'),
(5, 9, '44906fb2-6b40-4e14-ab0e-1713470273a3', 1, NOW() - INTERVAL '12 days', NOW() + INTERVAL '3 days'),
(6, 11, '69470002-f83a-4ac3-801e-4c36706f8fac', 1, NOW() - INTERVAL '6 days', NOW() + INTERVAL '9 days'),
(7, 13, '6c01aeef-3651-44ec-b66a-23b67620eb51', 1, NOW() - INTERVAL '7 days', NOW() + INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert reviews
INSERT INTO reviews (id, submission_id, reviewer_id, status, recommendation, comments, date_assigned, created_at) VALUES
(1, 1, 'c1e95c17-16c7-485e-960c-d28854ebd616', 'completed', 'minor_revisions', 'Good paper, needs minor improvements in methodology section.', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
(2, 4, '6c01aeef-3651-44ec-b66a-23b67620eb51', 'completed', 'accept', 'Excellent research with significant contributions.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(3, 7, 'd976c2dd-7aa2-4df8-97ac-ab022114a16b', 'pending', NULL, NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(4, 9, '44906fb2-6b40-4e14-ab0e-1713470273a3', 'completed', 'major_revisions', 'Interesting topic but requires substantial revisions.', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(5, 11, '69470002-f83a-4ac3-801e-4c36706f8fac', 'pending', NULL, NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
(6, 13, '6c01aeef-3651-44ec-b66a-23b67620eb51', 'completed', 'accept', 'Well-written and timely research.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert editorial decisions
INSERT INTO editorial_decisions (id, submission_id, editor_id, decision, comments, date_decided, created_at) VALUES
(1, 3, '872f33f6-9fdf-4e30-8d9c-7cddc445c260', 'accept', 'Accepted for publication after minor revisions.', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
(2, 6, '2b7e7549-6d59-4e0f-bb2f-a7b7f07a0d42', 'accept', 'Excellent contribution to the field.', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
(3, 10, 'c0ec26c6-aa23-453d-99c9-b344b83b62fa', 'accept', 'Approved for publication.', NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days'),
(4, 14, '2b7e7549-6d59-4e0f-bb2f-a7b7f07a0d42', 'accept', 'Accepted with enthusiasm.', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert notifications
INSERT INTO notifications (id, user_id, type, title, message, read, created_at) VALUES
(1, '539839bb-3f4c-4ed7-b448-ea5cba6d23a7', 'submission', 'Submission Received', 'Your submission "Machine Learning Approaches" has been received.', false, NOW() - INTERVAL '10 days'),
(2, 'c1e95c17-16c7-485e-960c-d28854ebd616', 'review_assignment', 'New Review Assignment', 'You have been assigned to review a submission.', true, NOW() - INTERVAL '8 days'),
(3, '539839bb-3f4c-4ed7-b448-ea5cba6d23a7', 'decision', 'Editorial Decision', 'Your submission has been accepted.', false, NOW() - INTERVAL '25 days'),
(4, '6c01aeef-3651-44ec-b66a-23b67620eb51', 'review_assignment', 'New Review Assignment', 'You have been assigned to review a medical research paper.', false, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 8. Insert discussions
INSERT INTO discussions (id, submission_id, user_id, topic, message, created_at) VALUES
(1, 1, '872f33f6-9fdf-4e30-8d9c-7cddc445c260', 'Methodology Clarification', 'Could you please clarify the data collection methodology?', NOW() - INTERVAL '6 days'),
(2, 1, '539839bb-3f4c-4ed7-b448-ea5cba6d23a7', 'Re: Methodology Clarification', 'Thank you for the question. We used stratified random sampling...', NOW() - INTERVAL '5 days'),
(3, 4, '03a05e09-6100-4f2e-89d7-6f14537440fb', 'Sample Size', 'The sample size seems small. Can you justify this?', NOW() - INTERVAL '4 days'),
(4, 9, '98b2d3ef-49ba-4e08-b4b2-56a3bf213f0c', 'Data Analysis', 'Please provide more details on the statistical analysis.', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- 9. Update sequence counters
SELECT setval('submissions_id_seq', (SELECT MAX(id) FROM submissions));
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));
SELECT setval('review_assignments_id_seq', (SELECT MAX(id) FROM review_assignments));
SELECT setval('editorial_decisions_id_seq', (SELECT MAX(id) FROM editorial_decisions));
SELECT setval('discussions_id_seq', (SELECT MAX(id) FROM discussions));

-- Summary
DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE '   - Journals: 5';
  RAISE NOTICE '   - Submissions: 15';
  RAISE NOTICE '   - Reviews: 6';
  RAISE NOTICE '   - Review Assignments: 7';
  RAISE NOTICE '   - Editorial Decisions: 4';
  RAISE NOTICE '   - Notifications: 4';
  RAISE NOTICE '   - Discussions: 4';
END $$;
