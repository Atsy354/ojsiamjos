-- Verify if reviewer now exists in public.users
SELECT 
    id,
    email,
    first_name,
    last_name,
    roles,
    created_at
FROM public.users
WHERE id = 'c1e95c17-16c7-485e-960c-d28854ebd616'
   OR email = 'reviewer@jcst.org';

-- Also check total count
SELECT COUNT(*) as total_users FROM public.users;
