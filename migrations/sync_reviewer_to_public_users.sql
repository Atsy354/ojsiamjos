-- ========================================
-- SYNC USERS FROM AUTH.USERS TO PUBLIC.USERS
-- ========================================
-- Date: 2025-12-20
-- Purpose: Sync reviewer user from auth.users to public.users
-- Issue: Reviewer exists in auth.users but not in public.users
-- ========================================

-- Insert reviewer into public.users if not exists
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    roles,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', 'Unknown') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', 'User') as last_name,
    CASE 
        WHEN au.raw_user_meta_data->'roles' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(au.raw_user_meta_data->'roles'))::text[]
        ELSE ARRAY['reviewer']::text[]
    END as roles,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE au.email = 'reviewer@jcst.org'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
  );

-- Verify the user was created
SELECT 
    id,
    email,
    first_name,
    last_name,
    roles
FROM public.users
WHERE email = 'reviewer@jcst.org';

-- Success message
SELECT '✅ Reviewer user synced to public.users!' as message;
