/*
  # Optimisation RLS - Partie 1 : Event Providers System

  ## Description
  Cette migration optimise les politiques RLS pour le système de prestataires événementiels
  en remplaçant `auth.uid()` par `(SELECT auth.uid())` pour améliorer les performances.
  
  Cette optimisation force PostgreSQL à évaluer `auth.uid()` une seule fois par requête
  au lieu de le réévaluer pour chaque ligne, ce qui peut améliorer les performances de 10x-100x.

  ## Tables optimisées
  1. event_providers - Prestataires événementiels
  2. event_provider_reviews - Avis clients
  3. event_quote_requests - Demandes de devis

  ## Changements
  - Toutes les références à `auth.uid()` dans les clauses USING et WITH CHECK
    sont remplacées par `(SELECT auth.uid())`
  - Les politiques sont recréées avec la même logique mais optimisées
  - Aucun changement fonctionnel, uniquement des optimisations de performance

  ## Impact
  - Amélioration significative des performances sur les requêtes impliquant RLS
  - Aucun changement sur les permissions ou la sécurité
  - Pas d'impact sur les données existantes
*/

-- =====================================================
-- OPTIMISATION: event_providers
-- =====================================================

-- Providers peuvent voir leur propre fiche
DROP POLICY IF EXISTS "Providers can view own listing" ON event_providers;
CREATE POLICY "Providers can view own listing"
  ON event_providers FOR SELECT
  TO authenticated
  USING (provider_id = (SELECT auth.uid()));

-- Providers peuvent créer leur fiche
DROP POLICY IF EXISTS "Providers can create own listing" ON event_providers;
CREATE POLICY "Providers can create own listing"
  ON event_providers FOR INSERT
  TO authenticated
  WITH CHECK (
    provider_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role IN ('provider', 'admin')
    )
  );

-- Providers peuvent modifier leur propre fiche
DROP POLICY IF EXISTS "Providers can update own listing" ON event_providers;
CREATE POLICY "Providers can update own listing"
  ON event_providers FOR UPDATE
  TO authenticated
  USING (provider_id = (SELECT auth.uid()))
  WITH CHECK (
    provider_id = (SELECT auth.uid()) AND
    status != 'suspended'
  );

-- Admins ont contrôle total
DROP POLICY IF EXISTS "Admins can manage all providers" ON event_providers;
CREATE POLICY "Admins can manage all providers"
  ON event_providers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: event_provider_reviews
-- =====================================================

-- Clients peuvent créer des avis
DROP POLICY IF EXISTS "Clients can create reviews" ON event_provider_reviews;
CREATE POLICY "Clients can create reviews"
  ON event_provider_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role IN ('client', 'admin')
    )
  );

-- Clients peuvent modifier leurs propres avis (dans les 24h)
DROP POLICY IF EXISTS "Clients can update own reviews" ON event_provider_reviews;
CREATE POLICY "Clients can update own reviews"
  ON event_provider_reviews FOR UPDATE
  TO authenticated
  USING (
    client_id = (SELECT auth.uid()) AND
    created_at > now() - interval '24 hours'
  )
  WITH CHECK (client_id = (SELECT auth.uid()));

-- Providers peuvent voir tous leurs avis
DROP POLICY IF EXISTS "Providers can view their reviews" ON event_provider_reviews;
CREATE POLICY "Providers can view their reviews"
  ON event_provider_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_providers 
      WHERE event_providers.id = event_provider_reviews.event_provider_id 
      AND event_providers.provider_id = (SELECT auth.uid())
    )
  );

-- Providers peuvent répondre aux avis
DROP POLICY IF EXISTS "Providers can respond to reviews" ON event_provider_reviews;
CREATE POLICY "Providers can respond to reviews"
  ON event_provider_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_providers 
      WHERE event_providers.id = event_provider_reviews.event_provider_id 
      AND event_providers.provider_id = (SELECT auth.uid())
    )
  );

-- Admins contrôle total
DROP POLICY IF EXISTS "Admins can manage all reviews" ON event_provider_reviews;
CREATE POLICY "Admins can manage all reviews"
  ON event_provider_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- =====================================================
-- OPTIMISATION: event_quote_requests
-- =====================================================

-- Clients peuvent voir leurs propres demandes
DROP POLICY IF EXISTS "Clients can view own quote requests" ON event_quote_requests;
CREATE POLICY "Clients can view own quote requests"
  ON event_quote_requests FOR SELECT
  TO authenticated
  USING (client_id = (SELECT auth.uid()));

-- Providers peuvent voir leurs demandes reçues
DROP POLICY IF EXISTS "Providers can view received quotes" ON event_quote_requests;
CREATE POLICY "Providers can view received quotes"
  ON event_quote_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_providers 
      WHERE event_providers.id = event_quote_requests.event_provider_id 
      AND event_providers.provider_id = (SELECT auth.uid())
    )
  );

-- Providers peuvent répondre à leurs demandes
DROP POLICY IF EXISTS "Providers can respond to quotes" ON event_quote_requests;
CREATE POLICY "Providers can respond to quotes"
  ON event_quote_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_providers 
      WHERE event_providers.id = event_quote_requests.event_provider_id 
      AND event_providers.provider_id = (SELECT auth.uid())
    )
  );

-- Admins contrôle total
DROP POLICY IF EXISTS "Admins can manage all quotes" ON event_quote_requests;
CREATE POLICY "Admins can manage all quotes"
  ON event_quote_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );