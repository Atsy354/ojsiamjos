-- Ensure journals.id is a valid primary key (or at least unique) so FKs can reference it
-- Run this FIRST if you see error: "there is no unique constraint matching given keys for referenced table 'journals'"

do $$
declare
  has_pk boolean;
begin
  -- Check if journals already has a primary key
  select exists (
    select 1
    from pg_index i
    join pg_class c on c.oid = i.indrelid
    join pg_attribute a on a.attrelid = c.oid and a.attnum = any(i.indkey)
    where c.relname = 'journals'
      and i.indisprimary
  ) into has_pk;

  if not has_pk then
    -- Ensure the id column exists
    perform 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'journals' and column_name = 'id';
    if not found then
      alter table public.journals add column id bigserial;
    end if;

    -- If id has nulls, fill them with a sequence
    -- Create a sequence if not exists
    do $$ begin
      perform 1 from pg_class where relname = 'journals_id_seq';
      if not found then
        create sequence journals_id_seq;
      end if;
    end $$;

    -- Set id values where null
    update public.journals set id = nextval('journals_id_seq') where id is null;

    -- Add a unique index on id if not exists
    do $$ begin
      perform 1 from pg_class where relname = 'journals_id_key';
      if not found then
        create unique index journals_id_key on public.journals(id);
      end if;
    end $$;

    -- Promote to primary key if none exists
    alter table public.journals add primary key (id);
  end if;
end $$;

-- Optional: ensure path is unique for tenant routing
do $$ begin
  perform 1 from pg_class where relname = 'journals_path_key';
  if not found then
    create unique index journals_path_key on public.journals(path);
  end if;
end $$;
