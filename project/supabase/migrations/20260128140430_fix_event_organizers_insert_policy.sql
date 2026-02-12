/*
  # Fix Event Organizers Insert Policy
  
  1. Changes
    - Add INSERT policy for event_organizers table
    - Allow authenticated users with 'organizer' role to create their profile
  
  2. Security
    - Policy checks that the user is authenticated
    - User can only create a profile for their own user_id
*/

-- Allow organizers to create their own profile
CREATE POLICY "Organizers can create own profile"
  ON event_organizers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );
