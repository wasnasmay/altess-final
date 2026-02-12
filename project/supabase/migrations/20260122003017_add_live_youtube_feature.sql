/*
  # Fonctionnalité Live YouTube pour WebTV

  1. Modifications
    - Ajout du champ `live_video_id` dans `webtv_ticker_settings`
      - Type : text (nullable) - ID de la vidéo YouTube Live en cours
      - NULL = pas de Live, retour à la programmation normale
      - Si rempli = priorité absolue sur la programmation

  2. Comportement
    - Quand `live_video_id` est NULL ou vide : programmation normale
    - Quand `live_video_id` contient un ID : diffusion du Live immédiate
    - Le lecteur YouTube reconnaît automatiquement les Lives
    - Retour automatique à la programmation quand le champ est vidé

  3. Sécurité
    - Utilise les mêmes policies RLS que la table parent
    - Seuls les admins peuvent modifier ce champ
    - Lecture publique pour affichage sur le site
*/

-- Ajouter le champ live_video_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webtv_ticker_settings' AND column_name = 'live_video_id'
  ) THEN
    ALTER TABLE webtv_ticker_settings ADD COLUMN live_video_id text DEFAULT NULL;
  END IF;
END $$;

-- Créer un index pour la performance
CREATE INDEX IF NOT EXISTS idx_webtv_live_video ON webtv_ticker_settings(live_video_id) WHERE live_video_id IS NOT NULL;

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN webtv_ticker_settings.live_video_id IS 'ID de la vidéo YouTube Live en cours. Si NULL, retour à la programmation normale. Si rempli, diffusion prioritaire du Live.';
