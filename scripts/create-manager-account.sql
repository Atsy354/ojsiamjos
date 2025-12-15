-- Create Manager Account
-- Script ini untuk membuat akun Manager baru
-- GANTI email dan password sesuai kebutuhan Anda

-- ============================================
-- PENTING: 
-- 1. Ganti email dengan email yang diinginkan
-- 2. Ganti password dengan password yang diinginkan
-- 3. Password akan di-hash oleh Supabase Auth
-- ============================================

-- ============================================
-- OPSI 1: Membuat User Baru + Manager Role
-- ============================================
-- Jika user belum ada di auth.users, buat dulu di Supabase Auth Dashboard
-- Lalu jalankan query di bawah untuk menambahkan role Manager

-- Step 1: Buat user di Supabase Auth (Dashboard > Authentication > Users > Add User)
-- - Email: manager@iamjos.org (atau email yang Anda inginkan)
-- - Password: (password yang Anda inginkan)
-- - Auto Confirm: Yes

-- Step 2: Setelah user dibuat, dapatkan UUID dari auth.users:
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'manager@iamjos.org';  -- Ganti dengan email yang Anda buat

-- Step 3: Tambahkan user ke tabel users (jika belum ada)
-- GANTI '<user-uuid>' dengan UUID dari step 2
INSERT INTO public.users (id, email, first_name, last_name, roles)
VALUES (
  '<user-uuid>'::uuid,
  'manager@iamjos.org',  -- Ganti dengan email
  'Journal',             -- Ganti dengan first_name
  'Manager',             -- Ganti dengan last_name
  ARRAY['manager']::text[]
)
ON CONFLICT (id) DO UPDATE 
SET 
  roles = ARRAY['manager']::text[],
  updated_at = NOW();

-- Step 4: Tambahkan Manager role di journal
INSERT INTO public.user_journal_roles (user_id, journal_id, role)
SELECT 
  u.id,
  1 as journal_id,  -- Ganti 1 dengan journal_id yang diinginkan
  'manager' as role
FROM public.users u
WHERE u.email = 'manager@iamjos.org'  -- Ganti dengan email
ON CONFLICT (user_id, journal_id, role) DO NOTHING;

-- ============================================
-- OPSI 2: Menggunakan Email yang Sudah Ada
-- ============================================
-- Jika user sudah ada di auth.users, langsung tambahkan role Manager

-- Step 1: Cek apakah user sudah ada
SELECT id, email FROM auth.users WHERE email = 'manager@iamjos.org';

-- Step 2: Tambahkan ke tabel users (update roles jika sudah ada)
INSERT INTO public.users (id, username, email, first_name, last_name, roles)
SELECT 
  au.id,
  COALESCE(u.username, au.email) as username,  -- username dari existing atau email
  au.email,
  COALESCE(u.first_name, 'Journal') as first_name,
  COALESCE(u.last_name, 'Manager') as last_name,
  ARRAY['manager']::text[]
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE au.email = 'manager@iamjos.org'  -- Ganti dengan email
ON CONFLICT (id) DO UPDATE 
SET 
  username = COALESCE(EXCLUDED.username, public.users.username),
  email = EXCLUDED.email,
  roles = ARRAY['manager']::text[],
  updated_at = NOW();

-- Step 3: Tambahkan Manager role di journal
INSERT INTO public.user_journal_roles (user_id, journal_id, role)
SELECT 
  u.id,
  1 as journal_id,  -- Ganti 1 dengan journal_id yang diinginkan
  'manager' as role
FROM public.users u
WHERE u.email = 'manager@iamjos.org'  -- Ganti dengan email
ON CONFLICT (user_id, journal_id, role) DO NOTHING;

-- ============================================
-- OPSI 3: QUICK SETUP - Langsung dari Email
-- ============================================
-- Paling mudah: Pastikan user sudah ada di auth.users
-- Lalu jalankan query ini (ganti email dan journal_id):

DO $$
DECLARE
  v_user_id uuid;
  v_journal_id bigint := 1;  -- Ganti dengan journal_id yang diinginkan
  v_email text := 'manager@iamjos.org';  -- Ganti dengan email
BEGIN
  -- Dapatkan user_id dari auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User dengan email % tidak ditemukan di auth.users. Buat dulu di Supabase Auth Dashboard!', v_email;
  END IF;
  
  -- Tambahkan ke tabel users
  INSERT INTO public.users (id, username, email, first_name, last_name, roles)
  VALUES (
    v_user_id,
    v_email,  -- username biasanya sama dengan email
    v_email,
    'Journal',
    'Manager',
    ARRAY['manager']::text[]
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    username = COALESCE(EXCLUDED.username, public.users.username),
    email = v_email,
    roles = ARRAY['manager']::text[],
    updated_at = NOW();
  
  -- Tambahkan Manager role di journal
  INSERT INTO public.user_journal_roles (user_id, journal_id, role)
  VALUES (v_user_id, v_journal_id, 'manager')
  ON CONFLICT (user_id, journal_id, role) DO NOTHING;
  
  RAISE NOTICE 'Manager account berhasil dibuat!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Journal ID: %', v_journal_id;
END $$;

-- ============================================
-- OPSI 4: SETUP DENGAN UUID YANG SUDAH DIKETAHUI
-- ============================================
-- Jika Anda sudah tahu UUID user (dari Supabase Auth)
-- Contoh: manager@ojs.test dengan UUID 8ec27814-eea3-4960-958c-aa740939bc39

DO $$
DECLARE
  v_user_id uuid := '8ec27814-eea3-4960-958c-aa740939bc39';  -- Ganti dengan UUID Anda
  v_email text := 'manager@ojs.test';  -- Ganti dengan email Anda
  v_journal_id bigint := 1;  -- Ganti dengan journal_id yang sesuai
BEGIN
  -- Verifikasi user ada di auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User dengan UUID % tidak ditemukan di auth.users', v_user_id;
  END IF;
  
  -- Tambahkan ke tabel users
  INSERT INTO public.users (id, email, first_name, last_name, roles)
  VALUES (
    v_user_id,
    v_email,
    'Journal',
    'Manager',
    ARRAY['manager']::text[]
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = v_email,
    roles = ARRAY['manager']::text[],
    updated_at = NOW();
  
  -- Tambahkan Manager role di journal
  INSERT INTO public.user_journal_roles (user_id, journal_id, role)
  VALUES (v_user_id, v_journal_id, 'manager')
  ON CONFLICT (user_id, journal_id, role) DO NOTHING;
  
  RAISE NOTICE '✅ Manager account berhasil dibuat!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Journal ID: %', v_journal_id;
END $$;

-- ============================================
-- VERIFIKASI
-- ============================================
-- Cek apakah Manager account sudah berhasil dibuat
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.roles,
  ujr.journal_id,
  j.name as journal_name,
  ujr.role,
  ujr.created_at
FROM public.users u
LEFT JOIN public.user_journal_roles ujr ON u.id = ujr.user_id
LEFT JOIN public.journals j ON j.journal_id = ujr.journal_id
WHERE u.email = 'manager@iamjos.org'  -- Ganti dengan email
ORDER BY ujr.journal_id;

-- ============================================
-- CEK SEMUA JOURNALS YANG ADA
-- ============================================
-- Untuk mengetahui journal_id yang tersedia:
SELECT journal_id, name, path, description 
FROM public.journals
ORDER BY journal_id;

