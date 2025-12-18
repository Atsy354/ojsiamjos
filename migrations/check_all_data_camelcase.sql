-- Cek semua submissions (camelCase version)
SELECT 
  s.id,
  s."currentPublicationId",
  s."submitterId",
  s."createdAt"
FROM submissions s
ORDER BY s."createdAt" DESC
LIMIT 10;

-- Cek semua publications
SELECT * FROM publications ORDER BY "createdAt" DESC LIMIT 5;

-- Cek semua authors dengan settings
SELECT 
  a.id,
  a.email,
  a."publicationId",
  p."submissionId"
FROM authors a
LEFT JOIN publications p ON a."publicationId" = p.id
ORDER BY a."createdAt" DESC
LIMIT 10;

-- Cek author_settings
SELECT * FROM author_settings ORDER BY author_id DESC LIMIT 20;
