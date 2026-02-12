/*
  # Complete Orientale Musique System

  1. Changes to orchestra_formulas
    - Add missing fields: duration_hours, musicians_count, is_popular
    - Add long_description for SEO
    - Add seo_keywords array

  2. Changes to carousel_media  
    - Add formula_id to link media to formulas

  3. Sample Data
    - Insert complete formulas with all fields including image_url
    - Insert carousel media and demo videos
*/

-- Add missing fields to orchestra_formulas
ALTER TABLE orchestra_formulas
ADD COLUMN IF NOT EXISTS duration_hours INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS musicians_count INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];

-- Add formula_id to carousel_media
ALTER TABLE carousel_media
ADD COLUMN IF NOT EXISTS formula_id UUID REFERENCES orchestra_formulas(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_carousel_media_formula_id ON carousel_media(formula_id);

-- Clear existing formulas
DELETE FROM orchestra_formulas;

-- Insert complete orchestra formulas with images
INSERT INTO orchestra_formulas (
  name,
  slug,
  description,
  long_description,
  seo_content,
  seo_keywords,
  price_from,
  duration_hours,
  musicians_count,
  features,
  image_url,
  is_popular,
  is_active,
  display_order
) VALUES
(
  'Formule Essentielle',
  'formule-essentielle',
  'Notre formule de base pour des événements intimistes et élégants',
  'La Formule Essentielle est idéale pour les événements de taille moyenne nécessitant une ambiance musicale raffinée. Notre orchestre de 4 musiciens professionnels apporte une touche orientale authentique à vos soirées. Cette formule comprend 3 heures de prestation musicale en continu, un répertoire varié alliant classiques orientaux et musique moderne, ainsi qu''un système de sonorisation professionnel. Parfait pour les mariages intimistes, fiançailles, anniversaires et événements d''entreprise.',
  'Orchestre oriental pour événements intimistes - 4 musiciens - Formule Essentielle',
  ARRAY['orchestre oriental', 'mariage', 'événement intimiste', 'musique orientale', 'groupe musical'],
  1200,
  3,
  4,
  '["4 musiciens professionnels", "3 heures de prestation", "Répertoire varié (classique et moderne)", "Sonorisation professionnelle", "Eclairage d''ambiance", "Consultation pré-événement", "Playlist personnalisable"]'::jsonb,
  '/image_(4).png',
  false,
  true,
  1
),
(
  'Formule Prestige',
  'formule-prestige',
  'Notre formule premium pour des événements d''envergure avec une ambiance exceptionnelle',
  'La Formule Prestige élève votre événement à un niveau supérieur avec un orchestre complet de 8 musiciens d''exception. Cette prestation de 5 heures comprend un vaste répertoire musical, des arrangements exclusifs, et une mise en scène professionnelle. Notre équipe comprend des chanteurs vedettes, des instrumentistes virtuoses, et un chef d''orchestre expérimenté. Le matériel audiovisuel haut de gamme (sonorisation et éclairage scénique) transformera votre lieu en une véritable salle de spectacle. Idéal pour les grands mariages, galas, et événements corporatifs prestigieux.',
  'Orchestre oriental premium - 8 musiciens - Formule Prestige pour événements de luxe',
  ARRAY['orchestre prestige', 'mariage luxe', 'grand événement', 'musique orientale premium', 'gala'],
  2800,
  5,
  8,
  '["8 musiciens professionnels", "5 heures de prestation", "Chanteurs vedettes inclus", "Chef d''orchestre expérimenté", "Sonorisation haut de gamme", "Eclairage scénique professionnel", "Répertoire exclusif étendu", "Arrangements personnalisés", "Répétition avec couple/organisateur", "Coordination avec autres prestataires"]'::jsonb,
  '/image_(4).png',
  true,
  true,
  2
),
(
  'Formule Royale',
  'formule-royale',
  'Le summum du luxe pour des événements exceptionnels et inoubliables',
  'La Formule Royale représente l''excellence absolue de la musique orientale. Avec 12 musiciens d''élite, notre orchestre complet offre 6 heures de performance ininterrompue. Cette formule exclusive comprend des artistes internationalement reconnus, des danseurs professionnels, un spectacle sons et lumières personnalisé, et une mise en scène digne des plus grands palais. Chaque détail est soigneusement orchestré pour créer une expérience musicale inoubliable. Le répertoire illimité couvre tous les styles de musique orientale, du classique au contemporain. Service VIP inclus avec coordinateur dédié, répétitions multiples, et personnalisation complète du programme musical.',
  'Orchestre oriental de luxe - 12 musiciens - Formule Royale pour événements exceptionnels',
  ARRAY['orchestre royal', 'luxe événementiel', 'mariage prestigieux', 'orchestre complet', 'événement exceptionnel'],
  5500,
  6,
  12,
  '["12 musiciens d''élite", "6 heures de prestation", "Artistes internationaux", "Danseurs professionnels", "Spectacle sons et lumières", "Sonorisation exceptionnelle", "Eclairage scénique premium", "Mise en scène complète", "Répertoire illimité", "Chef d''orchestre renommé", "Coordinateur dédié VIP", "Répétitions multiples", "Personnalisation totale", "Service traiteur musiciens", "Assurance tous risques"]'::jsonb,
  '/image_(4).png',
  false,
  true,
  3
);

-- Insert carousel media for home page
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
  'video',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  'home',
  true,
  1
),
(
  'Performance Live Orchestre',
  'Un medley envoûtant de classiques orientaux',
  'video',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  'home',
  true,
  2
),
(
  'Ambiance Gala Prestige',
  'L''ambiance exceptionnelle lors d''un gala d''entreprise',
  'video',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  'home',
  true,
  3
)
ON CONFLICT DO NOTHING;

-- Link carousel media to formulas
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
  'Vidéo ' || of.name,
  'Découvrez la ' || of.name || ' en action',
  'video',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  'formula_demo',
  of.id,
  true,
  of.display_order * 10
FROM orchestra_formulas of
ON CONFLICT DO NOTHING;

-- Insert demo videos
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
  'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  true,
  1
),
(
  'Répertoire Classique Oriental',
  'Un aperçu de notre répertoire classique avec arrangements traditionnels',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  true,
  2
),
(
  'Fusion Moderne',
  'Notre approche moderne de la musique orientale',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  true,
  3
)
ON CONFLICT DO NOTHING;