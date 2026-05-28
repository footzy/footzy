-- Add snapchat to profiles (replace tiktok/youtube with snapchat)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS snapchat text;
