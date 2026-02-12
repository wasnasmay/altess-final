/*
  # Système de Gestion Complète pour Prestataires

  ## Vue d'ensemble
  Ce système permet aux prestataires partenaires de gérer complètement leur mini-site:
  - Carrousel de médias personnalisé
  - Calendrier de disponibilité
  - Réception et gestion des demandes de devis

  ## 1. Nouvelles Tables

  ### partner_media_carousel
  Gestion du carrousel de médias pour chaque partenaire

  ### partner_availability
  Calendrier de disponibilité des prestataires

  ### partner_quote_requests
  Demandes de devis reçues par les prestataires

  ### partner_users
  Liaison entre utilisateurs auth et partenaires

  ## 2. Sécurité
  - RLS activée sur toutes les tables
  - Les prestataires peuvent uniquement gérer leurs propres données
  - Les visiteurs peuvent voir les médias actifs
*/

-- =====================================================
-- 0. TABLE: partner_users (liaison user <-> partner)
-- =====================================================

CREATE TABLE IF NOT EXISTS partner_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager', 'editor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_users_user ON partner_users(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_partner ON partner_users(partner_id);

ALTER TABLE partner_users ENABLE ROW LEVEL SECURITY;

-- Admins et le user lui-même peuvent voir ses liens
CREATE POLICY "Users can view their partner links"
  ON partner_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 1. TABLE: partner_media_carousel
-- =====================================================

CREATE TABLE IF NOT EXISTS partner_media_carousel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  title text,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_media_carousel_partner 
  ON partner_media_carousel(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_media_carousel_active 
  ON partner_media_carousel(partner_id, is_active, display_order);

ALTER TABLE partner_media_carousel ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les médias actifs
CREATE POLICY "Public can view active partner media"
  ON partner_media_carousel
  FOR SELECT
  TO public
  USING (is_active = true);

-- Les prestataires autorisés peuvent tout gérer
CREATE POLICY "Partners can manage their own media"
  ON partner_media_carousel
  FOR ALL
  TO authenticated
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 2. TABLE: partner_availability
-- =====================================================

CREATE TABLE IF NOT EXISTS partner_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'partially_available', 'unavailable', 'booked')) DEFAULT 'available',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partner_id, date)
);

CREATE INDEX IF NOT EXISTS idx_partner_availability_partner_date 
  ON partner_availability(partner_id, date);
CREATE INDEX IF NOT EXISTS idx_partner_availability_status 
  ON partner_availability(partner_id, status);

ALTER TABLE partner_availability ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les disponibilités
CREATE POLICY "Public can view partner availability"
  ON partner_availability
  FOR SELECT
  TO public
  USING (true);

-- Les prestataires peuvent gérer leurs disponibilités
CREATE POLICY "Partners can manage their availability"
  ON partner_availability
  FOR ALL
  TO authenticated
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. TABLE: partner_quote_requests
-- =====================================================

CREATE TABLE IF NOT EXISTS partner_quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  event_date date,
  event_type text,
  guest_count integer,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'converted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_quote_requests_partner 
  ON partner_quote_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_quote_requests_status 
  ON partner_quote_requests(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_quote_requests_created 
  ON partner_quote_requests(partner_id, created_at DESC);

ALTER TABLE partner_quote_requests ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut créer des demandes
CREATE POLICY "Anyone can create quote requests"
  ON partner_quote_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Les prestataires peuvent voir et gérer leurs demandes
CREATE POLICY "Partners can view their quote requests"
  ON partner_quote_requests
  FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update their quote requests"
  ON partner_quote_requests
  FOR UPDATE
  TO authenticated
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. TRIGGERS pour updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_partner_media_carousel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_media_carousel_updated_at
  BEFORE UPDATE ON partner_media_carousel
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_media_carousel_updated_at();

CREATE OR REPLACE FUNCTION update_partner_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_availability_updated_at
  BEFORE UPDATE ON partner_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_availability_updated_at();

CREATE OR REPLACE FUNCTION update_partner_quote_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_quote_requests_updated_at
  BEFORE UPDATE ON partner_quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_quote_requests_updated_at();