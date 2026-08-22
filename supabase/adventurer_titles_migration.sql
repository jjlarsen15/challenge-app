-- =========================================================
-- ADVENTURER TITLES
-- =========================================================
-- Adds persistent randomized titles to members.
-- Preserves rejoin-code column-level SELECT restrictions.
-- Assignment / reroll happen only via SECURITY DEFINER RPCs
-- (and an insert trigger), not via direct client writes.
-- =========================================================

alter table public.members
  add column if not exists adventurer_title text,
  add column if not exists adventurer_rarity text;

alter table public.members
  drop constraint if exists members_adventurer_rarity_check;

alter table public.members
  add constraint members_adventurer_rarity_check
  check (
    adventurer_rarity is null
    or adventurer_rarity in ('common', 'rare', 'legendary', 'mythic')
  );

-- Keep recovery columns hidden. Explicitly allow title fields.
revoke select on public.members from authenticated;
grant select (
  id,
  room_id,
  user_id,
  display_name,
  joined_at,
  adventurer_title,
  adventurer_rarity
) on public.members to authenticated;

-- ---------------------------------------------------------
-- INTERNAL: pick an unused title for a room
-- ---------------------------------------------------------

create or replace function public._pick_adventurer_title(
  p_room_id uuid,
  p_exclude_member_id uuid default null,
  p_exclude_title text default null
)
returns table(title text, rarity text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_roll double precision;
  v_rarity text;
  v_used text[];
  v_common text[] := array[
    'Storm Mage','Storm Rogue','Storm Ranger','Storm Knight','Storm Bard','Storm Monk',
    'Storm Druid','Storm Alchemist','Storm Warrior','Storm Hunter','Storm Cleric','Storm Scout',
    'Shadow Mage','Shadow Rogue','Shadow Ranger','Shadow Knight','Shadow Bard','Shadow Monk',
    'Shadow Druid','Shadow Alchemist','Shadow Warrior','Shadow Hunter','Shadow Cleric','Shadow Scout',
    'Frost Mage','Frost Rogue','Frost Ranger','Frost Knight','Frost Bard','Frost Monk',
    'Frost Druid','Frost Alchemist','Frost Warrior','Frost Hunter','Frost Cleric','Frost Scout',
    'Ember Mage','Ember Rogue','Ember Ranger','Ember Knight','Ember Bard','Ember Monk',
    'Ember Druid','Ember Alchemist','Ember Warrior','Ember Hunter','Ember Cleric','Ember Scout',
    'Iron Mage','Iron Rogue','Iron Ranger','Iron Knight','Iron Bard','Iron Monk',
    'Iron Druid','Iron Alchemist','Iron Warrior','Iron Hunter','Iron Cleric','Iron Scout',
    'Wild Mage','Wild Rogue','Wild Ranger','Wild Knight','Wild Bard','Wild Monk',
    'Wild Druid','Wild Alchemist','Wild Warrior','Wild Hunter','Wild Cleric','Wild Scout',
    'Arcane Mage','Arcane Rogue','Arcane Ranger','Arcane Knight','Arcane Bard','Arcane Monk',
    'Arcane Druid','Arcane Alchemist','Arcane Warrior','Arcane Hunter','Arcane Cleric','Arcane Scout',
    'Moon Mage','Moon Rogue','Moon Ranger','Moon Knight','Moon Bard','Moon Monk',
    'Moon Druid','Moon Alchemist','Moon Warrior','Moon Hunter','Moon Cleric','Moon Scout',
    'Stone Mage','Stone Rogue','Stone Ranger','Stone Knight','Stone Bard','Stone Monk',
    'Stone Druid','Stone Alchemist','Stone Warrior','Stone Hunter','Stone Cleric','Stone Scout',
    'Mist Mage','Mist Rogue','Mist Ranger','Mist Knight','Mist Bard','Mist Monk',
    'Mist Druid','Mist Alchemist','Mist Warrior','Mist Hunter','Mist Cleric','Mist Scout',
    'Thorn Mage','Thorn Rogue','Thorn Ranger','Thorn Knight','Thorn Bard','Thorn Monk',
    'Thorn Druid','Thorn Alchemist','Thorn Warrior','Thorn Hunter','Thorn Cleric','Thorn Scout',
    'Ash Mage','Ash Rogue','Ash Ranger','Ash Knight','Ash Bard','Ash Monk',
    'Ash Druid','Ash Alchemist','Ash Warrior','Ash Hunter','Ash Cleric','Ash Scout'
  ];
  v_rare text[] := array[
    'Tempest Warlock','Tempest Warden','Tempest Sorcerer','Tempest Assassin',
    'Tempest Paladin','Tempest Artificer','Tempest Spellblade','Tempest Arcanist',
    'Umbral Warlock','Umbral Warden','Umbral Sorcerer','Umbral Assassin',
    'Umbral Paladin','Umbral Artificer','Umbral Spellblade','Umbral Arcanist',
    'Astral Warlock','Astral Warden','Astral Sorcerer','Astral Assassin',
    'Astral Paladin','Astral Artificer','Astral Spellblade','Astral Arcanist',
    'Infernal Warlock','Infernal Warden','Infernal Sorcerer','Infernal Assassin',
    'Infernal Paladin','Infernal Artificer','Infernal Spellblade','Infernal Arcanist',
    'Abyssal Warlock','Abyssal Warden','Abyssal Sorcerer','Abyssal Assassin',
    'Abyssal Paladin','Abyssal Artificer','Abyssal Spellblade','Abyssal Arcanist',
    'Celestial Warlock','Celestial Warden','Celestial Sorcerer','Celestial Assassin',
    'Celestial Paladin','Celestial Artificer','Celestial Spellblade','Celestial Arcanist',
    'Runic Warlock','Runic Warden','Runic Sorcerer','Runic Assassin',
    'Runic Paladin','Runic Artificer','Runic Spellblade','Runic Arcanist',
    'Phantom Warlock','Phantom Warden','Phantom Sorcerer','Phantom Assassin',
    'Phantom Paladin','Phantom Artificer','Phantom Spellblade','Phantom Arcanist'
  ];
  v_legendary text[] := array[
    'Warden of the Fallen Sun',
    'Harbinger of the Endless Storm',
    'Herald of the Dying Star',
    'Oracle of the Shattered Moon',
    'Bearer of the First Flame',
    'Blade of the Hallowed Crown',
    'Sentinel of the Frozen Gate',
    'Wanderer of the Starless Path',
    'Champion of the Last Dawn',
    'Keeper of the World Tree'
  ];
  v_mythic text[] := array[
    'Heavensbearer',
    'Suntouched',
    'Deicide',
    'Starforged'
  ];
  v_pool text[];
  v_available text[];
  v_fallback text[];
  v_rarities text[] := array['common','rare','legendary','mythic'];
  v_r text;
begin
  select coalesce(array_agg(m.adventurer_title), array[]::text[])
  into v_used
  from public.members m
  where m.room_id = p_room_id
    and m.adventurer_title is not null
    and (p_exclude_member_id is null or m.id <> p_exclude_member_id);

  if p_exclude_title is not null then
    v_used := array_append(v_used, p_exclude_title);
  end if;

  v_roll := random();
  if v_roll < 0.01 then
    v_rarity := 'mythic';
  elsif v_roll < 0.05 then
    v_rarity := 'legendary';
  elsif v_roll < 0.25 then
    v_rarity := 'rare';
  else
    v_rarity := 'common';
  end if;

  if v_rarity = 'common' then
    v_pool := v_common;
  elsif v_rarity = 'rare' then
    v_pool := v_rare;
  elsif v_rarity = 'legendary' then
    v_pool := v_legendary;
  else
    v_pool := v_mythic;
  end if;

  select coalesce(array_agg(t), array[]::text[])
  into v_available
  from unnest(v_pool) as t
  where not (t = any (v_used));

  if cardinality(v_available) > 0 then
    title := v_available[1 + floor(random() * cardinality(v_available))::int];
    rarity := v_rarity;
    return next;
    return;
  end if;

  -- Rolled rarity exhausted: fall back across remaining pools.
  foreach v_r in array v_rarities
  loop
    if v_r = v_rarity then
      continue;
    end if;

    if v_r = 'common' then
      v_pool := v_common;
    elsif v_r = 'rare' then
      v_pool := v_rare;
    elsif v_r = 'legendary' then
      v_pool := v_legendary;
    else
      v_pool := v_mythic;
    end if;

    select coalesce(array_agg(t), array[]::text[])
    into v_available
    from unnest(v_pool) as t
    where not (t = any (v_used));

    if cardinality(v_available) > 0 then
      title := v_available[1 + floor(random() * cardinality(v_available))::int];
      rarity := v_r;
      return next;
      return;
    end if;
  end loop;

  -- All titles used somehow: allow a duplicate from the rolled rarity pool.
  if v_rarity = 'common' then
    v_fallback := v_common;
  elsif v_rarity = 'rare' then
    v_fallback := v_rare;
  elsif v_rarity = 'legendary' then
    v_fallback := v_legendary;
  else
    v_fallback := v_mythic;
  end if;

  title := v_fallback[1 + floor(random() * cardinality(v_fallback))::int];
  rarity := v_rarity;
  return next;
end;
$$;

-- ---------------------------------------------------------
-- INTERNAL: write title (bypasses client UPDATE locks via definer)
-- ---------------------------------------------------------

create or replace function public._set_member_adventurer_title(
  p_member_id uuid,
  p_title text,
  p_rarity text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Lets the BEFORE UPDATE protect trigger allow this write.
  perform set_config('app.allow_title_change', 'on', true);
  update public.members
  set
    adventurer_title = p_title,
    adventurer_rarity = p_rarity
  where id = p_member_id;
end;
$$;

create or replace function public._assign_adventurer_title_to_member(
  p_member_id uuid,
  p_force boolean default false
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_existing_title text;
  v_pick record;
begin
  select m.room_id, m.adventurer_title
  into v_room_id, v_existing_title
  from public.members m
  where m.id = p_member_id;

  if v_room_id is null then
    return json_build_object('error', 'Member not found');
  end if;

  if not p_force and v_existing_title is not null then
    return json_build_object(
      'success', true,
      'unchanged', true,
      'adventurer_title', v_existing_title
    );
  end if;

  select * into v_pick
  from public._pick_adventurer_title(
    v_room_id,
    p_member_id,
    case when p_force then v_existing_title else null end
  );

  perform public._set_member_adventurer_title(
    p_member_id,
    v_pick.title,
    v_pick.rarity
  );

  return json_build_object(
    'success', true,
    'adventurer_title', v_pick.title,
    'adventurer_rarity', v_pick.rarity
  );
end;
$$;

-- ---------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------
-- BEFORE INSERT: ignore client-supplied titles and assign one.
-- BEFORE UPDATE: block client tampering unless allow flag is set
-- by a SECURITY DEFINER title writer for this transaction.

create or replace function public.members_adventurer_title_bi()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pick record;
begin
  -- Never trust client-provided titles on insert.
  NEW.adventurer_title := null;
  NEW.adventurer_rarity := null;

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
  return NEW;
end;
$$;

drop trigger if exists trg_members_assign_adventurer_title on public.members;
drop trigger if exists trg_members_protect_adventurer_title on public.members;
drop trigger if exists trg_members_adventurer_title_bi on public.members;
drop trigger if exists trg_members_adventurer_title_bu on public.members;

create trigger trg_members_adventurer_title_bi
before insert on public.members
for each row
execute function public.members_adventurer_title_bi();

create trigger trg_members_adventurer_title_bu
before update on public.members
for each row
execute function public.members_adventurer_title_bu();

-- ---------------------------------------------------------
-- PUBLIC RPC: ensure title (self or room admin; null only)
-- ---------------------------------------------------------

create or replace function public.ensure_adventurer_title(
  p_member_id uuid
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_room_id uuid;
  v_admin_user_id uuid;
  v_title text;
begin
  if auth.uid() is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  select m.user_id, m.room_id, m.adventurer_title, r.admin_user_id
  into v_user_id, v_room_id, v_title, v_admin_user_id
  from public.members m
  join public.rooms r on r.id = m.room_id
  where m.id = p_member_id;

  if v_room_id is null then
    return json_build_object('error', 'Member not found');
  end if;

  if auth.uid() <> v_user_id and auth.uid() <> v_admin_user_id then
    return json_build_object('error', 'Not allowed');
  end if;

  if v_title is not null then
    return json_build_object(
      'success', true,
      'unchanged', true,
      'adventurer_title', v_title
    );
  end if;

  return public._assign_adventurer_title_to_member(p_member_id, false);
end;
$$;

-- ---------------------------------------------------------
-- PUBLIC RPC: admin reroll
-- ---------------------------------------------------------

create or replace function public.reroll_adventurer_title(
  p_member_id uuid
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_admin_user_id uuid;
begin
  if auth.uid() is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  select m.room_id, r.admin_user_id
  into v_room_id, v_admin_user_id
  from public.members m
  join public.rooms r on r.id = m.room_id
  where m.id = p_member_id;

  if v_room_id is null then
    return json_build_object('error', 'Member not found');
  end if;

  if v_admin_user_id <> auth.uid() then
    return json_build_object('error', 'Only the room admin can reroll titles');
  end if;

  return public._assign_adventurer_title_to_member(p_member_id, true);
end;
$$;

-- Internal helpers: not callable by clients (SECURITY DEFINER callers still work).
revoke execute on function public._pick_adventurer_title(uuid, uuid, text) from public;
revoke execute on function public._pick_adventurer_title(uuid, uuid, text) from anon;
revoke execute on function public._pick_adventurer_title(uuid, uuid, text) from authenticated;

revoke execute on function public._set_member_adventurer_title(uuid, text, text) from public;
revoke execute on function public._set_member_adventurer_title(uuid, text, text) from anon;
revoke execute on function public._set_member_adventurer_title(uuid, text, text) from authenticated;

revoke execute on function public._assign_adventurer_title_to_member(uuid, boolean) from public;
revoke execute on function public._assign_adventurer_title_to_member(uuid, boolean) from anon;
revoke execute on function public._assign_adventurer_title_to_member(uuid, boolean) from authenticated;

-- Public RPCs: authenticated only.
revoke execute on function public.ensure_adventurer_title(uuid) from public;
revoke execute on function public.ensure_adventurer_title(uuid) from anon;
grant execute on function public.ensure_adventurer_title(uuid) to authenticated;

revoke execute on function public.reroll_adventurer_title(uuid) from public;
revoke execute on function public.reroll_adventurer_title(uuid) from anon;
grant execute on function public.reroll_adventurer_title(uuid) to authenticated;

-- ---------------------------------------------------------
-- BACKFILL existing members (safe, one-time)
-- ---------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select m.id
    from public.members m
    where m.adventurer_title is null
    order by m.joined_at nulls last, m.id
  loop
    perform public._assign_adventurer_title_to_member(r.id, false);
  end loop;
end;
$$;
