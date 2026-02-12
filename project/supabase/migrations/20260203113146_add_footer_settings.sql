/*
  # Ajout des paramètres du footer

  1. Nouveaux paramètres
    - Description complète du site
    - Adresse complète
    - Liens réseaux sociaux (Facebook, Instagram, YouTube)
    - Texte de copyright personnalisé
    - Baseline du footer

  2. Sécurité
    - Tous les paramètres sont publics
    - Gérés par les administrateurs uniquement
*/

-- Ajouter les nouveaux paramètres du footer
INSERT INTO site_settings (setting_key, setting_value, setting_label, setting_type, setting_group, is_public)
VALUES
  -- Informations générales
  ('site_description', 'Le sens du partage - WebTV, WebRadio, Événementiel, Académie & Plus', 'Description du site (footer)', 'textarea', 'general', true),
  ('footer_baseline', 'Le sens du partage - Média, Culture & Événementiel', 'Baseline du footer', 'text', 'general', true),
  ('copyright_text', 'ALTESS. Tous droits réservés.', 'Texte du copyright', 'text', 'general', true),

  -- Coordonnées complètes
  ('contact_address', 'Paris, Île-de-France', 'Adresse complète', 'text', 'contact', true),

  -- Réseaux sociaux
  ('social_facebook', 'https://facebook.com', 'Lien Facebook', 'url', 'social', true),
  ('social_instagram', 'https://instagram.com', 'Lien Instagram', 'url', 'social', true),
  ('social_youtube', 'https://youtube.com', 'Lien YouTube', 'url', 'social', true)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  setting_label = EXCLUDED.setting_label,
  setting_type = EXCLUDED.setting_type,
  setting_group = EXCLUDED.setting_group,
  is_public = EXCLUDED.is_public,
  updated_at = now();