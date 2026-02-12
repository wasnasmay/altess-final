/*
  # Système d'Analytics pour Prestataires
  
  Ce système permet de tracker et afficher les performances des prestataires.

  ## Nouvelles Tables
  
  ### 1. `provider_profile_completeness`
  Évalue la complétude du profil pour calculer le score d'optimisation
  - `provider_id` (uuid, FK vers profiles)
  - `has_description` (boolean)
  - `has_pricing` (boolean)
  - `photos_count` (integer)
  - `videos_count` (integer)
  - `has_availability` (boolean)
  - `has_whatsapp` (boolean)
  - `optimization_score` (integer, 0-100)
  - `missing_items` (jsonb) - Liste des éléments manquants
  - `updated_at` (timestamptz)

  ### 2. `provider_page_views`
  Tracker les visites des pages prestataires
  - `id` (uuid)
  - `provider_id` (uuid, FK vers profiles)
  - `visitor_city` (text) - Ville du visiteur
  - `visitor_region` (text) - Région du visiteur
  - `visitor_country` (text) - Pays du visiteur
  - `page_url` (text)
  - `referrer` (text)
  - `device_type` (text) - mobile, desktop, tablet
  - `viewed_at` (timestamptz)

  ### 3. `provider_performance_metrics`
  Métriques de performance commerciale
  - `provider_id` (uuid, FK vers profiles, primary key)
  - `total_views` (integer) - Total de visites
  - `total_quotes_sent` (integer) - Devis envoyés
  - `total_quotes_accepted` (integer) - Devis acceptés
  - `conversion_rate` (decimal) - Taux de conversion
  - `avg_response_time_hours` (decimal) - Temps de réponse moyen en heures
  - `last_calculated_at` (timestamptz)

  ## Sécurité
  - RLS activé sur toutes les tables
  - Seuls les prestataires authentifiés peuvent voir leurs propres données
  - Les vues sont publiques (pour tracking anonyme)
*/

-- Table: provider_profile_completeness
CREATE TABLE IF NOT EXISTS provider_profile_completeness (
  provider_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  has_description boolean DEFAULT false,
  has_pricing boolean DEFAULT false,
  photos_count integer DEFAULT 0,
  videos_count integer DEFAULT 0,
  has_availability boolean DEFAULT false,
  has_whatsapp boolean DEFAULT false,
  optimization_score integer DEFAULT 0,
  missing_items jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE provider_profile_completeness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own completeness"
  ON provider_profile_completeness FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "System can update completeness"
  ON provider_profile_completeness FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "System can insert completeness"
  ON provider_profile_completeness FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

-- Table: provider_page_views
CREATE TABLE IF NOT EXISTS provider_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_city text,
  visitor_region text,
  visitor_country text DEFAULT 'France',
  page_url text,
  referrer text,
  device_type text,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE provider_page_views ENABLE ROW LEVEL SECURITY;

-- Les vues peuvent être insérées par tout le monde (tracking anonyme)
CREATE POLICY "Anyone can insert page views"
  ON provider_page_views FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can insert page views anon"
  ON provider_page_views FOR INSERT
  TO anon
  WITH CHECK (true);

-- Seul le prestataire peut voir ses propres vues
CREATE POLICY "Providers can view own page views"
  ON provider_page_views FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

-- Table: provider_performance_metrics
CREATE TABLE IF NOT EXISTS provider_performance_metrics (
  provider_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_views integer DEFAULT 0,
  total_quotes_sent integer DEFAULT 0,
  total_quotes_accepted integer DEFAULT 0,
  conversion_rate decimal(5,2) DEFAULT 0.0,
  avg_response_time_hours decimal(8,2) DEFAULT 0.0,
  last_calculated_at timestamptz DEFAULT now()
);

ALTER TABLE provider_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own metrics"
  ON provider_performance_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "System can update metrics"
  ON provider_performance_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "System can insert metrics"
  ON provider_performance_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

-- Fonction pour calculer le score d'optimisation
CREATE OR REPLACE FUNCTION calculate_optimization_score(provider_uuid uuid)
RETURNS integer AS $$
DECLARE
  score integer := 0;
  missing jsonb := '[]'::jsonb;
  has_desc boolean;
  has_price boolean;
  photo_cnt integer;
  video_cnt integer;
  has_avail boolean;
  has_wa boolean;
BEGIN
  -- Vérifier la description (20 points)
  SELECT EXISTS(
    SELECT 1 FROM event_providers 
    WHERE user_id = provider_uuid AND description IS NOT NULL AND length(description) > 50
  ) INTO has_desc;
  
  IF has_desc THEN
    score := score + 20;
  ELSE
    missing := missing || '["description"]'::jsonb;
  END IF;

  -- Vérifier les tarifs (15 points)
  SELECT EXISTS(
    SELECT 1 FROM event_providers 
    WHERE user_id = provider_uuid AND price_range_min IS NOT NULL
  ) INTO has_price;
  
  IF has_price THEN
    score := score + 15;
  ELSE
    missing := missing || '["pricing"]'::jsonb;
  END IF;

  -- Compter les photos (25 points max, 5 points par photo jusqu'à 5)
  SELECT COUNT(*) FROM provider_social_videos 
  WHERE provider_id = provider_uuid AND media_type = 'photo'
  INTO photo_cnt;
  
  score := score + LEAST(photo_cnt * 5, 25);
  IF photo_cnt < 5 THEN
    missing := missing || jsonb_build_array(format('photos_%s_more', 5 - photo_cnt));
  END IF;

  -- Compter les vidéos (20 points max, 10 points par vidéo jusqu'à 2)
  SELECT COUNT(*) FROM provider_social_videos 
  WHERE provider_id = provider_uuid AND media_type = 'video'
  INTO video_cnt;
  
  score := score + LEAST(video_cnt * 10, 20);
  IF video_cnt < 2 THEN
    missing := missing || jsonb_build_array(format('videos_%s_more', 2 - video_cnt));
  END IF;

  -- Vérifier les disponibilités (10 points)
  SELECT EXISTS(
    SELECT 1 FROM partner_availability 
    WHERE partner_id = provider_uuid
  ) INTO has_avail;
  
  IF has_avail THEN
    score := score + 10;
  ELSE
    missing := missing || '["availability"]'::jsonb;
  END IF;

  -- Vérifier WhatsApp (10 points)
  SELECT EXISTS(
    SELECT 1 FROM provider_social_videos 
    WHERE provider_id = provider_uuid AND whatsapp_number IS NOT NULL
  ) INTO has_wa;
  
  IF has_wa THEN
    score := score + 10;
  ELSE
    missing := missing || '["whatsapp"]'::jsonb;
  END IF;

  -- Mettre à jour ou insérer dans provider_profile_completeness
  INSERT INTO provider_profile_completeness (
    provider_id, has_description, has_pricing, photos_count, videos_count,
    has_availability, has_whatsapp, optimization_score, missing_items, updated_at
  ) VALUES (
    provider_uuid, has_desc, has_price, photo_cnt, video_cnt,
    has_avail, has_wa, score, missing, now()
  )
  ON CONFLICT (provider_id) DO UPDATE SET
    has_description = EXCLUDED.has_description,
    has_pricing = EXCLUDED.has_pricing,
    photos_count = EXCLUDED.photos_count,
    videos_count = EXCLUDED.videos_count,
    has_availability = EXCLUDED.has_availability,
    has_whatsapp = EXCLUDED.has_whatsapp,
    optimization_score = EXCLUDED.optimization_score,
    missing_items = EXCLUDED.missing_items,
    updated_at = now();

  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_provider_page_views_provider ON provider_page_views(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_page_views_date ON provider_page_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_page_views_city ON provider_page_views(visitor_city);
