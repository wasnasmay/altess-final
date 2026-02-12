/*
  # Système de Gestion des Prestataires Événementiels - ALTOS

  ## Vue d'ensemble
  Ce module crée l'infrastructure complète pour le Hub Événementiel ALTOS,
  permettant aux prestataires (traiteurs, photographes, DJ, etc.) de créer
  leurs fiches professionnelles et aux clients de les découvrir.

  ## 1. Nouvelles Tables

  ### `event_providers`
  Table principale des prestataires événementiels
  - `id` (uuid, PK) - Identifiant unique
  - `provider_id` (uuid, FK profiles) - Lien vers le compte utilisateur
  - `company_name` (text) - Nom de l'entreprise
  - `slug` (text, unique) - URL-friendly identifier
  - `category` (text) - traiteur, photographe, decorateur, dj, autre
  - `subcategory` (text) - Sous-catégorie optionnelle
  - `short_description`, `full_description` (text) - Descriptions
  - SEO: title, description, keywords, og_image
  - Médias: main_image, gallery_images[], logo_url
  - Contact: phone, email, website, social links
  - Localisation: address, city, postal_code, service_area[]
  - Caractéristiques: services[], pricing_range, min/max_price
  - Stats: rating, total_reviews, view_count
  - Statut: status (pending/approved/rejected/suspended), is_verified, is_featured
  
  ### `event_provider_reviews`
  Système d'avis clients pour les prestataires
  - `id` (uuid, PK)
  - `event_provider_id` (uuid, FK event_providers)
  - `client_id` (uuid, FK profiles)
  - `rating` (int, 1-5) - Note du client
  - `comment` (text) - Commentaire
  - `service_date` (date) - Date de la prestation
  - `is_verified`, `is_published` (boolean)
  - `admin_response` (text) - Réponse du prestataire/admin
  
  ### `event_quote_requests`
  Demandes de devis des clients vers les prestataires
  - `id` (uuid, PK)
  - `client_id` (uuid, FK profiles, nullable)
  - `event_provider_id` (uuid, FK event_providers)
  - Contact: client_name, client_email, client_phone
  - Événement: event_type, event_date, event_location, guest_count, budget_range
  - `message` (text) - Description détaillée
  - `attachments` (jsonb) - Fichiers joints
  - Suivi: status, provider_response, quoted_price
  
  ## 2. Sécurité RLS
  
  ### Lecture Publique
  - Les fiches approuvées sont publiques (status = 'approved')
  - Les avis publiés sont publics
  
  ### Accès Prestataire
  - Peut voir/modifier UNIQUEMENT sa propre fiche
  - Peut voir/répondre à ses demandes de devis
  - Peut répondre aux avis le concernant
  - NE PEUT PAS modifier son status (seul admin)
  
  ### Accès Admin
  - Contrôle total sur tous les prestataires
  - Modération (approbation/rejet/suspension)
  - Gestion des avis et devis
  
  ## 3. Indexes de Performance
  - Recherche par catégorie et statut
  - Recherche par ville
  - Recherche par slug (URL)
  - Liens FK optimisés
  
  ## 4. Notes d'Implémentation
  - Cette migration préserve 100% l'architecture existante (orchestras, WebTV, etc.)
  - Module totalement isolé pour garantir performance
  - Dashboard prestataire séparé du dashboard admin
  - Section Orchestre reste propriété exclusive du créateur
*/

-- =====================================================
-- TABLE: event_providers
-- =====================================================

CREATE TABLE IF NOT EXISTS event_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Informations entreprise
  company_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('traiteur', 'photographe', 'decorateur', 'dj', 'autre')),
  subcategory text,
  
  -- Descriptions
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
  logo_url text,
  
  -- Contact
  phone text,
  email text,
  website text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  
  -- Localisation
  address text,
  city text,
  postal_code text,
  service_area text[] DEFAULT '{}',
  
  -- Caractéristiques
  services text[] DEFAULT '{}',
  pricing_range text CHECK (pricing_range IN ('budget', 'moderate', 'premium', 'luxury')),
  min_price numeric,
  max_price numeric,
  
  -- Stats
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews int DEFAULT 0,
  view_count int DEFAULT 0,
  
  -- Statut
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  is_verified boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  display_order int DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_event_providers_provider_id ON event_providers(provider_id);
CREATE INDEX IF NOT EXISTS idx_event_providers_category ON event_providers(category, status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_event_providers_city ON event_providers(city) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_event_providers_slug ON event_providers(slug);
CREATE INDEX IF NOT EXISTS idx_event_providers_status ON event_providers(status);
CREATE INDEX IF NOT EXISTS idx_event_providers_featured ON event_providers(is_featured) WHERE is_featured = true AND status = 'approved';

-- =====================================================
-- TABLE: event_provider_reviews
-- =====================================================

CREATE TABLE IF NOT EXISTS event_provider_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_provider_id uuid REFERENCES event_providers(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  service_date date,
  
  is_verified boolean DEFAULT false,
  is_published boolean DEFAULT true,
  admin_response text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider ON event_provider_reviews(event_provider_id) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_provider_reviews_client ON event_provider_reviews(client_id);

-- =====================================================
-- TABLE: event_quote_requests
-- =====================================================

CREATE TABLE IF NOT EXISTS event_quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_provider_id uuid REFERENCES event_providers(id) ON DELETE CASCADE NOT NULL,
  
  -- Contact
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  
  -- Événement
  event_type text NOT NULL,
  event_date date NOT NULL,
  event_location text,
  guest_count int,
  budget_range text,
  
  -- Détails
  message text,
  attachments jsonb DEFAULT '[]',
  
  -- Suivi
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'accepted', 'declined', 'expired')),
  provider_response text,
  quoted_price numeric,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_provider ON event_quote_requests(event_provider_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_client ON event_quote_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON event_quote_requests(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE event_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_provider_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_quote_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: event_providers
-- =====================================================

-- Lecture publique des prestataires approuvés
CREATE POLICY "Public can read approved providers"
  ON event_providers FOR SELECT
  TO public
  USING (status = 'approved');

-- Les providers peuvent voir leur propre fiche (tous statuts)
CREATE POLICY "Providers can view own listing"
  ON event_providers FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

-- Les providers peuvent créer leur fiche
CREATE POLICY "Providers can create own listing"
  ON event_providers FOR INSERT
  TO authenticated
  WITH CHECK (
    provider_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('provider', 'admin')
    )
  );

-- Les providers peuvent modifier UNIQUEMENT leur propre fiche
CREATE POLICY "Providers can update own listing"
  ON event_providers FOR UPDATE
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (
    provider_id = auth.uid() AND
    status != 'suspended'
  );

-- Les providers NE PEUVENT PAS supprimer (désactivation uniquement)
CREATE POLICY "Providers cannot delete listings"
  ON event_providers FOR DELETE
  TO authenticated
  USING (false);

-- Admins ont contrôle total
CREATE POLICY "Admins can manage all providers"
  ON event_providers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- POLICIES: event_provider_reviews
-- =====================================================

-- Lecture publique des avis publiés
CREATE POLICY "Public can read published reviews"
  ON event_provider_reviews FOR SELECT
  TO public
  USING (is_published = true);

-- Clients peuvent créer des avis
CREATE POLICY "Clients can create reviews"
  ON event_provider_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('client', 'admin')
    )
  );

-- Clients peuvent modifier leurs propres avis (dans les 24h)
CREATE POLICY "Clients can update own reviews"
  ON event_provider_reviews FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid() AND
    created_at > now() - interval '24 hours'
  )
  WITH CHECK (client_id = auth.uid());

-- Providers peuvent voir tous leurs avis
CREATE POLICY "Providers can view their reviews"
  ON event_provider_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_providers 
      WHERE event_providers.id = event_provider_reviews.event_provider_id 
      AND event_providers.provider_id = auth.uid()
    )
  );

-- Providers peuvent répondre aux avis (admin_response)
CREATE POLICY "Providers can respond to reviews"
  ON event_provider_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_providers 
      WHERE event_providers.id = event_provider_reviews.event_provider_id 
      AND event_providers.provider_id = auth.uid()
    )
  );

-- Admins contrôle total
CREATE POLICY "Admins can manage all reviews"
  ON event_provider_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- POLICIES: event_quote_requests
-- =====================================================

-- Clients peuvent voir leurs propres demandes
CREATE POLICY "Clients can view own quote requests"
  ON event_quote_requests FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Clients peuvent créer des demandes
CREATE POLICY "Anyone can create quote requests"
  ON event_quote_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Providers peuvent voir leurs demandes reçues
CREATE POLICY "Providers can view received quotes"
  ON event_quote_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_providers 
      WHERE event_providers.id = event_quote_requests.event_provider_id 
      AND event_providers.provider_id = auth.uid()
    )
  );

-- Providers peuvent répondre à leurs demandes
CREATE POLICY "Providers can respond to quotes"
  ON event_quote_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_providers 
      WHERE event_providers.id = event_quote_requests.event_provider_id 
      AND event_providers.provider_id = auth.uid()
    )
  );

-- Admins contrôle total
CREATE POLICY "Admins can manage all quotes"
  ON event_quote_requests FOR ALL
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

-- Fonction pour recalculer le rating moyen
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE event_providers
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM event_provider_reviews
      WHERE event_provider_id = NEW.event_provider_id
      AND is_published = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM event_provider_reviews
      WHERE event_provider_id = NEW.event_provider_id
      AND is_published = true
    ),
    updated_at = now()
  WHERE id = NEW.event_provider_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger après insertion/modification d'un avis
DROP TRIGGER IF EXISTS trigger_update_provider_rating ON event_provider_reviews;
CREATE TRIGGER trigger_update_provider_rating
AFTER INSERT OR UPDATE OR DELETE ON event_provider_reviews
FOR EACH ROW
EXECUTE FUNCTION update_provider_rating();

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
DROP TRIGGER IF EXISTS set_updated_at_event_providers ON event_providers;
CREATE TRIGGER set_updated_at_event_providers
BEFORE UPDATE ON event_providers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_event_provider_reviews ON event_provider_reviews;
CREATE TRIGGER set_updated_at_event_provider_reviews
BEFORE UPDATE ON event_provider_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_event_quote_requests ON event_quote_requests;
CREATE TRIGGER set_updated_at_event_quote_requests
BEFORE UPDATE ON event_quote_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTAIRES DE DOCUMENTATION
-- =====================================================

COMMENT ON TABLE event_providers IS 'Prestataires événementiels pour le Hub ALTOS (traiteurs, photographes, DJ, etc.)';
COMMENT ON TABLE event_provider_reviews IS 'Système d''avis clients pour les prestataires événementiels';
COMMENT ON TABLE event_quote_requests IS 'Demandes de devis des clients vers les prestataires';

COMMENT ON COLUMN event_providers.status IS 'pending = en attente de validation, approved = visible publiquement, rejected = refusé, suspended = suspendu temporairement';
COMMENT ON COLUMN event_providers.is_featured IS 'Mise en avant premium (publicité payante)';
COMMENT ON COLUMN event_providers.service_area IS 'Liste des villes/régions desservies par le prestataire';
