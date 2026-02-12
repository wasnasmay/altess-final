/*
  # Optimisation RLS - Partie 8 : Organizers & Ticketing System

  ## Description
  Cette migration optimise les politiques RLS pour le système d'organisateurs et de billetterie
  en remplaçant `auth.uid()` par `(SELECT auth.uid())` pour améliorer les performances.

  ## Tables optimisées
  1. event_organizers - Organisateurs d'événements
  2. promo_codes - Codes promotionnels
  3. ticket_purchases - Achats de billets
  4. organizer_sales_stats - Statistiques de ventes
  5. provider_social_videos - Vidéos sociales des prestataires

  ## Changements
  - Toutes les références à `auth.uid()` sont remplacées par `(SELECT auth.uid())`
  - Les politiques sont recréées avec optimisation de performance
*/

-- =====================================================
-- OPTIMISATION: event_organizers
-- =====================================================

-- Organisateurs peuvent voir leur profil
DROP POLICY IF EXISTS "Organizers can view own profile" ON event_organizers;
CREATE POLICY "Organizers can view own profile"
  ON event_organizers FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Organisateurs peuvent mettre à jour leur profil
DROP POLICY IF EXISTS "Organizers can update own profile" ON event_organizers;
CREATE POLICY "Organizers can update own profile"
  ON event_organizers FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- =====================================================
-- OPTIMISATION: promo_codes
-- =====================================================

-- Organisateurs peuvent gérer leurs codes promo
DROP POLICY IF EXISTS "Organizers can manage own promo codes" ON promo_codes;
CREATE POLICY "Organizers can manage own promo codes"
  ON promo_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers 
      WHERE id = promo_codes.organizer_id 
      AND user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- OPTIMISATION: ticket_purchases
-- =====================================================

-- Clients peuvent voir leurs billets
DROP POLICY IF EXISTS "Customers can view own tickets" ON ticket_purchases;
CREATE POLICY "Customers can view own tickets"
  ON ticket_purchases FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id OR 
    customer_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

-- Organisateurs peuvent voir les billets de leurs événements
DROP POLICY IF EXISTS "Organizers can view their event tickets" ON ticket_purchases;
CREATE POLICY "Organizers can view their event tickets"
  ON ticket_purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers 
      WHERE id = ticket_purchases.organizer_id 
      AND user_id = (SELECT auth.uid())
    )
  );

-- Organisateurs peuvent mettre à jour le statut des billets
DROP POLICY IF EXISTS "Organizers can update ticket status" ON ticket_purchases;
CREATE POLICY "Organizers can update ticket status"
  ON ticket_purchases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers 
      WHERE id = ticket_purchases.organizer_id 
      AND user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- OPTIMISATION: organizer_sales_stats
-- =====================================================

-- Organisateurs peuvent voir leurs stats
DROP POLICY IF EXISTS "Organizers can view own stats" ON organizer_sales_stats;
CREATE POLICY "Organizers can view own stats"
  ON organizer_sales_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers 
      WHERE id = organizer_sales_stats.organizer_id 
      AND user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- OPTIMISATION: provider_social_videos
-- =====================================================

-- Providers peuvent voir leurs vidéos
DROP POLICY IF EXISTS "Providers can view own social videos" ON provider_social_videos;
CREATE POLICY "Providers can view own social videos"
  ON provider_social_videos FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = provider_id);

-- Providers peuvent créer leurs vidéos
DROP POLICY IF EXISTS "Providers can insert own social videos" ON provider_social_videos;
CREATE POLICY "Providers can insert own social videos"
  ON provider_social_videos FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = provider_id);

-- Providers peuvent mettre à jour leurs vidéos
DROP POLICY IF EXISTS "Providers can update own social videos" ON provider_social_videos;
CREATE POLICY "Providers can update own social videos"
  ON provider_social_videos FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = provider_id)
  WITH CHECK ((SELECT auth.uid()) = provider_id);

-- Providers peuvent supprimer leurs vidéos
DROP POLICY IF EXISTS "Providers can delete own social videos" ON provider_social_videos;
CREATE POLICY "Providers can delete own social videos"
  ON provider_social_videos FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = provider_id);

-- Admins peuvent voir toutes les vidéos
DROP POLICY IF EXISTS "Admins can view all social videos" ON provider_social_videos;
CREATE POLICY "Admins can view all social videos"
  ON provider_social_videos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Admins peuvent gérer toutes les vidéos
DROP POLICY IF EXISTS "Admins can manage all social videos" ON provider_social_videos;
CREATE POLICY "Admins can manage all social videos"
  ON provider_social_videos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );