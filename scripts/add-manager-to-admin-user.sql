-- Add Manager Role to Existing Site Admin User
-- Script ini untuk menambahkan role Manager ke user yang sudah jadi Site Admin
-- User akan punya 2 roles: admin (Site Admin) + manager (Journal Manager)

-- ============================================
-- PENTING: Site Admin sudah punya akses penuh
-- Tapi jika ingin juga jadi Manager di journal tertentu:
-- ============================================

-- 1. Cek user yang sudah jadi Site Admin
SELECT 
  u.id as user_uuid,
  u.email,
  u.first_name,
  u.last_name,
  ujr.role,
  j.name as journal_name
FROM users u
LEFT JOIN user_journal_roles ujr ON u.id = ujr.user_id
LEFT JOIN journals j ON j.journal_id = ujr.journal_id
WHERE u.email = 'anjarbdn@gmail.com'
ORDER BY ujr.journal_id;

-- ============================================
-- 2. Tambahkan Manager Role untuk User Ini
-- ============================================
-- Pilih salah satu:

-- Opsi A: Tambahkan Manager role di journal tertentu (misalnya journal_id = 1)
INSERT INTO user_journal_roles (user_id, journal_id, role)
SELECT 
  u.id,
  1 as journal_id,  -- Ganti dengan journal_id yang diinginkan
  'manager' as role
FROM users u
WHERE u.email = 'anjarbdn@gmail.com'
ON CONFLICT (user_id, journal_id, role) DO NOTHING;

-- Opsi B: Tambahkan Manager di semua journal yang ada
INSERT INTO user_journal_roles (user_id, journal_id, role)
SELECT 
  u.id,
  j.journal_id,
  'manager' as role
FROM users u
CROSS JOIN journals j
WHERE u.email = 'anjarbdn@gmail.com'
ON CONFLICT (user_id, journal_id, role) DO NOTHING;

-- ============================================
-- 3. Verifikasi: Cek semua roles user ini
-- ============================================
SELECT 
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
WHERE u.email = 'anjarbdn@gmail.com'
ORDER BY ujr.journal_id, ujr.role;

-- ============================================
-- CATATAN:
-- ============================================
-- 1. Site Admin (admin) sudah punya akses penuh ke semua journal
-- 2. Menambahkan Manager role tidak akan mengurangi atau meningkatkan akses
--    karena Site Admin sudah paling tinggi
-- 3. Manager role berguna jika ingin tracking/audit bahwa user ini juga 
--    berperan sebagai Manager di journal tertentu
-- 4. Jika hanya ingin test fitur Manager, tidak perlu menambahkan role Manager
--    karena Site Admin sudah bisa akses semua fitur Manager

