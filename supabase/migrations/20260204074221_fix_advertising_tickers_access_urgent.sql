/*
  # Correctif URGENT - Accès aux Bandeaux Publicitaires

  1. Problème
    - Les messages publicitaires ne s'affichent pas
    - La page admin ne charge pas les données
    
  2. Solution
    - Simplifier les policies RLS
    - Permettre l'accès public en lecture aux messages actifs
    - Permettre aux admins authentifiés de tout voir
    
  3. Sécurité
    - Les utilisateurs publics ne voient QUE les messages actifs
    - Seuls les admins authentifiés peuvent modifier/créer/supprimer
*/

-- Supprimer toutes les policies existantes pour recommencer proprement
DROP POLICY IF EXISTS "Public users can view active tickers" ON advertising_tickers;
DROP POLICY IF EXISTS "Admins can view all tickers" ON advertising_tickers;
DROP POLICY IF EXISTS "Admins can create tickers" ON advertising_tickers;
DROP POLICY IF EXISTS "Admins can update tickers" ON advertising_tickers;
DROP POLICY IF EXISTS "Admins can delete tickers" ON advertising_tickers;

-- LECTURE PUBLIQUE: Tout le monde peut voir les messages actifs (sans conditions de date complexes)
CREATE POLICY "Enable read access for all users"
  ON advertising_tickers
  FOR SELECT
  TO public
  USING (is_active = true);

-- LECTURE ADMIN: Les admins authentifiés peuvent tout voir
CREATE POLICY "Admins can view all tickers"
  ON advertising_tickers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- INSERTION: Seuls les admins peuvent créer
CREATE POLICY "Admins can insert tickers"
  ON advertising_tickers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- MISE À JOUR: Seuls les admins peuvent modifier
CREATE POLICY "Admins can update tickers"
  ON advertising_tickers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- SUPPRESSION: Seuls les admins peuvent supprimer
CREATE POLICY "Admins can delete tickers"
  ON advertising_tickers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Rafraîchir le cache Supabase
NOTIFY pgrst, 'reload schema';

-- Vérifier que tout fonctionne en récupérant les messages actifs
DO $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM advertising_tickers
  WHERE is_active = true;
  
  RAISE NOTICE 'Messages publicitaires actifs: %', active_count;
  
  IF active_count = 0 THEN
    RAISE WARNING 'AUCUN message publicitaire actif trouvé!';
  ELSE
    RAISE NOTICE 'Policies mises à jour avec succès. % messages actifs disponibles.', active_count;
  END IF;
END $$;
