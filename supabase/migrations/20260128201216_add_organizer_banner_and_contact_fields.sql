/*
  # Ajouter bannière et infos de contact pour organisateurs

  1. Modifications
    - Ajouter `banner_image` pour la bannière de fond du mini-site
    - Ajouter `about_text` pour la description de l'organisation
    - Ajouter `contact_email` et `contact_phone` pour les coordonnées

  2. Notes
    - Ces champs permettent de personnaliser complètement le mini-site
    - La bannière peut être une image hébergée dans le storage Supabase
*/

-- Ajouter les nouveaux champs à la table event_organizers
ALTER TABLE event_organizers
ADD COLUMN IF NOT EXISTS banner_image TEXT,
ADD COLUMN IF NOT EXISTS about_text TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Mettre à jour l'organisateur de test avec des données par défaut
UPDATE event_organizers
SET 
  banner_image = 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=1920',
  about_text = 'Spécialiste des événements culturels et festifs depuis 2020. Nous organisons des soirées inoubliables mêlant tradition et modernité.',
  contact_email = 'contact@mon-organisation.fr',
  contact_phone = '+33 6 12 34 56 78'
WHERE slug = 'mon-organisation-imed';

-- Ajouter un commentaire
COMMENT ON COLUMN event_organizers.banner_image IS 'URL de l''image de bannière pour le mini-site (1920x400px recommandé)';
COMMENT ON COLUMN event_organizers.about_text IS 'Description de l''organisation affichée dans la popup';
COMMENT ON COLUMN event_organizers.contact_email IS 'Email de contact public';
COMMENT ON COLUMN event_organizers.contact_phone IS 'Téléphone de contact public';
