/*
  # Fix profiles role constraint to include all user roles

  ## Changes
  1. Drop existing role constraint
  2. Add new constraint with all valid roles: 'client', 'provider', 'admin', 'organizer', 'partner'
  
  ## Why
  - The current constraint only allows 'client', 'provider', 'admin'
  - This causes error 23514 when trying to create an organizer or partner account
  - This migration fixes the constraint to support all role types used in the application
  
  ## Security
  - Maintains data integrity by ensuring role values are valid
  - Does not affect RLS policies
*/

-- Drop the existing constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the corrected constraint with all roles
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('client', 'provider', 'admin', 'organizer', 'partner'));