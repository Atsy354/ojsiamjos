### Changelog (UI/UX OJS 3.3 – Next.js + Supabase)

#### Added
- docs/TASKS.md — Task list + status (Selesai/▶/⏭/QA)
- docs/SCHEMA_EXPECTATIONS.md — Skema yang diharapkan (Supabase-only)
- scripts/fix_journals_pk.sql, scripts/fix_journals_pk_simple.sql — Perbaikan PK pada journals
- scripts/add_journal_id_columns.sql — Menambah kolom `journal_id` dan FK ke `journals(id)`
- scripts/tenant_rbac.sql, scripts/tenant_rbac_use_id.sql — RLS policies untuk dua variasi skema
- app/api/admin/seed-auth/route.ts — Seeding akun Supabase Auth (once)
- app/api/admin/set-password/route.ts — Set mass password (sementara)
- app/api/auth/me/route.ts — Sinkronisasi profil/roles dari session Supabase

#### Changed
- app/api/auth/login/route.ts — Gabungkan roles dari `user_journal_roles`
- app/api/submissions/route.ts — Scoping `journal_id` + auth + filter sesuai role
- app/api/submissions/[id]/route.ts — Scoping `journal_id` + auth
- app/api/issues/route.ts — Editor-only; scoping `journal_id`
- app/api/users/route.ts — Admin-only, pagination & projection aman
- app/api/users/[id]/route.ts — Guard self/admin
- app/api/workflow/decision/route.ts — Set `journal_id`, status map diselaraskan (`accepted/declined/revision_required`)
- lib/utils/context.ts — Fallback `journals.id`/`journal_id` untuk resolve konteks jurnal
- lib/hooks/use-auth.ts — Sinkronisasi `/api/auth/me`; fix `currentUser` ReferenceError
- components/layout/sidebar.tsx — Sidebar OJS-like (Author/Reviewer/Editorial/Issues) + journal-aware links
- app/login/page.tsx — Hapus demo login; tampilkan daftar akun terdaftar (klik autofill email)
- app/my-submissions/page.tsx — Header toolbar + tombol New Submission journal-aware
- components/submissions/submission-list.tsx — Default list/table OJS-like; filter status diselaraskan
- app/submissions/page.tsx — Tabs OJS + dukung `?stage=` untuk default tab
- app/j/[journalPath]/submissions/new/page.tsx — Perbaikan select Section + progress steps

#### Known Behavior Changes
- Login sekarang strict (email+password via `/api/auth/login`); tidak ada demo fallback.
- Menu di sidebar disaring berdasarkan roles hasil gabungan dari DB + membership; perlu sync session agar tampilan akurat.

#### Latest Updates (Recent)
- `app/j/[journalPath]/submissions/new/page.tsx` - Migration dari localStorage ke API langsung:
  - Fetch journal dan sections via `/api/journals` dan `/api/sections`
  - Create submission via `/api/submissions` menggunakan `useSubmissionsAPI` hook
  - Upload file via `/api/upload` endpoint
  - Menggunakan `useAuth` untuk authentication state
- `app/api/sections/route.ts` - Menambahkan filter `journalId` query parameter untuk filtering sections per journal.