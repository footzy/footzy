-- Migration 005: Remove 'mid' plan — only 'free' and 'premium' exist now
-- Migrate any existing 'mid' subscribers to 'premium' first, then tighten the CHECK.

-- 1. Migrate legacy 'mid' users to 'premium'
UPDATE profiles SET plan = 'premium' WHERE plan = 'mid';

-- 2. Drop current CHECK (includes 'mid')
ALTER TABLE profiles DROP CONSTRAINT profiles_plan_check;

-- 3. New CHECK — only 'free' and 'premium'
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'premium'));
