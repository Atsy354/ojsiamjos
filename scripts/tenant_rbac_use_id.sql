-- Alternative multi-tenant RBAC & RLS setup (uses journals.id instead of journals.journal_id)
-- Run this if your `journals` table primary key column is `id` (and there is no `journal_id`).

create schema if not exists app;

-- 1) Per-journal membership table (kept column name journal_id but FK points to journals.id)
create table if not exists public.user_journal_roles (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  journal_id bigint not null references public.journals(id) on delete cascade,
  role text not null check (role in ('admin','editor','author','reviewer','reader')),
  created_at timestamp with time zone default now(),
  unique(user_id, journal_id, role)
);

-- 2) Helper to check membership
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
-- journals: public readable; admin(s) writable (journal key is `id`)
drop policy if exists journals_select_public on public.journals;
create policy journals_select_public on public.journals
for select using (true);

drop policy if exists journals_write_admin on public.journals;
create policy journals_write_admin on public.journals
for all to authenticated
using (app.is_member(id, auth.uid(), array['admin']))
with check (app.is_member(id, auth.uid(), array['admin']));

-- sections: assumes sections.journal_id exists; adjust if your FK name differs
drop policy if exists sections_select_public on public.sections;
create policy sections_select_public on public.sections
for select using (true);

drop policy if exists sections_write_editor on public.sections;
create policy sections_write_editor on public.sections
for all to authenticated
using (app.is_member(journal_id, auth.uid(), array['editor','admin']))
with check (app.is_member(journal_id, auth.uid(), array['editor','admin']));

-- submissions: assumes submissions.journal_id exists
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

-- review_assignments: assumes review_assignments.journal_id exists
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

-- reviews (if used): assumes reviews.journal_id exists
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

-- editorial_decisions: assumes editorial_decisions.journal_id exists
drop policy if exists editorial_decisions_rw on public.editorial_decisions;
create policy editorial_decisions_rw on public.editorial_decisions
for all to authenticated
using (app.is_member(journal_id, auth.uid(), array['editor','admin']))
with check (app.is_member(journal_id, auth.uid(), array['editor','admin']));

-- issues: assumes issues.journal_id exists
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

-- publications: adjust as needed
drop policy if exists publications_select on public.publications;
create policy publications_select on public.publications
for select using (true);

drop policy if exists publications_write on public.publications;
create policy publications_write on public.publications
for all to authenticated
using (true)
with check (true);

-- submission_files: assumes submission_files.journal_id exists
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

-- notifications: assumes notifications.journal_id exists
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

-- Helpful indexes
create index if not exists idx_user_journal_roles_user on public.user_journal_roles(user_id);
create index if not exists idx_user_journal_roles_journal on public.user_journal_roles(journal_id);