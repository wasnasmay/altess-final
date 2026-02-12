/*
  # Add fallback URL support to media library

  1. Changes
    - Add `fallback_url` column to `media_library` table
      - Stores an alternative MP4 URL when YouTube videos fail to load
      - Allows automatic fallback for reliable playback
    
  2. Purpose
    - Enable dual-source support: YouTube (primary) + MP4 (fallback)
    - Provide seamless user experience when YouTube embed fails
    - Support regions/networks where YouTube is restricted
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media_library' AND column_name = 'fallback_url'
  ) THEN
    ALTER TABLE media_library ADD COLUMN fallback_url text;
  END IF;
END $$;
