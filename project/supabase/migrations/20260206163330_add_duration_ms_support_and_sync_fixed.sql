/*
  # Support pour duration_ms et synchronisation avec duration_seconds

  1. Problème identifié
    - La base de données en production peut avoir `duration_ms` (millisecondes)
    - Le code cherche `duration_seconds` (secondes)
    - Résultat : durées NULL → affichage "00:03:00" par défaut

  2. Solution
    - Ajouter la colonne `duration_ms` si elle n'existe pas
    - Synchroniser les deux colonnes (ms ↔ seconds)
    - Utiliser `duration_seconds` comme source de vérité
    - Convertir automatiquement entre les deux formats
*/

-- Étape 1 : Ajouter duration_ms si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playout_media_library' AND column_name = 'duration_ms'
  ) THEN
    ALTER TABLE playout_media_library 
    ADD COLUMN duration_ms INTEGER;
    RAISE NOTICE '✅ Colonne duration_ms ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne duration_ms existe déjà';
  END IF;
END $$;

-- Étape 2 : Synchroniser duration_ms depuis duration_seconds
UPDATE playout_media_library
SET duration_ms = duration_seconds * 1000
WHERE duration_ms IS NULL AND duration_seconds IS NOT NULL AND duration_seconds > 0;

-- Étape 3 : Synchroniser duration_seconds depuis duration_ms
UPDATE playout_media_library
SET duration_seconds = GREATEST(ROUND(duration_ms / 1000.0)::INTEGER, 180)
WHERE 
  (duration_seconds IS NULL OR duration_seconds = 0)
  AND duration_ms IS NOT NULL 
  AND duration_ms > 0;

-- Étape 4 : Afficher le résultat
DO $$
DECLARE
  total_count INTEGER;
  valid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM playout_media_library WHERE is_active = true;
  SELECT COUNT(*) INTO valid_count FROM playout_media_library WHERE is_active = true AND duration_seconds > 0;
  
  RAISE NOTICE '📊 Total médias actifs: %', total_count;
  RAISE NOTICE '   ✅ Durées valides: %', valid_count;
END $$;

-- Étape 5 : Créer trigger de synchronisation
CREATE OR REPLACE FUNCTION sync_duration_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.duration_seconds IS NOT NULL AND NEW.duration_seconds > 0 THEN
    NEW.duration_ms = NEW.duration_seconds * 1000;
  END IF;
  
  IF NEW.duration_ms IS NOT NULL AND NEW.duration_ms > 0 AND (NEW.duration_seconds IS NULL OR NEW.duration_seconds = 0) THEN
    NEW.duration_seconds = GREATEST(ROUND(NEW.duration_ms / 1000.0)::INTEGER, 180);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_duration_trigger ON playout_media_library;

CREATE TRIGGER sync_duration_trigger
  BEFORE INSERT OR UPDATE ON playout_media_library
  FOR EACH ROW
  EXECUTE FUNCTION sync_duration_fields();

-- Étape 6 : Mettre à jour contrainte
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'playout_media_library_duration_positive') THEN
    ALTER TABLE playout_media_library DROP CONSTRAINT playout_media_library_duration_positive;
  END IF;
  
  ALTER TABLE playout_media_library
  ADD CONSTRAINT playout_media_library_duration_valid
  CHECK (duration_seconds > 0 OR duration_ms > 0);
  
  RAISE NOTICE '✅ Contrainte de durée mise à jour';
END $$;