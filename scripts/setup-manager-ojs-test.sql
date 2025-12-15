-- Setup Manager Account untuk manager@ojs.test
-- User sudah dibuat di Supabase Auth dengan UUID: 8ec27814-eea3-4960-958c-aa740939bc39
-- Script ini akan menambahkan user ke tabel users dan memberikan role Manager

DO $$
DECLARE
  v_user_id uuid := '8ec27814-eea3-4960-958c-aa740939bc39';
  v_email text := 'manager@ojs.test';
  v_journal_id bigint := 1;  -- Ganti dengan journal_id yang sesuai jika berbeda
BEGIN
  -- Verifikasi user ada di auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User dengan UUID % tidak ditemukan di auth.users', v_user_id;
  END IF;
  
  -- Tambahkan ke tabel users
  INSERT INTO public.users (id, username, email, first_name, last_name, roles)
  VALUES (
    v_user_id,
    v_email,  -- username biasanya sama dengan email atau bisa diubah
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
  
  RAISE NOTICE '✅ Manager account berhasil dibuat!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Journal ID: %', v_journal_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Sekarang Anda bisa login dengan:';
  RAISE NOTICE '  Email: manager@ojs.test';
  RAISE NOTICE '  Password: (password yang Anda buat di Supabase Auth)';
END $$;

-- Verifikasi hasil
SELECT 
  u.id as user_uuid,
  u.email,
  u.first_name,
  u.last_name,
  u.roles,
  ujr.journal_id,
  j.name as journal_name,
  j.path as journal_path,
  ujr.role,
  ujr.created_at as role_assigned_at
FROM public.users u
LEFT JOIN public.user_journal_roles ujr ON u.id = ujr.user_id
LEFT JOIN public.journals j ON j.journal_id = ujr.journal_id
WHERE u.email = 'manager@ojs.test'
ORDER BY ujr.journal_id;

