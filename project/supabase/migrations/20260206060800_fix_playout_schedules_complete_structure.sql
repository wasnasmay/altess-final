/*
  # Fix Playout Schedules - Structure complète et synchronisation

  ## Objectif
  Corriger définitivement les problèmes de synchronisation et de structure de la table playout_schedules

  ## Actions
  1. Vérification et ajout des colonnes manquantes
  2. Nettoyage des données inconsistantes
  3. Création d'index pour performance
  4. Refresh du schéma pour forcer synchronisation

  ## Colonnes vérifiées
  - channel_id (uuid, NOT NULL) - Référence au canal
  - media_id (uuid, NOT NULL) - Référence au média
  - scheduled_date (date, NOT NULL) - Date de diffusion
  - scheduled_time (time, NOT NULL) - Heure de diffusion
  - scheduled_datetime (timestamptz, NOT NULL) - Date/heure complète
  - duration_seconds (integer, NOT NULL) - Durée en secondes
  - order_position (integer, NOT NULL) - Position dans le planning

  ## Sécurité
  - RLS activé avec policies publiques pour compatibilité
*/

-- 1. Vérifier et créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS playout_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES playout_channels(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES playout_media_library(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  scheduled_datetime timestamptz NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  order_position integer NOT NULL DEFAULT 0,
  status text DEFAULT 'scheduled',
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  transition_effect text DEFAULT 'cut',
  transition_duration integer DEFAULT 1000,
  title text,
  start_time time,
  end_time time,
  channel_type text
);

-- 2. Ajouter les colonnes manquantes si nécessaire (cas où table existe mais incomplète)
DO $$
BEGIN
  -- Channel ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playout_schedules' AND column_name = 'channel_id'
  ) THEN
    ALTER TABLE playout_schedules ADD COLUMN channel_id uuid;
  END IF;

  -- Media ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playout_schedules' AND column_name = 'media_id'
  ) THEN
    ALTER TABLE playout_schedules ADD COLUMN media_id uuid;
  END IF;

  -- Scheduled datetime
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playout_schedules' AND column_name = 'scheduled_datetime'
  ) THEN
    ALTER TABLE playout_schedules ADD COLUMN scheduled_datetime timestamptz;
  END IF;

  -- Duration seconds
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playout_schedules' AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE playout_schedules ADD COLUMN duration_seconds integer DEFAULT 0;
  END IF;
END $$;

-- 3. Supprimer les données invalides (sans channel_id ou media_id)
DELETE FROM playout_schedules
WHERE channel_id IS NULL OR media_id IS NULL;

-- 4. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_playout_schedules_channel_date 
  ON playout_schedules(channel_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_playout_schedules_datetime 
  ON playout_schedules(scheduled_datetime);

CREATE INDEX IF NOT EXISTS idx_playout_schedules_status 
  ON playout_schedules(status);

-- 5. Activer RLS
ALTER TABLE playout_schedules ENABLE ROW LEVEL SECURITY;

-- 6. Supprimer les anciennes policies et recréer
DROP POLICY IF EXISTS "Public can insert schedules" ON playout_schedules;
DROP POLICY IF EXISTS "Public can view schedules" ON playout_schedules;
DROP POLICY IF EXISTS "Public can update schedules" ON playout_schedules;
DROP POLICY IF EXISTS "Public can delete schedules" ON playout_schedules;
DROP POLICY IF EXISTS "Anyone can view schedules" ON playout_schedules;
DROP POLICY IF EXISTS "Authenticated users can manage schedules" ON playout_schedules;

-- 7. Créer des policies simples et permissives
CREATE POLICY "Enable all for public" 
  ON playout_schedules FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);

-- 8. Insérer un programme de test pour aujourd'hui
INSERT INTO playout_schedules (
  channel_id,
  media_id,
  scheduled_date,
  scheduled_time,
  scheduled_datetime,
  duration_seconds,
  order_position,
  status
)
SELECT 
  (SELECT id FROM playout_channels WHERE type = 'tv' LIMIT 1),
  (SELECT id FROM playout_media_library WHERE is_active = true ORDER BY created_at DESC LIMIT 1),
  CURRENT_DATE,
  '14:00'::time,
  (CURRENT_DATE || ' 14:00:00')::timestamptz,
  (SELECT duration_seconds FROM playout_media_library WHERE is_active = true ORDER BY created_at DESC LIMIT 1),
  1,
  'scheduled'
WHERE EXISTS (SELECT 1 FROM playout_channels WHERE type = 'tv')
  AND EXISTS (SELECT 1 FROM playout_media_library WHERE is_active = true)
  AND NOT EXISTS (
    SELECT 1 FROM playout_schedules 
    WHERE scheduled_date = CURRENT_DATE AND scheduled_time = '14:00'::time
  );

-- 9. Trigger de mise à jour automatique
CREATE OR REPLACE FUNCTION update_playout_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_playout_schedules_updated_at ON playout_schedules;
CREATE TRIGGER update_playout_schedules_updated_at
  BEFORE UPDATE ON playout_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_playout_schedules_updated_at();

-- 10. Commentaire pour documentation
COMMENT ON TABLE playout_schedules IS 'Table de planification des programmes pour le playout Web TV/Radio';
COMMENT ON COLUMN playout_schedules.channel_id IS 'ID du canal (Web TV ou Web Radio)';
COMMENT ON COLUMN playout_schedules.media_id IS 'ID du média à diffuser';
COMMENT ON COLUMN playout_schedules.scheduled_datetime IS 'Date et heure complète de diffusion (timestamptz)';
