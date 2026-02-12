/*
  # Synchronisation complète du système Playout
  
  **Date** : 5 Février 2026
  **Objectif** : S'assurer que toutes les tables playout existent
  
  ## Problème résolu
  - Erreur : "Could not find table 'public.playout_schedules' in schema cache"
  - Le code utilise playout_schedules mais la table n'existe pas
  
  ## Tables créées
  
  ### 1. playout_channels
  Gestion des canaux de diffusion (TV, Radio, Web)
  - id (uuid, primary key)
  - name (text) - Nom du canal
  - type (text) - tv, radio, web
  - is_active (boolean)
  - status (text) - on_air, off_air, standby
  
  ### 2. playout_media_library  
  Bibliothèque de médias
  - id (uuid, primary key)
  - title (text) - Titre du média
  - type (text) - video, audio, jingle, ad, live
  - media_url (text) - URL du fichier
  - duration_seconds (integer) - Durée en secondes
  - thumbnail_url (text, nullable)
  - is_active (boolean)
  
  ### 3. playout_schedules
  Planning de diffusion
  - id (uuid, primary key)
  - channel_id (uuid) - Référence au canal
  - media_id (uuid) - Référence au média
  - scheduled_date (date) - Date de diffusion
  - scheduled_time (time) - Heure de diffusion
  - scheduled_datetime (timestamptz) - Date et heure combinées
  - duration_seconds (integer) - Durée
  - order_position (integer) - Position dans le planning
  - status (text) - scheduled, playing, completed, cancelled
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Policies publiques permissives (pour développement)
  - En production : utiliser authentification ou SERVICE_ROLE_KEY
*/

-- ================================================
-- 1. PLAYOUT_CHANNELS
-- ================================================

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

-- RLS
ALTER TABLE playout_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view channels" ON playout_channels;
CREATE POLICY "Public can view channels" ON playout_channels FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert channels" ON playout_channels;
CREATE POLICY "Public can insert channels" ON playout_channels FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update channels" ON playout_channels;
CREATE POLICY "Public can update channels" ON playout_channels FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ================================================
-- 2. PLAYOUT_MEDIA_LIBRARY
-- ================================================

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

-- RLS
ALTER TABLE playout_media_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view media" ON playout_media_library;
CREATE POLICY "Public can view media" ON playout_media_library FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert media" ON playout_media_library;
CREATE POLICY "Public can insert media" ON playout_media_library FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update media" ON playout_media_library;
CREATE POLICY "Public can update media" ON playout_media_library FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete media" ON playout_media_library;
CREATE POLICY "Public can delete media" ON playout_media_library FOR DELETE TO public USING (true);

-- ================================================
-- 3. PLAYOUT_SCHEDULES
-- ================================================

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

-- RLS
ALTER TABLE playout_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view schedules" ON playout_schedules;
CREATE POLICY "Public can view schedules" ON playout_schedules FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert schedules" ON playout_schedules;
CREATE POLICY "Public can insert schedules" ON playout_schedules FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update schedules" ON playout_schedules;
CREATE POLICY "Public can update schedules" ON playout_schedules FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete schedules" ON playout_schedules;
CREATE POLICY "Public can delete schedules" ON playout_schedules FOR DELETE TO public USING (true);

-- ================================================
-- 4. DONNÉES DE TEST (si aucun canal n'existe)
-- ================================================

DO $$
BEGIN
  -- Créer un canal TV par défaut s'il n'en existe aucun
  IF NOT EXISTS (SELECT 1 FROM playout_channels WHERE type = 'tv') THEN
    INSERT INTO playout_channels (name, type, is_active, status)
    VALUES ('Web TV', 'tv', true, 'on_air');
    
    RAISE NOTICE '✅ Canal Web TV créé par défaut';
  END IF;
  
  -- Créer un canal Radio par défaut s'il n'en existe aucun
  IF NOT EXISTS (SELECT 1 FROM playout_channels WHERE type = 'radio') THEN
    INSERT INTO playout_channels (name, type, is_active, status)
    VALUES ('Web Radio', 'radio', true, 'on_air');
    
    RAISE NOTICE '✅ Canal Web Radio créé par défaut';
  END IF;
END $$;

-- ================================================
-- 5. RAFRAÎCHIR LE CACHE
-- ================================================

-- Notifier PostgREST de recharger le schéma
NOTIFY pgrst, 'reload schema';

-- Résumé
DO $$
DECLARE
  channels_count integer;
  media_count integer;
  schedules_count integer;
BEGIN
  SELECT COUNT(*) INTO channels_count FROM playout_channels;
  SELECT COUNT(*) INTO media_count FROM playout_media_library;
  SELECT COUNT(*) INTO schedules_count FROM playout_schedules;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SYNCHRONISATION PLAYOUT TERMINÉE';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Tables créées/vérifiées :';
  RAISE NOTICE '  - playout_channels (% canaux)', channels_count;
  RAISE NOTICE '  - playout_media_library (% médias)', media_count;
  RAISE NOTICE '  - playout_schedules (% programmes)', schedules_count;
  RAISE NOTICE '';
  RAISE NOTICE 'RLS activé avec policies publiques permissives';
  RAISE NOTICE 'Schéma rafraîchi dans le cache';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
