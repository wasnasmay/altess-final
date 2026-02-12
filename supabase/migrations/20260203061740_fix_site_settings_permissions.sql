/*
  # Fix Site Settings Permissions

  1. Security Changes
    - Drop existing policies that are tied to a specific user UUID
    - Create new policies that check for admin role from profiles table
    - Keep public read access for public settings
  
  2. Important Notes
    - All users with admin role can now manage settings
    - Public can only read settings where is_public = true
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin user can delete settings" ON site_settings;
DROP POLICY IF EXISTS "Admin user can insert settings" ON site_settings;
DROP POLICY IF EXISTS "Admin user can read all settings" ON site_settings;
DROP POLICY IF EXISTS "Admin user can update settings" ON site_settings;
DROP POLICY IF EXISTS "Anyone can read public settings" ON site_settings;

-- Create new admin-based policies
CREATE POLICY "Admins can insert settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete settings"
  ON site_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can read all settings"
  ON site_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public can read public settings
CREATE POLICY "Anyone can read public settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (is_public = true);
