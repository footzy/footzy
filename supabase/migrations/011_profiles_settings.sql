-- Add settings fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_pronos boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_bio boolean DEFAULT true;
