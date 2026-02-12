/*
  # Fix Profile Update Permissions for New Users

  ## Changes

  1. Improve RLS policies for profiles table
  2. Allow users to update their profile immediately after signup
  3. Ensure smooth profile creation and update flow

  ## Security

  - Users can only update their own profile
  - All updates must match the authenticated user ID
  - Maintains security while allowing post-signup profile updates
*/

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create improved update policy that works for newly created users
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add a more permissive policy for just-signed-up users
-- This allows updates during the signup flow when auth session is still being established
DROP POLICY IF EXISTS "Enable update during signup" ON profiles;

CREATE POLICY "Enable update during signup"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id AND
    (EXTRACT(EPOCH FROM (NOW() - created_at)) < 60)
  )
  WITH CHECK (auth.uid() = id);

-- Ensure the profiles table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);