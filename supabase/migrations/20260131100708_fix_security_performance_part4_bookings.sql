/*
  # Optimisation RLS - Partie 4 : Bookings System

  ## Description
  Cette migration optimise les politiques RLS pour le système de réservations
  en remplaçant `auth.uid()` par `(SELECT auth.uid())` pour améliorer les performances.

  ## Tables optimisées
  1. bookings - Réservations
  2. availability - Disponibilités
  3. reviews - Avis clients
  4. messages - Messages
  5. payment_metadata - Métadonnées de paiement

  ## Changements
  - Toutes les références à `auth.uid()` sont remplacées par `(SELECT auth.uid())`
  - Les politiques sont recréées avec optimisation de performance
*/

-- =====================================================
-- OPTIMISATION: bookings
-- =====================================================

-- Clients peuvent voir leurs réservations
DROP POLICY IF EXISTS "Clients can view own bookings" ON bookings;
CREATE POLICY "Clients can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (client_id = (SELECT auth.uid()));

-- Providers peuvent voir les réservations de leurs orchestres
DROP POLICY IF EXISTS "Providers can view their orchestra bookings" ON bookings;
CREATE POLICY "Providers can view their orchestra bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orchestras
      WHERE orchestras.id = bookings.orchestra_id
      AND orchestras.provider_id = (SELECT auth.uid())
    )
  );

-- Clients peuvent créer des réservations
DROP POLICY IF EXISTS "Clients can create bookings" ON bookings;
CREATE POLICY "Clients can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (client_id = (SELECT auth.uid()));

-- Clients peuvent mettre à jour leurs réservations
DROP POLICY IF EXISTS "Clients can update own bookings" ON bookings;
CREATE POLICY "Clients can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (client_id = (SELECT auth.uid()))
  WITH CHECK (client_id = (SELECT auth.uid()));

-- Providers peuvent mettre à jour les réservations de leurs orchestres
DROP POLICY IF EXISTS "Providers can update their orchestra bookings" ON bookings;
CREATE POLICY "Providers can update their orchestra bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orchestras
      WHERE orchestras.id = bookings.orchestra_id
      AND orchestras.provider_id = (SELECT auth.uid())
    )
  );

-- Admins peuvent gérer toutes les réservations
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: availability
-- =====================================================

-- Providers peuvent gérer leurs disponibilités
DROP POLICY IF EXISTS "Providers can manage own orchestra availability" ON availability;
CREATE POLICY "Providers can manage own orchestra availability"
  ON availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orchestras
      WHERE orchestras.id = availability.orchestra_id
      AND orchestras.provider_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- OPTIMISATION: reviews
-- =====================================================

-- Clients peuvent créer des avis pour leurs réservations
DROP POLICY IF EXISTS "Clients can create reviews for their bookings" ON reviews;
CREATE POLICY "Clients can create reviews for their bookings"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.client_id = (SELECT auth.uid())
      AND bookings.status = 'completed'
    )
  );

-- =====================================================
-- OPTIMISATION: messages
-- =====================================================

-- Users peuvent voir les messages envoyés ou reçus
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));

-- Users peuvent envoyer des messages
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (SELECT auth.uid()));

-- =====================================================
-- OPTIMISATION: payment_metadata
-- =====================================================

-- Clients peuvent voir leurs métadonnées de paiement
DROP POLICY IF EXISTS "Clients can view own payment metadata" ON payment_metadata;
CREATE POLICY "Clients can view own payment metadata"
  ON payment_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payment_metadata.booking_id
      AND bookings.client_id = (SELECT auth.uid())
    )
  );

-- Providers peuvent voir les métadonnées de paiement de leurs orchestres
DROP POLICY IF EXISTS "Providers can view their orchestra payment metadata" ON payment_metadata;
CREATE POLICY "Providers can view their orchestra payment metadata"
  ON payment_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN orchestras ON orchestras.id = bookings.orchestra_id
      WHERE bookings.id = payment_metadata.booking_id
      AND orchestras.provider_id = (SELECT auth.uid())
    )
  );