-- Add event_id and gage columns to groupes table
ALTER TABLE groupes
  ADD COLUMN IF NOT EXISTS event_id text,
  ADD COLUMN IF NOT EXISTS gage text;
