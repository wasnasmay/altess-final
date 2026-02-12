/*
  # Système de Publicité Premium - ALTOS

  ## Vue d'ensemble
  Module de gestion de la publicité premium pour ALTOS.
  Permet de monétiser la plateforme via des emplacements publicitaires
  stratégiques (bannières, mises en avant, etc.).

  ## 1. Nouvelles Tables

  ### `premium_ads`
  Annonces publicitaires premium
  - `id` (uuid, PK)
  - `content_type` (text) - Type de contenu lié (event_provider, travel_offer, good_address, partner, custom)
  - `content_id` (uuid) - ID du contenu lié (nullable pour custom)
  - `placement` (text) - Emplacement (home_hero, home_sidebar, category_top, etc.)
  - Contenu: title, description, image_url, link_url, cta_text
  - Tarification: price, billing_period (daily, weekly, monthly, yearly, one_time)
  - Dates: start_date, end_date
  - Stats: impressions, clicks
  - Statut: status (pending, active, paused, completed, cancelled), is_paid
  - `advertiser_id` (uuid, FK profiles)
  
  ### `ad_analytics`
  Tracking des impressions et clics pour les annonces
  - `id` (uuid, PK)
  - `ad_id` (uuid, FK premium_ads)
  - `event_type` (text) - impression, click
  - `user_id` (uuid, FK auth.users, nullable)
  - `ip_address` (inet)
  - `user_agent` (text)
  - `referrer` (text)
  - `created_at` (timestamptz)
  
  ## 2. Sécurité RLS
  - Lecture publique des annonces actives et dans les dates
  - Annonceurs peuvent voir leurs propres annonces
  - Création/modification : admin uniquement
  - Analytics : admin uniquement
  
  ## 3. Indexes de Performance
  - Recherche par placement et statut
  - Recherche par dates d'activité
  - Stats par annonce
*/

-- =====================================================
-- TABLE: premium_ads
-- =====================================================

CREATE TABLE IF NOT EXISTS premium_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de contenu lié
  content_type text NOT NULL CHECK (content_type IN ('event_provider', 'travel_offer', 'good_address', 'partner', 'custom')),
  content_id uuid,
  
  -- Emplacement
  placement text NOT NULL CHECK (placement IN ('home_hero', 'home_sidebar', 'category_top', 'event_sidebar', 'travel_banner', 'address_banner')),
  
  -- Contenu de l'annonce
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  cta_text text DEFAULT 'En savoir plus',
  
  -- Tarification
  price numeric NOT NULL,
  billing_period text CHECK (billing_period IN ('daily', 'weekly', 'monthly', 'yearly', 'one_time')),
  
  -- Dates
  start_date date NOT NULL,
  end_date date NOT NULL,
  
  -- Stats
  impressions int DEFAULT 0,
  clicks int DEFAULT 0,
  
  -- Statut
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')),
  is_paid boolean DEFAULT false,
  
  -- Relation
  advertiser_id uuid REFERENCES profiles(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_premium_ads_placement ON premium_ads(placement, status, start_date, end_date) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_premium_ads_dates ON premium_ads(start_date, end_date, status);
CREATE INDEX IF NOT EXISTS idx_premium_ads_advertiser ON premium_ads(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_premium_ads_content ON premium_ads(content_type, content_id);

-- =====================================================
-- TABLE: ad_analytics
-- =====================================================

CREATE TABLE IF NOT EXISTS ad_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES premium_ads(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'click')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_analytics_ad ON ad_analytics(ad_id, event_type);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_date ON ad_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_user ON ad_analytics(user_id) WHERE user_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE premium_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: premium_ads
-- =====================================================

-- Lecture publique des annonces actives dans les dates
CREATE POLICY "Public can read active ads"
  ON premium_ads FOR SELECT
  TO public
  USING (
    status = 'active' AND
    start_date <= CURRENT_DATE AND
    end_date >= CURRENT_DATE
  );

-- Annonceurs peuvent voir leurs annonces
CREATE POLICY "Advertisers can view own ads"
  ON premium_ads FOR SELECT
  TO authenticated
  USING (advertiser_id = auth.uid());

-- Admins gestion totale
CREATE POLICY "Admins can manage ads"
  ON premium_ads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- POLICIES: ad_analytics
-- =====================================================

-- Tout le monde peut créer des événements analytics (impressions/clicks)
CREATE POLICY "Anyone can create analytics events"
  ON ad_analytics FOR INSERT
  TO public
  WITH CHECK (true);

-- Seuls les admins peuvent lire les analytics
CREATE POLICY "Admins can read analytics"
  ON ad_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour enregistrer une impression
CREATE OR REPLACE FUNCTION track_ad_impression(
  p_ad_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_referrer text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Insérer l'événement analytics
  INSERT INTO ad_analytics (ad_id, event_type, user_id, ip_address, user_agent, referrer)
  VALUES (p_ad_id, 'impression', p_user_id, p_ip_address, p_user_agent, p_referrer);
  
  -- Mettre à jour le compteur dans premium_ads
  UPDATE premium_ads
  SET impressions = impressions + 1
  WHERE id = p_ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour enregistrer un clic
CREATE OR REPLACE FUNCTION track_ad_click(
  p_ad_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_referrer text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Insérer l'événement analytics
  INSERT INTO ad_analytics (ad_id, event_type, user_id, ip_address, user_agent, referrer)
  VALUES (p_ad_id, 'click', p_user_id, p_ip_address, p_user_agent, p_referrer);
  
  -- Mettre à jour le compteur dans premium_ads
  UPDATE premium_ads
  SET clicks = clicks + 1
  WHERE id = p_ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les stats d'une annonce
CREATE OR REPLACE FUNCTION get_ad_stats(p_ad_id uuid)
RETURNS TABLE (
  impressions_total bigint,
  clicks_total bigint,
  ctr numeric,
  impressions_today bigint,
  clicks_today bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'impression') as impressions_total,
    COUNT(*) FILTER (WHERE event_type = 'click') as clicks_total,
    CASE 
      WHEN COUNT(*) FILTER (WHERE event_type = 'impression') > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE event_type = 'click')::numeric / 
                  COUNT(*) FILTER (WHERE event_type = 'impression')::numeric) * 100, 2)
      ELSE 0
    END as ctr,
    COUNT(*) FILTER (WHERE event_type = 'impression' AND created_at >= CURRENT_DATE) as impressions_today,
    COUNT(*) FILTER (WHERE event_type = 'click' AND created_at >= CURRENT_DATE) as clicks_today
  FROM ad_analytics
  WHERE ad_id = p_ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at_premium_ads ON premium_ads;
CREATE TRIGGER set_updated_at_premium_ads
BEFORE UPDATE ON premium_ads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour automatiquement le statut des annonces
CREATE OR REPLACE FUNCTION update_ads_status()
RETURNS void AS $$
BEGIN
  -- Activer les annonces dont la date de début est atteinte
  UPDATE premium_ads
  SET status = 'active'
  WHERE status = 'pending'
  AND start_date <= CURRENT_DATE
  AND end_date >= CURRENT_DATE
  AND is_paid = true;
  
  -- Compléter les annonces dont la date de fin est passée
  UPDATE premium_ads
  SET status = 'completed'
  WHERE status = 'active'
  AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES DE DOCUMENTATION
-- =====================================================

COMMENT ON TABLE premium_ads IS 'Annonces publicitaires premium ALTOS';
COMMENT ON TABLE ad_analytics IS 'Tracking des impressions et clics des annonces';

COMMENT ON COLUMN premium_ads.placement IS 'home_hero = bannière hero accueil, home_sidebar = sidebar accueil, category_top = haut de page catégorie, etc.';
COMMENT ON COLUMN premium_ads.content_type IS 'Type de contenu promu : prestataire événementiel, offre voyage, bonne adresse, partenaire, ou custom';
COMMENT ON COLUMN premium_ads.billing_period IS 'Période de facturation : daily, weekly, monthly, yearly, one_time';
COMMENT ON COLUMN premium_ads.status IS 'pending = en attente, active = diffusée, paused = en pause, completed = terminée, cancelled = annulée';

COMMENT ON FUNCTION track_ad_impression IS 'Enregistre une impression publicitaire avec détails user/IP/referrer';
COMMENT ON FUNCTION track_ad_click IS 'Enregistre un clic publicitaire avec détails user/IP/referrer';
COMMENT ON FUNCTION get_ad_stats IS 'Retourne les statistiques complètes d''une annonce (impressions, clics, CTR)';
