-- Migration 003: Fix user deletion — add ON DELETE CASCADE to profiles FK
-- Without this, deleting a user from auth.users fails because profiles.id
-- has a FK reference without cascade, blocking the delete.

-- 1. Drop old FK (no cascade)
ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;

-- 2. Re-add with ON DELETE CASCADE so deleting auth user removes profile too
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Fix malus_target (no cascade → can block profile deletion)
ALTER TABLE pronostics DROP CONSTRAINT IF EXISTS pronostics_malus_target_fkey;
ALTER TABLE pronostics
  ADD CONSTRAINT pronostics_malus_target_fkey
  FOREIGN KEY (malus_target) REFERENCES profiles(id) ON DELETE SET NULL;
