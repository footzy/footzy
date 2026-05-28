-- Add bio and social links to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS tiktok text,
  ADD COLUMN IF NOT EXISTS twitter text,
  ADD COLUMN IF NOT EXISTS youtube text;
