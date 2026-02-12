/*
  # Add Partner Activity Preferences

  1. Extensions
    - Add `can_create_events` to profiles (true if user wants to organize events)
    - Add `can_create_places` to profiles (true if user wants to manage places/addresses)
    - These preferences are set during registration
    - System also checks actual content (if user has events or places)

  2. Important Notes
    - Both can be true (user can do both activities)
    - Default is false for new users
    - Admins have both automatically
    - These fields determine which dashboard sections are visible
*/

-- =====================================================
-- ADD ACTIVITY PREFERENCES TO profiles
-- =====================================================

DO $$
BEGIN
  -- can_create_events: User wants to organize events and sell tickets
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'can_create_events'
  ) THEN
    ALTER TABLE profiles ADD COLUMN can_create_events boolean DEFAULT false;
  END IF;

  -- can_create_places: User wants to create places/addresses listings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'can_create_places'
  ) THEN
    ALTER TABLE profiles ADD COLUMN can_create_places boolean DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- SET DEFAULTS FOR EXISTING USERS
-- =====================================================

-- Admins get both permissions
UPDATE profiles 
SET can_create_events = true, can_create_places = true
WHERE role = 'admin';

-- Partners who already have events
UPDATE profiles
SET can_create_events = true
WHERE role = 'partner' 
  AND id IN (SELECT DISTINCT organizer_id FROM public_events WHERE organizer_id IS NOT NULL);

-- Partners who already have places (if owner_id exists in good_addresses)
UPDATE profiles
SET can_create_places = true
WHERE role = 'partner' 
  AND id IN (SELECT DISTINCT owner_id FROM good_addresses WHERE owner_id IS NOT NULL);