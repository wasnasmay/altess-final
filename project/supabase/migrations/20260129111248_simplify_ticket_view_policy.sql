/*
  # Simplification de la Politique de Lecture des Billets

  ## Problème
  La politique "View tickets by email" est trop complexe et peut causer
  des erreurs lors de l'achat de billets.

  ## Solution
  Permettre à tout le monde de voir les billets récemment créés (24h)
  pour que le client puisse voir son billet immédiatement après l'achat.

  ## Sécurité
  - Les billets de plus de 24h nécessitent une authentification
  - Les organisateurs peuvent toujours voir tous leurs billets
  - Les admins peuvent tout voir
*/

-- Supprimer la politique complexe
DROP POLICY IF EXISTS "View tickets by email" ON ticket_purchases;

-- Nouvelle politique simple : voir les billets récents (24h)
CREATE POLICY "View recent tickets publicly"
  ON ticket_purchases
  FOR SELECT
  TO public
  USING (created_at >= NOW() - INTERVAL '24 hours');

-- Les clients authentifiés peuvent voir leurs propres billets
CREATE POLICY "Authenticated users view own tickets"
  ON ticket_purchases
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
