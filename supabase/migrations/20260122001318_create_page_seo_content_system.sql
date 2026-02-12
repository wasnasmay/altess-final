/*
  # Système de Gestion du Contenu SEO des Pages

  1. Nouvelle Table
    - `page_seo_content`
      - `id` (uuid, primary key)
      - `page_slug` (text, unique) - Identifiant de la page (orchestres, prestations, partenaires, stars)
      - `title` (text) - Titre principal
      - `subtitle` (text) - Sous-titre
      - `hero_text` (text) - Texte d'introduction principal
      - `section_title` (text) - Titre de la section caractéristiques
      - `feature_1_icon` (text) - Nom de l'icône lucide pour caractéristique 1
      - `feature_1_title` (text) - Titre caractéristique 1
      - `feature_1_text` (text) - Description caractéristique 1
      - `feature_2_icon` (text) - Nom de l'icône lucide pour caractéristique 2
      - `feature_2_title` (text) - Titre caractéristique 2
      - `feature_2_text` (text) - Description caractéristique 2
      - `feature_3_icon` (text) - Nom de l'icône lucide pour caractéristique 3
      - `feature_3_title` (text) - Titre caractéristique 3
      - `feature_3_text` (text) - Description caractéristique 3
      - `feature_4_icon` (text) - Nom de l'icône lucide pour caractéristique 4
      - `feature_4_title` (text) - Titre caractéristique 4
      - `feature_4_text` (text) - Description caractéristique 4
      - `cta_text` (text) - Texte d'appel à l'action
      - `meta_description` (text) - Description meta pour SEO
      - `is_published` (boolean) - Publié ou non
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur `page_seo_content`
    - Policy lecture publique pour contenu publié
    - Policy admin pour gestion complète

  3. Données Initiales
    - Contenu SEO par défaut pour chaque rubrique
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS page_seo_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text UNIQUE NOT NULL,
  title text DEFAULT '',
  subtitle text DEFAULT '',
  hero_text text DEFAULT '',
  section_title text DEFAULT '',
  feature_1_icon text DEFAULT 'Star',
  feature_1_title text DEFAULT '',
  feature_1_text text DEFAULT '',
  feature_2_icon text DEFAULT 'Award',
  feature_2_title text DEFAULT '',
  feature_2_text text DEFAULT '',
  feature_3_icon text DEFAULT 'Users',
  feature_3_title text DEFAULT '',
  feature_3_text text DEFAULT '',
  feature_4_icon text DEFAULT 'Music',
  feature_4_title text DEFAULT '',
  feature_4_text text DEFAULT '',
  cta_text text DEFAULT '',
  meta_description text DEFAULT '',
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE page_seo_content ENABLE ROW LEVEL SECURITY;

-- Policy: lecture publique pour contenu publié
CREATE POLICY "Public can view published SEO content"
  ON page_seo_content
  FOR SELECT
  USING (is_published = true);

-- Policy: admins peuvent tout faire
CREATE POLICY "Admins can manage SEO content"
  ON page_seo_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Fonction pour mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_page_seo_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_page_seo_content_updated_at_trigger
  BEFORE UPDATE ON page_seo_content
  FOR EACH ROW
  EXECUTE FUNCTION update_page_seo_content_updated_at();

-- Insertion des contenus par défaut
INSERT INTO page_seo_content (page_slug, title, subtitle, hero_text, section_title,
  feature_1_icon, feature_1_title, feature_1_text,
  feature_2_icon, feature_2_title, feature_2_text,
  feature_3_icon, feature_3_title, feature_3_text,
  feature_4_icon, feature_4_title, feature_4_text,
  cta_text, meta_description, is_published)
VALUES
  (
    'orchestres',
    'Orchestres Orientaux de Prestige',
    'Des formations musicales d''exception pour vos événements',
    'Découvrez notre sélection exclusive d''orchestres orientaux professionnels. Chaque formation est soigneusement vérifiée et composée de musiciens expérimentés, garantissant une prestation musicale de haute qualité pour tous vos événements : mariages, galas, soirées privées et événements d''entreprise.',
    'Nos Garanties Excellence',
    'Shield',
    'Musiciens Professionnels',
    'Tous nos artistes sont des professionnels reconnus avec plus de 10 ans d''expérience sur scène',
    'Award',
    'Qualité Garantie',
    'Chaque orchestre est vérifié et noté par nos clients pour garantir votre satisfaction',
    'Music2',
    'Répertoire Varié',
    'Du classique oriental au moderne, nos orchestres s''adaptent à tous vos souhaits musicaux',
    'Headphones',
    'Matériel Professionnel',
    'Sonorisation et éclairage de qualité professionnelle inclus dans chaque prestation',
    'Réservez votre orchestre dès maintenant et faites de votre événement un moment inoubliable',
    'Orchestres orientaux professionnels pour mariages et événements. Musiciens vérifiés, répertoire varié, qualité garantie.',
    true
  ),
  (
    'prestations',
    'Prestations Musicales Sur-Mesure',
    'Des formules adaptées à chaque événement',
    'Orientale Musique vous propose des prestations musicales personnalisées pour tous types d''événements. Du duo intimiste à l''orchestre complet, nous adaptons chaque formule à vos besoins spécifiques et à votre budget. Nos artistes professionnels garantissent une ambiance musicale exceptionnelle qui marquera les esprits.',
    'Pourquoi Nous Choisir',
    'Sparkles',
    'Personnalisation Totale',
    'Chaque prestation est unique et adaptée à vos envies : style musical, durée, nombre de musiciens',
    'Clock',
    'Disponibilité Flexible',
    'Nous nous adaptons à vos contraintes horaires et géographiques partout en France',
    'DollarSign',
    'Tarifs Transparents',
    'Devis détaillé gratuit sous 24h, sans surprise ni frais cachés',
    'ThumbsUp',
    'Satisfaction Client',
    'Plus de 500 événements réussis avec un taux de satisfaction de 98%',
    'Demandez votre devis personnalisé gratuit et sans engagement',
    'Prestations musicales orientales sur-mesure pour tous événements. Devis gratuit, artistes professionnels, satisfaction garantie.',
    true
  ),
  (
    'partenaires',
    'Nos Partenaires de Confiance',
    'Un réseau d''excellence au service de vos événements',
    'Orientale Musique collabore avec les meilleurs prestataires du secteur événementiel pour vous offrir une expérience complète et sans stress. Traiteurs, décorateurs, photographes, lieux de réception... Tous nos partenaires sont triés sur le volet et partagent notre exigence de qualité et de professionnalisme.',
    'Les Avantages de Notre Réseau',
    'CheckCircle',
    'Partenaires Certifiés',
    'Chaque partenaire est sélectionné selon des critères stricts de qualité et de fiabilité',
    'Heart',
    'Tarifs Préférentiels',
    'Bénéficiez de conditions avantageuses grâce à notre réseau de partenaires privilégiés',
    'Zap',
    'Organisation Simplifiée',
    'Un seul interlocuteur pour coordonner tous les prestataires de votre événement',
    'Star',
    'Excellence Garantie',
    'Tous nos partenaires sont notés et évalués par nos clients pour maintenir le plus haut niveau de qualité',
    'Découvrez nos partenaires et profitez d''offres exclusives',
    'Réseau de partenaires événementiels de qualité : traiteurs, décorateurs, photographes. Services coordonnés, tarifs préférentiels.',
    true
  ),
  (
    'stars',
    'Artistes Stars de la Musique Orientale',
    'Les plus grands noms de la scène orientale',
    'Faites de votre événement un moment d''exception en accueillant les stars les plus populaires de la musique orientale. Chanteurs, chanteuses et musiciens de renom sont disponibles pour vos événements privés et professionnels. Une expérience VIP inoubliable pour vos invités avec des artistes qui ont fait vibrer des milliers de fans à travers le monde.',
    'Prestations VIP Exclusives',
    'Mic2',
    'Artistes Reconnus',
    'Des stars avec des millions de vues et une notoriété internationale dans la musique orientale',
    'Crown',
    'Expérience Premium',
    'Prestation complète avec équipe technique professionnelle et mise en scène soignée',
    'Camera',
    'Moments Inoubliables',
    'Photos, dédicaces et moments privilégiés avec l''artiste pour vos invités',
    'Lock',
    'Discrétion Garantie',
    'Confidentialité absolue pour vos événements privés et protocole de sécurité adapté',
    'Contactez-nous pour réserver votre artiste star',
    'Réservation d''artistes stars de la musique orientale pour événements VIP. Chanteurs reconnus, prestation premium, confidentialité garantie.',
    true
  )
ON CONFLICT (page_slug) DO NOTHING;