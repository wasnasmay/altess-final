/*
  # SCRIPT SQL COMPLET - Reconstruction Tables Playout
  
  Date: 6 Février 2026 - Version 2.0
  
  ## Tables incluses
  1. playout_channels - Canaux (Web TV / Web Radio)
  2. playout_media_library - Bibliothèque de médias
  3. playout_schedules - Programmation
  4. radio_stations - Stations de radio
*/

-- ============================================================
-- 1. playout_channels
-- ============================================================

CREATE TABLE IF NOT EXISTS playout_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('tv', 'radio')),
  description text,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE playout_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read channels" ON playout_channels;
CREATE POLICY "Public can read channels" ON playout_channels FOR SELECT TO public USING (true);

INSERT INTO playout_channels (name, type, description)
SELECT 'Web TV', 'tv', 'Canal de diffusion Web TV'
WHERE NOT EXISTS (SELECT 1 FROM playout_channels WHERE type = 'tv');

INSERT INTO playout_channels (name, type, description)
SELECT 'Web Radio', 'radio', 'Canal de diffusion Web Radio'
WHERE NOT EXISTS (SELECT 1 FROM playout_channels WHERE type = 'radio');

-- ============================================================
-- 2. playout_media_library
-- ============================================================

CREATE TABLE IF NOT EXISTS playout_media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL,
  category text,
  media_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer NOT NULL DEFAULT 0,
  file_size_mb numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[],
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playout_media_type ON playout_media_library(type);
CREATE INDEX IF NOT EXISTS idx_playout_media_active ON playout_media_library(is_active);

ALTER TABLE playout_media_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can manage media" ON playout_media_library;
CREATE POLICY "Public can manage media" ON playout_media_library FOR ALL TO public USING (true) WITH CHECK (true);

-- ============================================================
-- 3. playout_schedules
-- ============================================================

CREATE TABLE IF NOT EXISTS playout_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES playout_channels(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES playout_media_library(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  scheduled_datetime timestamptz NOT NULL,
  duration_seconds integer NOT NULL,
  order_position integer NOT NULL DEFAULT 0,
  status text DEFAULT 'scheduled',
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  transition_effect text DEFAULT 'cut',
  transition_duration integer DEFAULT 1000,
  title text,
  start_time time,
  end_time time,
  channel_type text
);

CREATE INDEX IF NOT EXISTS idx_schedules_channel_date ON playout_schedules(channel_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_datetime ON playout_schedules(scheduled_datetime);

ALTER TABLE playout_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can manage schedules" ON playout_schedules;
CREATE POLICY "Public can manage schedules" ON playout_schedules FOR ALL TO public USING (true) WITH CHECK (true);

-- ============================================================
-- 4. radio_stations
-- ============================================================

CREATE TABLE IF NOT EXISTS radio_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stream_url text NOT NULL,
  logo_url text,
  color text NOT NULL DEFAULT '#f59e0b',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_radio_stations_active ON radio_stations(is_active);

ALTER TABLE radio_stations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read stations" ON radio_stations;
CREATE POLICY "Public can read stations" ON radio_stations FOR SELECT TO public USING (is_active = true);

-- ============================================================
-- DONNÉES DE TEST
-- ============================================================

INSERT INTO playout_media_library (title, type, media_url, duration_seconds)
SELECT 'Test Video - Blues Live', 'video', 'https://www.youtube.com/watch?v=NhARbaifiQw', 7523
WHERE NOT EXISTS (SELECT 1 FROM playout_media_library WHERE media_url LIKE '%NhARbaifiQw%');

INSERT INTO playout_schedules (channel_id, media_id, scheduled_date, scheduled_time, scheduled_datetime, duration_seconds, order_position)
SELECT 
  (SELECT id FROM playout_channels WHERE type = 'tv' LIMIT 1),
  (SELECT id FROM playout_media_library LIMIT 1),
  CURRENT_DATE,
  '14:00'::time,
  (CURRENT_DATE || ' 14:00:00')::timestamptz,
  7523,
  1
WHERE EXISTS (SELECT 1 FROM playout_channels WHERE type = 'tv')
  AND EXISTS (SELECT 1 FROM playout_media_library)
  AND NOT EXISTS (SELECT 1 FROM playout_schedules WHERE scheduled_date = CURRENT_DATE AND scheduled_time = '14:00');
