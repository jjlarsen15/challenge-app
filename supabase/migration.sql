-- Add rejoin code columns to members table
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS rejoin_code text,
  ADD COLUMN IF NOT EXISTS rejoin_code_expires_at timestamptz;

-- RPC function: claim_member_with_rejoin_code
-- Securely transfers a member record to a new anonymous user via a valid rejoin code.
-- Validates: room exists, member belongs to room, code matches, code not expired.
-- On success: updates user_id, clears rejoin code. Returns the member row.
CREATE OR REPLACE FUNCTION claim_member_with_rejoin_code(
  p_room_code text,
  p_rejoin_code text,
  p_new_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
  v_member record;
BEGIN
  -- Look up room
  SELECT id INTO v_room_id
  FROM rooms
  WHERE code = upper(p_room_code);

  IF v_room_id IS NULL THEN
    RETURN json_build_object('error', 'Room not found');
  END IF;

  -- Find member with matching rejoin code in this room
  SELECT * INTO v_member
  FROM members
  WHERE room_id = v_room_id
    AND rejoin_code = upper(p_rejoin_code);

  IF v_member IS NULL THEN
    RETURN json_build_object('error', 'Invalid rejoin code');
  END IF;

  -- Check expiry
  IF v_member.rejoin_code_expires_at < now() THEN
    RETURN json_build_object('error', 'Rejoin code has expired');
  END IF;

  -- Transfer ownership
  UPDATE members
  SET user_id = p_new_user_id,
      rejoin_code = NULL,
      rejoin_code_expires_at = NULL
  WHERE id = v_member.id;

  RETURN json_build_object(
    'success', true,
    'member_id', v_member.id,
    'display_name', v_member.display_name,
    'room_code', upper(p_room_code)
  );
END;
$$;
