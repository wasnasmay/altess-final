/*
  # WhatsApp & Photo Gallery System

  1. New Fields
    - Add `whatsapp_number` to profiles for provider WhatsApp contact

  2. New Tables
    - `provider_photo_gallery`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key to auth.users)
      - `photo_url` (text) - URL of the photo
      - `display_order` (integer) - Order for slideshow
      - `is_active` (boolean) - Active status
      - `caption` (text, nullable) - Optional caption
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Storage
    - Create bucket for provider photos if not exists

  4. Security
    - Enable RLS on new table
    - Add policies for provider access
    - Add storage policies
*/

-- Add WhatsApp number to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN whatsapp_number text;
  END IF;
END $$;

-- Create provider photo gallery table
CREATE TABLE IF NOT EXISTS provider_photo_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  caption text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_provider_photo_gallery_provider
  ON provider_photo_gallery(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_photo_gallery_active
  ON provider_photo_gallery(provider_id, is_active, display_order);

-- Enable RLS
ALTER TABLE provider_photo_gallery ENABLE ROW LEVEL SECURITY;

-- Policies for provider_photo_gallery
CREATE POLICY "Providers can view own photos"
  ON provider_photo_gallery FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own photos"
  ON provider_photo_gallery FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own photos"
  ON provider_photo_gallery FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own photos"
  ON provider_photo_gallery FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_id);

-- Public read access for active photos
CREATE POLICY "Anyone can view active photos"
  ON provider_photo_gallery FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Create storage bucket for provider photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-photos', 'provider-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for provider photos
CREATE POLICY "Authenticated users can upload provider photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'provider-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own provider photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'provider-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own provider photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'provider-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view provider photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'provider-photos');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_provider_photo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at
DROP TRIGGER IF EXISTS provider_photo_gallery_updated_at ON provider_photo_gallery;
CREATE TRIGGER provider_photo_gallery_updated_at
  BEFORE UPDATE ON provider_photo_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_photo_updated_at();
