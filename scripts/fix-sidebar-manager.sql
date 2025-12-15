-- ============================================================================
-- QUICK FIX: Sidebar Manager Tidak Muncul
-- ============================================================================
-- Jalankan query ini di Supabase SQL Editor
-- ============================================================================

-- STEP 1: CEK USER MANAGER
SELECT 
    id,
    email, 
    roles, 
    role_ids,
    CASE 
        WHEN role_ids IS NULL THEN '❌ NULL - PERLU FIX'
        WHEN role_ids = '{}' THEN '❌ EMPTY - PERLU FIX'
        WHEN 16 = ANY(role_ids) THEN '✅ OK - Punya Manager role'
        ELSE '⚠️ TIDAK ADA MANAGER ROLE'
    END as status
FROM users 
WHERE email = 'manager@ojs.local';

-- ============================================================================
-- STEP 2: FIX JIKA role_ids NULL ATAU EMPTY
-- ============================================================================

-- Fix manager user
UPDATE users 
SET role_ids = ARRAY[16]
WHERE email = 'manager@ojs.local' 
  AND (role_ids IS NULL OR role_ids = '{}');

-- ============================================================================
-- STEP 3: FIX SEMUA DEMO USERS (PREVENTIVE)
-- ============================================================================

-- Update all users yang belum punya role_ids
UPDATE users SET role_ids = ARRAY[1] 
WHERE 'admin' = ANY(roles) AND (role_ids IS NULL OR role_ids = '{}');

UPDATE users SET role_ids = ARRAY[16] 
WHERE 'manager' = ANY(roles) AND (role_ids IS NULL OR role_ids = '{}');

UPDATE users SET role_ids = ARRAY[17] 
WHERE 'editor' = ANY(roles) AND (role_ids IS NULL OR role_ids = '{}');

UPDATE users SET role_ids = ARRAY[4096] 
WHERE 'reviewer' = ANY(roles) AND (role_ids IS NULL OR role_ids = '{}');

UPDATE users SET role_ids = ARRAY[65536] 
WHERE 'author' = ANY(roles) AND (role_ids IS NULL OR role_ids = '{}');

UPDATE users SET role_ids = ARRAY[1048576] 
WHERE 'reader' = ANY(roles) AND (role_ids IS NULL OR role_ids = '{}');

-- ============================================================================
-- STEP 4: VERIFY SEMUA USERS
-- ============================================================================

SELECT 
    email,
    roles,
    role_ids,
    CASE 
        WHEN role_ids IS NULL OR role_ids = '{}' THEN '❌ PERLU FIX'
        ELSE '✅ OK'
    END as status
FROM users
WHERE email LIKE '%@ojs.local' OR email LIKE '%@iamjos.org'
ORDER BY role_ids;

-- ============================================================================
-- EXPECTED RESULT:
-- ============================================================================
-- email                | roles        | role_ids  | status
-- ---------------------|--------------|-----------|--------
-- admin@ojs.local      | ["admin"]    | [1]       | ✅ OK
-- manager@ojs.local    | ["manager"]  | [16]      | ✅ OK
-- editor@ojs.local     | ["editor"]   | [17]      | ✅ OK
-- reviewer@ojs.local   | ["reviewer"] | [4096]    | ✅ OK
-- author@ojs.local     | ["author"]   | [65536]   | ✅ OK
-- reader@iamjos.org    | ["reader"]   | [1048576] | ✅ OK
-- ============================================================================
