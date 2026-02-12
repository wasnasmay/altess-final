/*
  # Fix - Permissions playout_schedules plus permissives

  1. Problème potentiel
    - Les policies actuelles nécessitent l'authentification
    - Si l'utilisateur n'est pas connecté, l'INSERT échoue silencieusement
  
  2. Solution
    - Ajouter une policy permissive pour public (développement)
    - Permet l'insertion même sans authentification
  
  3. Production
    - En production, utilisez l'authentification obligatoire
    - Ou utilisez SERVICE_ROLE_KEY dans les API Routes
*/

-- Supprimer l'ancienne policy restrictive si nécessaire
DROP POLICY IF EXISTS "Public can insert schedules" ON playout_schedules;

-- Créer une policy permissive pour INSERT
CREATE POLICY "Public can insert schedules"
  ON playout_schedules
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Créer une policy permissive pour UPDATE
DROP POLICY IF EXISTS "Public can update schedules" ON playout_schedules;

CREATE POLICY "Public can update schedules"
  ON playout_schedules
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Créer une policy permissive pour DELETE
DROP POLICY IF EXISTS "Public can delete schedules" ON playout_schedules;

CREATE POLICY "Public can delete schedules"
  ON playout_schedules
  FOR DELETE
  TO public
  USING (true);

-- Rafraîchir le cache
NOTIFY pgrst, 'reload schema';
