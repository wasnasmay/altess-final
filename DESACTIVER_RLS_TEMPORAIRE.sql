-- ═══════════════════════════════════════════════════════════════════════════════
-- SCRIPT SQL - DÉSACTIVER TEMPORAIREMENT LES RLS POUR DIAGNOSTIC
-- ═══════════════════════════════════════════════════════════════════════════════
-- ⚠️  ATTENTION: Ce script désactive temporairement la sécurité RLS
-- ⚠️  NE PAS UTILISER EN PRODUCTION avec des données sensibles
-- ⚠️  Utilisez uniquement pour diagnostiquer les problèmes d'accès
-- ═══════════════════════════════════════════════════════════════════════════════

-- ┌───────────────────────────────────────────────────────────────────────────┐
-- │ ÉTAPE 1: DÉSACTIVER RLS SUR LES TABLES CRITIQUES                         │
-- └───────────────────────────────────────────────────────────────────────────┘

-- Désactiver RLS sur media_library
ALTER TABLE media_library DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur playout_media_library
ALTER TABLE playout_media_library DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur radio_stations
ALTER TABLE radio_stations DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur advertising_tickers
ALTER TABLE advertising_tickers DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur webtv_ticker_settings
ALTER TABLE webtv_ticker_settings DISABLE ROW LEVEL SECURITY;

-- Notification pour rafraîchir le cache Supabase
NOTIFY pgrst, 'reload schema';

-- ┌───────────────────────────────────────────────────────────────────────────┐
-- │ VÉRIFICATION: Confirmer que RLS est bien désactivé                       │
-- └───────────────────────────────────────────────────────────────────────────┘

SELECT
  schemaname,
  tablename,
  rowsecurity AS "RLS Activé?"
FROM pg_tables
WHERE tablename IN (
  'media_library',
  'playout_media_library',
  'radio_stations',
  'advertising_tickers',
  'webtv_ticker_settings'
)
ORDER BY tablename;

-- Résultat attendu: Toutes les lignes doivent avoir "RLS Activé?" = false

-- ═══════════════════════════════════════════════════════════════════════════════
-- APRÈS AVOIR TESTÉ, RÉACTIVEZ RLS AVEC LE SCRIPT CI-DESSOUS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ┌───────────────────────────────────────────────────────────────────────────┐
-- │ ÉTAPE 2: RÉACTIVER RLS (IMPORTANT - NE PAS OUBLIER!)                     │
-- └───────────────────────────────────────────────────────────────────────────┘

-- ⚠️  DÉCOMMENTEZ ET EXÉCUTEZ CES LIGNES APRÈS VOS TESTS ⚠️

-- ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE playout_media_library ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE radio_stations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE advertising_tickers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE webtv_ticker_settings ENABLE ROW LEVEL SECURITY;
-- NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════════════════
-- ALTERNATIVE: CRÉER DES POLICIES PERMISSIVES TEMPORAIRES (PLUS SÛR)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Au lieu de désactiver complètement RLS, vous pouvez créer des policies
-- temporaires qui autorisent tout le monde (plus sûr que de désactiver RLS)

-- ┌───────────────────────────────────────────────────────────────────────────┐
-- │ OPTION B: CRÉER DES POLICIES PERMISSIVES TEMPORAIRES                     │
-- └───────────────────────────────────────────────────────────────────────────┘

-- Pour media_library
DROP POLICY IF EXISTS "temp_allow_all_read_media_library" ON media_library;
CREATE POLICY "temp_allow_all_read_media_library"
  ON media_library FOR SELECT
  TO public
  USING (true);

-- Pour playout_media_library
DROP POLICY IF EXISTS "temp_allow_all_read_playout_media" ON playout_media_library;
CREATE POLICY "temp_allow_all_read_playout_media"
  ON playout_media_library FOR SELECT
  TO public
  USING (true);

-- Pour radio_stations
DROP POLICY IF EXISTS "temp_allow_all_read_radio_stations" ON radio_stations;
CREATE POLICY "temp_allow_all_read_radio_stations"
  ON radio_stations FOR SELECT
  TO public
  USING (true);

-- Pour advertising_tickers
DROP POLICY IF EXISTS "temp_allow_all_read_advertising" ON advertising_tickers;
CREATE POLICY "temp_allow_all_read_advertising"
  ON advertising_tickers FOR SELECT
  TO public
  USING (true);

-- Pour webtv_ticker_settings
DROP POLICY IF EXISTS "temp_allow_all_read_webtv" ON webtv_ticker_settings;
CREATE POLICY "temp_allow_all_read_webtv"
  ON webtv_ticker_settings FOR SELECT
  TO public
  USING (true);

NOTIFY pgrst, 'reload schema';

-- ┌───────────────────────────────────────────────────────────────────────────┐
-- │ SUPPRIMER LES POLICIES TEMPORAIRES APRÈS TEST                            │
-- └───────────────────────────────────────────────────────────────────────────┘

-- ⚠️  DÉCOMMENTEZ ET EXÉCUTEZ APRÈS VOS TESTS ⚠️

-- DROP POLICY IF EXISTS "temp_allow_all_read_media_library" ON media_library;
-- DROP POLICY IF EXISTS "temp_allow_all_read_playout_media" ON playout_media_library;
-- DROP POLICY IF EXISTS "temp_allow_all_read_radio_stations" ON radio_stations;
-- DROP POLICY IF EXISTS "temp_allow_all_read_advertising" ON advertising_tickers;
-- DROP POLICY IF EXISTS "temp_allow_all_read_webtv" ON webtv_ticker_settings;
-- NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════════════════
-- INSTRUCTIONS D'UTILISATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. AVANT DE COMMENCER
--    - Connectez-vous à Supabase Dashboard
--    - Allez dans SQL Editor
--    - Créez une nouvelle requête

-- 2. CHOISISSEZ UNE OPTION:
--    OPTION A: Désactiver complètement RLS (lignes 17-28)
--    OPTION B: Créer des policies permissives (lignes 62-94)
--
--    ⚠️  OPTION B est RECOMMANDÉE (plus sûre)

-- 3. TESTEZ VOTRE APPLICATION
--    - Allez sur Vercel
--    - Testez /playout/library
--    - Testez /api/diagnostic/playout-media
--    - Vérifiez les logs Vercel

-- 4. ANALYSEZ LES RÉSULTATS:
--    ✅ Si ça marche maintenant → Le problème était les policies RLS
--    ❌ Si ça ne marche toujours pas → Le problème est ailleurs (variables env, API routes)

-- 5. RÉACTIVEZ LA SÉCURITÉ
--    - Si vous avez utilisé OPTION A → Décommentez lignes 42-47
--    - Si vous avez utilisé OPTION B → Décommentez lignes 102-107
--    - Exécutez le script de réactivation

-- ═══════════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC RAPIDE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Voir toutes les policies actuelles sur media_library
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'media_library';

-- Voir toutes les policies actuelles sur playout_media_library
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'playout_media_library';

-- Compter les médias disponibles
SELECT
  'media_library' as table_name,
  COUNT(*) as total,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
FROM media_library
UNION ALL
SELECT
  'playout_media_library' as table_name,
  COUNT(*) as total,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
FROM playout_media_library;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTES IMPORTANTES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 📝 RLS (Row Level Security) contrôle qui peut voir quelles lignes dans une table
-- 📝 Désactiver RLS = tout le monde peut tout voir (PUBLIC access)
-- 📝 Policies permissives temporaires = même effet mais plus sûr
-- 📝 Après diagnostic, TOUJOURS réactiver la sécurité
-- 📝 NOTIFY pgrst = force Supabase à recharger le schéma immédiatement

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIN DU SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════════
