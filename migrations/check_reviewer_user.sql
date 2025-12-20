-- Check if reviewer exists in public.users
SELECT 
    id,
    email,
    first_name,
    last_name,
    username,
    roles
FROM public.users
WHERE email = 'reviewer@jcst.org'
   OR id = 'c1e95c17-16c7-485e-960c-d28854ebd616';

-- Also check auth.users
SELECT 
    id,
    email,
    raw_user_meta_data
FROM auth.users
WHERE email = 'reviewer@jcst.org'
   OR id = 'c1e95c17-16c7-485e-960c-d28854ebd616';
