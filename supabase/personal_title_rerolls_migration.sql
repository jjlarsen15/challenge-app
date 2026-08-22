-- =========================================================
-- PERSONAL TITLE REROLLS
-- =========================================================
-- Adds a per-member personal_rerolls_remaining counter (default 2)
-- and a secure self-reroll RPC. Admin unlimited rerolls are unchanged
-- and do not consume personal rerolls.
--
-- Preserves rejoin-code column-level SELECT restrictions.
-- =========================================================

alter table public.members
  add column if not exists personal_rerolls_remaining integer;

update public.members
set personal_rerolls_remaining = 2
where personal_rerolls_remaining is null;

alter table public.members
  alter column personal_rerolls_remaining set default 2;

alter table public.members
  alter column personal_rerolls_remaining set not null;

alter table public.members
  drop constraint if exists members_personal_rerolls_remaining_check;

alter table public.members
  add constraint members_personal_rerolls_remaining_check
  check (personal_rerolls_remaining >= 0);

-- Keep recovery columns hidden. Allow title + personal reroll fields.
revoke select on public.members from authenticated;
grant select (
  id,
  room_id,
  user_id,
  display_name,
  joined_at,
  adventurer_title,
  adventurer_rarity,
  personal_rerolls_remaining
) on public.members to authenticated;

-- ---------------------------------------------------------
-- Protect personal_rerolls_remaining from direct client writes
-- (extends existing title protect triggers).
-- ---------------------------------------------------------

create or replace function public.members_adventurer_title_bi()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pick record;
begin
  -- Never trust client-provided titles or reroll counts on insert.
  NEW.adventurer_title := null;
  NEW.adventurer_rarity := null;
  NEW.personal_rerolls_remaining := 2;

  select * into v_pick
  from public._pick_adventurer_title(NEW.room_id, null, null);

  NEW.adventurer_title := v_pick.title;
  NEW.adventurer_rarity := v_pick.rarity;
  return NEW;
end;
$$;

create or replace function public.members_adventurer_title_bu()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('app.allow_title_change', true) = 'on' then
    return NEW;
  end if;

  NEW.adventurer_title := OLD.adventurer_title;
  NEW.adventurer_rarity := OLD.adventurer_rarity;
  NEW.personal_rerolls_remaining := OLD.personal_rerolls_remaining;
  return NEW;
end;
$$;

-- ---------------------------------------------------------
-- PUBLIC RPC: personal self-reroll (auth.uid() only)
-- ---------------------------------------------------------

create or replace function public.reroll_own_adventurer_title(
  p_room_id uuid
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
  v_current_title text;
  v_rerolls integer;
  v_pick record;
  v_new_remaining integer;
begin
  if auth.uid() is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  if p_room_id is null then
    return json_build_object('error', 'Room is required');
  end if;

  -- Lock the caller's member row so concurrent requests cannot
  -- both spend the same remaining reroll.
  select m.id, m.adventurer_title, m.personal_rerolls_remaining
  into v_member_id, v_current_title, v_rerolls
  from public.members m
  where m.room_id = p_room_id
    and m.user_id = auth.uid()
  for update;

  if v_member_id is null then
    return json_build_object('error', 'Member not found');
  end if;

  if v_rerolls is null or v_rerolls <= 0 then
    return json_build_object('error', 'No personal rerolls remaining');
  end if;

  select * into v_pick
  from public._pick_adventurer_title(
    p_room_id,
    v_member_id,
    v_current_title
  );

  v_new_remaining := v_rerolls - 1;

  -- Atomic title change + reroll spend (allow flag for protect trigger).
  perform set_config('app.allow_title_change', 'on', true);

  update public.members
  set
    adventurer_title = v_pick.title,
    adventurer_rarity = v_pick.rarity,
    personal_rerolls_remaining = v_new_remaining
  where id = v_member_id
    and personal_rerolls_remaining = v_rerolls;

  if not found then
    return json_build_object('error', 'Reroll could not be completed');
  end if;

  return json_build_object(
    'success', true,
    'adventurer_title', v_pick.title,
    'adventurer_rarity', v_pick.rarity,
    'personal_rerolls_remaining', v_new_remaining
  );
end;
$$;

revoke all on function public.reroll_own_adventurer_title(uuid) from public;
revoke execute on function public.reroll_own_adventurer_title(uuid) from public;
revoke execute on function public.reroll_own_adventurer_title(uuid) from anon;
grant execute on function public.reroll_own_adventurer_title(uuid) to authenticated;

-- NOTE: public.reroll_adventurer_title (admin) is intentionally unchanged.
-- It only updates title/rarity via _set_member_adventurer_title and does
-- not modify personal_rerolls_remaining.
