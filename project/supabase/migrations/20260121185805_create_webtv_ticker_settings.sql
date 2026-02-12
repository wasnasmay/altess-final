/*
  # Système de Gestion du News Ticker WebTV

  1. Nouvelle Table
    - `webtv_ticker_settings`
      - `id` (uuid, primary key)
      - `text` (text) - Le texte qui défile
      - `speed` (text) - Vitesse : 'slow', 'medium', 'fast'
      - `color` (text) - Couleur du texte (code hex ou tailwind)
      - `is_enabled` (boolean) - Afficher/masquer le ticker
      - `updated_at` (timestamptz) - Date de dernière modification
      - `updated_by` (uuid) - Utilisateur qui a modifié

  2. Sécurité
    - RLS activé
    - Lecture publique (pour afficher le ticker sur le site)
    - Modification uniquement pour les admins

  3. Configuration
    - Une seule ligne de configuration (singleton)
    - Valeurs par défaut : texte de base, vitesse medium, couleur ambre, activé
*/

-- Créer la table
CREATE TABLE IF NOT EXISTS webtv_ticker_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL DEFAULT 'En direct - WebTV Orientale Musique - Programmation continue 24h/24',
  speed text NOT NULL DEFAULT 'medium' CHECK (speed IN ('slow', 'medium', 'fast')),
  color text NOT NULL DEFAULT 'amber',
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insérer la configuration par défaut
INSERT INTO webtv_ticker_settings (id, text, speed, color, is_enabled)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'En direct - WebTV Orientale Musique - Programmation continue 24h/24',
  'medium',
  'amber',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Activer RLS
ALTER TABLE webtv_ticker_settings ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Tout le monde peut lire les paramètres du ticker"
  ON webtv_ticker_settings
  FOR SELECT
  TO public
  USING (true);

-- Politique de modification pour les admins
CREATE POLICY "Les admins peuvent modifier les paramètres du ticker"
  ON webtv_ticker_settings
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

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_webtv_ticker_enabled ON webtv_ticker_settings(is_enabled);
