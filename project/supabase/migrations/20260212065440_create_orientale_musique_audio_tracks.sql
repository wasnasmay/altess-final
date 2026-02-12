/*
  # Système de Lecteur Audio Premium pour Orientale Musique
  
  1. Nouvelles Tables
    - `orientale_musique_audio_tracks`
      - `id` (uuid, primary key)
      - `title` (text) - Titre du morceau
      - `artist` (text) - Artiste/Orchestre
      - `audio_url` (text) - URL du fichier audio
      - `cover_image_url` (text) - Image de couverture
      - `duration_seconds` (integer) - Durée en secondes
      - `album` (text) - Nom de l'album
      - `display_order` (integer) - Ordre d'affichage
      - `is_active` (boolean) - Actif ou non
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `orchestra_formula_images`
      - `id` (uuid, primary key)
      - `formula_id` (uuid, foreign key) - Référence à orchestra_formulas
      - `image_url` (text) - URL de l'image d'illustration
      - `image_type` (text) - Type: 'hero', 'gallery', 'thumbnail'
      - `alt_text` (text) - Texte alternatif
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      
  2. Sécurité
    - Enable RLS on all tables
    - Public read access for active tracks and images
    - Admin-only write access
*/

-- Table des pistes audio
CREATE TABLE IF NOT EXISTS orientale_musique_audio_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text DEFAULT 'Orientale Musique',
  audio_url text NOT NULL,
  cover_image_url text,
  duration_seconds integer DEFAULT 0,
  album text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des images des formules
CREATE TABLE IF NOT EXISTS orchestra_formula_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id uuid REFERENCES orchestra_formulas(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text DEFAULT 'gallery' CHECK (image_type IN ('hero', 'gallery', 'thumbnail')),
  alt_text text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orientale_musique_audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestra_formula_images ENABLE ROW LEVEL SECURITY;

-- Policies for audio tracks (public read, admin write)
CREATE POLICY "Anyone can view active audio tracks"
  ON orientale_musique_audio_tracks
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage audio tracks"
  ON orientale_musique_audio_tracks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for formula images (public read, admin write)
CREATE POLICY "Anyone can view active formula images"
  ON orchestra_formula_images
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage formula images"
  ON orchestra_formula_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert sample audio tracks
INSERT INTO orientale_musique_audio_tracks (title, artist, audio_url, cover_image_url, duration_seconds, album, display_order) VALUES
('Laylat Hob', 'Orientale Musique', 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8b3f22f.mp3', 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400', 180, 'Collection Prestige', 1),
('Sahara Dream', 'Orientale Musique', 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=400', 210, 'Collection Prestige', 2),
('Andalousie', 'Orientale Musique', 'https://cdn.pixabay.com/audio/2022/08/02/audio_4b2fb9a4f7.mp3', 'https://images.pexels.com/photos/1682699/pexels-photo-1682699.jpeg?auto=compress&cs=tinysrgb&w=400', 195, 'Collection Prestige', 3),
('Nuits d''Orient', 'Orientale Musique', 'https://cdn.pixabay.com/audio/2023/02/28/audio_88ef921e05.mp3', 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=400', 165, 'Collection Royale', 4),
('Mille et Une Nuits', 'Orientale Musique', 'https://cdn.pixabay.com/audio/2022/11/22/audio_3a6d9b141f.mp3', 'https://images.pexels.com/photos/1644888/pexels-photo-1644888.jpeg?auto=compress&cs=tinysrgb&w=400', 220, 'Collection Royale', 5);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audio_tracks_active ON orientale_musique_audio_tracks(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_formula_images_formula ON orchestra_formula_images(formula_id, is_active);
