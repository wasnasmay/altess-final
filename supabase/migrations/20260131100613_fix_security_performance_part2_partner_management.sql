/*
  # Optimisation RLS - Partie 2 : Partner Management System

  ## Description
  Cette migration optimise les politiques RLS pour le système de gestion des partenaires
  en remplaçant `auth.uid()` par `(SELECT auth.uid())` pour améliorer les performances.

  ## Tables optimisées
  1. partner_users - Liaison utilisateurs <-> partenaires
  2. partner_media_carousel - Carrousel de médias des partenaires
  3. partner_availability - Disponibilités des partenaires
  4. partner_quote_requests - Demandes de devis partenaires

  ## Changements
  - Toutes les références à `auth.uid()` sont remplacées par `(SELECT auth.uid())`
  - Les politiques sont recréées avec optimisation de performance
*/

-- =====================================================
-- OPTIMISATION: partner_users
-- =====================================================

-- Users peuvent voir leurs liens partenaires
DROP POLICY IF EXISTS "Users can view their partner links" ON partner_users;
CREATE POLICY "Users can view their partner links"
  ON partner_users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- OPTIMISATION: partner_media_carousel
-- =====================================================

-- Les prestataires autorisés peuvent tout gérer
DROP POLICY IF EXISTS "Partners can manage their own media" ON partner_media_carousel;
CREATE POLICY "Partners can manage their own media"
  ON partner_media_carousel FOR ALL
  TO authenticated
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- OPTIMISATION: partner_availability
-- =====================================================

-- Les prestataires peuvent gérer leurs disponibilités
DROP POLICY IF EXISTS "Partners can manage their availability" ON partner_availability;
CREATE POLICY "Partners can manage their availability"
  ON partner_availability FOR ALL
  TO authenticated
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- OPTIMISATION: partner_quote_requests
-- =====================================================

-- Les prestataires peuvent voir leurs demandes
DROP POLICY IF EXISTS "Partners can view their quote requests" ON partner_quote_requests;
CREATE POLICY "Partners can view their quote requests"
  ON partner_quote_requests FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = (SELECT auth.uid())
    )
  );

-- Les prestataires peuvent mettre à jour leurs demandes
DROP POLICY IF EXISTS "Partners can update their quote requests" ON partner_quote_requests;
CREATE POLICY "Partners can update their quote requests"
  ON partner_quote_requests FOR UPDATE
  TO authenticated
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = (SELECT auth.uid())
    )
  );