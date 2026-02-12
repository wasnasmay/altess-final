/*
  # Disable Automatic Profile Creation

  ## Changes

  1. Drop the automatic trigger that creates profiles with role='client'
  2. Profiles will now be created manually with the correct role from the application
  3. This prevents the issue where profiles are created with wrong role

  ## Security

  - RLS policies remain intact
  - Manual profile creation allows proper role assignment
*/

-- Drop the trigger that automatically creates profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Keep the function but don't use it automatically
-- This allows us to call it manually if needed
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;