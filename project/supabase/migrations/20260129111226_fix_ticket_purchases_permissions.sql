/*
  # Correction des Permissions pour l'Achat de Billets

  ## Problème
  Erreur "permission denied for table users" lors de l'achat de billets.
  Les politiques RLS référencent auth.users de manière incorrecte.

  ## Solution
  1. Supprimer les politiques qui causent des problèmes d'accès
  2. Recréer des politiques simples et efficaces
  3. Permettre les insertions anonymes (nécessaire pour l'achat public)

  ## Politiques Créées
  - INSERT: Tout le monde peut créer un ticket (achat public)
  - SELECT: Client peut voir son ticket via email
  - SELECT: Organisateur peut voir les tickets de ses événements
  - UPDATE: Organisateur peut mettre à jour le statut
*/

-- =====================================================
-- SUPPRIMER LES ANCIENNES POLITIQUES
-- =====================================================

DROP POLICY IF EXISTS "Customers can view own tickets" ON ticket_purchases;
DROP POLICY IF EXISTS "Organizers can update ticket status" ON ticket_purchases;
DROP POLICY IF EXISTS "Organizers can view their event tickets" ON ticket_purchases;
DROP POLICY IF EXISTS "Public can create ticket purchases" ON ticket_purchases;
DROP POLICY IF EXISTS "Public can view recently created tickets" ON ticket_purchases;

-- =====================================================
-- NOUVELLES POLITIQUES SIMPLIFIÉES
-- =====================================================

-- 1. INSERT: Tout le monde peut acheter un billet
CREATE POLICY "Anyone can purchase tickets"
  ON ticket_purchases
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 2. SELECT: Voir les tickets via email (pour les clients non connectés)
CREATE POLICY "View tickets by email"
  ON ticket_purchases
  FOR SELECT
  TO public
  USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email'
         OR created_at >= NOW() - INTERVAL '1 hour');

-- 3. SELECT: Organisateurs voient leurs tickets
CREATE POLICY "Organizers view their tickets"
  ON ticket_purchases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM event_organizers 
      WHERE event_organizers.id = ticket_purchases.organizer_id
      AND event_organizers.user_id = auth.uid()
    )
  );

-- 4. UPDATE: Organisateurs peuvent scanner/valider les tickets
CREATE POLICY "Organizers update ticket status"
  ON ticket_purchases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM event_organizers 
      WHERE event_organizers.id = ticket_purchases.organizer_id
      AND event_organizers.user_id = auth.uid()
    )
  );

-- 5. SELECT: Admin peut tout voir
CREATE POLICY "Admins view all tickets"
  ON ticket_purchases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- VÉRIFICATION
-- =====================================================

DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'ticket_purchases';

  RAISE NOTICE 'Created % policies for ticket_purchases', policy_count;
END $$;
