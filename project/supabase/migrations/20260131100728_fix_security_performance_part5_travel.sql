/*
  # Optimisation RLS - Partie 5 : Travel System

  ## Description
  Cette migration optimise les politiques RLS pour le système de voyages
  en remplaçant `auth.uid()` par `(SELECT auth.uid())` pour améliorer les performances.

  ## Tables optimisées
  1. travel_agencies - Agences de voyage
  2. travel_offers - Offres de voyage
  3. travel_inquiries - Demandes de renseignements

  ## Changements
  - Toutes les références à `auth.uid()` sont remplacées par `(SELECT auth.uid())`
  - Les politiques sont recréées avec optimisation de performance
*/

-- =====================================================
-- OPTIMISATION: travel_agencies
-- =====================================================

-- Admins peuvent gérer les agences
DROP POLICY IF EXISTS "Admins can manage agencies" ON travel_agencies;
CREATE POLICY "Admins can manage agencies"
  ON travel_agencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: travel_offers
-- =====================================================

-- Agences peuvent gérer leurs offres
DROP POLICY IF EXISTS "Agencies can manage own offers" ON travel_offers;
CREATE POLICY "Agencies can manage own offers"
  ON travel_offers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM travel_agencies ta
      JOIN profiles p ON LOWER(p.email) = LOWER(ta.email)
      WHERE ta.id = travel_offers.agency_id 
      AND p.id = (SELECT auth.uid())
      AND p.role IN ('provider', 'admin')
    )
  );

-- Admins peuvent gérer toutes les offres
DROP POLICY IF EXISTS "Admins can manage all travel offers" ON travel_offers;
CREATE POLICY "Admins can manage all travel offers"
  ON travel_offers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: travel_inquiries
-- =====================================================

-- Agences peuvent voir les demandes reçues
DROP POLICY IF EXISTS "Agencies can view received inquiries" ON travel_inquiries;
CREATE POLICY "Agencies can view received inquiries"
  ON travel_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM travel_agencies ta
      JOIN profiles p ON LOWER(p.email) = LOWER(ta.email)
      WHERE ta.id = travel_inquiries.agency_id 
      AND p.id = (SELECT auth.uid())
    )
  );

-- Agences peuvent répondre aux demandes
DROP POLICY IF EXISTS "Agencies can respond to inquiries" ON travel_inquiries;
CREATE POLICY "Agencies can respond to inquiries"
  ON travel_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM travel_agencies ta
      JOIN profiles p ON LOWER(p.email) = LOWER(ta.email)
      WHERE ta.id = travel_inquiries.agency_id 
      AND p.id = (SELECT auth.uid())
    )
  );

-- Admins peuvent gérer toutes les demandes
DROP POLICY IF EXISTS "Admins can manage all travel inquiries" ON travel_inquiries;
CREATE POLICY "Admins can manage all travel inquiries"
  ON travel_inquiries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );