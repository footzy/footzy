-- Migration 002: Fix RLS policies for global (null groupe_id) vainqueur predictions
-- Problem: the SELECT policy used "groupe_id IN (...)" which returns false for NULL values,
--          making global predictions invisible after save.
-- Also adds a missing DELETE policy.

-- Drop old SELECT policy
DROP POLICY IF EXISTS "vainqueur_select_groupe" ON pronostics_vainqueur;

-- New SELECT policy: group predictions (existing behavior) + global prediction (groupe_id IS NULL)
CREATE POLICY "vainqueur_select" ON pronostics_vainqueur FOR SELECT
  USING (
    (groupe_id IN (SELECT groupe_id FROM groupe_membres WHERE user_id = auth.uid()))
    OR
    (groupe_id IS NULL AND auth.uid() = user_id)
  );

-- Add missing DELETE policy (needed for delete-then-insert save pattern)
CREATE POLICY "vainqueur_delete_own" ON pronostics_vainqueur FOR DELETE
  USING (auth.uid() = user_id);
