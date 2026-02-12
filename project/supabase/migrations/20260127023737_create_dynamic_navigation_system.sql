/*
  # Create Dynamic Navigation System

  1. New Tables
    - `navigation_items`
      - `id` (uuid, primary key)
      - `label` (text) - The display text for the menu item
      - `href` (text) - The URL path
      - `icon` (text) - The name of the Lucide icon to use
      - `order_index` (integer) - Sort order for display
      - `is_active` (boolean) - Whether the item is visible
      - `target` (text) - Link target (_self, _blank, etc.)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `navigation_items` table
    - Public can read active navigation items
    - Only admins can create, update, or delete navigation items

  3. Initial Data
    - Insert current navigation items with their configuration
*/

-- Create navigation_items table
CREATE TABLE IF NOT EXISTS navigation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  icon text NOT NULL DEFAULT 'Circle',
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  target text DEFAULT '_self',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- Public can read active navigation items
CREATE POLICY "Anyone can view active navigation items"
  ON navigation_items
  FOR SELECT
  USING (is_active = true);

-- Admins can manage navigation items
CREATE POLICY "Admins can insert navigation items"
  ON navigation_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update navigation items"
  ON navigation_items
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

CREATE POLICY "Admins can delete navigation items"
  ON navigation_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_navigation_items_order ON navigation_items(order_index, is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_navigation_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_navigation_items_updated_at
  BEFORE UPDATE ON navigation_items
  FOR EACH ROW
  EXECUTE FUNCTION update_navigation_items_updated_at();

-- Insert initial navigation items (current menu structure)
INSERT INTO navigation_items (label, href, icon, order_index, is_active) VALUES
  ('Accueil', '/', 'Home', 1, true),
  ('Événementiel', '/evenementiel', 'PartyPopper', 2, true),
  ('Académie', '/academy', 'GraduationCap', 3, true),
  ('Bonnes Adresses', '/bonnes-adresses', 'MapPin', 4, true),
  ('Nos Partenaires', '/partenaires', 'Handshake', 5, true),
  ('Rendez-vous', '/rendez-vous', 'Calendar', 6, true),
  ('Voyages', '/voyages', 'Plane', 7, false)
ON CONFLICT DO NOTHING;