-- Add journal_id columns to core tables if missing and create FKs to journals(id)
-- Run this BEFORE tenant_rbac_use_id.sql when your journals table uses `id` as PK.

-- Submissions
alter table if exists public.submissions add column if not exists journal_id bigint;
do $$ begin
  alter table public.submissions add constraint submissions_journal_fk foreign key (journal_id) references public.journals(id) on delete cascade;
exception when duplicate_object then null; end $$;
create index if not exists idx_submissions_journal on public.submissions(journal_id);

-- Issues
alter table if exists public.issues add column if not exists journal_id bigint;
do $$ begin
  alter table public.issues add constraint issues_journal_fk foreign key (journal_id) references public.journals(id) on delete cascade;
exception when duplicate_object then null; end $$;
create index if not exists idx_issues_journal on public.issues(journal_id);

-- Editorial decisions
alter table if exists public.editorial_decisions add column if not exists journal_id bigint;
do $$ begin
  alter table public.editorial_decisions add constraint editorial_decisions_journal_fk foreign key (journal_id) references public.journals(id) on delete cascade;
exception when duplicate_object then null; end $$;
create index if not exists idx_editorial_decisions_journal on public.editorial_decisions(journal_id);

-- Review rounds
alter table if exists public.review_rounds add column if not exists journal_id bigint;
do $$ begin
  alter table public.review_rounds add constraint review_rounds_journal_fk foreign key (journal_id) references public.journals(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- Review assignments
alter table if exists public.review_assignments add column if not exists journal_id bigint;
do $$ begin
  alter table public.review_assignments add constraint review_assignments_journal_fk foreign key (journal_id) references public.journals(id) on delete cascade;
exception when duplicate_object then null; end $$;
create index if not exists idx_review_assignments_journal on public.review_assignments(journal_id);

-- Reviews (if used)
alter table if exists public.reviews add column if not exists journal_id bigint;
do $$ begin
  alter table public.reviews add constraint reviews_journal_fk foreign key (journal_id) references public.journals(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- Submission files
alter table if exists public.submission_files add column if not exists journal_id bigint;
do $$ begin
  alter table public.submission_files add constraint submission_files_journal_fk foreign key (journal_id) references public.journals(id) on delete cascade;
exception when duplicate_object then null; end $$;
create index if not exists idx_submission_files_journal on public.submission_files(journal_id);

-- Notifications
alter table if exists public.notifications add column if not exists journal_id bigint;
do $$ begin
  alter table public.notifications add constraint notifications_journal_fk foreign key (journal_id) references public.journals(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- Publications (TOC linking)
alter table if exists public.publications add column if not exists journal_id bigint;
do $$ begin
  alter table public.publications add constraint publications_journal_fk foreign key (journal_id) references public.journals(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- Sections (if missing)
alter table if exists public.sections add column if not exists journal_id bigint;
do $$ begin
  alter table public.sections add constraint sections_journal_fk foreign key (journal_id) references public.journals(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- Optional: backfill strategy (manual)
-- For testing, you can set all existing rows to a specific journal id (replace 1 with your journal id):
-- update public.submissions set journal_id = 1 where journal_id is null;
-- update public.issues set journal_id = 1 where journal_id is null;
-- ...repeat for other tables as needed.
