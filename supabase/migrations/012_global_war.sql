-- Global war: attacks between users visible in the feed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS global_bm_pts integer DEFAULT 0;

-- Table to track every global attack
CREATE TABLE IF NOT EXISTS feed_attacks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id  uuid NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  to_user_id    uuid NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  points        integer NOT NULL,
  label         text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE feed_attacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_insert_own"  ON feed_attacks FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "auth_select_all"  ON feed_attacks FOR SELECT TO authenticated USING (true);

-- RPC: apply global attack (security definer to bypass RLS on profiles update)
CREATE OR REPLACE FUNCTION apply_global_attack(
  p_to_user_id uuid,
  p_points     integer,
  p_label      text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attacks_today integer;
  MAX_DAILY     integer := 5;
BEGIN
  -- Cannot attack yourself
  IF auth.uid() = p_to_user_id THEN
    RETURN json_build_object('error', 'self_attack');
  END IF;

  -- Check daily limit (last 24h)
  SELECT COUNT(*) INTO attacks_today
  FROM feed_attacks
  WHERE from_user_id = auth.uid()
    AND created_at > now() - interval '24 hours';

  IF attacks_today >= MAX_DAILY THEN
    RETURN json_build_object('error', 'daily_limit', 'attacks_left', 0);
  END IF;

  -- Insert attack log
  INSERT INTO feed_attacks (from_user_id, to_user_id, points, label)
  VALUES (auth.uid(), p_to_user_id, p_points, p_label);

  -- Apply to target's global BM points
  UPDATE profiles
  SET global_bm_pts = COALESCE(global_bm_pts, 0) + p_points
  WHERE id = p_to_user_id;

  RETURN json_build_object('ok', true, 'attacks_left', MAX_DAILY - attacks_today - 1);
END;
$$;
