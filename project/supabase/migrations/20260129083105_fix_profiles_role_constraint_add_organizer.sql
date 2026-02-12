/*
  # Fix profiles role constraint

  1. Changes
    - Drop existing profiles_role_check constraint
    - Add new constraint with all required roles: admin, organizer, provider, client

  2. Security
    - Ensures all valid user roles can be assigned
    - Prevents database blocking on organizer registration
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'organizer', 'provider', 'client'));