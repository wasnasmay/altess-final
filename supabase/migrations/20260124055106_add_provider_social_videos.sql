/*
  # Système de Vidéos Sociales pour Prestataires

  1. Nouvelle Table
    - `provider_social_videos`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key vers profiles)
      - `video_url` (text, URL de la vidéo Instagram/TikTok)
      - `platform` (text, instagram ou tiktok)
      - `title` (text, titre optionnel)
      - `duration` (integer, durée en secondes, default 30)
      - `is_active` (boolean, actif ou non)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Policy pour que les prestataires puissent gérer leurs propres vidéos
    - Policy pour les admins
*/

CREATE TABLE IF NOT EXISTS provider_social_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_url text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'youtube')),
  title text,
  duration integer DEFAULT 30 CHECK (duration BETWEEN 15 AND 60),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE provider_social_videos ENABLE ROW LEVEL SECURITY;

-- Policy pour les prestataires: gérer leurs propres vidéos
CREATE POLICY "Providers can view own social videos"
  ON provider_social_videos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own social videos"
  ON provider_social_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own social videos"
  ON provider_social_videos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own social videos"
  ON provider_social_videos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_id);

-- Policy pour les admins: accès complet
CREATE POLICY "Admins can view all social videos"
  ON provider_social_videos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all social videos"
  ON provider_social_videos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_provider_social_videos_provider_id 
  ON provider_social_videos(provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_social_videos_active 
  ON provider_social_videos(is_active) 
  WHERE is_active = true;
