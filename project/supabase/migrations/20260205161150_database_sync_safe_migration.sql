/*
  # Synchronisation sécurisée de la base de données - 5 Février 2026

  **Objectif** : Corriger les problèmes de structure sans casser les données

  ## Actions
  1. Ajout des colonnes manquantes
  2. Synchronisation des données existantes
  3. Index de performance
  4. Triggers automatiques
  5. RLS policies complètes
*/

-- ================================================
-- PARTIE 1 : AJOUT DES COLONNES MANQUANTES
-- ================================================

-- Ajouter description à playout_media_library
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'playout_media_library'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE playout_media_library ADD COLUMN description text;
    RAISE NOTICE '✅ Colonne description ajoutée à playout_media_library';
  END IF;
END $$;

-- Ajouter title à playout_schedules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'playout_schedules'
    AND column_name = 'title'
  ) THEN
    ALTER TABLE playout_schedules ADD COLUMN title text;
    RAISE NOTICE '✅ Colonne title ajoutée à playout_schedules';
  END IF;
END $$;

-- Ajouter start_time à playout_schedules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'playout_schedules'
    AND column_name = 'start_time'
  ) THEN
    ALTER TABLE playout_schedules ADD COLUMN start_time time;
    RAISE NOTICE '✅ Colonne start_time ajoutée à playout_schedules';
  END IF;
END $$;

-- Ajouter end_time à playout_schedules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'playout_schedules'
    AND column_name = 'end_time'
  ) THEN
    ALTER TABLE playout_schedules ADD COLUMN end_time time;
    RAISE NOTICE '✅ Colonne end_time ajoutée à playout_schedules';
  END IF;
END $$;

-- ================================================
-- PARTIE 2 : SYNCHRONISATION DES DONNÉES EXISTANTES
-- ================================================

-- Synchroniser start_time avec scheduled_time
UPDATE playout_schedules
SET start_time = scheduled_time
WHERE start_time IS NULL AND scheduled_time IS NOT NULL;

-- Calculer end_time
UPDATE playout_schedules
SET end_time = (start_time::interval + (duration_seconds || ' seconds')::interval)::time
WHERE end_time IS NULL AND start_time IS NOT NULL AND duration_seconds IS NOT NULL;

-- Remplir title depuis media_library
UPDATE playout_schedules ps
SET title = pm.title
FROM playout_media_library pm
WHERE ps.media_id = pm.id AND ps.title IS NULL;

-- ================================================
-- PARTIE 3 : RLS POLICIES
-- ================================================

ALTER TABLE playout_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE playout_media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE playout_channels ENABLE ROW LEVEL SECURITY;

-- Policies pour playout_schedules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playout_schedules' AND policyname = 'Public can view schedules'
  ) THEN
    CREATE POLICY "Public can view schedules"
      ON playout_schedules FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playout_schedules' AND policyname = 'Public can insert schedules'
  ) THEN
    CREATE POLICY "Public can insert schedules"
      ON playout_schedules FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playout_schedules' AND policyname = 'Public can update schedules'
  ) THEN
    CREATE POLICY "Public can update schedules"
      ON playout_schedules FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playout_schedules' AND policyname = 'Public can delete schedules'
  ) THEN
    CREATE POLICY "Public can delete schedules"
      ON playout_schedules FOR DELETE TO public USING (true);
  END IF;
END $$;

-- Policies pour playout_media_library
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playout_media_library' AND policyname = 'Public can view media'
  ) THEN
    CREATE POLICY "Public can view media"
      ON playout_media_library FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playout_media_library' AND policyname = 'Public can insert media'
  ) THEN
    CREATE POLICY "Public can insert media"
      ON playout_media_library FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playout_media_library' AND policyname = 'Public can update media'
  ) THEN
    CREATE POLICY "Public can update media"
      ON playout_media_library FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playout_media_library' AND policyname = 'Public can delete media'
  ) THEN
    CREATE POLICY "Public can delete media"
      ON playout_media_library FOR DELETE TO public USING (true);
  END IF;
END $$;

-- Policies pour playout_channels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playout_channels' AND policyname = 'Public can view channels'
  ) THEN
    CREATE POLICY "Public can view channels"
      ON playout_channels FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playout_channels' AND policyname = 'Public can insert channels'
  ) THEN
    CREATE POLICY "Public can insert channels"
      ON playout_channels FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playout_channels' AND policyname = 'Public can update channels'
  ) THEN
    CREATE POLICY "Public can update channels"
      ON playout_channels FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ================================================
-- PARTIE 4 : INDEX POUR PERFORMANCES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_playout_schedules_datetime
  ON playout_schedules(scheduled_datetime DESC);

CREATE INDEX IF NOT EXISTS idx_playout_schedules_channel_date
  ON playout_schedules(channel_id, scheduled_date, order_position);

CREATE INDEX IF NOT EXISTS idx_playout_schedules_status_active
  ON playout_schedules(status) WHERE status != 'completed';

CREATE INDEX IF NOT EXISTS idx_playout_schedules_media
  ON playout_schedules(media_id);

CREATE INDEX IF NOT EXISTS idx_playout_media_type
  ON playout_media_library(type, is_active);

CREATE INDEX IF NOT EXISTS idx_playout_channels_active
  ON playout_channels(is_active, type);

-- ================================================
-- PARTIE 5 : TRIGGER DE SYNCHRONISATION
-- ================================================

CREATE OR REPLACE FUNCTION sync_playout_schedule_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Synchroniser start_time avec scheduled_time
  IF NEW.start_time IS NULL AND NEW.scheduled_time IS NOT NULL THEN
    NEW.start_time := NEW.scheduled_time;
  END IF;

  -- Calculer end_time
  IF NEW.end_time IS NULL AND NEW.start_time IS NOT NULL AND NEW.duration_seconds IS NOT NULL THEN
    NEW.end_time := (NEW.start_time::interval + (NEW.duration_seconds || ' seconds')::interval)::time;
  END IF;

  -- Synchroniser title
  IF NEW.title IS NULL AND NEW.media_id IS NOT NULL THEN
    SELECT title INTO NEW.title FROM playout_media_library WHERE id = NEW.media_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_schedule_times ON playout_schedules;
CREATE TRIGGER trigger_sync_schedule_times
  BEFORE INSERT OR UPDATE ON playout_schedules
  FOR EACH ROW
  EXECUTE FUNCTION sync_playout_schedule_times();

-- ================================================
-- RAFRAÎCHIR LE CACHE
-- ================================================

NOTIFY pgrst, 'reload schema';

-- ================================================
-- RAPPORT FINAL
-- ================================================

DO $$
DECLARE
  channels_count INTEGER;
  media_count INTEGER;
  schedules_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO channels_count FROM playout_channels;
  SELECT COUNT(*) INTO media_count FROM playout_media_library;
  SELECT COUNT(*) INTO schedules_count FROM playout_schedules;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SYNCHRONISATION BASE DE DONNÉES TERMINÉE';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES :';
  RAISE NOTICE '  • Canaux     : %', channels_count;
  RAISE NOTICE '  • Médias     : %', media_count;
  RAISE NOTICE '  • Programmes : %', schedules_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ MODIFICATIONS :';
  RAISE NOTICE '  • Colonnes ajoutées (title, start_time, end_time)';
  RAISE NOTICE '  • Triggers de synchronisation créés';
  RAISE NOTICE '  • Index de performance optimisés';
  RAISE NOTICE '  • RLS policies complètes';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
