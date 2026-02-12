/*
  # Add Gallery and SEO Content to Orchestras

  1. Changes
    - Add `seo_content` column to orchestra_formulas for detailed SEO-optimized descriptions
    - Add `gallery_images` column to store photo gallery URLs
    - Add `gallery_videos` column to store video URLs
    - Update existing records with default values
  
  2. Security
    - No changes to RLS policies
*/

-- Add new columns to orchestra_formulas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestra_formulas' AND column_name = 'seo_content'
  ) THEN
    ALTER TABLE orchestra_formulas ADD COLUMN seo_content text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestra_formulas' AND column_name = 'gallery_images'
  ) THEN
    ALTER TABLE orchestra_formulas ADD COLUMN gallery_images text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestra_formulas' AND column_name = 'gallery_videos'
  ) THEN
    ALTER TABLE orchestra_formulas ADD COLUMN gallery_videos jsonb DEFAULT '[]';
  END IF;
END $$;

-- Update existing records with sample SEO content and galleries
UPDATE orchestra_formulas 
SET seo_content = 'Un musicien professionnel pour une ambiance intimiste et raffinée. Notre formule solo est parfaite pour les événements élégants et les ambiances lounge. Avec un répertoire riche en musique orientale classique et moderne, nos artistes sauront créer l''atmosphère parfaite pour vos mariages, soirées privées et événements corporate. Spécialisés dans les instruments traditionnels (oud, violon, derbouka), nos musiciens offrent une prestation de qualité exceptionnelle avec un système son professionnel inclus. Déplacement gratuit dans un rayon de 50km.',
    gallery_images = ARRAY[
      'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
      'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
      'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg',
      'https://images.pexels.com/photos/1916825/pexels-photo-1916825.jpeg',
      'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg',
      'https://images.pexels.com/photos/1isolate697/pexels-photo-1389697.jpeg'
    ]
WHERE slug = 'solo';

UPDATE orchestra_formulas 
SET seo_content = 'Formation de trois musiciens professionnels pour une ambiance chaleureuse et authentique. Notre formule trio est idéale pour les mariages et soirées privées, offrant un équilibre parfait entre convivialité et prestations musicales de haute qualité. Le trio typique se compose d''oud, derbouka et violon, créant une harmonie musicale orientale traditionnelle enrichie de touches modernes. Avec 3 heures de prestation et un système son professionnel, cette formule garantit une animation musicale de qualité pour 50 à 150 invités. Répertoire personnalisable selon vos préférences culturelles et musicales. Déplacement gratuit jusqu''à 100km.',
    gallery_images = ARRAY[
      'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
      'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
      'https://images.pexels.com/photos/3971985/pexels-photo-3971985.jpeg',
      'https://images.pexels.com/photos/1916825/pexels-photo-1916825.jpeg',
      'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg',
      'https://images.pexels.com/photos/210854/pexels-photo-210854.jpeg'
    ]
WHERE slug = 'trio';

UPDATE orchestra_formulas 
SET seo_content = 'Orchestre oriental complet avec plus de 8 musiciens professionnels pour des événements grandioses et inoubliables. Notre formation complète comprend tous les instruments traditionnels orientaux : oud, qanun, violon, derbouka, riqq, et bien plus encore, accompagnés d''une section rythmique moderne. Cette formule prestige est parfaite pour les grands mariages (200+ invités), événements corporate de standing et galas exceptionnels. Avec 4 heures de prestation minimum, sonorisation complète, éclairage scénique professionnel et un choriste expérimenté, nous transformons votre événement en spectacle mémorable. Notre répertoire couvre toutes les régions du monde arabe : musique égyptienne, libanaise, marocaine, algérienne, tunisienne et orientale fusion. Déplacements dans toute la France.',
    gallery_images = ARRAY[
      'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg',
      'https://images.pexels.com/photos/1916825/pexels-photo-1916825.jpeg',
      'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
      'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
      'https://images.pexels.com/photos/3971985/pexels-photo-3971985.jpeg',
      'https://images.pexels.com/photos/167491/pexels-photo-167491.jpeg',
      'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg',
      'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'
    ]
WHERE slug = 'complet';

-- Make seo_content NOT NULL
ALTER TABLE orchestra_formulas ALTER COLUMN seo_content SET NOT NULL;
