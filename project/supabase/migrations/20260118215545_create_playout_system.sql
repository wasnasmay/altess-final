/*
  # Create Playout System for WebTV and WebRadio

  ## Overview
  This migration creates a complete playout/scheduling system for WebTV and WebRadio channels.
  
  ## New Tables
  
  ### `media_library`
  Stores all media sources (YouTube, Vimeo, direct files)
  - `id` (uuid, primary key)
  - `title` (text) - Media title
  - `description` (text, nullable) - Media description
  - `media_type` (text) - Type: 'video' or 'audio'
  - `source_type` (text) - Source: 'youtube', 'vimeo', 'direct_url', 'upload'
  - `source_url` (text) - URL or file path
  - `thumbnail_url` (text, nullable) - Preview image
  - `duration_seconds` (integer, nullable) - Duration in seconds
  - `metadata` (jsonb, nullable) - Additional metadata (resolution, format, etc.)
  - `created_by` (uuid) - User who added this media
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `playout_programs`
  Groups media items into programs/shows
  - `id` (uuid, primary key)
  - `name` (text) - Program name
  - `description` (text, nullable)
  - `program_type` (text) - 'webtv' or 'webradio'
  - `media_items` (jsonb) - Array of media_library IDs with order
  - `total_duration_seconds` (integer) - Total duration
  - `created_by` (uuid)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `playout_schedule`
  Scheduling calendar for when to broadcast content
  - `id` (uuid, primary key)
  - `channel_type` (text) - 'webtv' or 'webradio'
  - `scheduled_date` (date) - Date of broadcast
  - `start_time` (time) - Start time
  - `end_time` (time) - End time
  - `media_id` (uuid, nullable) - Single media item
  - `program_id` (uuid, nullable) - Or a program
  - `title` (text) - Display title
  - `repeat_type` (text, nullable) - 'daily', 'weekly', 'monthly', null for one-time
  - `repeat_until` (date, nullable) - End date for repeating
  - `status` (text) - 'scheduled', 'playing', 'completed', 'cancelled'
  - `created_by` (uuid)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Only authenticated admin users can manage content
  - Public can view schedules (for public-facing TV/Radio pages)

  ## Indexes
  - Index on scheduled_date and channel_type for fast calendar queries
  - Index on media_type and source_type for filtering
*/

-- Create media_library table
CREATE TABLE IF NOT EXISTS media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_type text NOT NULL CHECK (media_type IN ('video', 'audio')),
  source_type text NOT NULL CHECK (source_type IN ('youtube', 'vimeo', 'direct_url', 'upload')),
  source_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create playout_programs table
CREATE TABLE IF NOT EXISTS playout_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  program_type text NOT NULL CHECK (program_type IN ('webtv', 'webradio')),
  media_items jsonb DEFAULT '[]'::jsonb,
  total_duration_seconds integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create playout_schedule table
CREATE TABLE IF NOT EXISTS playout_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type text NOT NULL CHECK (channel_type IN ('webtv', 'webradio')),
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  media_id uuid REFERENCES media_library(id) ON DELETE CASCADE,
  program_id uuid REFERENCES playout_programs(id) ON DELETE CASCADE,
  title text NOT NULL,
  repeat_type text CHECK (repeat_type IN ('daily', 'weekly', 'monthly')),
  repeat_until date,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'playing', 'completed', 'cancelled')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT media_or_program CHECK (
    (media_id IS NOT NULL AND program_id IS NULL) OR
    (media_id IS NULL AND program_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(media_type);
CREATE INDEX IF NOT EXISTS idx_media_library_source ON media_library(source_type);
CREATE INDEX IF NOT EXISTS idx_playout_schedule_date ON playout_schedule(scheduled_date, channel_type);
CREATE INDEX IF NOT EXISTS idx_playout_schedule_status ON playout_schedule(status);

-- Enable RLS
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE playout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playout_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_library
CREATE POLICY "Admin users can view all media"
  ON media_library FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can insert media"
  ON media_library FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update media"
  ON media_library FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete media"
  ON media_library FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for playout_programs
CREATE POLICY "Admin users can view all programs"
  ON playout_programs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can insert programs"
  ON playout_programs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update programs"
  ON playout_programs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete programs"
  ON playout_programs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for playout_schedule
CREATE POLICY "Admin users can view all schedules"
  ON playout_schedule FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can insert schedules"
  ON playout_schedule FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update schedules"
  ON playout_schedule FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete schedules"
  ON playout_schedule FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public policies for viewing schedules (for public TV/Radio pages)
CREATE POLICY "Public can view schedules"
  ON playout_schedule FOR SELECT
  TO anon
  USING (status IN ('scheduled', 'playing'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_media_library_updated_at ON media_library;
CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playout_programs_updated_at ON playout_programs;
CREATE TRIGGER update_playout_programs_updated_at
  BEFORE UPDATE ON playout_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playout_schedule_updated_at ON playout_schedule;
CREATE TRIGGER update_playout_schedule_updated_at
  BEFORE UPDATE ON playout_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
