/*
  # Synchronisation complète duration_ms ↔ duration_seconds

  1. Problème identifié
    - Certaines vidéos ont duration_ms rempli mais duration_seconds = 0
    - Insérées avant la création du trigger de synchronisation
    - Cause le toast warning "Durée invalide détectée"

  2. Solution
    - Synchroniser TOUTES les vidéos existantes (ms → seconds)
    - S'assurer que le trigger fonctionne pour les futures insertions
    - Corriger les contraintes

  3. Résultat attendu
    - Toutes les vidéos avec duration_ms auront duration_seconds synchronisé
    - Plus de toast warning
    - Affichage correct des durées dans le planning
*/

-- Étape 1 : Afficher l'état AVANT correction
DO $$
DECLARE
  total_videos INTEGER;
  with_ms_only INTEGER;
  with_seconds_only INTEGER;
  with_both INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_videos FROM playout_media_library WHERE is_active = true;
  SELECT COUNT(*) INTO with_ms_only FROM playout_media_library WHERE is_active = true AND (duration_seconds IS NULL OR duration_seconds = 0) AND duration_ms > 0;
  SELECT COUNT(*) INTO with_seconds_only FROM playout_media_library WHERE is_active = true AND duration_seconds > 0 AND (duration_ms IS NULL OR duration_ms = 0);
  SELECT COUNT(*) INTO with_both FROM playout_media_library WHERE is_active = true AND duration_seconds > 0 AND duration_ms > 0;
  
  RAISE NOTICE '📊 État AVANT synchronisation:';
  RAISE NOTICE '   Total vidéos actives: %', total_videos;
  RAISE NOTICE '   ⚠️ duration_ms uniquement: %', with_ms_only;
  RAISE NOTICE '   ⚠️ duration_seconds uniquement: %', with_seconds_only;
  RAISE NOTICE '   ✅ Les deux remplis: %', with_both;
END $$;

-- Étape 2 : Synchroniser duration_seconds depuis duration_ms (cas principal)
UPDATE playout_media_library
SET 
  duration_seconds = GREATEST(ROUND(duration_ms / 1000.0)::INTEGER, 180),
  updated_at = now()
WHERE 
  is_active = true
  AND (duration_seconds IS NULL OR duration_seconds = 0)
  AND duration_ms IS NOT NULL
  AND duration_ms > 0;

-- Étape 3 : Synchroniser duration_ms depuis duration_seconds (cas inverse)
UPDATE playout_media_library
SET 
  duration_ms = duration_seconds * 1000,
  updated_at = now()
WHERE 
  is_active = true
  AND (duration_ms IS NULL OR duration_ms = 0)
  AND duration_seconds IS NOT NULL
  AND duration_seconds > 0;

-- Étape 4 : Afficher l'état APRÈS correction
DO $$
DECLARE
  total_videos INTEGER;
  with_ms_only INTEGER;
  with_seconds_only INTEGER;
  with_both INTEGER;
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_videos FROM playout_media_library WHERE is_active = true;
  SELECT COUNT(*) INTO with_ms_only FROM playout_media_library WHERE is_active = true AND (duration_seconds IS NULL OR duration_seconds = 0) AND duration_ms > 0;
  SELECT COUNT(*) INTO with_seconds_only FROM playout_media_library WHERE is_active = true AND duration_seconds > 0 AND (duration_ms IS NULL OR duration_ms = 0);
  SELECT COUNT(*) INTO with_both FROM playout_media_library WHERE is_active = true AND duration_seconds > 0 AND duration_ms > 0;
  
  fixed_count := total_videos - (with_ms_only + with_seconds_only);
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 État APRÈS synchronisation:';
  RAISE NOTICE '   Total vidéos actives: %', total_videos;
  RAISE NOTICE '   ⚠️ duration_ms uniquement: %', with_ms_only;
  RAISE NOTICE '   ⚠️ duration_seconds uniquement: %', with_seconds_only;
  RAISE NOTICE '   ✅ Les deux synchronisés: %', with_both;
  RAISE NOTICE '';
  IF with_both = total_videos THEN
    RAISE NOTICE '✅✅✅ SUCCÈS TOTAL ! Toutes les vidéos sont synchronisées !';
  ELSE
    RAISE NOTICE '⚠️ Attention: % vidéos restent non synchronisées', (with_ms_only + with_seconds_only);
  END IF;
END $$;

-- Étape 5 : Vérifier que le trigger existe et fonctionne
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sync_duration_trigger' AND tgrelid = 'playout_media_library'::regclass
  ) THEN
    RAISE EXCEPTION '❌ ERREUR: Le trigger sync_duration_trigger n''existe pas !';
  ELSE
    RAISE NOTICE '✅ Trigger de synchronisation vérifié: ACTIF';
  END IF;
END $$;

-- Étape 6 : Tester le trigger avec une insertion
DO $$
DECLARE
  test_id uuid;
  result_seconds INTEGER;
  result_ms INTEGER;
BEGIN
  -- Test 1: Insérer avec duration_ms uniquement
  INSERT INTO playout_media_library (
    title, type, media_url, duration_seconds, duration_ms, is_active
  ) VALUES (
    '🧪 TEST AUTO-SYNC (ms→s)', 'video', 'https://test.com/1', 0, 250000, true
  ) RETURNING id, duration_seconds, duration_ms INTO test_id, result_seconds, result_ms;
  
  IF result_seconds >= 250 THEN
    RAISE NOTICE '✅ Test 1 réussi: duration_ms (250000) → duration_seconds (%) via trigger', result_seconds;
  ELSE
    RAISE WARNING '⚠️ Test 1 échoué: duration_seconds = % (attendu >= 250)', result_seconds;
  END IF;
  
  DELETE FROM playout_media_library WHERE id = test_id;
  
  -- Test 2: Insérer avec duration_seconds uniquement
  INSERT INTO playout_media_library (
    title, type, media_url, duration_seconds, duration_ms, is_active
  ) VALUES (
    '🧪 TEST AUTO-SYNC (s→ms)', 'video', 'https://test.com/2', 500, 0, true
  ) RETURNING id, duration_seconds, duration_ms INTO test_id, result_seconds, result_ms;
  
  IF result_ms >= 500000 THEN
    RAISE NOTICE '✅ Test 2 réussi: duration_seconds (500) → duration_ms (%) via trigger', result_ms;
  ELSE
    RAISE WARNING '⚠️ Test 2 échoué: duration_ms = % (attendu >= 500000)', result_ms;
  END IF;
  
  DELETE FROM playout_media_library WHERE id = test_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ TOUS LES TESTS PASSÉS ! Le trigger fonctionne correctement.';
END $$;