/*
  # Système de Gestion des Voyages - ALTOS

  ## Vue d'ensemble
  Module "Voyages" pour ALTOS : promotions, destinations, astuces voyage.
  Permet aux agences partenaires de publier leurs offres et aux utilisateurs
  de découvrir des opportunités de voyage.

  ## 1. Nouvelles Tables

  ### `travel_agencies`
  Agences de voyage partenaires
  - `id` (uuid, PK)
  - `name` (text) - Nom de l'agence
  - `slug` (text, unique)
  - `logo_url` (text)
  - Contact: phone, email, website, address
  - `description` (text)
  - `specialties` (text[]) - Spécialités (séjours balnéaires, aventure, etc.)
  - Partenariat: is_partner, contract_start_date, contract_end_date
  - `is_active` (boolean)
  
  ### `travel_offers`
  Offres de voyage publiées par les agences
  - `id` (uuid, PK)
  - `agency_id` (uuid, FK travel_agencies)
  - `title`, `slug` (text)
  - `offer_type` (text) - promotion, package, tip, destination_highlight
  - Destination: destination, country, continent
  - Descriptions: short_description, full_description
  - SEO: title, description, keywords, og_image
  - Médias: main_image, gallery_images[], video_url
  - Prix: price_from, original_price, currency
  - Caractéristiques: duration_days, includes[], highlights[]
  - Dates: valid_from, valid_until, departure_dates[]
  - Statut: is_active, is_featured, display_order, view_count
  
  ### `travel_inquiries`
  Demandes de renseignements clients vers les agences
  - `id` (uuid, PK)
  - `offer_id` (uuid, FK travel_offers)
  - `agency_id` (uuid, FK travel_agencies)
  - Contact: client_name, client_email, client_phone
  - Demande: travel_dates, travelers_count, message
  - Suivi: status, agency_response
  
  ## 2. Sécurité RLS
  - Lecture publique des offres actives et valides
  - Agences peuvent gérer leurs propres offres
  - Admins ont contrôle total
  
  ## 3. Indexes de Performance
  - Recherche par agence
  - Recherche par type d'offre
  - Recherche par destination
  - Offres mises en avant
*/

-- =====================================================
-- TABLE: travel_agencies
-- =====================================================

CREATE TABLE IF NOT EXISTS travel_agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  
  -- Contact
  phone text,
  email text,
  website text,
  address text,
  
  -- Description
  description text,
  specialties text[] DEFAULT '{}',
  
  -- Partenariat
  is_partner boolean DEFAULT false,
  contract_start_date date,
  contract_end_date date,
  
  -- Statut
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_travel_agencies_slug ON travel_agencies(slug);
CREATE INDEX IF NOT EXISTS idx_travel_agencies_active ON travel_agencies(is_active) WHERE is_active = true;

-- =====================================================
-- TABLE: travel_offers
-- =====================================================

CREATE TABLE IF NOT EXISTS travel_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES travel_agencies(id) ON DELETE CASCADE NOT NULL,
  
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  
  -- Type d'offre
  offer_type text NOT NULL CHECK (offer_type IN ('promotion', 'package', 'tip', 'destination_highlight')),
  
  -- Destination
  destination text NOT NULL,
  country text,
  continent text,
  
  -- Description
  short_description text NOT NULL DEFAULT '',
  full_description text NOT NULL DEFAULT '',
  
  -- SEO
  seo_title text,
  seo_description text,
  seo_keywords text,
  og_image text,
  
  -- Médias
  main_image text,
  gallery_images text[] DEFAULT '{}',
  video_url text,
  
  -- Prix
  price_from numeric,
  original_price numeric,
  currency text DEFAULT 'EUR',
  
  -- Caractéristiques
  duration_days int,
  includes text[] DEFAULT '{}',
  highlights text[] DEFAULT '{}',
  
  -- Dates
  valid_from date,
  valid_until date,
  departure_dates date[] DEFAULT '{}',
  
  -- Statut
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  display_order int DEFAULT 0,
  view_count int DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_travel_offers_agency ON travel_offers(agency_id);
CREATE INDEX IF NOT EXISTS idx_travel_offers_type ON travel_offers(offer_type, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_travel_offers_destination ON travel_offers(destination);
CREATE INDEX IF NOT EXISTS idx_travel_offers_slug ON travel_offers(slug);
CREATE INDEX IF NOT EXISTS idx_travel_offers_featured ON travel_offers(is_featured) WHERE is_featured = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_travel_offers_validity ON travel_offers(valid_from, valid_until) WHERE is_active = true;

-- =====================================================
-- TABLE: travel_inquiries
-- =====================================================

CREATE TABLE IF NOT EXISTS travel_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES travel_offers(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES travel_agencies(id) ON DELETE CASCADE NOT NULL,
  
  -- Contact
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  
  -- Demande
  travel_dates text,
  travelers_count int,
  message text,
  
  -- Suivi
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'booked', 'cancelled')),
  agency_response text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_travel_inquiries_offer ON travel_inquiries(offer_id);
CREATE INDEX IF NOT EXISTS idx_travel_inquiries_agency ON travel_inquiries(agency_id);
CREATE INDEX IF NOT EXISTS idx_travel_inquiries_status ON travel_inquiries(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE travel_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_inquiries ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: travel_agencies
-- =====================================================

-- Lecture publique des agences actives
CREATE POLICY "Public can read active agencies"
  ON travel_agencies FOR SELECT
  TO public
  USING (is_active = true);

-- Admins gestion complète
CREATE POLICY "Admins can manage agencies"
  ON travel_agencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- POLICIES: travel_offers
-- =====================================================

-- Lecture publique des offres actives et valides
CREATE POLICY "Public can read active offers"
  ON travel_offers FOR SELECT
  TO public
  USING (
    is_active = true AND 
    (valid_until IS NULL OR valid_until >= CURRENT_DATE)
  );

-- Agences peuvent gérer leurs offres (si email correspond)
CREATE POLICY "Agencies can manage own offers"
  ON travel_offers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM travel_agencies ta
      JOIN profiles p ON LOWER(p.email) = LOWER(ta.email)
      WHERE ta.id = travel_offers.agency_id 
      AND p.id = auth.uid() 
      AND p.role IN ('provider', 'admin')
    )
  );

-- Admins gestion totale
CREATE POLICY "Admins can manage all travel offers"
  ON travel_offers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- POLICIES: travel_inquiries
-- =====================================================

-- Tout le monde peut créer des demandes
CREATE POLICY "Anyone can create travel inquiries"
  ON travel_inquiries FOR INSERT
  TO public
  WITH CHECK (true);

-- Agences peuvent voir leurs demandes reçues
CREATE POLICY "Agencies can view received inquiries"
  ON travel_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM travel_agencies ta
      JOIN profiles p ON LOWER(p.email) = LOWER(ta.email)
      WHERE ta.id = travel_inquiries.agency_id 
      AND p.id = auth.uid()
    )
  );

-- Agences peuvent répondre à leurs demandes
CREATE POLICY "Agencies can respond to inquiries"
  ON travel_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM travel_agencies ta
      JOIN profiles p ON LOWER(p.email) = LOWER(ta.email)
      WHERE ta.id = travel_inquiries.agency_id 
      AND p.id = auth.uid()
    )
  );

-- Admins contrôle total
CREATE POLICY "Admins can manage all travel inquiries"
  ON travel_inquiries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at_travel_agencies ON travel_agencies;
CREATE TRIGGER set_updated_at_travel_agencies
BEFORE UPDATE ON travel_agencies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_travel_offers ON travel_offers;
CREATE TRIGGER set_updated_at_travel_offers
BEFORE UPDATE ON travel_offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_travel_inquiries ON travel_inquiries;
CREATE TRIGGER set_updated_at_travel_inquiries
BEFORE UPDATE ON travel_inquiries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTAIRES DE DOCUMENTATION
-- =====================================================

COMMENT ON TABLE travel_agencies IS 'Agences de voyage partenaires ALTOS';
COMMENT ON TABLE travel_offers IS 'Offres de voyage : promotions, packages, destinations';
COMMENT ON TABLE travel_inquiries IS 'Demandes de renseignements clients vers les agences';

COMMENT ON COLUMN travel_offers.offer_type IS 'promotion = offre promo, package = forfait complet, tip = astuce voyage, destination_highlight = destination à la une';
COMMENT ON COLUMN travel_offers.includes IS 'Ce qui est inclus : vol, hotel, repas, excursions, transferts, etc.';
