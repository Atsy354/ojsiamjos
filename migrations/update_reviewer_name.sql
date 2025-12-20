-- Update reviewer user with proper name
UPDATE public.users
SET 
    first_name = 'JCST',
    last_name = 'Reviewer',
    updated_at = NOW()
WHERE id = 'c1e95c17-16c7-485e-960c-d28854ebd616';

-- Verify update
SELECT 
    id,
    email,
    first_name,
    last_name,
    roles
FROM public.users
WHERE id = 'c1e95c17-16c7-485e-960c-d28854ebd616';
