/*
  # Système de Catégories de Partenaires Personnalisables

  1. Nouvelle Table
    - `partner_categories` (Catégories de partenaires)
      - `id` (uuid, primary key)
      - `code` (text, unique) - Code technique de la catégorie (ex: 'salle', 'voyage')
      - `label` (text) - Libellé affiché (ex: 'Salles de Réception')
      - `icon_name` (text) - Nom de l'icône Lucide React (ex: 'Building2')
      - `description` (text) - Description de la catégorie
      - `display_order` (integer) - Ordre d'affichage
      - `is_active` (boolean) - Actif/Inactif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur la table
    - Lecture publique pour les catégories actives
    - Modification réservée aux administrateurs authentifiés

  3. Données Initiales
    - Insertion des 12 catégories par défaut
*/

-- Create partner_categories table
CREATE TABLE IF NOT EXISTS partner_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  label text NOT NULL,
  icon_name text NOT NULL DEFAULT 'MapPin',
  description text NOT NULL DEFAULT '',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE partner_categories ENABLE ROW LEVEL SECURITY;

-- Public can read active categories
CREATE POLICY "Public can read active partner categories"
  ON partner_categories
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can read all categories
CREATE POLICY "Authenticated users can read all partner categories"
  ON partner_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert categories
CREATE POLICY "Authenticated users can insert partner categories"
  ON partner_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update categories
CREATE POLICY "Authenticated users can update partner categories"
  ON partner_categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete categories
CREATE POLICY "Authenticated users can delete partner categories"
  ON partner_categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_partner_categories_code ON partner_categories(code);
CREATE INDEX IF NOT EXISTS idx_partner_categories_active ON partner_categories(is_active, display_order);

-- Insert default categories
INSERT INTO partner_categories (code, label, icon_name, description, display_order, is_active)
VALUES 
  ('tous', 'Tous', 'Users', 'Afficher tous les partenaires', 0, true),
  ('salle', 'Salles de Réception', 'Building2', 'Espaces pour vos événements', 1, true),
  ('traiteur', 'Traiteurs', 'Users', 'Gastronomie et restauration', 2, true),
  ('photo', 'Photographes', 'Camera', 'Immortaliser vos moments', 3, true),
  ('decoration', 'Décoration', 'Sparkles', 'Embellir vos espaces', 4, true),
  ('voyage', 'Voyages', 'Plane', 'Agences et circuits touristiques', 5, true),
  ('transport', 'Transport VIP', 'Car', 'Véhicules de prestige', 6, true),
  ('beaute', 'Beauté & Coiffure', 'Paintbrush', 'Mise en beauté professionnelle', 7, true),
  ('animation', 'Animation & DJ', 'Music', 'Ambiance musicale et animations', 8, true),
  ('banque', 'Banques & Finance', 'Landmark', 'Solutions financières', 9, true),
  ('entreprise', 'Entreprises', 'Briefcase', 'Services professionnels', 10, true),
  ('association', 'Associations', 'Heart', 'Organismes à but non lucratif', 11, true),
  ('autre', 'Autres', 'MapPin', 'Autres types de partenaires', 12, true)
ON CONFLICT (code) DO NOTHING;
