/*
  # Données de Test avec Dates d'Expiration pour Alertes

  ## Contenu
  
  Création de données de test pour démontrer le système d'alertes:
  
  1. **2 Bonnes Adresses** avec photos et dates d'expiration proches:
     - Restaurant oriental (expire dans 5 jours) - TEST ALERTE ROUGE
     - Traiteur événementiel (expire dans 25 jours) - TEST ALERTE ORANGE
  
  2. **Mise à jour des événements existants** avec dates d'expiration variées
  
  Objectif: Tester visuellement les compte à rebours et le système d'alertes
*/

-- =====================================================
-- BONNES ADRESSES DE TEST
-- =====================================================

-- Bonne Adresse 1: Restaurant Oriental (expire dans 5 jours)
INSERT INTO good_addresses (
  name,
  slug,
  full_description,
  short_description,
  category,
  city,
  address,
  phone,
  email,
  website,
  main_image,
  gallery_images,
  is_active,
  is_featured,
  status,
  expires_at,
  opening_hours,
  price_range,
  features
) VALUES (
  'Le Palais des Mille et Une Nuits',
  'palais-mille-une-nuits',
  'Restaurant oriental authentique situé au cœur de Paris, offrant une expérience culinaire unique dans un décor somptueux inspiré des contes des Mille et Une Nuits.

Notre chef, formé dans les plus grandes maisons du Maghreb et du Moyen-Orient, propose une carte raffinée mêlant tradition et modernité. Chaque plat est préparé avec des épices sélectionnées et des produits frais de première qualité.

Spécialités:
- Couscous royal aux 7 légumes
- Tajines traditionnels (agneau, poulet, poisson)
- Mezze authentiques
- Pâtisseries orientales maison
- Thés et infusions du monde arabe

Ambiance:
Notre salle principale peut accueillir jusqu''à 80 convives dans une atmosphère chaleureuse avec décoration orientale raffinée, lanternes dorées, coussins brodés et musique d''ambiance. Salon privé disponible pour groupes jusqu''à 25 personnes.',
  'Restaurant oriental authentique avec cuisine raffinée et décor somptueux. Spécialités marocaines et libanaises.',
  'restaurant',
  'Paris',
  '42 Rue des Étoiles, 75011 Paris',
  '+33 1 43 55 67 89',
  'contact@palais-mille-nuits.fr',
  'https://palais-mille-nuits.fr',
  'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY[
    'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  true,
  true,
  'approved',
  NOW() + INTERVAL '5 days', -- EXPIRE DANS 5 JOURS
  '{
    "lundi": "12:00-14:30, 19:00-23:00",
    "mardi": "12:00-14:30, 19:00-23:00",
    "mercredi": "12:00-14:30, 19:00-23:00",
    "jeudi": "12:00-14:30, 19:00-23:00",
    "vendredi": "12:00-14:30, 19:00-00:00",
    "samedi": "12:00-14:30, 19:00-00:00",
    "dimanche": "12:00-15:00, 19:00-23:00"
  }'::jsonb,
  '€€€',
  ARRAY['Terrasse', 'Parking', 'WiFi gratuit', 'Salon privé', 'Menu végétarien', 'Livraison']
)
ON CONFLICT (slug) DO UPDATE SET
  expires_at = NOW() + INTERVAL '5 days',
  status = 'approved',
  is_active = true;

-- Bonne Adresse 2: Traiteur Événementiel (expire dans 25 jours)
INSERT INTO good_addresses (
  name,
  slug,
  full_description,
  short_description,
  category,
  subcategory,
  city,
  address,
  phone,
  email,
  website,
  main_image,
  gallery_images,
  is_active,
  is_featured,
  status,
  expires_at,
  opening_hours,
  price_range,
  features
) VALUES (
  'Saveurs d''Orient Traiteur',
  'saveurs-orient-traiteur',
  'Traiteur spécialisé dans l''événementiel oriental, nous créons des buffets et menus sur-mesure pour tous vos événements professionnels et privés.

Notre Expertise:
Avec plus de 15 ans d''expérience, notre équipe de chefs passionnés met son savoir-faire à votre service pour sublimer vos événements. Nous travaillons exclusivement avec des produits frais et des épices importées directement des pays du Maghreb et du Moyen-Orient.

Nos Services:
- Traiteur pour événements (10 à 500 personnes)
- Buffets orientaux chauds et froids
- Cocktails dinatoires
- Box repas et plateaux-repas
- Service à domicile ou en entreprise

Nos Formules:
→ Formule Découverte (à partir de 25€/pers)
→ Formule Prestige (à partir de 45€/pers)
→ Formule Premium (à partir de 75€/pers)',
  'Traiteur événementiel spécialisé cuisine orientale. Buffets sur-mesure pour 10 à 500 personnes.',
  'autre',
  'Traiteur',
  'Lyon',
  '15 Avenue de la Gastronomie, 69003 Lyon',
  '+33 4 78 90 12 34',
  'contact@saveurs-orient.fr',
  'https://saveurs-orient-traiteur.fr',
  'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY[
    'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  true,
  false,
  'approved',
  NOW() + INTERVAL '25 days', -- EXPIRE DANS 25 JOURS
  '{
    "lundi": "09:00-18:00",
    "mardi": "09:00-18:00",
    "mercredi": "09:00-18:00",
    "jeudi": "09:00-18:00",
    "vendredi": "09:00-18:00",
    "samedi": "10:00-16:00",
    "dimanche": "Fermé"
  }'::jsonb,
  '€€',
  ARRAY['Service traiteur', 'Livraison', 'Personnel inclus', 'Décoration orientale', 'Halal certifié']
)
ON CONFLICT (slug) DO UPDATE SET
  expires_at = NOW() + INTERVAL '25 days',
  status = 'approved',
  is_active = true;

-- =====================================================
-- MISE À JOUR DES ÉVÉNEMENTS AVEC DATES D'EXPIRATION
-- =====================================================

-- Événement 1: Concert de Oud (expire dans 60 jours - OK)
UPDATE public_events
SET expires_at = NOW() + INTERVAL '60 days'
WHERE slug = 'concert-oud-oriental';

-- Événement 2: Stage de Danse (expire dans 6 jours - ALERTE)
UPDATE public_events
SET expires_at = NOW() + INTERVAL '6 days'
WHERE slug = 'stage-danse-orientale';

-- Événement 3: Dîner-Spectacle (expire dans 28 jours - ATTENTION)
UPDATE public_events
SET expires_at = NOW() + INTERVAL '28 days'
WHERE slug = 'diner-spectacle-mediterraneen';

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON COLUMN good_addresses.expires_at IS 'Date d''expiration de l''annonce. Tests: 5j (rouge), 25j (orange), 60j (vert)';
