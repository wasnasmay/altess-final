/*
  # Correction du cache Supabase et optimisation des performances

  1. Actions
    - Rafraîchir le cache du schéma Supabase
    - Garantir l'existence des données critiques
    - Créer des index de performance sur les bonnes colonnes
  
  2. Tables Optimisées
    - advertising_tickers - Index sur priorité et dates
    - webtv_ticker_settings - Configuration garantie
    - media_library - Index sur type et création
    - playout_schedule - Index sur dates et heures
  
  3. Résultat
    - Cache Supabase rafraîchi
    - Requêtes plus rapides
    - Données de test présentes
*/

-- Rafraîchir le cache du schéma Supabase
NOTIFY pgrst, 'reload schema';

-- Garantir l'existence de la configuration WebTV Ticker
INSERT INTO webtv_ticker_settings (
  id,
  text,
  speed,
  color,
  is_enabled,
  live_video_id,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '📺 En direct - WebTV Orientale Musique - Programmation continue 24h/24',
  'medium',
  'amber',
  true,
  null,
  now()
) ON CONFLICT (id) DO UPDATE SET
  text = EXCLUDED.text,
  updated_at = now();

-- Garantir l'existence de messages publicitaires actifs
DO $$
DECLARE
  ticker_count INTEGER;
BEGIN
  -- Compter les messages actifs
  SELECT COUNT(*) INTO ticker_count 
  FROM advertising_tickers 
  WHERE is_active = true
    AND (start_date IS NULL OR start_date <= CURRENT_DATE)
    AND (end_date IS NULL OR end_date >= CURRENT_DATE);
  
  -- Si moins de 3 messages, en créer
  IF ticker_count < 3 THEN
    INSERT INTO advertising_tickers (
      message,
      bg_color,
      text_color,
      priority,
      display_duration,
      start_date,
      end_date,
      is_active,
      created_at
    ) VALUES
    (
      '🎓 Académie ALTESS : Découvrez nos cours de musique orientale avec nos professeurs experts',
      'rgba(0, 0, 0, 0.9)',
      '#FFFFFF',
      10,
      8,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '90 days',
      true,
      now()
    ),
    (
      '🎭 Événementiel : Réservez dès maintenant votre orchestre pour vos cérémonies et événements',
      'rgba(0, 0, 0, 0.9)',
      '#FFFFFF',
      9,
      8,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '90 days',
      true,
      now()
    ),
    (
      '🎵 Nouveau : Suivez nos programmes en direct sur WebTV et WebRadio ALTESS',
      'rgba(0, 0, 0, 0.9)',
      '#FFFFFF',
      8,
      8,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '90 days',
      true,
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Index pour améliorer les performances de chargement des messages publicitaires
CREATE INDEX IF NOT EXISTS idx_advertising_tickers_active_priority 
  ON advertising_tickers(priority DESC, created_at DESC) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_advertising_tickers_dates 
  ON advertising_tickers(start_date, end_date) 
  WHERE is_active = true;

-- Index pour média library (chargement rapide)
CREATE INDEX IF NOT EXISTS idx_media_library_type 
  ON media_library(media_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_library_source 
  ON media_library(source_type);

-- Index pour playout_schedule (amélioration des requêtes temporelles)
CREATE INDEX IF NOT EXISTS idx_playout_schedule_date_time 
  ON playout_schedule(scheduled_date, start_time);

CREATE INDEX IF NOT EXISTS idx_playout_schedule_channel 
  ON playout_schedule(channel_type, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_playout_schedule_status 
  ON playout_schedule(status)
  WHERE status = 'active';

-- Analyser les tables pour optimiser le query planner
ANALYZE advertising_tickers;
ANALYZE webtv_ticker_settings;
ANALYZE media_library;
ANALYZE playout_schedule;

-- Rafraîchir le cache final
NOTIFY pgrst, 'reload schema';
