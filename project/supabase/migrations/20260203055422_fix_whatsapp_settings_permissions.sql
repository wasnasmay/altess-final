/*
  # Fix WhatsApp Settings Permissions

  1. Security Changes
    - Drop existing overly permissive policies
    - Create secure policies that only allow admins to manage settings
    - Keep public read access for the WhatsApp button on homepage
  
  2. Important Notes
    - Only admin users can insert, update, or delete WhatsApp settings
    - All authenticated and public users can read active settings
    - This ensures the WhatsApp button works for everyone while protecting admin settings
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can delete WhatsApp settings" ON whatsapp_settings;
DROP POLICY IF EXISTS "Authenticated users can insert WhatsApp settings" ON whatsapp_settings;
DROP POLICY IF EXISTS "Authenticated users can update WhatsApp settings" ON whatsapp_settings;
DROP POLICY IF EXISTS "Public can read WhatsApp settings" ON whatsapp_settings;

-- Create secure admin-only policies
CREATE POLICY "Admins can insert WhatsApp settings"
  ON whatsapp_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update WhatsApp settings"
  ON whatsapp_settings
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

CREATE POLICY "Admins can delete WhatsApp settings"
  ON whatsapp_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public can read enabled settings (for the WhatsApp button on homepage)
CREATE POLICY "Anyone can read enabled WhatsApp settings"
  ON whatsapp_settings
  FOR SELECT
  TO public
  USING (is_enabled = true);

-- Admins can read all settings
CREATE POLICY "Admins can read all WhatsApp settings"
  ON whatsapp_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
