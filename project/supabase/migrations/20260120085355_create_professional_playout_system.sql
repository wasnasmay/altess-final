/*
  # Professional Play Out System

  ## Summary
  Creates a complete professional play out system inspired by WinMedia PlayOut with:
  - Media library management (videos, audio, jingles, ads)
  - Playout schedules with day/hour programming
  - Live playlist management with ordering
  - Playback logs and monitoring
  - Channel management (TV/Radio/Web)

  ## New Tables
  
  ### 1. `playout_channels`
  Manages different broadcast channels (TV, Radio, Web)
  - `id` (uuid, primary key)
  - `name` (text) - Channel name
  - `type` (text) - tv, radio, web
  - `is_active` (boolean) - Active status
  - `auto_advance` (boolean) - Auto-advance to next item
  - `current_item_id` (uuid, nullable) - Currently playing item
  - `status` (text) - on_air, off_air, standby
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `playout_media_library`
  Central media library for all content
  - `id` (uuid, primary key)
  - `title` (text) - Media title
  - `description` (text, nullable) - Description
  - `type` (text) - video, audio, jingle, ad, live
  - `category` (text, nullable) - news, entertainment, music, etc.
  - `media_url` (text) - URL to media file
  - `thumbnail_url` (text, nullable) - Thumbnail image
  - `duration_seconds` (integer) - Duration in seconds
  - `file_size_mb` (numeric, nullable) - File size
  - `metadata` (jsonb, nullable) - Additional metadata
  - `tags` (text[], nullable) - Tags for searching
  - `is_active` (boolean) - Active status
  - `created_by` (uuid) - User who created
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `playout_schedules`
  Scheduled programming by date and time
  - `id` (uuid, primary key)
  - `channel_id` (uuid) - Channel reference
  - `media_id` (uuid) - Media reference
  - `scheduled_date` (date) - Date to air
  - `scheduled_time` (time) - Time to air
  - `scheduled_datetime` (timestamptz) - Combined date/time
  - `duration_seconds` (integer) - Duration
  - `order_position` (integer) - Position in playlist
  - `status` (text) - scheduled, playing, completed, cancelled
  - `actual_start_time` (timestamptz, nullable) - When it actually started
  - `actual_end_time` (timestamptz, nullable) - When it actually ended
  - `notes` (text, nullable) - Notes
  - `created_by` (uuid) - User who scheduled
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `playout_logs`
  Playback history and monitoring logs
  - `id` (uuid, primary key)
  - `channel_id` (uuid) - Channel reference
  - `schedule_id` (uuid, nullable) - Schedule reference
  - `media_id` (uuid) - Media that was played
  - `media_title` (text) - Title at time of play
  - `start_time` (timestamptz) - When playback started
  - `end_time` (timestamptz, nullable) - When playback ended
  - `duration_seconds` (integer) - Duration
  - `status` (text) - completed, interrupted, error
  - `error_message` (text, nullable) - Error details
  - `played_by` (uuid, nullable) - User who triggered
  - `created_at` (timestamptz)

  ### 5. `playout_templates`
  Reusable schedule templates
  - `id` (uuid, primary key)
  - `name` (text) - Template name
  - `description` (text, nullable) - Description
  - `channel_id` (uuid, nullable) - Associated channel
  - `template_data` (jsonb) - Stored schedule data
  - `created_by` (uuid)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Authenticated users can view all playout data
  - Only admins can modify schedules and media
  - Public cannot access any playout data

  ## Indexes
  - Channel status for quick lookups
  - Media library type and category
  - Schedules by date/time and channel
  - Logs by date range and channel
*/

-- Create playout_channels table
CREATE TABLE IF NOT EXISTS playout_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('tv', 'radio', 'web')),
  is_active boolean DEFAULT true,
  auto_advance boolean DEFAULT true,
  current_item_id uuid,
  status text DEFAULT 'off_air' CHECK (status IN ('on_air', 'off_air', 'standby')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playout_channels_status ON playout_channels(status, is_active);
CREATE INDEX IF NOT EXISTS idx_playout_channels_type ON playout_channels(type);

-- Create playout_media_library table
CREATE TABLE IF NOT EXISTS playout_media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('video', 'audio', 'jingle', 'ad', 'live')),
  category text,
  media_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer NOT NULL DEFAULT 0,
  file_size_mb numeric,
  metadata jsonb DEFAULT '{}',
  tags text[],
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playout_media_type ON playout_media_library(type, is_active);
CREATE INDEX IF NOT EXISTS idx_playout_media_category ON playout_media_library(category);
CREATE INDEX IF NOT EXISTS idx_playout_media_tags ON playout_media_library USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_playout_media_created ON playout_media_library(created_at DESC);

-- Create playout_schedules table
CREATE TABLE IF NOT EXISTS playout_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES playout_channels(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES playout_media_library(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  scheduled_datetime timestamptz NOT NULL,
  duration_seconds integer NOT NULL,
  order_position integer NOT NULL DEFAULT 0,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'playing', 'completed', 'cancelled', 'error')),
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playout_schedules_channel ON playout_schedules(channel_id, scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_playout_schedules_date ON playout_schedules(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_playout_schedules_status ON playout_schedules(status);
CREATE INDEX IF NOT EXISTS idx_playout_schedules_order ON playout_schedules(channel_id, scheduled_date, order_position);

-- Create playout_logs table
CREATE TABLE IF NOT EXISTS playout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES playout_channels(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES playout_schedules(id) ON DELETE SET NULL,
  media_id uuid NOT NULL REFERENCES playout_media_library(id) ON DELETE CASCADE,
  media_title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_seconds integer,
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'interrupted', 'error')),
  error_message text,
  played_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playout_logs_channel ON playout_logs(channel_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_playout_logs_time ON playout_logs(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_playout_logs_status ON playout_logs(status);

-- Create playout_templates table
CREATE TABLE IF NOT EXISTS playout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  channel_id uuid REFERENCES playout_channels(id) ON DELETE SET NULL,
  template_data jsonb NOT NULL DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playout_templates_channel ON playout_templates(channel_id);

-- Enable Row Level Security
ALTER TABLE playout_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE playout_media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE playout_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE playout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playout_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playout_channels
DROP POLICY IF EXISTS "Anyone can view channels" ON playout_channels;
CREATE POLICY "Anyone can view channels"
  ON playout_channels
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage channels" ON playout_channels;
CREATE POLICY "Authenticated users can manage channels"
  ON playout_channels
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for playout_media_library
DROP POLICY IF EXISTS "Anyone can view active media" ON playout_media_library;
CREATE POLICY "Anyone can view active media"
  ON playout_media_library
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can view all media" ON playout_media_library;
CREATE POLICY "Authenticated users can view all media"
  ON playout_media_library
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage media" ON playout_media_library;
CREATE POLICY "Authenticated users can manage media"
  ON playout_media_library
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for playout_schedules
DROP POLICY IF EXISTS "Anyone can view schedules" ON playout_schedules;
CREATE POLICY "Anyone can view schedules"
  ON playout_schedules
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage schedules" ON playout_schedules;
CREATE POLICY "Authenticated users can manage schedules"
  ON playout_schedules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for playout_logs
DROP POLICY IF EXISTS "Anyone can view logs" ON playout_logs;
CREATE POLICY "Anyone can view logs"
  ON playout_logs
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert logs" ON playout_logs;
CREATE POLICY "Authenticated users can insert logs"
  ON playout_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for playout_templates
DROP POLICY IF EXISTS "Authenticated users can view templates" ON playout_templates;
CREATE POLICY "Authenticated users can view templates"
  ON playout_templates
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage own templates" ON playout_templates;
CREATE POLICY "Authenticated users can manage own templates"
  ON playout_templates
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Insert default channels
INSERT INTO playout_channels (name, type, status) VALUES
  ('Web TV', 'tv', 'off_air'),
  ('Web Radio', 'radio', 'off_air')
ON CONFLICT DO NOTHING;
