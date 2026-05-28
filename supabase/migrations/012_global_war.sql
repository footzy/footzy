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
-- Pas de limite quotidienne — chaque action est payante (1,99€ via Whop)
CREATE OR REPLACE FUNCTION apply_global_attack(
  p_to_user_id uuid,
  p_points     integer,
  p_label      text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cannot attack yourself
  IF auth.uid() = p_to_user_id THEN
    RETURN json_build_object('error', 'self_attack');
  END IF;

  -- Insert attack log
  INSERT INTO feed_attacks (from_user_id, to_user_id, points, label)
  VALUES (auth.uid(), p_to_user_id, p_points, p_label);

  -- Apply to target's global BM points
  UPDATE profiles
  SET global_bm_pts = COALESCE(global_bm_pts, 0) + p_points
  WHERE id = p_to_user_id;

  RETURN json_build_object('ok', true);
END;
$$;
