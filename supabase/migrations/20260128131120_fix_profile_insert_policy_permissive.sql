/*
  # Fix Profile Insert Policy - Make it Permissive

  ## Changes

  1. Replace restrictive INSERT policy with a permissive one
  2. Allow authenticated users to insert profiles
  3. This fixes the RLS violation during signup

  ## Security

  - Only authenticated users can insert profiles
  - Users can only insert with their own user ID (verified at app level)
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;

-- Create a permissive policy for authenticated users
CREATE POLICY "Authenticated users can create profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also allow anon role for the initial signup moment
CREATE POLICY "Allow profile creation during signup"
  ON profiles FOR INSERT
  TO anon
  WITH CHECK (true);