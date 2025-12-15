### Supabase Schema Expectations (MVP)

This document lists the tables/columns that the iammJOSSS Next.js app expects when using Supabase (no Prisma). Use this as a checklist to verify or adjust the database schema. Names use snake_case to match Supabase/Postgres conventions.

#### Conventions
- Multi-tenant scope by `journal_id` for all journal-owned data
- Auth users stored in `users` table (profiles) keyed by Supabase Auth `id` (UUID)
- Roles: minimally `roles` TEXT[] on `users` (global), and per-journal membership table (recommended) `user_journal_roles`
- RLS required for all sensitive tables; example policies provided in `scripts/tenant_rbac.sql`

---

#### 1) users
- id UUID primary key (matches Supabase Auth user id)
- email TEXT unique
- password TEXT (hashed, optional if only using Auth)
- first_name TEXT
- last_name TEXT
- roles TEXT[] (e.g., ['admin','editor','author','reviewer','reader'])
- affiliation TEXT (optional)
- created_at TIMESTAMP (default now)

Used by routes:
- app/api/users/route.ts (GET list, admin only)
- app/api/users/[id]/route.ts (GET/PATCH self or admin)
- app/api/auth/register/route.ts (inserts new user profile)

---

#### 2) journals
- journal_id BIGINT primary key (or id BIGINT) — code reads `journal_id` in context resolver
- path TEXT unique (tenant key, e.g., 'journal-a')
- name TEXT
- acronym TEXT (optional)
- description TEXT (optional)
- primary_locale TEXT default 'en'
- contact_email TEXT (optional)
- issn TEXT (optional)
- publisher TEXT (optional)
- enabled BOOLEAN default true
- seq INT (optional ordering)

Used by routes:
- app/api/journals/route.ts (GET/POST)
- lib/utils/context.ts resolves `journal_id` from `path`

---

#### 3) sections
- id BIGINT primary key
- journal_id BIGINT references journals(journal_id)
- title TEXT
- abbrev TEXT (or abbreviation TEXT) — code expects `title` in select; ensure one canonical name
- seq INT default 0

Used by routes:
- app/api/submissions/route.ts joins `sections(id, title)`

---

#### 4) submissions
- id BIGSERIAL primary key
- journal_id BIGINT references journals(journal_id)
- submitter_id UUID references users(id)
- section_id BIGINT references sections(id)
- title TEXT NOT NULL
- abstract TEXT
- status TEXT default 'submission' (values used in code: 'submission', also transitions via editorial endpoints)
- stage_id INT default 1 (optional, workflow stage)
- language TEXT default 'en'
- date_submitted TIMESTAMP default now()
- date_last_activity TIMESTAMP default now()
- created_at TIMESTAMP default now()
- updated_at TIMESTAMP default now()

Used by routes:
- app/api/submissions/route.ts (GET list scoped by journal_id; POST inserts with journal_id)
- app/api/submissions/[id]/route.ts (GET/PATCH/DELETE scoped by journal_id)
- app/api/workflow/* (assign/decision) — updates `status`

Indexes recommended: (journal_id), (submitter_id), (status)

---

#### 5) submission_files
- id BIGSERIAL primary key
- submission_id BIGINT references submissions(id)
- journal_id BIGINT references journals(journal_id)
- stage TEXT (e.g., 'submission','review','copyediting','production')
- file_path TEXT (Supabase Storage path)
- mime_type TEXT
- size BIGINT
- date_uploaded TIMESTAMP default now()
- created_by UUID references users(id)

Used by routes:
- app/api/upload/route.ts (inserts and manages revisions)

---

#### 6) review_rounds
- id BIGSERIAL primary key
- submission_id BIGINT references submissions(id)
- journal_id BIGINT references journals(journal_id)
- round INT default 1
- status TEXT default 'pending'
- created_at TIMESTAMP default now()

#### 7) review_assignments
- id BIGSERIAL primary key
- submission_id BIGINT references submissions(id)
- journal_id BIGINT references journals(journal_id)
- reviewer_id UUID references users(id)
- status TEXT default 'pending' (values: 'pending','completed','declined')
- date_assigned TIMESTAMP default now()
- date_due TIMESTAMP
- date_completed TIMESTAMP

#### 8) reviews (optional if using review_assignments for content)
- id BIGSERIAL primary key
- submission_id BIGINT references submissions(id)
- journal_id BIGINT references journals(journal_id)
- reviewer_id UUID references users(id)
- recommendation TEXT (values: 'accept','minor','major','reject','decline')
- comments TEXT
- status TEXT default 'pending'
- date_completed TIMESTAMP

Used by routes:
- app/api/workflow/assign, app/api/workflow/decision (depending on implementation)

---

#### 9) editorial_decisions
- id BIGSERIAL primary key
- submission_id BIGINT references submissions(id)
- journal_id BIGINT references journals(journal_id)
- editor_id UUID references users(id)
- decision TEXT NOT NULL (e.g., 'accept','reject','revisions')
- comments TEXT
- date_decided TIMESTAMP default now()

---

#### 10) issues
- id BIGSERIAL primary key
- journal_id BIGINT references journals(journal_id)
- volume INT
- number INT
- year INT
- title TEXT
- description TEXT
- status TEXT default 'unpublished' (values: 'unpublished','published')
- date_published TIMESTAMP

Used by routes:
- app/api/issues/route.ts (GET scoped by journal_id, POST inserts journal_id)

---

#### 11) publications (TOC linking)
- id BIGSERIAL primary key
- issue_id BIGINT references issues(id)
- submission_id BIGINT references submissions(id)
- seq INT default 0

---

#### 12) notifications
- id BIGSERIAL primary key
- user_id UUID references users(id)
- journal_id BIGINT references journals(journal_id)
- type TEXT (e.g., 'assignment','review_submitted','decision')
- message TEXT
- created_at TIMESTAMP default now()

---

#### 13) user_journal_roles (recommended for per-tenant RBAC)
- id BIGSERIAL primary key
- user_id UUID references users(id)
- journal_id BIGINT references journals(journal_id)
- role TEXT (one of: 'admin','editor','author','reviewer','reader')
- UNIQUE (user_id, journal_id, role)

Used by RLS and middleware to determine per-journal permissions.

---

Known mismatch hotspots to verify:
- journals: ensure `journal_id` exists (used by context.ts) and `path` is unique
- users: ensure `roles` TEXT[] exists; if `role_ids` exists it can be ignored for MVP
- sections: confirm `title` and `seq` columns; use `abbrev` or `abbreviation` consistently
- submissions: confirm `status` accepted values and presence of `journal_id`, `submitter_id`, `section_id`
- issues: confirm `status` uses 'published'/'unpublished' and `date_published`
- submission_files: include `date_uploaded` and `stage`

If any column/table is missing, adjust DB using SQL (see `scripts/fix-schema.sql` or add targeted DDL).
