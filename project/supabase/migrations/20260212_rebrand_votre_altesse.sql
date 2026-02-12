/*
  # Refonte de Marque - ALTESS vers Votre Altesse

  1. Mise à jour des paramètres du site
    - Nom du site : "Votre Altesse"
    - Tagline : "L'Excellence au Service du Partage"
    - Email de contact : contact@votre-altesse.fr

  2. Sécurité
    - Mise à jour sécurisée des settings
*/

-- Mise à jour des paramètres du site dans site_settings
UPDATE site_settings
SET setting_value = 'Votre Altesse'
WHERE setting_key = 'site_name';

UPDATE site_settings
SET setting_value = 'L''Excellence au Service du Partage'
WHERE setting_key = 'site_tagline';

UPDATE site_settings
SET setting_value = 'L''Excellence au Service du Partage - WebTV, WebRadio, Événementiel, Académie & Plus'
WHERE setting_key = 'site_description';

UPDATE site_settings
SET setting_value = 'L''Excellence au Service du Partage - Média, Culture & Événementiel'
WHERE setting_key = 'footer_baseline';

UPDATE site_settings
SET setting_value = 'Votre Altesse. Tous droits réservés.'
WHERE setting_key = 'copyright_text';

UPDATE site_settings
SET setting_value = 'contact@votre-altesse.fr'
WHERE setting_key = 'contact_email';

-- Si la table n'a pas encore ces valeurs, les insérer
INSERT INTO site_settings (setting_key, setting_value, is_public, created_at, updated_at)
VALUES
  ('site_name', 'Votre Altesse', true, now(), now()),
  ('site_tagline', 'L''Excellence au Service du Partage', true, now(), now()),
  ('site_description', 'L''Excellence au Service du Partage - WebTV, WebRadio, Événementiel, Académie & Plus', true, now(), now()),
  ('footer_baseline', 'L''Excellence au Service du Partage - Média, Culture & Événementiel', true, now(), now()),
  ('copyright_text', 'Votre Altesse. Tous droits réservés.', true, now(), now()),
  ('contact_email', 'contact@votre-altesse.fr', true, now(), now())
ON CONFLICT (setting_key)
DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = now();
