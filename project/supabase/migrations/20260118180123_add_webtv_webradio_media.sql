/*
  # WebTV and WebRadio Media System

  ## 1. New Tables
  
  ### `videos` table (WebTV)
  - `id` (uuid, primary key)
  - `title` (text) - Video title
  - `description` (text) - Video description
  - `video_url` (text) - URL to video file
  - `thumbnail_url` (text) - URL to video thumbnail
  - `category` (text) - Video category
  - `is_live` (boolean) - Live stream indicator
  - `is_active` (boolean) - Published/unpublished
  - `view_count` (int) - Number of views
  - `duration` (int) - Duration in seconds
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `audios` table (WebRadio)
  - `id` (uuid, primary key)
  - `title` (text) - Song/track title
  - `artist` (text) - Artist name
  - `album` (text) - Album name
  - `audio_url` (text) - URL to audio file
  - `cover_url` (text) - URL to album cover
  - `genre` (text) - Music genre
  - `is_live` (boolean) - Live stream indicator
  - `is_active` (boolean) - Published/unpublished
  - `play_count` (int) - Number of plays
  - `duration` (int) - Duration in seconds
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 2. Security
  - Enable RLS on both tables
  - Public read access for active media
  - Admin-only write access
*/

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  category text,
  is_live boolean DEFAULT false,
  is_active boolean DEFAULT true,
  view_count int DEFAULT 0,
  duration int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Videos policies
CREATE POLICY "Anyone can view active videos"
  ON videos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all videos"
  ON videos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create audios table
CREATE TABLE IF NOT EXISTS audios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text,
  album text,
  audio_url text NOT NULL,
  cover_url text,
  genre text,
  is_live boolean DEFAULT false,
  is_active boolean DEFAULT true,
  play_count int DEFAULT 0,
  duration int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE audios ENABLE ROW LEVEL SECURITY;

-- Audios policies
CREATE POLICY "Anyone can view active audios"
  ON audios FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all audios"
  ON audios FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_is_active ON videos(is_active);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audios_is_active ON audios(is_active);
CREATE INDEX IF NOT EXISTS idx_audios_genre ON audios(genre);
CREATE INDEX IF NOT EXISTS idx_audios_created_at ON audios(created_at DESC);

-- Update trigger function to set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_audios_updated_at ON audios;
CREATE TRIGGER update_audios_updated_at
  BEFORE UPDATE ON audios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();