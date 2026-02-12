-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT DE RÉPARATION : DURÉES VIDÉOS PLAYOUT
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif : Réparer toutes les vidéos qui ont duration_ms = 0 ou NULL
--            en utilisant duration_seconds comme source de vérité
-- ═══════════════════════════════════════════════════════════════════════════

-- ÉTAPE 1 : DIAGNOSTIC - Afficher les vidéos avec problème
-- ═════════════════════════════════════════════════════════════════════════
SELECT
  id,
  title,
  duration_seconds,
  duration_ms,
  CASE
    WHEN duration_ms IS NULL THEN '❌ NULL'
    WHEN duration_ms = 0 THEN '❌ ZÉRO'
    WHEN duration_ms != duration_seconds * 1000 THEN '⚠️ INCOHÉRENT'
    ELSE '✅ OK'
  END as status,
  created_at
FROM playout_media_library
WHERE
  duration_ms IS NULL
  OR duration_ms = 0
  OR duration_ms != duration_seconds * 1000
ORDER BY created_at DESC;

-- Si cette requête retourne des résultats, exécutez l'ÉTAPE 2

-- ÉTAPE 2 : RÉPARATION AUTOMATIQUE
-- ═════════════════════════════════════════════════════════════════════════
-- Cette requête va :
-- 1. Calculer duration_ms à partir de duration_seconds
-- 2. Mettre à jour UNIQUEMENT les lignes avec problème
-- ═════════════════════════════════════════════════════════════════════════

UPDATE playout_media_library
SET
  duration_ms = duration_seconds * 1000,
  updated_at = NOW()
WHERE
  duration_ms IS NULL
  OR duration_ms = 0
  OR duration_ms != duration_seconds * 1000;

-- Afficher le nombre de lignes mises à jour
-- (Le résultat s'affichera automatiquement dans Supabase)

-- ÉTAPE 3 : VÉRIFICATION - Afficher TOUTES les vidéos après réparation
-- ═════════════════════════════════════════════════════════════════════════
SELECT
  id,
  title,
  duration_seconds,
  duration_ms,
  CASE
    WHEN duration_ms IS NULL THEN '❌ NULL'
    WHEN duration_ms = 0 THEN '❌ ZÉRO'
    WHEN duration_ms != duration_seconds * 1000 THEN '⚠️ INCOHÉRENT'
    ELSE '✅ OK'
  END as status,
  TO_CHAR(INTERVAL '1 millisecond' * duration_ms, 'HH24:MI:SS') as affichage_prevu,
  created_at
FROM playout_media_library
ORDER BY created_at DESC;

-- Si tous les statuts affichent "✅ OK", le problème est résolu !

-- ÉTAPE 4 (OPTIONNEL) : AFFICHER UNIQUEMENT LES VIDÉOS OK
-- ═════════════════════════════════════════════════════════════════════════
SELECT
  COUNT(*) as total_videos,
  COUNT(CASE WHEN duration_ms > 0 THEN 1 END) as videos_ok,
  COUNT(CASE WHEN duration_ms IS NULL OR duration_ms = 0 THEN 1 END) as videos_ko
FROM playout_media_library;

-- Résultat attendu : videos_ko = 0

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTES IMPORTANTES
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 1. Ce script est SAFE : il ne supprime aucune donnée
-- 2. Il ne modifie que les colonnes duration_ms et updated_at
-- 3. La colonne duration_seconds reste inchangée
-- 4. Ce script peut être exécuté plusieurs fois sans problème (idempotent)
--
-- APRÈS L'EXÉCUTION :
-- - Retournez sur /playout/library
-- - Cliquez sur "Actualiser"
-- - Toutes les durées devraient s'afficher correctement
-- ═══════════════════════════════════════════════════════════════════════════
