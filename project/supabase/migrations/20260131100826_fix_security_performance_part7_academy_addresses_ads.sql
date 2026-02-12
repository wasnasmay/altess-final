/*
  # Optimisation RLS - Partie 7 : Academy, Good Addresses & Premium Ads

  ## Description
  Cette migration optimise les politiques RLS pour les systèmes académie, bonnes adresses et publicités
  en remplaçant `auth.uid()` par `(SELECT auth.uid())` pour améliorer les performances.

  ## Tables optimisées
  1. academy_user_purchases - Achats de formations
  2. academy_user_progress - Progression des cours
  3. academy_certificates - Certificats
  4. good_addresses - Bonnes adresses
  5. address_reviews - Avis sur les adresses
  6. premium_ads - Publicités premium

  ## Changements
  - Toutes les références à `auth.uid()` sont remplacées par `(SELECT auth.uid())`
  - Les politiques sont recréées avec optimisation de performance
*/

-- =====================================================
-- OPTIMISATION: academy_user_purchases
-- =====================================================

-- Users peuvent lire leurs achats
DROP POLICY IF EXISTS "Users can read own purchases" ON academy_user_purchases;
CREATE POLICY "Users can read own purchases"
  ON academy_user_purchases FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- OPTIMISATION: academy_user_progress
-- =====================================================

-- Users peuvent lire leur progression
DROP POLICY IF EXISTS "Users can read own progress" ON academy_user_progress;
CREATE POLICY "Users can read own progress"
  ON academy_user_progress FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users peuvent créer leur progression
DROP POLICY IF EXISTS "Users can create own progress" ON academy_user_progress;
CREATE POLICY "Users can create own progress"
  ON academy_user_progress FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users peuvent mettre à jour leur progression
DROP POLICY IF EXISTS "Users can update own progress" ON academy_user_progress;
CREATE POLICY "Users can update own progress"
  ON academy_user_progress FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- =====================================================
-- OPTIMISATION: academy_certificates
-- =====================================================

-- Users peuvent lire leurs certificats
DROP POLICY IF EXISTS "Users can read own certificates" ON academy_certificates;
CREATE POLICY "Users can read own certificates"
  ON academy_certificates FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- OPTIMISATION: good_addresses
-- =====================================================

-- Admins peuvent gérer les adresses
DROP POLICY IF EXISTS "Admins can manage addresses" ON good_addresses;
CREATE POLICY "Admins can manage addresses"
  ON good_addresses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: address_reviews
-- =====================================================

-- Clients peuvent créer des avis
DROP POLICY IF EXISTS "Clients can create address reviews" ON address_reviews;
CREATE POLICY "Clients can create address reviews"
  ON address_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role IN ('client', 'provider', 'admin')
    )
  );

-- =====================================================
-- OPTIMISATION: premium_ads
-- =====================================================

-- Annonceurs peuvent voir leurs annonces
DROP POLICY IF EXISTS "Advertisers can view own ads" ON premium_ads;
CREATE POLICY "Advertisers can view own ads"
  ON premium_ads FOR SELECT
  TO authenticated
  USING (advertiser_id = (SELECT auth.uid()));

-- Admins peuvent gérer les annonces
DROP POLICY IF EXISTS "Admins can manage ads" ON premium_ads;
CREATE POLICY "Admins can manage ads"
  ON premium_ads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: ad_analytics
-- =====================================================

-- Admins peuvent lire les analytics
DROP POLICY IF EXISTS "Admins can read analytics" ON ad_analytics;
CREATE POLICY "Admins can read analytics"
  ON ad_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );