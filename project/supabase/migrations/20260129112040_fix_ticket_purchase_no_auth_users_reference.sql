/*
  # Correction Finale des Permissions d'Achat de Billets

  ## Problème Identifié
  L'erreur "permission denied for table users" est causée par une politique RLS
  qui tente d'accéder à la table auth.users, ce qui est interdit.

  ## Solution
  1. Supprimer toutes les politiques existantes
  2. Créer des politiques simples qui N'utilisent PAS auth.users
  3. Permettre l'achat anonyme (pas besoin d'authentification)
  4. Utiliser uniquement des comparaisons simples

  ## Politiques Finales
  - INSERT: Accès public total (pour achats anonymes)
  - SELECT: Accès public pour les tickets récents
  - SELECT: Organisateurs voient leurs tickets
  - UPDATE: Organisateurs peuvent scanner
  - SELECT/UPDATE: Admins ont accès total
*/

-- =====================================================
-- SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
-- =====================================================

DROP POLICY IF EXISTS "Anyone can purchase tickets" ON ticket_purchases;
DROP POLICY IF EXISTS "View recent tickets publicly" ON ticket_purchases;
DROP POLICY IF EXISTS "Authenticated users view own tickets" ON ticket_purchases;
DROP POLICY IF EXISTS "Organizers view their tickets" ON ticket_purchases;
DROP POLICY IF EXISTS "Organizers update ticket status" ON ticket_purchases;
DROP POLICY IF EXISTS "Admins view all tickets" ON ticket_purchases;

-- =====================================================
-- NOUVELLES POLITIQUES SANS RÉFÉRENCE À AUTH.USERS
-- =====================================================

-- 1. INSERT: Tout le monde peut créer un billet (achat public)
CREATE POLICY "public_insert_tickets"
  ON ticket_purchases
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 2. SELECT: Tout le monde peut voir les tickets récents (72 heures)
--    Cela permet au client de voir son billet après l'achat
CREATE POLICY "public_view_recent_tickets"
  ON ticket_purchases
  FOR SELECT
  TO public
  USING (created_at >= NOW() - INTERVAL '72 hours');

-- 3. SELECT: Les organisateurs peuvent voir TOUS les tickets de leurs événements
CREATE POLICY "organizer_view_tickets"
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

-- 4. UPDATE: Les organisateurs peuvent mettre à jour le statut (scanner)
CREATE POLICY "organizer_update_tickets"
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

-- 5. SELECT: Les admins peuvent tout voir
CREATE POLICY "admin_view_all_tickets"
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

-- 6. UPDATE: Les admins peuvent tout modifier
CREATE POLICY "admin_update_all_tickets"
  ON ticket_purchases
  FOR UPDATE
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
-- VÉRIFICATION FINALE
-- =====================================================

DO $$
DECLARE
  insert_count int;
  select_count int;
  update_count int;
BEGIN
  SELECT COUNT(*) INTO insert_count
  FROM pg_policies
  WHERE tablename = 'ticket_purchases' AND cmd = 'INSERT';
  
  SELECT COUNT(*) INTO select_count
  FROM pg_policies
  WHERE tablename = 'ticket_purchases' AND cmd = 'SELECT';
  
  SELECT COUNT(*) INTO update_count
  FROM pg_policies
  WHERE tablename = 'ticket_purchases' AND cmd = 'UPDATE';

  RAISE NOTICE 'Policies created - INSERT: %, SELECT: %, UPDATE: %', 
    insert_count, select_count, update_count;
    
  IF insert_count = 0 THEN
    RAISE EXCEPTION 'No INSERT policy created!';
  END IF;
END $$;
