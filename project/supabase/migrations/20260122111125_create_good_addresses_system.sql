/*
  # Système de Gestion des Bonnes Adresses - ALTOS

  ## Vue d'ensemble
  Module "Bonnes Adresses" pour ALTOS : guide de sorties, restaurants, bars,
  lieux culturels et shopping. Permet aux utilisateurs de découvrir les meilleures
  adresses dans leur ville.

  ## 1. Nouvelles Tables

  ### `good_addresses`
  Table principale des bonnes adresses
  - `id` (uuid, PK)
  - `name` (text) - Nom de l'établissement
  - `slug` (text, unique) - URL-friendly
  - `category` (text) - restaurant, bar, cafe, culture, loisirs, shopping, autre
  - `subcategory` (text) - Sous-catégorie
  - `cuisine_type` (text) - Type de cuisine (pour restaurants)
  - Descriptions: short_description, full_description
  - SEO: title, description, keywords, og_image
  - Médias: main_image, gallery_images[]
  - Contact: phone, email, website, address, city, postal_code
  - Géolocalisation: latitude, longitude
  - Réseaux sociaux: facebook_url, instagram_url
  - Horaires: opening_hours (JSON)
  - Caractéristiques: price_range (€ à €€€€), features[]
  - Stats: rating, total_reviews, view_count
  - Statut: is_active, is_featured, display_order
  
  ### `address_reviews`
  Système d'avis pour les adresses
  - `id` (uuid, PK)
  - `address_id` (uuid, FK good_addresses)
  - `client_id` (uuid, FK profiles)
  - `rating` (int, 1-5)
  - `comment` (text)
  - `visit_date` (date)
  - `is_verified`, `is_published` (boolean)
  - `admin_response` (text)
  - UNIQUE (address_id, client_id) - Un avis par utilisateur par adresse
  
  ## 2. Sécurité RLS
  - Lecture publique des adresses actives
  - Avis : lecture publique des avis publiés
  - Création avis : authentification requise
  - Gestion : admin uniquement
  
  ## 3. Indexes de Performance
  - Recherche par catégorie
  - Recherche par ville
  - Recherche par slug
  - Adresses mises en avant
*/

-- =====================================================
-- TABLE: good_addresses
-- =====================================================

CREATE TABLE IF NOT EXISTS good_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  
  -- Catégorie
  category text NOT NULL CHECK (category IN ('restaurant', 'bar', 'cafe', 'culture', 'loisirs', 'shopping', 'autre')),
  subcategory text,
  cuisine_type text,
  
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
  
  -- Contact & Localisation
  phone text,
  email text,
  website text,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text,
  latitude numeric,
  longitude numeric,
  
  -- Réseaux sociaux
  facebook_url text,
  instagram_url text,
  
  -- Horaires (format JSON)
  opening_hours jsonb DEFAULT '{}',
  
  -- Caractéristiques
  price_range text CHECK (price_range IN ('€', '€€', '€€€', '€€€€')),
  features text[] DEFAULT '{}',
  
  -- Stats
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews int DEFAULT 0,
  view_count int DEFAULT 0,
  
  -- Statut
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  display_order int DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_good_addresses_category ON good_addresses(category, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_good_addresses_city ON good_addresses(city, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_good_addresses_slug ON good_addresses(slug);
CREATE INDEX IF NOT EXISTS idx_good_addresses_featured ON good_addresses(is_featured) WHERE is_featured = true AND is_active = true;

-- =====================================================
-- TABLE: address_reviews
-- =====================================================

CREATE TABLE IF NOT EXISTS address_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address_id uuid REFERENCES good_addresses(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  visit_date date,
  
  is_verified boolean DEFAULT false,
  is_published boolean DEFAULT true,
  admin_response text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(address_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_address_reviews_address ON address_reviews(address_id) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_address_reviews_client ON address_reviews(client_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE good_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: good_addresses
-- =====================================================

-- Lecture publique des adresses actives
CREATE POLICY "Public can read active addresses"
  ON good_addresses FOR SELECT
  TO public
  USING (is_active = true);

-- Admins gestion complète
CREATE POLICY "Admins can manage addresses"
  ON good_addresses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- POLICIES: address_reviews
-- =====================================================

-- Lecture publique des avis publiés
CREATE POLICY "Public can read published address reviews"
  ON address_reviews FOR SELECT
  TO public
  USING (is_published = true);

-- Clients peuvent créer des avis
CREATE POLICY "Clients can create address reviews"
  ON address_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('client', 'provider', 'admin')
    )
  );

-- Clients peuvent modifier leurs avis (dans les 24h)
CREATE POLICY "Clients can update own address reviews"
  ON address_reviews FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid() AND
    created_at > now() - interval '24 hours'
  )
  WITH CHECK (client_id = auth.uid());

-- Clients peuvent voir leurs propres avis
CREATE POLICY "Clients can view own address reviews"
  ON address_reviews FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Admins contrôle total
CREATE POLICY "Admins can manage all address reviews"
  ON address_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- TRIGGERS: Mise à jour automatique des stats
-- =====================================================

-- Fonction pour recalculer le rating moyen des adresses
CREATE OR REPLACE FUNCTION update_address_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE good_addresses
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM address_reviews
      WHERE address_id = COALESCE(NEW.address_id, OLD.address_id)
      AND is_published = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM address_reviews
      WHERE address_id = COALESCE(NEW.address_id, OLD.address_id)
      AND is_published = true
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.address_id, OLD.address_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger après insertion/modification/suppression d'un avis
DROP TRIGGER IF EXISTS trigger_update_address_rating ON address_reviews;
CREATE TRIGGER trigger_update_address_rating
AFTER INSERT OR UPDATE OR DELETE ON address_reviews
FOR EACH ROW
EXECUTE FUNCTION update_address_rating();

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at_good_addresses ON good_addresses;
CREATE TRIGGER set_updated_at_good_addresses
BEFORE UPDATE ON good_addresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_address_reviews ON address_reviews;
CREATE TRIGGER set_updated_at_address_reviews
BEFORE UPDATE ON address_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTAIRES DE DOCUMENTATION
-- =====================================================

COMMENT ON TABLE good_addresses IS 'Bonnes adresses ALTOS : restaurants, bars, lieux culturels, shopping';
COMMENT ON TABLE address_reviews IS 'Avis clients pour les bonnes adresses';

COMMENT ON COLUMN good_addresses.opening_hours IS 'Format JSON : {"lundi": {"open": "09:00", "close": "18:00", "closed": false}, ...}';
COMMENT ON COLUMN good_addresses.features IS 'Caractéristiques : terrasse, parking, wifi, accessible, animaux_acceptes, etc.';
COMMENT ON COLUMN good_addresses.price_range IS '€ = bon marché, €€ = moyen, €€€ = cher, €€€€ = très cher';
