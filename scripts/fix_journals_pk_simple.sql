-- Simple (no nested DO) – make journals.id a proper PK and unique

-- 1) Ensure id column exists
alter table if exists public.journals add column if not exists id bigserial;

-- 2) Ensure sequence exists and owned by journals.id
create sequence if not exists public.journals_id_seq;
alter sequence public.journals_id_seq owned by public.journals.id;
alter table public.journals alter column id set default nextval('public.journals_id_seq');

-- 3) Backfill null ids
update public.journals set id = nextval('public.journals_id_seq') where id is null;

-- 4) Unique index on id
create unique index if not exists journals_id_key on public.journals(id);

-- 5) Promote to primary key if missing (single DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'journals_pkey' and conrelid = 'public.journals'::regclass
  ) then
    alter table public.journals add constraint journals_pkey primary key (id);
  end if;
end $$;

-- 6) Unique index on path (recommended for tenant routing)
create unique index if not exists journals_path_key on public.journals(path);
