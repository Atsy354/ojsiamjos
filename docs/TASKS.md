### Status Pekerjaan (OJS PKP 3.3 – Next.js + Supabase)

#### Selesai (✓)
- RBAC & Multi-tenant (Supabase):
  - Skrip RLS dan membership per-jurnal (`scripts/tenant_rbac.sql`, `scripts/tenant_rbac_use_id.sql`).
  - Penambahan kolom `journal_id` di tabel anak + FK ke `journals(id)` (`scripts/add_journal_id_columns.sql`).
  - Perbaikan PK journals (`scripts/fix_journals_pk.sql`, `scripts/fix_journals_pk_simple.sql`).
  - Dokumen ekspektasi skema (`docs/SCHEMA_EXPECTATIONS.md`).
- Auth & Seeding:
  - Endpoint seeding akun Auth: `app/api/admin/seed-auth/route.ts` (buat akun Auth untuk email yang ada).
  - Endpoint set mass password: `app/api/admin/set-password/route.ts`.
  - Login API menggabungkan role dari `user_journal_roles` (`app/api/auth/login/route.ts`).
  - Endpoint sync profil/roles: `app/api/auth/me/route.ts`.
  - Hook `useAuth` disesuaikan agar sinkron ke `/api/auth/me` saat ada `auth_token`.
- Keamanan & Scoping API:
  - `app/api/submissions/route.ts` dan `app/api/submissions/[id]/route.ts`: enforce `journal_id`, auth.
  - `app/api/issues/route.ts`: editor-only + scoping `journal_id`.
  - `app/api/users/route.ts`, `app/api/users/[id]/route.ts`: guard admin dan self‑access.
  - Editorial decision: set `journal_id`, normalisasi status (`accepted/declined/revision_required`).
  - `lib/utils/context.ts`: fallback `journals.id` atau `journal_id`.
- UI/UX – Awal OJS-like:
  - Sidebar dengan grup: Author (My Submissions, New Submission), Reviewer, Editorial (stage), Issues.
  - My Submissions (Author): tombol “New Submission” journal‑aware; list/table ala OJS; filter status disesuaikan.
  - Submission list: tombol “New Submission” & empty state disesuaikan dan journal‑aware.
  - Login page: hilangkan akun demo, tampilkan “registered accounts quick reference”.

#### Sedang dikerjakan (▶)
- ✅ Author: New Submission wizard sudah menggunakan API langsung (bukan localStorage), progress indicator OJS-like sudah ada.
- Editor/Manager: Halaman Submissions bertab OJS (Unassigned/In Review/Copyediting/Production/Archives) – filter & count; workspace (Participants/Review/Editorial History/Files/Production).
- Reviewer: Review Assignments (Accept/Decline), Submit Review (recommendation + comments/files) – layout OJS sudah ada, perlu diperbaiki.
- Public per‑jurnal: `/j/{path}` (Home/Current Issue sudah ada, perlu Archives, Issue TOC, Article, About/Editorial Team).

#### Berikutnya (⏭)
- Journal Settings (minimal): UI Sections (CRUD) agar Author bisa memilih Section pada wizard.
- Notifikasi/Email minimal (opsional): trigger di assignment/review/decision.
- Polish & i18n: status chips, spacing, breadcrumbs, accessibility, label menyesuaikan OJS.

#### Catatan Testing / QA
- Uji E2E multi‑tenant: dua jurnal, 4 peran, alur Author→Editor→Reviewer→Editor→Issue publish.
- Verifikasi RLS: author jurnal A tidak bisa melihat data jurnal B; reviewer hanya assignment miliknya; editor penuh scoping per jurnal.
