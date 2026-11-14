-- Crewkit employee knowledge hub
-- Run this in the Supabase SQL editor (or via the Supabase CLI) on your shared project.
--
-- After running:
--   1. Dashboard -> Project Settings -> API -> Exposed schemas: add `crewkit`
--   2. Create auth users in Dashboard -> Authentication -> Users
--   3. Add each user's email to crewkit.members (see seed.sql)
--
-- All tables live in the `crewkit` schema so this app can share a single
-- Supabase project with your other projects.

create schema if not exists crewkit;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type crewkit.app_role as enum ('employee', 'hr');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type crewkit.article_status as enum ('draft', 'published');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type crewkit.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type crewkit.ticket_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type crewkit.ticket_category as enum ('general', 'payroll', 'benefits', 'it', 'facilities', 'other');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Approved emails. Auth is shared across every project in this Supabase
-- project, so Crewkit only lets in people listed here.
create table if not exists crewkit.members (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null default '',
  role crewkit.app_role not null default 'employee',
  created_at timestamptz not null default now()
);
create unique index if not exists members_email_key on crewkit.members (lower(email));

-- App profile, keyed by the shared auth.users id. Written by ensure_profile().
create table if not exists crewkit.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role crewkit.app_role not null default 'employee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists crewkit.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default 'BookOpen',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists crewkit.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  content text not null default '',
  category_id uuid references crewkit.categories (id) on delete set null,
  status crewkit.article_status not null default 'draft',
  author_id uuid references auth.users (id) on delete set null,
  view_count integer not null default 0,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists articles_search_idx on crewkit.articles using gin (search_vector);
create index if not exists articles_category_idx on crewkit.articles (category_id);
create index if not exists articles_status_idx on crewkit.articles (status);

create table if not exists crewkit.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

create table if not exists crewkit.article_tags (
  article_id uuid not null references crewkit.articles (id) on delete cascade,
  tag_id uuid not null references crewkit.tags (id) on delete cascade,
  primary key (article_id, tag_id)
);
create index if not exists article_tags_tag_idx on crewkit.article_tags (tag_id);

create table if not exists crewkit.article_feedback (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references crewkit.articles (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  helpful boolean not null,
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (article_id, user_id)
);
create index if not exists article_feedback_article_idx on crewkit.article_feedback (article_id);

create table if not exists crewkit.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number bigint generated always as identity (start with 1001),
  subject text not null,
  description text not null default '',
  category crewkit.ticket_category not null default 'general',
  priority crewkit.ticket_priority not null default 'normal',
  status crewkit.ticket_status not null default 'open',
  requester_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  assignee_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists tickets_requester_idx on crewkit.tickets (requester_id);
create index if not exists tickets_status_idx on crewkit.tickets (status);
create index if not exists tickets_priority_idx on crewkit.tickets (priority);

create table if not exists crewkit.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references crewkit.tickets (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists ticket_messages_ticket_idx on crewkit.ticket_messages (ticket_id);

create table if not exists crewkit.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references crewkit.tickets (id) on delete cascade,
  message_id uuid references crewkit.ticket_messages (id) on delete cascade,
  file_path text not null unique,
  file_name text not null,
  file_size bigint not null default 0,
  mime_type text not null default 'application/octet-stream',
  uploaded_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists ticket_attachments_ticket_idx on crewkit.ticket_attachments (ticket_id);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

create or replace function crewkit.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_touch_updated_at on crewkit.articles;
create trigger articles_touch_updated_at
  before update on crewkit.articles
  for each row execute function crewkit.touch_updated_at();

drop trigger if exists tickets_touch_updated_at on crewkit.tickets;
create trigger tickets_touch_updated_at
  before update on crewkit.tickets
  for each row execute function crewkit.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on crewkit.profiles;
create trigger profiles_touch_updated_at
  before update on crewkit.profiles
  for each row execute function crewkit.touch_updated_at();

-- Bump the parent ticket whenever a reply arrives.
create or replace function crewkit.touch_ticket_from_message()
returns trigger
language plpgsql
security definer
set search_path = crewkit, public
as $$
begin
  update crewkit.tickets set updated_at = now() where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists ticket_messages_touch_ticket on crewkit.ticket_messages;
create trigger ticket_messages_touch_ticket
  after insert on crewkit.ticket_messages
  for each row execute function crewkit.touch_ticket_from_message();

-- Role of the signed-in user. security definer so RLS policies can call it
-- without recursing into the profiles policy.
create or replace function crewkit.current_role()
returns crewkit.app_role
language sql
stable
security definer
set search_path = crewkit, public
as $$
  select coalesce(
    (select role from crewkit.profiles where id = auth.uid()),
    'employee'::crewkit.app_role
  );
$$;

create or replace function crewkit.is_hr()
returns boolean
language sql
stable
security definer
set search_path = crewkit, public
as $$
  select crewkit.current_role() = 'hr';
$$;

-- True only for emails on the Crewkit allowlist. Auth is shared with other
-- projects, so this is what keeps the data scoped to this app.
create or replace function crewkit.is_member()
returns boolean
language sql
stable
security definer
set search_path = crewkit, public
as $$
  select exists (
    select 1 from crewkit.members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Creates/refreshes the caller's profile from the allowlist.
create or replace function crewkit.ensure_profile()
returns crewkit.profiles
language plpgsql
security definer
set search_path = crewkit, public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_member crewkit.members%rowtype;
  v_profile crewkit.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_member from crewkit.members where lower(email) = v_email limit 1;
  if not found then
    raise exception 'not_a_member';
  end if;

  insert into crewkit.profiles (id, email, full_name, role)
  values (auth.uid(), v_email, v_member.full_name, v_member.role)
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now()
  returning * into v_profile;

  return v_profile;
end;
$$;

create or replace function crewkit.increment_article_view(p_article_id uuid)
returns void
language sql
security definer
set search_path = crewkit, public
as $$
  update crewkit.articles
  set view_count = view_count + 1
  where id = p_article_id and status = 'published';
$$;

-- Names for requester/assignee display. Security definer so employees can see
-- HR names, but only members of this app (not every auth user in the project).
create or replace function crewkit.member_directory()
returns table (id uuid, full_name text, email text, role crewkit.app_role)
language sql
stable
security definer
set search_path = crewkit, public
as $$
  select p.id, p.full_name, p.email, p.role
  from crewkit.profiles p
  where crewkit.is_member();
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table crewkit.members enable row level security;
alter table crewkit.profiles enable row level security;
alter table crewkit.categories enable row level security;
alter table crewkit.articles enable row level security;
alter table crewkit.tags enable row level security;
alter table crewkit.article_tags enable row level security;
alter table crewkit.article_feedback enable row level security;
alter table crewkit.tickets enable row level security;
alter table crewkit.ticket_messages enable row level security;
alter table crewkit.ticket_attachments enable row level security;

-- members: you can see your own allowlist row; HR sees all.
drop policy if exists members_select on crewkit.members;
create policy members_select on crewkit.members
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or crewkit.is_hr());

-- profiles: own profile or HR. Writes go through ensure_profile().
drop policy if exists profiles_select on crewkit.profiles;
create policy profiles_select on crewkit.profiles
  for select to authenticated
  using (id = auth.uid() or crewkit.is_hr());

-- categories: everyone reads, HR writes.
drop policy if exists categories_select on crewkit.categories;
create policy categories_select on crewkit.categories
  for select to authenticated using (crewkit.is_member());

drop policy if exists categories_insert on crewkit.categories;
create policy categories_insert on crewkit.categories
  for insert to authenticated with check (crewkit.is_hr());

drop policy if exists categories_update on crewkit.categories;
create policy categories_update on crewkit.categories
  for update to authenticated using (crewkit.is_hr()) with check (crewkit.is_hr());

drop policy if exists categories_delete on crewkit.categories;
create policy categories_delete on crewkit.categories
  for delete to authenticated using (crewkit.is_hr());

-- articles: published visible to everyone, drafts only HR, HR writes.
drop policy if exists articles_select on crewkit.articles;
create policy articles_select on crewkit.articles
  for select to authenticated
  using (crewkit.is_member() and (status = 'published' or crewkit.is_hr()));

drop policy if exists articles_insert on crewkit.articles;
create policy articles_insert on crewkit.articles
  for insert to authenticated with check (crewkit.is_hr());

drop policy if exists articles_update on crewkit.articles;
create policy articles_update on crewkit.articles
  for update to authenticated using (crewkit.is_hr()) with check (crewkit.is_hr());

drop policy if exists articles_delete on crewkit.articles;
create policy articles_delete on crewkit.articles
  for delete to authenticated using (crewkit.is_hr());

-- tags
drop policy if exists tags_select on crewkit.tags;
create policy tags_select on crewkit.tags
  for select to authenticated using (crewkit.is_member());

drop policy if exists tags_write on crewkit.tags;
create policy tags_write on crewkit.tags
  for all to authenticated using (crewkit.is_hr()) with check (crewkit.is_hr());

drop policy if exists article_tags_select on crewkit.article_tags;
create policy article_tags_select on crewkit.article_tags
  for select to authenticated using (crewkit.is_member());

drop policy if exists article_tags_write on crewkit.article_tags;
create policy article_tags_write on crewkit.article_tags
  for all to authenticated using (crewkit.is_hr()) with check (crewkit.is_hr());

-- article feedback: your own row, HR reads all.
drop policy if exists article_feedback_select on crewkit.article_feedback;
create policy article_feedback_select on crewkit.article_feedback
  for select to authenticated
  using (crewkit.is_member() and (user_id = auth.uid() or crewkit.is_hr()));

drop policy if exists article_feedback_insert on crewkit.article_feedback;
create policy article_feedback_insert on crewkit.article_feedback
  for insert to authenticated with check (crewkit.is_member() and user_id = auth.uid());

drop policy if exists article_feedback_update on crewkit.article_feedback;
create policy article_feedback_update on crewkit.article_feedback
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists article_feedback_delete on crewkit.article_feedback;
create policy article_feedback_delete on crewkit.article_feedback
  for delete to authenticated using (user_id = auth.uid() or crewkit.is_hr());

-- tickets: employees see their own, HR sees everything. Only HR changes status.
drop policy if exists tickets_select on crewkit.tickets;
create policy tickets_select on crewkit.tickets
  for select to authenticated
  using (crewkit.is_member() and (requester_id = auth.uid() or crewkit.is_hr()));

drop policy if exists tickets_insert on crewkit.tickets;
create policy tickets_insert on crewkit.tickets
  for insert to authenticated with check (crewkit.is_member() and requester_id = auth.uid());

drop policy if exists tickets_update on crewkit.tickets;
create policy tickets_update on crewkit.tickets
  for update to authenticated using (crewkit.is_hr()) with check (crewkit.is_hr());

drop policy if exists tickets_delete on crewkit.tickets;
create policy tickets_delete on crewkit.tickets
  for delete to authenticated using (crewkit.is_hr());

-- ticket messages
drop policy if exists ticket_messages_select on crewkit.ticket_messages;
create policy ticket_messages_select on crewkit.ticket_messages
  for select to authenticated
  using (
    crewkit.is_member()
    and exists (
      select 1 from crewkit.tickets t
      where t.id = ticket_id
        and (t.requester_id = auth.uid() or crewkit.is_hr())
    )
  );

drop policy if exists ticket_messages_insert on crewkit.ticket_messages;
create policy ticket_messages_insert on crewkit.ticket_messages
  for insert to authenticated
  with check (
    crewkit.is_member()
    and author_id = auth.uid()
    and exists (
      select 1 from crewkit.tickets t
      where t.id = ticket_id
        and (t.requester_id = auth.uid() or crewkit.is_hr())
    )
  );

drop policy if exists ticket_messages_delete on crewkit.ticket_messages;
create policy ticket_messages_delete on crewkit.ticket_messages
  for delete to authenticated using (crewkit.is_hr());

-- ticket attachments
drop policy if exists ticket_attachments_select on crewkit.ticket_attachments;
create policy ticket_attachments_select on crewkit.ticket_attachments
  for select to authenticated
  using (
    crewkit.is_member()
    and exists (
      select 1 from crewkit.tickets t
      where t.id = ticket_id
        and (t.requester_id = auth.uid() or crewkit.is_hr())
    )
  );

drop policy if exists ticket_attachments_insert on crewkit.ticket_attachments;
create policy ticket_attachments_insert on crewkit.ticket_attachments
  for insert to authenticated
  with check (
    crewkit.is_member()
    and uploaded_by = auth.uid()
    and exists (
      select 1 from crewkit.tickets t
      where t.id = ticket_id
        and (t.requester_id = auth.uid() or crewkit.is_hr())
    )
  );

drop policy if exists ticket_attachments_delete on crewkit.ticket_attachments;
create policy ticket_attachments_delete on crewkit.ticket_attachments
  for delete to authenticated using (crewkit.is_hr());

-- ---------------------------------------------------------------------------
-- Storage: private bucket for ticket attachments
-- Path format: <ticket_id>/<random>-<file-name>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('crewkit-ticket-attachments', 'crewkit-ticket-attachments', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "crewkit attachments read" on storage.objects;
create policy "crewkit attachments read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'crewkit-ticket-attachments'
    and crewkit.is_member()
    and exists (
      select 1 from crewkit.tickets t
      where t.id::text = (storage.foldername(name))[1]
        and (t.requester_id = auth.uid() or crewkit.is_hr())
    )
  );

drop policy if exists "crewkit attachments upload" on storage.objects;
create policy "crewkit attachments upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'crewkit-ticket-attachments'
    and crewkit.is_member()
    and exists (
      select 1 from crewkit.tickets t
      where t.id::text = (storage.foldername(name))[1]
        and (t.requester_id = auth.uid() or crewkit.is_hr())
    )
  );

drop policy if exists "crewkit attachments delete" on storage.objects;
create policy "crewkit attachments delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'crewkit-ticket-attachments' and crewkit.is_hr());

-- ---------------------------------------------------------------------------
-- Grants (RLS is still the real guard)
-- ---------------------------------------------------------------------------
grant usage on schema crewkit to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema crewkit to authenticated;
grant all on all tables in schema crewkit to service_role;
grant usage, select on all sequences in schema crewkit to authenticated, service_role;
grant execute on all functions in schema crewkit to authenticated, service_role;

alter default privileges in schema crewkit
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema crewkit
  grant usage, select on sequences to authenticated;
alter default privileges in schema crewkit
  grant execute on functions to authenticated;
