/*
  # Système d'Agenda des Événements Publics - ALTOS

  ## Vue d'ensemble
  Module "Rendez-vous" pour ALTOS : agenda visuel des événements publics
  (concerts, festivals, spectacles, conférences, ateliers, etc.).
  Permet aux utilisateurs de découvrir les événements à venir.

  ## 1. Nouvelle Table

  ### `public_events`
  Événements publics affichés dans le calendrier
  - `id` (uuid, PK)
  - `title`, `slug` (text)
  - `event_type` (text) - concert, festival, soiree, spectacle, conference, atelier, autre
  - Descriptions: short_description, full_description
  - SEO: title, description, keywords, og_image
  - Médias: main_image, gallery_images[]
  - Date et lieu: event_date, event_time, end_date, end_time
  - Lieu: venue_name, venue_address, city, latitude, longitude
  - Organisateur: organizer_name, organizer_contact, organizer_website
  - Billetterie: ticket_url, price_info, is_free
  - Caractéristiques: artists[], tags[]
  - Statut: is_active, is_featured, status (upcoming/ongoing/completed/cancelled)
  - Stats: view_count
  - `created_by` (uuid, FK auth.users)
  
  ## 2. Sécurité RLS
  - Lecture publique des événements actifs
  - Création/modification : admin uniquement
  - Soft delete : changement de statut
  
  ## 3. Indexes de Performance
  - Recherche par date
  - Recherche par ville
  - Recherche par type
  - Événements à la une
*/

-- =====================================================
-- TABLE: public_events
-- =====================================================

CREATE TABLE IF NOT EXISTS public_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  
  -- Type d'événement
  event_type text NOT NULL CHECK (event_type IN ('concert', 'festival', 'soiree', 'spectacle', 'conference', 'atelier', 'autre')),
  
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
  
  -- Date et lieu
  event_date date NOT NULL,
  event_time time,
  end_date date,
  end_time time,
  
  venue_name text,
  venue_address text,
  city text NOT NULL,
  latitude numeric,
  longitude numeric,
  
  -- Organisateur
  organizer_name text,
  organizer_contact text,
  organizer_website text,
  
  -- Billetterie
  ticket_url text,
  price_info text,
  is_free boolean DEFAULT false,
  
  -- Caractéristiques
  artists text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  
  -- Statut
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  
  view_count int DEFAULT 0,
  
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_public_events_date ON public_events(event_date, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_public_events_city ON public_events(city, event_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_public_events_type ON public_events(event_type, event_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_public_events_slug ON public_events(slug);
CREATE INDEX IF NOT EXISTS idx_public_events_status ON public_events(status, event_date);
CREATE INDEX IF NOT EXISTS idx_public_events_featured ON public_events(is_featured, event_date) WHERE is_featured = true AND is_active = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: public_events
-- =====================================================

-- Lecture publique des événements actifs
CREATE POLICY "Public can read active events"
  ON public_events FOR SELECT
  TO public
  USING (is_active = true);

-- Admins peuvent créer des événements
CREATE POLICY "Admins can create events"
  ON public_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins peuvent modifier des événements
CREATE POLICY "Admins can update events"
  ON public_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins peuvent supprimer des événements
CREATE POLICY "Admins can delete events"
  ON public_events FOR DELETE
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
DROP TRIGGER IF EXISTS set_updated_at_public_events ON public_events;
CREATE TRIGGER set_updated_at_public_events
BEFORE UPDATE ON public_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour automatiquement le statut des événements
CREATE OR REPLACE FUNCTION update_event_status()
RETURNS void AS $$
BEGIN
  -- Passer les événements en 'ongoing' si la date de début est aujourd'hui
  UPDATE public_events
  SET status = 'ongoing'
  WHERE status = 'upcoming'
  AND event_date = CURRENT_DATE;
  
  -- Passer les événements en 'completed' si la date de fin est passée
  UPDATE public_events
  SET status = 'completed'
  WHERE status IN ('upcoming', 'ongoing')
  AND COALESCE(end_date, event_date) < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES DE DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public_events IS 'Agenda des événements publics ALTOS : concerts, festivals, spectacles, etc.';

COMMENT ON COLUMN public_events.status IS 'upcoming = à venir, ongoing = en cours, completed = terminé, cancelled = annulé';
COMMENT ON COLUMN public_events.is_featured IS 'Mise en avant dans le calendrier (événements premium)';
COMMENT ON COLUMN public_events.artists IS 'Liste des artistes/intervenants participant à l''événement';
COMMENT ON COLUMN public_events.tags IS 'Tags pour filtrage : musique orientale, famille, gratuit, etc.';
