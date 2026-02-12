/*
  # Système de Bandeau Publicitaire Dynamique (Ticker Bar)
  
  ## Description
  Ce système permet de gérer et d'afficher un bandeau défilant sous le lecteur TV/Radio
  pour afficher des messages publicitaires, promotions, annonces, etc.
  
  ## 1. Nouvelle Table
    - `advertising_tickers`
      - `id` (uuid, primary key) - Identifiant unique
      - `message` (text) - Le texte du message à afficher
      - `background_color` (text) - Couleur de fond (ex: #000000, rgba(0,0,0,0.8))
      - `text_color` (text) - Couleur du texte (ex: #FFFFFF, #F59E0B)
      - `is_active` (boolean) - Active/désactive le ticker
      - `priority` (integer) - Ordre d'affichage (plus haut = prioritaire)
      - `start_date` (date) - Date de début d'affichage (optionnel)
      - `end_date` (date) - Date de fin d'affichage (optionnel)
      - `display_duration_seconds` (integer) - Durée d'affichage si rotation (optionnel)
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de dernière modification
      - `created_by` (uuid) - ID de l'utilisateur créateur

  ## 2. Sécurité (RLS)
    - Lecture publique : Tous les tickers actifs et dans les dates valides
    - Création/Modification : Réservé aux administrateurs authentifiés

  ## 3. Fonctionnalités
    - Support de plusieurs messages en rotation
    - Gestion des périodes de validité (promos temporaires)
    - Personnalisation complète des couleurs
    - Ordre de priorité pour l'affichage
*/

-- Créer la table des tickers publicitaires
CREATE TABLE IF NOT EXISTS advertising_tickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  background_color text DEFAULT 'rgba(0, 0, 0, 0.9)',
  text_color text DEFAULT '#FFFFFF',
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  start_date date,
  end_date date,
  display_duration_seconds integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contraintes
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CONSTRAINT valid_duration CHECK (display_duration_seconds > 0)
);

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_advertising_tickers_active 
  ON advertising_tickers(is_active, priority DESC) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_advertising_tickers_dates 
  ON advertising_tickers(start_date, end_date) 
  WHERE is_active = true;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_advertising_tickers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_advertising_tickers_updated_at ON advertising_tickers;
CREATE TRIGGER trigger_update_advertising_tickers_updated_at
  BEFORE UPDATE ON advertising_tickers
  FOR EACH ROW
  EXECUTE FUNCTION update_advertising_tickers_updated_at();

-- Activer RLS
ALTER TABLE advertising_tickers ENABLE ROW LEVEL SECURITY;

-- Politique : Lecture publique des tickers actifs et valides
CREATE POLICY "Public users can view active tickers"
  ON advertising_tickers
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= CURRENT_DATE)
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  );

-- Politique : Les admins peuvent tout lire
CREATE POLICY "Admins can view all tickers"
  ON advertising_tickers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique : Les admins peuvent créer des tickers
CREATE POLICY "Admins can create tickers"
  ON advertising_tickers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique : Les admins peuvent modifier des tickers
CREATE POLICY "Admins can update tickers"
  ON advertising_tickers
  FOR UPDATE
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

-- Politique : Les admins peuvent supprimer des tickers
CREATE POLICY "Admins can delete tickers"
  ON advertising_tickers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer quelques exemples de tickers par défaut
INSERT INTO advertising_tickers (message, background_color, text_color, priority, display_duration_seconds)
VALUES 
  ('🎓 Académie ALTESS : Découvrez nos cours de musique orientale avec nos professeurs experts', 'rgba(0, 0, 0, 0.9)', '#F59E0B', 10, 45),
  ('🎵 Nouveau : Suivez nos programmes en direct sur WebTV et WebRadio ALTESS', 'rgba(217, 119, 6, 0.2)', '#FFFFFF', 8, 40),
  ('🎭 Événementiel : Réservez dès maintenant votre orchestre pour vos cérémonies et événements', 'rgba(0, 0, 0, 0.9)', '#D97706', 9, 40)
ON CONFLICT DO NOTHING;