/*
  # Système d'Arrière-plans Dynamiques pour TV & Radio

  1. Nouvelle Table
    - `dynamic_backgrounds`
      - `id` (uuid, primary key)
      - `title` (text) - Titre de l'image
      - `description` (text) - Description optionnelle
      - `image_url` (text) - URL de l'image (storage ou externe)
      - `display_mode` (text) - 'tv', 'radio', ou 'both'
      - `is_default` (boolean) - Image de la bibliothèque ALTESS
      - `is_active` (boolean) - Actuellement utilisée
      - `priority` (integer) - Ordre d'affichage
      - `upload_by` (uuid) - Utilisateur qui a uploadé (null pour images par défaut)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage Bucket
    - `backgrounds` - Pour les uploads utilisateur

  3. Security
    - Enable RLS on `dynamic_backgrounds` table
    - Public read access for active backgrounds
    - Admin-only write access
    - Storage policies for authenticated uploads

  4. Images par Défaut ALTESS
    - 6 images haute qualité orientales/luxe de Pexels
    - Salle de concert, textures dorées, architecture orientale
    - Studio radio, instruments, scènes prestigieuses
*/

-- Create backgrounds table
CREATE TABLE IF NOT EXISTS dynamic_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  display_mode text NOT NULL DEFAULT 'both' CHECK (display_mode IN ('tv', 'radio', 'both')),
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT false,
  priority integer DEFAULT 0,
  upload_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dynamic_backgrounds ENABLE ROW LEVEL SECURITY;

-- Public can view active backgrounds
CREATE POLICY "Anyone can view active backgrounds"
  ON dynamic_backgrounds
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all backgrounds
CREATE POLICY "Authenticated users can view all backgrounds"
  ON dynamic_backgrounds
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert backgrounds
CREATE POLICY "Admins can insert backgrounds"
  ON dynamic_backgrounds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update backgrounds
CREATE POLICY "Admins can update backgrounds"
  ON dynamic_backgrounds
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

-- Only admins can delete backgrounds
CREATE POLICY "Admins can delete backgrounds"
  ON dynamic_backgrounds
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create storage bucket for backgrounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('backgrounds', 'backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Anyone can view
CREATE POLICY "Public can view background images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'backgrounds');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload backgrounds"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own uploads
CREATE POLICY "Users can update own backgrounds"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own uploads
CREATE POLICY "Users can delete own backgrounds"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_backgrounds_active ON dynamic_backgrounds(is_active, display_mode, priority);
CREATE INDEX IF NOT EXISTS idx_backgrounds_mode ON dynamic_backgrounds(display_mode);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_backgrounds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS backgrounds_updated_at ON dynamic_backgrounds;
CREATE TRIGGER backgrounds_updated_at
  BEFORE UPDATE ON dynamic_backgrounds
  FOR EACH ROW
  EXECUTE FUNCTION update_backgrounds_updated_at();

-- Insert default ALTESS backgrounds (Images orientales luxe de Pexels)
INSERT INTO dynamic_backgrounds (title, description, image_url, display_mode, is_default, is_active, priority) VALUES
(
  'Salle de Concert Orientale',
  'Théâtre royal avec architecture orientale moderne',
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'both',
  true,
  true,
  1
),
(
  'Texture Dorée Arabesque',
  'Motifs arabesques dorés sur fond noir luxueux',
  'https://images.pexels.com/photos/3616764/pexels-photo-3616764.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'both',
  true,
  false,
  2
),
(
  'Scène de Concert Prestige',
  'Grande scène illuminée ambiance nocturne',
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'tv',
  true,
  false,
  3
),
(
  'Studio Radio Professionnel',
  'Intérieur studio avec équipement audio professionnel',
  'https://images.pexels.com/photos/7426867/pexels-photo-7426867.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'radio',
  true,
  false,
  4
),
(
  'Architecture Orientale Moderne',
  'Dôme et arches avec éclairage doré',
  'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'both',
  true,
  false,
  5
),
(
  'Instruments Orientaux',
  'Oud et instruments traditionnels sur textile luxueux',
  'https://images.pexels.com/photos/6671242/pexels-photo-6671242.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'radio',
  true,
  false,
  6
);
