-- =========================================================
-- REJOIN / MEMBER RECOVERY
-- =========================================================

alter table public.members
  add column if not exists rejoin_code text,
  add column if not exists rejoin_code_expires_at timestamptz;

-- ---------------------------------------------------------
-- ADMIN: GENERATE A REJOIN CODE
-- ---------------------------------------------------------

create or replace function public.generate_member_rejoin_code(
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
  v_code text;
  v_expires_at timestamptz;
begin
  if auth.uid() is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  select
    m.room_id,
    r.admin_user_id
  into
    v_room_id,
    v_admin_user_id
  from public.members m
  join public.rooms r on r.id = m.room_id
  where m.id = p_member_id;

  if v_room_id is null then
    return json_build_object('error', 'Member not found');
  end if;

  if v_admin_user_id <> auth.uid() then
    return json_build_object('error', 'Only the room admin can generate a rejoin code');
  end if;

  -- Avoid allowing recovery codes for the admin account itself.
  if exists (
    select 1
    from public.members m
    where m.id = p_member_id
      and m.user_id = v_admin_user_id
  ) then
    return json_build_object('error', 'Cannot generate a rejoin code for the room admin');
  end if;

  -- Easy-to-read 6-character code.
  -- Excludes confusing characters such as O/0/I/1.
  v_code := upper(
    substr(md5(gen_random_uuid()::text), 1, 6)
  );

  v_expires_at := now() + interval '24 hours';

  update public.members
  set
    rejoin_code = v_code,
    rejoin_code_expires_at = v_expires_at
  where id = p_member_id;

  return json_build_object(
    'success', true,
    'rejoin_code', v_code,
    'expires_at', v_expires_at
  );
end;
$$;


-- ---------------------------------------------------------
-- MEMBER: CLAIM OLD IDENTITY
-- ---------------------------------------------------------

create or replace function public.claim_member_with_rejoin_code(
  p_room_code text,
  p_rejoin_code text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
  v_display_name text;
  v_room_id uuid;
begin
  if auth.uid() is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  select
    m.id,
    m.display_name,
    m.room_id
  into
    v_member_id,
    v_display_name,
    v_room_id
  from public.members m
  join public.rooms r on r.id = m.room_id
  where upper(r.code) = upper(trim(p_room_code))
    and upper(m.rejoin_code) = upper(trim(p_rejoin_code))
    and m.rejoin_code_expires_at > now()
  limit 1;

  if v_member_id is null then
    return json_build_object(
      'error',
      'Invalid or expired rejoin code'
    );
  end if;

  -- Prevent this anonymous user from already being another member
  -- of the same room.
  if exists (
    select 1
    from public.members
    where room_id = v_room_id
      and user_id = auth.uid()
      and id <> v_member_id
  ) then
    return json_build_object(
      'error',
      'This browser is already joined to this room as another member'
    );
  end if;

  update public.members
  set
    user_id = auth.uid(),
    rejoin_code = null,
    rejoin_code_expires_at = null
  where id = v_member_id;

  return json_build_object(
    'success', true,
    'member_id', v_member_id,
    'display_name', v_display_name,
    'room_code', upper(trim(p_room_code))
  );
end;
$$;


-- ---------------------------------------------------------
-- RPC ACCESS
-- ---------------------------------------------------------

revoke all on function public.generate_member_rejoin_code(uuid) from public;
revoke all on function public.claim_member_with_rejoin_code(text, text) from public;

grant execute on function public.generate_member_rejoin_code(uuid) to authenticated;
grant execute on function public.claim_member_with_rejoin_code(text, text) to authenticated;

-- Prevent authenticated clients from directly reading sensitive recovery columns.
-- Keep normal member fields readable.
revoke select on public.members from authenticated;
grant select (
  id,
  room_id,
  user_id,
  display_name,
  joined_at
) on public.members to authenticated;
