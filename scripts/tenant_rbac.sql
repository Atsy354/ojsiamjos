-- Multi-tenant RBAC & RLS setup for Supabase (OJS-like)
-- Run this in Supabase SQL editor. Adjust table/column names if your schema differs.

-- 0) Schema helper schema
create schema if not exists app;

-- 1) Per-journal membership table
create table if not exists public.user_journal_roles (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  journal_id bigint not null references public.journals(journal_id) on delete cascade,
  role text not null check (role in ('admin','editor','author','reviewer','reader')),
  created_at timestamp with time zone default now(),
  unique(user_id, journal_id, role)
);

-- 2) Helper function to check membership
create or replace function app.is_member(journal bigint, uid uuid, allowed_roles text[])
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_journal_roles ujr
    where ujr.journal_id = journal
      and ujr.user_id = uid
      and ujr.role = any(allowed_roles)
  );
$$;

-- 3) Enable RLS on core tables
alter table if exists public.journals enable row level security;
alter table if exists public.submissions enable row level security;
alter table if exists public.sections enable row level security;
alter table if exists public.review_rounds enable row level security;
alter table if exists public.review_assignments enable row level security;
alter table if exists public.reviews enable row level security;
alter table if exists public.editorial_decisions enable row level security;
alter table if exists public.issues enable row level security;
alter table if exists public.publications enable row level security;
alter table if exists public.submission_files enable row level security;
alter table if exists public.notifications enable row level security;

-- 4) Policies
-- journals: public readable; admin(s) writable
drop policy if exists journals_select_public on public.journals;
create policy journals_select_public on public.journals
for select using (true);

drop policy if exists journals_write_admin on public.journals;
create policy journals_write_admin on public.journals
for all to authenticated
using (app.is_member(journal_id, auth.uid(), array['admin']))
with check (app.is_member(journal_id, auth.uid(), array['admin']));

-- sections: readable by all; editors/admin manage within journal
drop policy if exists sections_select_public on public.sections;
create policy sections_select_public on public.sections
for select using (true);

drop policy if exists sections_write_editor on public.sections;
create policy sections_write_editor on public.sections
for all to authenticated
using (app.is_member(journal_id, auth.uid(), array['editor','admin']))
with check (app.is_member(journal_id, auth.uid(), array['editor','admin']));

-- submissions: author sees own; editor/admin see all in journal; author can insert own in journal
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions
for select to authenticated using (
  submitter_id = auth.uid() or app.is_member(journal_id, auth.uid(), array['editor','admin'])
);

drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions
for insert to authenticated with check (
  submitter_id = auth.uid() and app.is_member(journal_id, auth.uid(), array['author','editor','admin'])
);

drop policy if exists submissions_update on public.submissions;
create policy submissions_update on public.submissions
for update to authenticated using (
  submitter_id = auth.uid() or app.is_member(journal_id, auth.uid(), array['editor','admin'])
)
with check (
  submitter_id = auth.uid() or app.is_member(journal_id, auth.uid(), array['editor','admin'])
);

-- review_assignments: reviewer sees assigned; editor/admin see all within journal
drop policy if exists review_assignments_select on public.review_assignments;
create policy review_assignments_select on public.review_assignments
for select to authenticated using (
  reviewer_id = auth.uid() or app.is_member(journal_id, auth.uid(), array['editor','admin'])
);

drop policy if exists review_assignments_write on public.review_assignments;
create policy review_assignments_write on public.review_assignments
for all to authenticated
using (app.is_member(journal_id, auth.uid(), array['editor','admin']))
with check (app.is_member(journal_id, auth.uid(), array['editor','admin']));

-- reviews (if used separately): reviewer can insert/update own review; editor/admin can read all
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
for select to authenticated using (
  reviewer_id = auth.uid() or app.is_member(journal_id, auth.uid(), array['editor','admin'])
);

drop policy if exists reviews_write on public.reviews;
create policy reviews_write on public.reviews
for all to authenticated
using (reviewer_id = auth.uid() or app.is_member(journal_id, auth.uid(), array['editor','admin']))
with check (reviewer_id = auth.uid() or app.is_member(journal_id, auth.uid(), array['editor','admin']));

-- editorial_decisions: editor/admin only within journal
drop policy if exists editorial_decisions_rw on public.editorial_decisions;
create policy editorial_decisions_rw on public.editorial_decisions
for all to authenticated
using (app.is_member(journal_id, auth.uid(), array['editor','admin']))
with check (app.is_member(journal_id, auth.uid(), array['editor','admin']));

-- issues: public can read published; editor/admin manage within journal
drop policy if exists issues_select on public.issues;
create policy issues_select on public.issues
for select using (
  status = 'published' or app.is_member(journal_id, auth.uid(), array['editor','admin'])
);

drop policy if exists issues_write on public.issues;
create policy issues_write on public.issues
for all to authenticated
using (app.is_member(journal_id, auth.uid(), array['editor','admin']))
with check (app.is_member(journal_id, auth.uid(), array['editor','admin']));

-- publications: public read for published issues; editor/admin manage
drop policy if exists publications_select on public.publications;
create policy publications_select on public.publications
for select using (true);

drop policy if exists publications_write on public.publications;
create policy publications_write on public.publications
for all to authenticated
using (true)
with check (true);

-- submission_files: restrict by journal and role; signed URL recommended for downloads
drop policy if exists submission_files_select on public.submission_files;
create policy submission_files_select on public.submission_files
for select to authenticated using (
  app.is_member(journal_id, auth.uid(), array['editor','admin','author','reviewer'])
);

drop policy if exists submission_files_write on public.submission_files;
create policy submission_files_write on public.submission_files
for all to authenticated
using (app.is_member(journal_id, auth.uid(), array['editor','admin','author']))
with check (app.is_member(journal_id, auth.uid(), array['editor','admin','author']));

-- notifications: user sees own; admins can insert for system events
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
for select to authenticated using (
  user_id = auth.uid() or app.is_member(journal_id, auth.uid(), array['editor','admin'])
);

drop policy if exists notifications_write on public.notifications;
create policy notifications_write on public.notifications
for all to authenticated
using (user_id = auth.uid() or app.is_member(journal_id, auth.uid(), array['editor','admin']))
with check (user_id = auth.uid() or app.is_member(journal_id, auth.uid(), array['editor','admin']));

-- 5) Helpful indexes
create index if not exists idx_user_journal_roles_user on public.user_journal_roles(user_id);
create index if not exists idx_user_journal_roles_journal on public.user_journal_roles(journal_id);
create index if not exists idx_submissions_journal on public.submissions(journal_id);
create index if not exists idx_review_assignments_journal on public.review_assignments(journal_id);
create index if not exists idx_editorial_decisions_journal on public.editorial_decisions(journal_id);
create index if not exists idx_issues_journal on public.issues(journal_id);
create index if not exists idx_submission_files_journal on public.submission_files(journal_id);
