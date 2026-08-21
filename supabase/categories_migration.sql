-- =========================================================
-- CATEGORIES / LOCATIONS + CHALLENGE DELETE CASCADE
-- =========================================================

-- Allow deleting a challenge that already has contributions.
-- Contributions are removed automatically when their challenge is deleted.
do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'contributions'
      and constraint_type = 'FOREIGN KEY'
      and constraint_name = 'contributions_challenge_id_fkey'
  ) then
    alter table public.contributions
      drop constraint contributions_challenge_id_fkey;
  end if;
end $$;

alter table public.contributions
  add constraint contributions_challenge_id_fkey
  foreign key (challenge_id)
  references public.challenges(id)
  on delete cascade;

-- ---------------------------------------------------------
-- CATEGORIES TABLE
-- ---------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists categories_room_id_idx
  on public.categories (room_id);

create index if not exists categories_room_id_sort_order_idx
  on public.categories (room_id, sort_order);

-- ---------------------------------------------------------
-- CHALLENGES.CATEGORY_ID
-- ---------------------------------------------------------

alter table public.challenges
  add column if not exists category_id uuid;

-- Backfill any existing challenges into a default "General" category per room.
-- Idempotent: reuse an existing 'General' category if one already exists.
do $$
declare
  r record;
  v_category_id uuid;
begin
  for r in
    select distinct room_id
    from public.challenges
    where category_id is null
  loop
    select id
    into v_category_id
    from public.categories
    where room_id = r.room_id
      and name = 'General'
    limit 1;

    if v_category_id is null then
      insert into public.categories (room_id, name, sort_order)
      values (r.room_id, 'General', 0)
      returning id into v_category_id;
    end if;

    update public.challenges
    set category_id = v_category_id
    where room_id = r.room_id
      and category_id is null;
  end loop;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'challenges'
      and constraint_name = 'challenges_category_id_fkey'
  ) then
    alter table public.challenges
      drop constraint challenges_category_id_fkey;
  end if;
end $$;

alter table public.challenges
  alter column category_id set not null;

alter table public.challenges
  add constraint challenges_category_id_fkey
  foreign key (category_id)
  references public.categories(id)
  on delete cascade;

create index if not exists challenges_category_id_idx
  on public.challenges (category_id);

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------

alter table public.categories enable row level security;

-- Members of a room can read categories.
drop policy if exists "categories_select_room_members" on public.categories;
create policy "categories_select_room_members"
  on public.categories
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.members m
      where m.room_id = categories.room_id
        and m.user_id = auth.uid()
    )
  );

-- Only room admin can insert categories.
drop policy if exists "categories_insert_admin" on public.categories;
create policy "categories_insert_admin"
  on public.categories
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.rooms r
      where r.id = categories.room_id
        and r.admin_user_id = auth.uid()
    )
  );

-- Only room admin can update categories.
drop policy if exists "categories_update_admin" on public.categories;
create policy "categories_update_admin"
  on public.categories
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.rooms r
      where r.id = categories.room_id
        and r.admin_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.rooms r
      where r.id = categories.room_id
        and r.admin_user_id = auth.uid()
    )
  );

-- Only room admin can delete categories (cascades challenges + contributions).
drop policy if exists "categories_delete_admin" on public.categories;
create policy "categories_delete_admin"
  on public.categories
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.rooms r
      where r.id = categories.room_id
        and r.admin_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------
-- REALTIME
-- ---------------------------------------------------------

do $$
begin
  begin
    alter publication supabase_realtime add table public.categories;
  exception
    when duplicate_object then null;
  end;
end $$;
