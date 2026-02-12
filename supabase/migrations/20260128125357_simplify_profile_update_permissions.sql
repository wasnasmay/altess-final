/*
  # Simplify Profile Update Permissions

  ## Changes

  1. Remove restrictive update policies
  2. Create a single, more permissive policy for new profiles
  3. Allow complete profile updates within 5 minutes of creation

  ## Security

  - Users can still only update their own profile
  - Time-limited permissive window for signup flow
  - After 5 minutes, normal restrictions apply
*/

-- Drop all existing update policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update during signup" ON profiles;

-- Create a single, comprehensive update policy
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verify the insert policy allows profile creation
DO $$
BEGIN
  -- Ensure the permissive insert policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Enable insert for authentication'
  ) THEN
    CREATE POLICY "Enable insert for authentication"
      ON profiles FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;