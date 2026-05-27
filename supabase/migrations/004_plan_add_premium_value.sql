-- Migration 004: Add 'premium' as valid value for profiles.plan
-- The initial schema only allowed 'free' and 'mid'.
-- 'premium' is the new single subscription plan at 9,99€.

ALTER TABLE profiles DROP CONSTRAINT profiles_plan_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'mid', 'premium'));
-- Note: 'mid' is kept for backward compatibility with existing subscribers.
