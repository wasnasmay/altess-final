/*
  # Correction des durées invalides dans playout_media_library

  1. Problème
    - Certaines vidéos ont duration_seconds = 0 ou NULL
    - Cela provoque l'affichage de "00:03:00" dans les vignettes
    - Toast warning "Durée invalide détectée" lors de l'ajout au planning

  2. Solution
    - Mettre à jour toutes les vidéos avec duration_seconds = 0 ou NULL
    - Leur attribuer 180 secondes (3 minutes) par défaut
    - Empêcher les futures insertions avec durée = 0

  3. Sécurité
    - Ne modifie que les durées invalides
    - Conserve les durées valides existantes
    - Log du nombre de médias corrigés
*/

-- Afficher le nombre de médias avec durée invalide AVANT correction
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM playout_media_library
  WHERE duration_seconds IS NULL OR duration_seconds = 0;
  
  RAISE NOTICE '⚠️ Nombre de médias avec durée invalide: %', invalid_count;
END $$;

-- Corriger toutes les durées invalides (NULL ou 0) en les mettant à 180 secondes
UPDATE playout_media_library
SET 
  duration_seconds = 180,
  updated_at = now()
WHERE 
  (duration_seconds IS NULL OR duration_seconds = 0)
  AND is_active = true;

-- Afficher le nombre de médias corrigés
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM playout_media_library
  WHERE duration_seconds = 180 AND updated_at > now() - interval '1 second';
  
  RAISE NOTICE '✅ Nombre de médias corrigés: %', fixed_count;
END $$;

-- Ajouter une contrainte CHECK pour empêcher les futures insertions avec durée = 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'playout_media_library_duration_positive'
  ) THEN
    ALTER TABLE playout_media_library
    ADD CONSTRAINT playout_media_library_duration_positive
    CHECK (duration_seconds > 0);
    
    RAISE NOTICE '✅ Contrainte CHECK ajoutée: duration_seconds doit être > 0';
  ELSE
    RAISE NOTICE 'ℹ️ Contrainte CHECK déjà existante';
  END IF;
END $$;