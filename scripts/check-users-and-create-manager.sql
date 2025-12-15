-- Check Users and Create Manager Role
-- Script ini membantu Anda:
-- 1. Melihat semua user yang ada di database
-- 2. Membuat user menjadi Manager

-- ============================================
-- 1. CEK SEMUA USERS YANG ADA
-- ============================================
-- Jalankan query ini untuk melihat semua user beserta UUID-nya
SELECT 
  id as user_uuid,
  email,
  first_name,
  last_name,
  roles,
  created_at
FROM users
ORDER BY created_at DESC;

-- ============================================
-- 2. CEK USER DENGAN EMAIL TERTENTU
-- ============================================
-- Ganti 'email@example.com' dengan email user yang ingin dicek
SELECT 
  id as user_uuid,
  email,
  first_name,
  last_name,
  roles
FROM users
WHERE email = 'email@example.com';

-- ============================================
-- 3. CEK ROLE YANG DIMILIKI USER DI JURNAL
-- ============================================
-- Ganti '<user-uuid>' dengan UUID user yang ingin dicek
-- Ganti journal_id sesuai journal yang ingin dicek (misalnya: 1)
SELECT 
  ujr.id,
  ujr.user_id,
  u.email,
  u.first_name,
  u.last_name,
  ujr.journal_id,
  j.name as journal_name,
  ujr.role,
  ujr.created_at
FROM user_journal_roles ujr
JOIN users u ON u.id = ujr.user_id
LEFT JOIN journals j ON j.journal_id = ujr.journal_id
WHERE ujr.user_id = '<user-uuid>'
ORDER BY ujr.journal_id;

-- ============================================
-- 4. BUAT USER MENJADI MANAGER
-- ============================================
-- GANTI '<user-uuid>' dengan UUID user yang ingin dijadikan Manager
-- GANTI journal_id dengan ID journal (misalnya: 1 untuk journal default)

-- Pilihan 1: Tambahkan role Manager (jika user sudah punya role lain di journal yang sama)
INSERT INTO user_journal_roles (user_id, journal_id, role)
VALUES ('<user-uuid>', 1, 'manager')
ON CONFLICT (user_id, journal_id, role) DO NOTHING;

-- Pilihan 2: Update role Editor menjadi Manager (jika user sudah punya role editor)
UPDATE user_journal_roles
SET role = 'manager'
WHERE user_id = '<user-uuid>'
  AND journal_id = 1
  AND role = 'editor';

-- ============================================
-- 5. CONTOH: Membuat user dengan email tertentu menjadi Manager
-- ============================================
-- Ganti 'editor@jcst.org' dengan email yang ingin dijadikan Manager
-- Ganti 1 dengan journal_id yang sesuai
INSERT INTO user_journal_roles (user_id, journal_id, role)
SELECT 
  u.id,
  1 as journal_id,
  'manager' as role
FROM users u
WHERE u.email = 'editor@jcst.org'
ON CONFLICT (user_id, journal_id, role) DO NOTHING;

-- ============================================
-- 6. VERIFIKASI: Cek apakah user sudah jadi Manager
-- ============================================
-- Ganti '<user-uuid>' dengan UUID user
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  ujr.role,
  j.name as journal_name
FROM user_journal_roles ujr
JOIN users u ON u.id = ujr.user_id
LEFT JOIN journals j ON j.journal_id = ujr.journal_id
WHERE ujr.user_id = '<user-uuid>'
  AND ujr.role = 'manager';

-- ============================================
-- 7. CEK SEMUA MANAGER YANG ADA
-- ============================================
SELECT 
  u.id as user_uuid,
  u.email,
  u.first_name,
  u.last_name,
  j.name as journal_name,
  ujr.created_at as manager_since
FROM user_journal_roles ujr
JOIN users u ON u.id = ujr.user_id
LEFT JOIN journals j ON j.journal_id = ujr.journal_id
WHERE ujr.role = 'manager'
ORDER BY ujr.created_at DESC;

