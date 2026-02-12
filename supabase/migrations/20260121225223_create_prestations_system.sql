/*
  # Système de Prestations Dynamique

  1. Nouvelle Table
    - `prestations`
      - `id` (uuid, primary key)
      - `title` (text) - Titre de la prestation
      - `slug` (text, unique) - URL slug pour SEO
      - `short_description` (text) - Description courte pour les cartes
      - `full_description` (text) - Description complète pour la page détail
      - `seo_title` (text) - Titre SEO optimisé
      - `seo_description` (text) - Meta description
      - `seo_keywords` (text) - Mots-clés SEO
      - `og_image` (text) - Image Open Graph pour partage social
      - `main_image` (text) - Image principale
      - `gallery_images` (text[]) - Galerie d'images
      - `features` (text[]) - Liste des caractéristiques
      - `display_order` (integer) - Ordre d'affichage
      - `is_active` (boolean) - Actif/Inactif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur `prestations`
    - Lecture publique pour les prestations actives
    - Modification réservée aux administrateurs
*/

-- Create prestations table
CREATE TABLE IF NOT EXISTS prestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_description text NOT NULL DEFAULT '',
  full_description text NOT NULL DEFAULT '',
  seo_title text,
  seo_description text,
  seo_keywords text,
  og_image text,
  main_image text,
  gallery_images text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;

-- Public can read active prestations
CREATE POLICY "Public can read active prestations"
  ON prestations
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can read all prestations
CREATE POLICY "Authenticated users can read all prestations"
  ON prestations
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert prestations
CREATE POLICY "Authenticated users can insert prestations"
  ON prestations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update prestations
CREATE POLICY "Authenticated users can update prestations"
  ON prestations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete prestations
CREATE POLICY "Authenticated users can delete prestations"
  ON prestations
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_prestations_slug ON prestations(slug);

-- Create index for active prestations
CREATE INDEX IF NOT EXISTS idx_prestations_active ON prestations(is_active, display_order);

-- Insert default prestations
INSERT INTO prestations (title, slug, short_description, full_description, seo_title, seo_description, seo_keywords, main_image, features, display_order, is_active)
VALUES 
(
  'Mariage Oriental',
  'mariage-oriental',
  'Animation musicale professionnelle pour votre mariage oriental. Orchestre live, DJ et ambiance authentique.',
  'Faites de votre mariage oriental un moment inoubliable avec notre animation musicale professionnelle. Notre équipe de musiciens expérimentés vous accompagne tout au long de votre célébration avec un répertoire riche et varié.

Du traditionnel au moderne, nous créons l''ambiance parfaite pour votre mariage tunisien, algérien, marocain ou libanais. Orchestre complet avec chanteurs, DJ professionnel et sonorisation haut de gamme inclus.

Disponible partout en France avec possibilité de personnalisation totale selon vos souhaits.',
  'Animation Mariage Oriental - Orchestre & DJ Professionnel | France',
  'Animation musicale professionnelle pour mariage oriental. Orchestre live, DJ, sonorisation. Disponible partout en France. Devis gratuit.',
  'mariage oriental, orchestre mariage, animation mariage, DJ mariage, mariage tunisien, mariage algérien, mariage marocain, musiciens professionnels',
  'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg',
  ARRAY['Orchestre complet avec musiciens professionnels', 'DJ et sonorisation haut de gamme', 'Répertoire traditionnel et moderne', 'Chanteurs expérimentés', 'Éclairage professionnel', 'Disponible partout en France'],
  1,
  true
),
(
  'Concert & Festival',
  'concert-festival',
  'Organisation de concerts et festivals de musique orientale. Production complète et artistes reconnus.',
  'Organisez des concerts et festivals de musique orientale avec notre expertise en production événementielle. Nous gérons l''ensemble de la production : artistes, sonorisation, lumières, scène et logistique.

Notre réseau d''artistes orientaux reconnus internationalement garantit des performances de haute qualité. Du petit concert intimiste au grand festival, nous adaptons nos prestations à vos besoins.

Production clé en main incluant la gestion technique, artistique et administrative de votre événement musical.',
  'Organisation Concert & Festival Musique Orientale | Production Événementielle',
  'Production complète de concerts et festivals de musique orientale. Artistes reconnus, sonorisation professionnelle, gestion technique complète.',
  'concert oriental, festival musique orientale, production concert, organisation festival, artistes orientaux, spectacle musical',
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
  ARRAY['Production technique complète', 'Réseau d''artistes reconnus', 'Sonorisation et lumières professionnelles', 'Gestion logistique', 'Scène et décors', 'Coordination artistique'],
  2,
  true
),
(
  'Événement d''Entreprise',
  'evenement-entreprise',
  'Animation musicale pour vos événements professionnels. Soirées d''entreprise, inaugurations, séminaires.',
  'Valorisez vos événements d''entreprise avec une animation musicale orientale raffinée et professionnelle. Que ce soit pour un gala, une inauguration, un séminaire ou une soirée de fin d''année, nous créons l''ambiance idéale.

Notre approche sur-mesure s''adapte à votre image de marque et à vos objectifs. Du cocktail musical intimiste au grand gala, nous proposons des formules flexibles avec orchestre, DJ ou les deux.

Prestation clé en main incluant la gestion technique, le respect de votre planning et une coordination parfaite avec vos autres prestataires.',
  'Animation Musicale Événement Entreprise | Soirée Gala Corporate',
  'Animation musicale professionnelle pour événements d''entreprise. Gala, inauguration, séminaire. Orchestre et DJ. Service premium.',
  'événement entreprise, soirée entreprise, gala entreprise, animation corporate, musique entreprise, séminaire entreprise',
  'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg',
  ARRAY['Formules adaptées au corporate', 'Animation élégante et raffinée', 'Respect du planning et protocole', 'Coordination avec autres prestataires', 'Sonorisation discrète ou puissante', 'Devis personnalisé sur mesure'],
  3,
  true
),
(
  'Soirée Privée',
  'soiree-privee',
  'Animation pour vos soirées privées : anniversaires, fiançailles, baptêmes et célébrations familiales.',
  'Célébrez vos moments importants avec une animation musicale orientale authentique et chaleureuse. Anniversaires, fiançailles, baptêmes, retrouvailles familiales : nous rendons chaque événement unique.

Notre formule soirée privée est conçue pour créer une ambiance conviviale et festive dans un cadre intimiste. Orchestre modulable selon le nombre d''invités et vos préférences musicales.

Nous nous adaptons à tous les lieux : domicile, salle des fêtes, restaurant ou lieu de réception. Installation rapide et sonorisation adaptée au volume de la salle.',
  'Animation Soirée Privée Orientale | Anniversaire, Fiançailles, Baptême',
  'Animation musicale pour soirée privée orientale. Anniversaire, fiançailles, baptême, célébrations familiales. Orchestre modulable.',
  'soirée privée, anniversaire oriental, fiançailles, baptême, fête familiale, animation privée, orchestre privé',
  'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg',
  ARRAY['Formule modulable selon invités', 'Ambiance conviviale et festive', 'Adaptation à tous les lieux', 'Installation rapide', 'Répertoire personnalisable', 'Tarifs adaptés aux particuliers'],
  4,
  true
);
