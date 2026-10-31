-- OwnerOS foundation schema
-- Apply in the Supabase SQL editor or with the CLI:
--   supabase db push
-- Extensions, tables, RLS, storage, and helper functions.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "vector";

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  industry text not null default 'hvac',
  settings jsonb not null default jsonb_build_object(
    'taxonomy', jsonb_build_array(
      'procedure', 'equipment', 'pricing', 'customer', 'supplier', 'policy', 'lesson'
    ),
    'limits', jsonb_build_object('members', 30, 'capturesPerMonth', 200),
    'industryLabel', 'HVAC and specialty trades'
  ),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'employee')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists organization_members_user_idx
  on public.organization_members (user_id)
  where status = 'active';

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'manager', 'employee')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users (id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Domain records
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  manufacturer text,
  model text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger equipment_updated_at
before update on public.equipment
for each row execute function public.set_updated_at();

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  slug text not null,
  unique (organization_id, slug)
);

-- ---------------------------------------------------------------------------
-- Captures and jobs
-- ---------------------------------------------------------------------------

create table if not exists public.source_captures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid not null references auth.users (id),
  source_type text not null check (
    source_type in ('voice', 'audio_upload', 'note', 'pdf', 'txt', 'docx')
  ),
  original_filename text,
  storage_path text,
  transcript text,
  original_content text not null default '',
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  processing_error text,
  duration_seconds numeric,
  related_customer_id uuid references public.customers (id) on delete set null,
  related_equipment_id uuid references public.equipment (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger source_captures_updated_at
before update on public.source_captures
for each row execute function public.set_updated_at();

create index if not exists source_captures_org_created_idx
  on public.source_captures (organization_id, created_at desc);

create table if not exists public.capture_attachments (
  id uuid primary key default gen_random_uuid(),
  capture_id uuid not null references public.source_captures (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  filename text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes >= 0),
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  capture_id uuid references public.source_captures (id) on delete cascade,
  knowledge_entry_id uuid,
  job_type text not null check (job_type in ('transcribe', 'extract', 'embed')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  attempt_count integer not null default 0,
  idempotency_key text not null unique,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists processing_jobs_due_idx
  on public.processing_jobs (status, scheduled_at)
  where status in ('pending', 'failed');

-- ---------------------------------------------------------------------------
-- Knowledge
-- ---------------------------------------------------------------------------

create table if not exists public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  category text not null check (
    category in ('procedure', 'equipment', 'pricing', 'customer', 'supplier', 'policy', 'lesson')
  ),
  title text not null,
  summary text not null,
  content text not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'approved', 'archived')),
  sensitivity text not null default 'general'
    check (sensitivity in ('general', 'customer_specific')),
  customer_id uuid references public.customers (id) on delete set null,
  equipment_id uuid references public.equipment (id) on delete set null,
  created_by uuid not null references auth.users (id),
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  current_version integer not null default 1,
  review_signals text[] not null default '{}',
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger knowledge_entries_updated_at
before update on public.knowledge_entries
for each row execute function public.set_updated_at();

create index if not exists knowledge_entries_org_status_idx
  on public.knowledge_entries (organization_id, status, updated_at desc);

create index if not exists knowledge_entries_search_idx
  on public.knowledge_entries using gin (search_vector);

create table if not exists public.knowledge_versions (
  id uuid primary key default gen_random_uuid(),
  knowledge_entry_id uuid not null references public.knowledge_entries (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  version_number integer not null,
  title text not null,
  summary text not null,
  content text not null,
  changed_by uuid not null references auth.users (id),
  change_reason text not null default '',
  created_at timestamptz not null default now(),
  unique (knowledge_entry_id, version_number)
);

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  knowledge_entry_id uuid not null references public.knowledge_entries (id) on delete cascade,
  capture_id uuid not null references public.source_captures (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  excerpt text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_relationships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  from_entry_id uuid not null references public.knowledge_entries (id) on delete cascade,
  to_entry_id uuid not null references public.knowledge_entries (id) on delete cascade,
  relationship_type text not null check (
    relationship_type in (
      'same_equipment',
      'same_procedure',
      'similar_problem',
      'related_customer',
      'semantic'
    )
  ),
  note text,
  created_at timestamptz not null default now(),
  check (from_entry_id <> to_entry_id),
  unique (from_entry_id, to_entry_id, relationship_type)
);

create table if not exists public.knowledge_tags (
  knowledge_entry_id uuid not null references public.knowledge_entries (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  primary key (knowledge_entry_id, tag_id)
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  knowledge_entry_id uuid not null references public.knowledge_entries (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (knowledge_entry_id, chunk_index)
);

create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks
  using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Conversations and audit
-- ---------------------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New question',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  undocumented boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references auth.users (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_org_idx
  on public.audit_events (organization_id, created_at desc);

create table if not exists public.data_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  requested_by uuid not null references auth.users (id),
  request_type text not null check (request_type in ('export', 'delete')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  user_id uuid,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_lookup_idx
  on public.rate_limit_events (user_id, action, created_at desc);

-- ---------------------------------------------------------------------------
-- Membership helpers (security definer, locked search_path, auth.uid() only)
-- ---------------------------------------------------------------------------

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.org_role(org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.organization_members
  where organization_id = org_id
    and user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

create or replace function public.is_org_manager(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.org_role(org_id) in ('owner', 'manager');
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.invitations enable row level security;
alter table public.customers enable row level security;
alter table public.equipment enable row level security;
alter table public.tags enable row level security;
alter table public.source_captures enable row level security;
alter table public.capture_attachments enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.knowledge_entries enable row level security;
alter table public.knowledge_versions enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.knowledge_relationships enable row level security;
alter table public.knowledge_tags enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.audit_events enable row level security;
alter table public.data_requests enable row level security;
alter table public.rate_limit_events enable row level security;

create policy profiles_self_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid());

create policy organizations_member_select on public.organizations
  for select using (public.is_org_member(id) and deleted_at is null);
create policy organizations_owner_update on public.organizations
  for update using (public.org_role(id) = 'owner');
create policy organizations_authenticated_insert on public.organizations
  for insert with check (auth.uid() is not null and created_by = auth.uid());

create policy members_select on public.organization_members
  for select using (public.is_org_member(organization_id));
create policy members_owner_write on public.organization_members
  for all using (public.org_role(organization_id) = 'owner')
  with check (public.org_role(organization_id) = 'owner');

create policy invitations_manager_select on public.invitations
  for select using (public.is_org_manager(organization_id));
create policy invitations_owner_write on public.invitations
  for all using (public.org_role(organization_id) = 'owner')
  with check (public.org_role(organization_id) = 'owner');

create policy customers_manager_select on public.customers
  for select using (
    public.is_org_manager(organization_id) and deleted_at is null
  );
create policy customers_manager_write on public.customers
  for all using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create policy equipment_member_select on public.equipment
  for select using (public.is_org_member(organization_id) and deleted_at is null);
create policy equipment_manager_write on public.equipment
  for all using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create policy tags_member_select on public.tags
  for select using (public.is_org_member(organization_id));
create policy tags_member_write on public.tags
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy captures_member_select on public.source_captures
  for select using (public.is_org_member(organization_id) and deleted_at is null);
create policy captures_member_insert on public.source_captures
  for insert with check (
    public.is_org_member(organization_id) and created_by = auth.uid()
  );
create policy captures_owner_or_creator_update on public.source_captures
  for update using (
    created_by = auth.uid() or public.is_org_manager(organization_id)
  );

create policy attachments_member_select on public.capture_attachments
  for select using (public.is_org_member(organization_id));
create policy attachments_member_insert on public.capture_attachments
  for insert with check (public.is_org_member(organization_id));

create policy jobs_manager_select on public.processing_jobs
  for select using (public.is_org_manager(organization_id));

create policy knowledge_select on public.knowledge_entries
  for select using (
    public.is_org_member(organization_id)
    and deleted_at is null
    and (
      (
        sensitivity = 'general'
        and (
          status in ('approved', 'archived')
          or public.is_org_manager(organization_id)
          or created_by = auth.uid()
        )
      )
      or (
        sensitivity = 'customer_specific'
        and public.is_org_manager(organization_id)
      )
    )
  );

create policy knowledge_insert on public.knowledge_entries
  for insert with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
    and status in ('draft', 'pending_review')
  );

create policy knowledge_update on public.knowledge_entries
  for update using (
    public.is_org_manager(organization_id)
    or (created_by = auth.uid() and status = 'draft')
  );

create policy knowledge_versions_select on public.knowledge_versions
  for select using (
    exists (
      select 1 from public.knowledge_entries e
      where e.id = knowledge_entry_id
    )
  );
create policy knowledge_versions_manager_insert on public.knowledge_versions
  for insert with check (public.is_org_manager(organization_id));

create policy knowledge_sources_select on public.knowledge_sources
  for select using (public.is_org_member(organization_id));
create policy knowledge_sources_insert on public.knowledge_sources
  for insert with check (public.is_org_member(organization_id));

create policy knowledge_rel_select on public.knowledge_relationships
  for select using (public.is_org_member(organization_id));
create policy knowledge_rel_write on public.knowledge_relationships
  for all using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create policy knowledge_tags_select on public.knowledge_tags
  for select using (public.is_org_member(organization_id));
create policy knowledge_tags_write on public.knowledge_tags
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy knowledge_chunks_select on public.knowledge_chunks
  for select using (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.knowledge_entries e
      where e.id = knowledge_entry_id
        and e.status = 'approved'
    )
  );

create policy conversations_own_select on public.conversations
  for select using (
    public.is_org_member(organization_id) and user_id = auth.uid()
  );
create policy conversations_own_write on public.conversations
  for all using (
    public.is_org_member(organization_id) and user_id = auth.uid()
  )
  with check (
    public.is_org_member(organization_id) and user_id = auth.uid()
  );

create policy conversation_messages_own_select on public.conversation_messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
create policy conversation_messages_own_insert on public.conversation_messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy audit_manager_select on public.audit_events
  for select using (public.is_org_manager(organization_id));

create policy data_requests_owner on public.data_requests
  for all using (public.org_role(organization_id) = 'owner')
  with check (public.org_role(organization_id) = 'owner');

-- Rate-limit rows are written by the service role; members do not read them.
create policy rate_limit_no_direct_access on public.rate_limit_events
  for select using (false);

-- ---------------------------------------------------------------------------
-- Private storage for original captures
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('source-captures', 'source-captures', false)
on conflict (id) do nothing;

create policy source_captures_storage_select
on storage.objects for select
using (
  bucket_id = 'source-captures'
  and public.is_org_member((storage.foldername(name))[1]::uuid)
);

create policy source_captures_storage_insert
on storage.objects for insert
with check (
  bucket_id = 'source-captures'
  and public.is_org_member((storage.foldername(name))[1]::uuid)
);

create policy source_captures_storage_update
on storage.objects for update
using (
  bucket_id = 'source-captures'
  and public.is_org_manager((storage.foldername(name))[1]::uuid)
);

-- Objects are stored as {organization_id}/{capture_id}/{filename}
-- and accessed with short-lived signed URLs from the server.

create or replace function public.create_organization(
  p_name text,
  p_industry text default 'hvac'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if length(trim(p_name)) < 2 then
    raise exception 'Company name is required';
  end if;

  v_slug := trim(both '-' from lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g')))
    || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.organizations (name, slug, industry, created_by)
  values (trim(p_name), v_slug, coalesce(nullif(trim(p_industry), ''), 'hvac'), auth.uid())
  returning id into v_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_id, auth.uid(), 'owner', 'active');

  insert into public.audit_events (organization_id, actor_id, action, entity_type, entity_id)
  values (v_id, auth.uid(), 'organization.created', 'organization', v_id);

  return v_id;
end;
$$;

create or replace function public.approve_knowledge_entry(
  p_entry_id uuid,
  p_title text,
  p_summary text,
  p_content text,
  p_category text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_version integer;
begin
  select organization_id, current_version
  into v_org, v_version
  from public.knowledge_entries
  where id = p_entry_id
    and deleted_at is null;

  if v_org is null then
    raise exception 'Knowledge entry not found';
  end if;

  if not public.is_org_manager(v_org) then
    raise exception 'Only owners and managers can approve knowledge';
  end if;

  insert into public.knowledge_versions (
    knowledge_entry_id, organization_id, version_number, title, summary, content, changed_by, change_reason
  )
  values (
    p_entry_id, v_org, v_version + 1, p_title, p_summary, p_content, auth.uid(), 'Approved'
  );

  update public.knowledge_entries
  set
    title = p_title,
    summary = p_summary,
    content = p_content,
    category = p_category,
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = now(),
    current_version = v_version + 1
  where id = p_entry_id;

  insert into public.audit_events (organization_id, actor_id, action, entity_type, entity_id)
  values (v_org, auth.uid(), 'knowledge.approved', 'knowledge_entry', p_entry_id);
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.approve_knowledge_entry(uuid, text, text, text, text) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.org_role(uuid) to authenticated;
grant execute on function public.is_org_manager(uuid) to authenticated;
