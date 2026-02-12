/*
  # Update Orientale Musique with Real Media URLs

  1. Updates
    - Update carousel_media with real video/image URLs from Pexels
    - Update demo_videos with real YouTube-like placeholder URLs
    - Update orchestra_formulas with better images
*/

-- Clear existing carousel and demo videos
DELETE FROM carousel_media;
DELETE FROM demo_videos;

-- Update orchestra formulas with better images
UPDATE orchestra_formulas
SET image_url = 'https://images.pexels.com/photos/1763067/pexels-photo-1763067.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE slug = 'formule-essentielle';

UPDATE orchestra_formulas
SET image_url = 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE slug = 'formule-prestige';

UPDATE orchestra_formulas
SET image_url = 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE slug = 'formule-royale';

-- Insert real carousel media for home page
INSERT INTO carousel_media (
  title,
  description,
  type,
  url,
  thumbnail_url,
  category,
  is_active,
  order_position
) VALUES
(
  'Mariage Oriental de Luxe',
  'Les meilleurs moments d''un mariage oriental prestigieux',
  'image',
  'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=400',
  'home',
  true,
  1
),
(
  'Performance Live Orchestre',
  'Un medley envoûtant de classiques orientaux',
  'image',
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400',
  'home',
  true,
  2
),
(
  'Ambiance Gala Prestige',
  'L''ambiance exceptionnelle lors d''un gala d''entreprise',
  'image',
  'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=400',
  'home',
  true,
  3
),
(
  'Soirée Orientale Magique',
  'Découvrez l''atmosphère envoûtante de nos soirées',
  'image',
  'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=400',
  'home',
  true,
  4
),
(
  'Orchestre en Action',
  'Nos musiciens professionnels en pleine performance',
  'image',
  'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=400',
  'home',
  true,
  5
),
(
  'Célébration Traditionnelle',
  'L''alliance parfaite entre tradition et modernité',
  'image',
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400',
  'home',
  true,
  6
);

-- Link carousel media to formulas with real images
INSERT INTO carousel_media (
  title,
  description,
  type,
  url,
  thumbnail_url,
  category,
  formula_id,
  is_active,
  order_position
)
SELECT
  'Galerie ' || of.name,
  'Découvrez la ' || of.name || ' en images',
  'image',
  CASE 
    WHEN of.slug = 'formule-essentielle' THEN 'https://images.pexels.com/photos/1763067/pexels-photo-1763067.jpeg?auto=compress&cs=tinysrgb&w=1200'
    WHEN of.slug = 'formule-prestige' THEN 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ELSE 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=1200'
  END,
  CASE 
    WHEN of.slug = 'formule-essentielle' THEN 'https://images.pexels.com/photos/1763067/pexels-photo-1763067.jpeg?auto=compress&cs=tinysrgb&w=400'
    WHEN of.slug = 'formule-prestige' THEN 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400'
    ELSE 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=400'
  END,
  'formula_demo',
  of.id,
  true,
  of.display_order * 10
FROM orchestra_formulas of;

-- Add more images for each formula
INSERT INTO carousel_media (
  title,
  description,
  type,
  url,
  thumbnail_url,
  category,
  formula_id,
  is_active,
  order_position
)
SELECT
  'Performance ' || of.name,
  'Ambiance exceptionnelle avec la ' || of.name,
  'image',
  CASE 
    WHEN of.slug = 'formule-essentielle' THEN 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200'
    WHEN of.slug = 'formule-prestige' THEN 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ELSE 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=1200'
  END,
  CASE 
    WHEN of.slug = 'formule-essentielle' THEN 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400'
    WHEN of.slug = 'formule-prestige' THEN 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=400'
    ELSE 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=400'
  END,
  'formula_demo',
  of.id,
  true,
  of.display_order * 10 + 1
FROM orchestra_formulas of;

-- Insert demo videos with real image URLs
INSERT INTO demo_videos (
  title,
  description,
  video_url,
  thumbnail_url,
  is_active,
  display_order
) VALUES
(
  'Démo Orchestre Complet',
  'Présentation de notre orchestre complet en configuration Formule Royale',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://images.pexels.com/photos/1763067/pexels-photo-1763067.jpeg?auto=compress&cs=tinysrgb&w=600',
  true,
  1
),
(
  'Répertoire Classique Oriental',
  'Un aperçu de notre répertoire classique avec arrangements traditionnels',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=600',
  true,
  2
),
(
  'Fusion Moderne',
  'Notre approche moderne de la musique orientale',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=600',
  true,
  3
);